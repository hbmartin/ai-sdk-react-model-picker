import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import {
  type IProviderRegistry,
  type StorageAdapter,
  type ModelConfigWithProvider,
  type ProviderMetadata,
  createProviderId,
} from '../types';
import { ModelSelectionListbox } from './ModelSelectionListbox';

export interface AddModelFormProps {
  readonly providerRegistry: IProviderRegistry;
  readonly storage: StorageAdapter;
  readonly onClose: () => void;
  readonly onModelAdded: (model: ModelConfigWithProvider) => void;
  readonly className?: string;
}

interface FormData {
  apiKey?: string;
  resourceName?: string; // For Azure TODO: remove this
  apiBase?: string;
  // eslint-disable-next-line @typescript-eslint/member-ordering
  [key: string]: string | undefined;
}

/**
 * Form for adding new models with provider configuration
 * Integrated dialog that manages its own state internally
 */
export function AddModelForm({
  providerRegistry,
  storage,
  onClose,
  onModelAdded,
  className = '',
}: AddModelFormProps) {
  const [selectedProvider, setSelectedProvider] = useState<ProviderMetadata | undefined>();
  const [selectedModel, setSelectedModel] = useState<ModelConfigWithProvider | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>('');

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>();

  // Set default provider
  useEffect(() => {
    if (providerRegistry.defaultProvider !== undefined) {
      setSelectedProvider(providerRegistry.getProviderMetadata(providerRegistry.defaultProvider));
    }
  }, [providerRegistry, setSelectedProvider]);

  // Update available models when provider changes
  const availableModels = useMemo(
    () => (selectedProvider ? providerRegistry.getModelsForProvider(selectedProvider.id) : []),
    [selectedProvider, providerRegistry]
  );

  // Set default model when provider changes
  useEffect(() => {
    if (availableModels.length > 0) {
      const defaultModel =
        availableModels.find((model: ModelConfigWithProvider) => model.model.isDefault === true) ??
        availableModels[0];
      setSelectedModel(defaultModel);
    } else {
      setSelectedModel(undefined);
    }
  }, [availableModels]);

  const onSubmit = async (formData: FormData) => {
    if (!selectedProvider || !selectedModel) {
      setError('Please select a provider and model');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const provider = providerRegistry.getProvider(selectedProvider.id);

      // Validate the form data
      const validation = provider.validateCredentials(formData);
      if (!validation.isValid) {
        setError(validation.error ?? 'Invalid configuration');
        return;
      }

      // Store the configuration
      await storage.set(`${selectedProvider.id}:config`, formData);

      // Store individual API key if provided (for convenience)
      if (typeof formData.apiKey === 'string' && formData.apiKey.trim() !== '') {
        await storage.set(`${selectedProvider.id}:apiKey`, formData.apiKey);
      }

      // Call success callback
      onModelAdded(selectedModel);
    } catch (error_) {
      console.error('Error saving model configuration:', error_);
      setError(error_ instanceof Error ? error_.message : 'Failed to save configuration');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid =
    selectedProvider !== undefined &&
    selectedModel !== undefined &&
    selectedProvider.requiredKeys !== undefined
      ? selectedProvider.requiredKeys.every((key) => {
          const value = watch(key);
          return typeof value === 'string' && value.trim().length > 0;
        })
      : true;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div
        className={`
        bg-background border border-border rounded-lg shadow-lg
        max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto
        ${className}
      `}
      >
        {/* eslint-disable-next-line @typescript-eslint/no-misused-promises */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-foreground">Add Model</h2>
            <button
              type="button"
              onClick={onClose}
              className="text-muted hover:text-foreground p-1 rounded"
              aria-label="Close dialog"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2} // eslint-disable-line code-complete/no-magic-numbers-except-zero-one
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <div className="space-y-6">
            {/* Provider Selection */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Provider</label>
              <ModelSelectionListbox
                selectedItem={selectedProvider}
                onSelectionChange={(item) => {
                  if ('name' in item) {
                    setSelectedProvider(item);
                  }
                }}
              />
              <p className="mt-1 text-xs text-muted">
                Don't see your provider?{' '}
                <a
                  href="https://docs.anthropic.com/en/api/getting-started"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  View the full list
                </a>
              </p>
            </div>

            {/* Model Selection */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Model</label>
              <ModelSelectionListbox
                selectedItem={selectedModel}
                onSelectionChange={(item) => {
                  if ('model' in item) {
                    setSelectedModel(item);
                  }
                }}
                topOptions={availableModels}
              />
            </div>

            {/* API Key Field */}
            {selectedProvider?.requiredKeys !== undefined &&
              selectedProvider.requiredKeys.includes('apiKey') && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">API Key</label>
                  <input
                    placeholder={`Enter your ${selectedProvider.name} API key`}
                    className="
                    w-full px-3 py-2 border border-border rounded-default
                    bg-background text-foreground
                    focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary
                  "
                    {...register('apiKey', {
                      required: selectedProvider.requiredKeys.includes('apiKey'),
                    })}
                  />
                  {errors.apiKey && (
                    <p className="mt-1 text-xs text-destructive">API key is required</p>
                  )}
                  {selectedProvider.apiKeyUrl !== undefined && (
                    <p className="mt-1 text-xs text-muted">
                      <a
                        href={selectedProvider.apiKeyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        Get your API key here
                      </a>
                    </p>
                  )}
                </div>
              )}

            {/* TODO: genericize this */}
            {selectedProvider?.id === createProviderId('azure') && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Resource Name
                </label>
                <input
                  type="text"
                  placeholder="Enter your Azure OpenAI resource name"
                  className="
                    w-full px-3 py-2 border border-border rounded-default
                    bg-background text-foreground
                    focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary
                  "
                  {...register('resourceName', { required: true })}
                />
                {errors.resourceName && (
                  <p className="mt-1 text-xs text-destructive">Resource name is required</p>
                )}
              </div>
            )}

            {/* Custom API Base (optional) */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                API Base URL (Optional)
              </label>
              <input
                type="url"
                placeholder="https://api.example.com"
                className="
                  w-full px-3 py-2 border border-border rounded-default
                  bg-background text-foreground
                  focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary
                "
                {...register('apiBase')}
              />
              <p className="mt-1 text-xs text-muted">Leave empty to use the default endpoint</p>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-muted hover:text-foreground transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isFormValid || isSubmitting}
              className="
                px-4 py-2 text-sm bg-primary text-white rounded-default
                hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed
                transition-colors
              "
            >
              {isSubmitting ? 'Connecting...' : 'Connect'}
            </button>
          </div>

          <p className="mt-4 text-center text-xs text-muted">
            This will save your configuration for future use
          </p>
        </form>
      </div>
    </div>
  );
}

export default AddModelForm;
