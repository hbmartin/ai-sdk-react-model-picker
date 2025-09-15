import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import type {
  IProviderRegistry,
  StorageAdapter,
  AIProvider,
  ProviderMetadata,
  ProviderId,
} from '../types';
import { TrashIcon } from '../icons';
import {
  deleteProviderConfiguration,
  getProviderConfiguration,
  setProviderConfiguration,
} from '../storage/repository';
import { ProviderSelectionListbox } from './ProviderSelectionListbox';

export interface AddModelFormProps {
  readonly providerRegistry: IProviderRegistry;
  readonly storage: StorageAdapter;
  readonly onClose: () => void;
  readonly onProviderConfigured: (provider: ProviderMetadata) => void;
  readonly className?: string;
  readonly onProviderDeleted: (providerId: ProviderId) => void;
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
  onProviderDeleted,
}: AddModelFormProps) {
  const [selectedProvider, setSelectedProvider] = useState<AIProvider | undefined>();
  const [warnings, setWarnings] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | undefined>();
  const [providerHadCredentials, setProviderHadCredentials] = useState<boolean>(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid, isSubmitting },
    reset,
    getFieldState,
  } = useForm<FormData>({
    mode: 'onTouched',
  });

  const clearReset = () => {
    reset(
      selectedProvider?.configuration.fields.reduce<Record<string, string>>((acc, field) => {
        acc[field.key] = '';
        return acc;
      }, {})
    );
  };

  const { topProviders, otherProviders } = useMemo(() => {
    const allProviders = providerRegistry.getAllProviders().map((provider) => provider.metadata);
    const topProviders: ProviderMetadata[] = [];
    const otherProviders: ProviderMetadata[] = [];
    for (const provider of allProviders) {
      if (providerRegistry.topProviders.includes(provider.id)) {
        topProviders.push(provider);
      } else {
        otherProviders.push(provider);
      }
    }
    return { topProviders, otherProviders };
  }, [providerRegistry]);

  const validate = (key: string, value: string | undefined): string | undefined => {
    if (selectedProvider === undefined) {
      return 'Provider is required';
    }
    const fieldValidation = selectedProvider.configuration.validateField(key, value);
    const hasValue = value !== undefined && value.trim().length > 0;
    const { isDirty } = getFieldState(key);
    if (fieldValidation?.error !== undefined) {
      return hasValue || isDirty ? fieldValidation.error : undefined;
    }
    if (fieldValidation?.warning === undefined && key in warnings && hasValue) {
      setWarnings((prev) => {
        // eslint-disable-next-line sonarjs/no-unused-vars
        const { [key]: _, ...rest } = prev;
        return rest;
      });
    } else if (fieldValidation?.warning !== undefined && (hasValue || isDirty)) {
      setWarnings((prev) => {
        return { ...prev, [key]: fieldValidation.warning };
      });
    }
    return undefined;
  };

  const onProviderSelected = async (provider: ProviderMetadata) => {
    setWarnings({});
    setSubmitError(undefined);

    clearReset();
    const providerConfig = await getProviderConfiguration(storage, provider.id);
    if (providerConfig !== undefined) {
      reset(providerConfig);
    }

    setProviderHadCredentials(providerConfig !== undefined);
    setSelectedProvider(providerRegistry.getProvider(provider.id));
  };

  const onSubmit = async (formDataWithAny: FormData) => {
    const formData = Object.fromEntries(
      Object.entries(formDataWithAny).filter(([_, value]) => typeof value === 'string')
    ) as Record<string, string>;

    if (selectedProvider === undefined) {
      return;
    }

    try {
      // The user should not be able to submit without individually validated fields
      // So this check is functionally for mutually inclusive field e.g. one of apiKey or baseURL
      const validation = selectedProvider.validateCredentials(formData);
      if (!validation.isValid) {
        setSubmitError(validation.error ?? 'An unknown error occurred');
        return;
      }
      await setProviderConfiguration(storage, selectedProvider.metadata.id, formData);

      // Model and Provider are set as selected in the parent component
      onProviderConfigured(selectedProvider.metadata);
      reset();
      setWarnings({});
      setSubmitError(undefined);
      setProviderHadCredentials(false);
    } catch (error) {
      setSubmitError(
        `Error saving model configuration: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50  backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-model-title"
    >
      <div
        className={`
        bg-background border border-border rounded-lg shadow-lg
        max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto
        ${className}
      `}
        onClick={(event) => event.stopPropagation()}
      >
        {/* eslint-disable-next-line @typescript-eslint/no-misused-promises */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 id="add-model-title" className="text-md font-semibold text-foreground leading-none">
              Add Provider
            </h2>
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
              <ProviderSelectionListbox
                selectedItem={selectedProvider?.metadata}
                onSelectionChange={(provider) => void onProviderSelected(provider)}
                topOptions={topProviders}
                otherOptions={otherProviders}
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
                      validate: (value) => validate(key, value),
                    })}
                  />
                  {errors[key] && (
                    <p className="mt-1 px-1 text-xs text-destructive">{errors[key].message}</p>
                  )}
                  {key in warnings && !(key in errors) && (
                    <p className="mt-1 px-1 text-xs text-warning">{warnings[key]}</p>
                  )}
                  {key === 'apiKey' &&
                    selectedProvider.metadata.apiKeyUrl !== undefined &&
                    !(key in warnings) &&
                    !(key in errors) && (
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

          {submitError !== undefined && (
            <p className="my-2 px-1 text-sm text-destructive">{submitError}</p>
          )}

          <div className="flex justify-between gap-2">
            {selectedProvider !== undefined && providerHadCredentials && (
              <button
                type="button"
                disabled={isSubmitting}
                aria-busy={isSubmitting}
                onClick={() => {
                  void deleteProviderConfiguration(storage, selectedProvider.metadata.id);
                  setProviderHadCredentials(false);
                  clearReset();
                  onProviderDeleted(selectedProvider.metadata.id);
                }}
                className="w-1/4
              mt-8 px-4 py-2 text-sm bg-destructive text-white rounded w-full
              disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed
               border border-border border-solid transition-colors
               active:scale-95 transition-all duration-100 ease-in-out
            "
              >
                <TrashIcon className="w-4 h-4 flex-shrink-0 text-current" />
              </button>
            )}
            <button
              type="submit"
              disabled={isSubmitting || !isValid || selectedProvider === undefined}
              aria-busy={isSubmitting}
              className="
                mt-8 px-4 py-2 text-sm bg-primary text-white rounded w-full font-medium
                disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed
                 border border-border border-solid transition-colors
                 active:scale-95 transition-all duration-100 ease-in-out
              "
            >
              {providerHadCredentials
                ? // eslint-disable-next-line sonarjs/no-nested-conditional
                  isSubmitting
                  ? 'Updating...'
                  : 'Update'
                : // eslint-disable-next-line sonarjs/no-nested-conditional
                  isSubmitting
                  ? 'Connecting...'
                  : 'Connect'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddModelForm;
