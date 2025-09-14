import { useState, useMemo, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import type { IProviderRegistry, StorageAdapter, AIProvider, ProviderMetadata } from '../types';
import { ModelSelectionListbox } from './ModelSelectionListbox';

export interface AddModelFormProps {
  readonly providerRegistry: IProviderRegistry;
  readonly storage: StorageAdapter;
  readonly onClose: () => void;
  readonly onProviderConfigured: (provider: ProviderMetadata) => void;
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
  onProviderConfigured,
  className = '',
}: AddModelFormProps) {
  const [selectedProvider, setSelectedProvider] = useState<AIProvider | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const warnings = useRef<Map<string, string>>(new Map());

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
  } = useForm<FormData>();
  const watchedValues = watch();
  // Set default provider
  const allProviders = useMemo(
    () => providerRegistry.getAllProviders().map((provider) => provider.metadata),
    [providerRegistry]
  );

  useEffect(() => {
    reset();
    warnings.current = new Map();
  }, [selectedProvider, reset]);

  const onSubmit = async (formDataWithAny: FormData) => {
    console.log('onSubmit', formDataWithAny);
    const formData = Object.fromEntries(
      Object.entries(formDataWithAny).filter(([_, value]) => typeof value === 'string')
    ) as Record<string, string>;

    if (!selectedProvider) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Validate the form data
      const validation = selectedProvider.validateCredentials(formData);
      if (!validation.isValid) {
        return;
      }

      await storage.set(`${selectedProvider.metadata.id}:config`, formData);

      // Call success callback
      onProviderConfigured(selectedProvider.metadata);
    } catch (error_) {
      console.error('Error saving model configuration:', error_);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formInvalidReason: string | undefined = useMemo(() => {
    if (selectedProvider === undefined) {
      return 'Please select a provider';
    }

    const validation = selectedProvider.validateCredentials(watchedValues);
    if (!validation.isValid) {
      return validation.error;
    }
    return undefined;
  }, [selectedProvider, watchedValues]);
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50  backdrop-blur-sm">
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
            <h2 className="text-md font-semibold text-foreground">Add Model</h2>
            <button
              type="button"
              onClick={onClose}
              className="text-muted p-1 bg-transparent border-none rounded
        text-foreground hover:bg-accent
        transition-colors duration-150"
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
                  href="https://github.com/hbmartin/ai-sdk-react-model-picker/issues"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Request one here
                </a>
              </p>
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
                    autoComplete="off"
                    spellCheck="false"
                    autoCorrect="off"
                    autoCapitalize="off"
                    type="text"
                    className="w-full px-3 py-2 border border-border border-solid rounded bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                    {...register(key, {
                      validate: (value) => {
                        const fieldValidation = selectedProvider.configuration.validateField(
                          key,
                          value
                        );
                        if (fieldValidation?.error !== undefined) {
                          return fieldValidation.error;
                        }
                        if (fieldValidation?.warning === undefined) {
                          warnings.current.delete(key);
                        } else {
                          warnings.current.set(key, fieldValidation.warning);
                        }
                        return true;
                      },
                    })}
                  />
                  {errors[key] && (
                    <p className="mt-1 text-xs text-destructive">{fieldName} is required</p>
                  )}
                  {warnings.current.get(key) !== undefined && (
                    <p className="mt-1 text-xs">{warnings.current.get(key)}</p>
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

          <button
            type="submit"
            disabled={formInvalidReason !== undefined || isSubmitting}
            className="
                mt-8 px-4 py-2 text-sm bg-primary text-white rounded w-full font-medium
                hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed
                transition-colors
              "
          >
            {isSubmitting ? 'Connecting...' : 'Connect'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AddModelForm;
