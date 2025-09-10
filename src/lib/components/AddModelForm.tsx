import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import type {
  IProviderRegistry,
  StorageAdapter,
  ModelConfigWithProvider,
  AIProvider,
  ModelConfig,
} from '../types';
import { ModelSelectionListbox } from './ModelSelectionListbox';

export interface AddModelFormProps {
  readonly providerRegistry: IProviderRegistry;
  readonly storage: StorageAdapter;
  readonly onClose: () => void;
  readonly onModelAdded: (model: ModelConfigWithProvider) => void;
  readonly className?: string;
}

interface FormData extends Record<string, string> {
  apiKey?: string;
  baseURL?: string;
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
  const [selectedProvider, setSelectedProvider] = useState<AIProvider | undefined>();
  const [selectedModel, setSelectedModel] = useState<ModelConfigWithProvider | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>('');

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>();
  const watchedValues = watch();
  // Set default provider
  const allProviders = useMemo(
    () => providerRegistry.getAllProviders().map((provider) => provider.metadata),
    [providerRegistry]
  );

  // Update available models when provider changes
  const availableModels: ModelConfig[] = useMemo(
    () => (selectedProvider ? selectedProvider.models : []),
    [selectedProvider]
  );

  // Set default model when provider changes
  useEffect(() => {
    if (selectedProvider !== undefined && availableModels.length > 0) {
      const defaultModel =
        availableModels.find((model: ModelConfig) => model.isDefault === true) ??
        availableModels[0];
      setSelectedModel({ model: defaultModel, provider: selectedProvider.metadata });
    } else {
      setSelectedModel(undefined);
    }
  }, [availableModels, selectedProvider]);

  const onSubmit = async (formDataWithAny: FormData) => {
    const formData = Object.fromEntries(
      Object.entries(formDataWithAny).filter(([_, value]) => typeof value === 'string')
    ) as Record<string, string>;

    if (!selectedProvider || !selectedModel) {
      setError('Please select a provider and model');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      // Validate the form data
      const validation = selectedProvider.validateCredentials(formData);
      if (!validation.isValid) {
        setError(validation.error ?? 'Invalid configuration');
        return;
      }

      await storage.set(`${selectedProvider.metadata.id}:config`, formData);

      // Call success callback
      onModelAdded(selectedModel);
    } catch (error_) {
      console.error('Error saving model configuration:', error_);
      setError(error_ instanceof Error ? error_.message : 'Failed to save configuration');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formInvalidReason: string | undefined = useMemo(() => {
    if (selectedProvider === undefined) {
      return 'Please select a provider';
    }
    if (selectedModel === undefined) {
      return 'Please select a model';
    }

    const validation = selectedProvider.validateCredentials(watchedValues);
    if (!validation.isValid) {
      return validation.error;
    }
    return undefined;
  }, [selectedProvider, selectedModel, watchedValues]);
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
                selectedItem={selectedProvider?.metadata}
                onSelectionChange={(item) => {
                  if ('name' in item) {
                    setSelectedProvider(providerRegistry.getProvider(item.id));
                  }
                }}
                topOptions={allProviders}
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
                topOptions={
                  selectedProvider === undefined
                    ? []
                    : availableModels.map((model) => ({
                        model,
                        provider: selectedProvider.metadata,
                      }))
                }
              />
            </div>

            {selectedProvider?.configuration.fields.map(
              ({ key, label: fieldName, placeholder, required }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    {fieldName}
                    {required === true ? ' *' : ''}
                  </label>
                  <input
                    placeholder={placeholder}
                    className="w-full px-3 py-2 border border-border rounded-default bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                    {...register(key, { required: required === true })}
                  />
                  {errors[key] && (
                    <p className="mt-1 text-xs text-destructive">{fieldName} is required</p>
                  )}
                  {key === 'apiKey' && selectedProvider.metadata.apiKeyUrl !== undefined && (
                    <p className="mt-1 text-xs text-muted">
                      <a
                        href={selectedProvider.metadata.apiKeyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        Get your API key here
                      </a>
                    </p>
                  )}
                </div>
              )
            )}
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
              disabled={formInvalidReason !== undefined || isSubmitting}
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
