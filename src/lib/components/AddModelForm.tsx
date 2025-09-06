import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import type {
  IProviderRegistry,
  StorageAdapter,
  ModelConfigWithProvider,
  ProviderMetadata,
} from '../types';
import { ModelSelectionListbox } from './ModelSelectionListbox';

export interface AddModelFormProps {
  providers: IProviderRegistry;
  storage: StorageAdapter;
  onClose: () => void;
  onModelAdded: (model: ModelConfigWithProvider) => void;
  className?: string;
}

interface FormData {
  apiKey?: string;
  resourceName?: string; // For Azure
  apiBase?: string;
  [key: string]: any;
}

/**
 * Form for adding new models with provider configuration
 * Integrated dialog that manages its own state internally
 */
export function AddModelForm({
  providers,
  storage,
  onClose,
  onModelAdded,
  className = '',
}: AddModelFormProps) {
  const [selectedProvider, setSelectedProvider] = useState<ProviderMetadata | null>(null);
  const [selectedModel, setSelectedModel] = useState<ModelConfigWithProvider | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>('');

  const {
    register,
    handleSubmit,
    watch,
    reset: _reset,
    formState: { errors },
  } = useForm<FormData>();

  // Get all providers
  const allProviders = providers.getAllProviders();

  // Popular providers (customize as needed)
  const popularProviderIds = new Set(['openai', 'anthropic', 'google']);
  const popularProviders = allProviders
    .filter((p) => popularProviderIds.has(p.metadata.id))
    .map((p) => p.metadata);

  const otherProviders = allProviders
    .filter((p) => !popularProviderIds.has(p.metadata.id))
    .map((p) => p.metadata);

  // Set default provider
  useEffect(() => {
    if (popularProviders.length > 0 && !selectedProvider) {
      setSelectedProvider(popularProviders[0]);
    }
  }, [popularProviders]);

  // Update available models when provider changes
  const availableModels = selectedProvider
    ? providers.getModelsForProvider(selectedProvider.id)
    : [];

  // Set default model when provider changes
  useEffect(() => {
    if (availableModels.length > 0) {
      const defaultModel = availableModels.find((m) => m.model.isDefault) || availableModels[0];
      setSelectedModel(defaultModel);
    } else {
      setSelectedModel(null);
    }
  }, [selectedProvider, availableModels]);

  const onSubmit = async (formData: FormData) => {
    if (!selectedProvider || !selectedModel) {
      setError('Please select a provider and model');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const provider = providers.getProvider(selectedProvider.id);

      // Validate the form data
      const validation = provider.validateCredentials(formData);
      if (!validation.isValid) {
        setError(validation.error || 'Invalid configuration');
        return;
      }

      // Store the configuration
      await storage.set(`${selectedProvider.id}:config`, formData);

      // Store individual API key if provided (for convenience)
      if (formData.apiKey) {
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
    selectedProvider &&
    selectedModel &&
    (selectedProvider.requiredKeys?.every((key) => watch(key)) || true);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div
        className={`
        bg-background border border-border rounded-lg shadow-lg
        max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto
        ${className}
      `}
      >
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
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
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
                selectedItem={selectedProvider!}
                onSelectionChange={(item) => {
                  if ('name' in item) {
                    setSelectedProvider(item as ProviderMetadata);
                  }
                }}
                topOptions={popularProviders}
                otherOptions={otherProviders}
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
                selectedItem={selectedModel!}
                onSelectionChange={(item) => {
                  if ('model' in item) {
                    setSelectedModel(item as ModelConfigWithProvider);
                  }
                }}
                topOptions={availableModels}
              />
            </div>

            {/* API Key Field */}
            {selectedProvider?.requiredKeys?.includes('apiKey') && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">API Key</label>
                <input
                  type="password"
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
                {selectedProvider.apiKeyUrl && (
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

            {/* Azure-specific fields */}
            {selectedProvider?.id === 'azure' && (
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
