import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import type {
  IProviderRegistry,
  StorageAdapter,
  AIProvider,
  ProviderMetadata,
  ProviderId,
  CatalogEntry,
  ProviderModelsStatus,
  ModelId,
} from '../types';
import { TrashIcon } from '../icons';
import {
  deleteProviderConfiguration,
  getProviderConfiguration,
  setProviderConfiguration,
} from '../storage/repository';
import { ConfigureModelsPanel } from './add-model-form/ConfigureModelsPanel';
import { ProviderCredentialsSection } from './add-model-form/ProviderCredentialsSection';
import type { AddModelFormData } from './add-model-form/types';

export interface AddModelFormProps {
  readonly providerRegistry: IProviderRegistry;
  readonly storage: StorageAdapter;
  readonly onClose: () => void;
  readonly onProviderConfigured: (provider: ProviderMetadata) => void;
  readonly className?: string;
  readonly onProviderDeleted: (providerId: ProviderId) => void;
  readonly getProviderModels: (providerId: ProviderId) => CatalogEntry[];
  readonly getProviderModelsStatus: (providerId: ProviderId) => ProviderModelsStatus | undefined;
  readonly onToggleModelVisibility: (
    providerId: ProviderId,
    modelId: ModelId,
    visible: boolean
  ) => Promise<void>;
  readonly onAddModel: (
    providerId: ProviderId,
    modelId: string
  ) => Promise<CatalogEntry | undefined>;
  readonly selectedCatalogModel: CatalogEntry | undefined;
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
  getProviderModels,
  getProviderModelsStatus,
  onToggleModelVisibility,
  onAddModel,
  selectedCatalogModel,
}: AddModelFormProps) {
  const [selectedProvider, setSelectedProvider] = useState<AIProvider | undefined>();
  const [warnings, setWarnings] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | undefined>();
  const [providerHadCredentials, setProviderHadCredentials] = useState<boolean>(false);
  const [showModelConfigurator, setShowModelConfigurator] = useState(false);
  const [modelPanelError, setModelPanelError] = useState<string | undefined>();
  const [newModelId, setNewModelId] = useState('');
  const [highlightedModelId, setHighlightedModelId] = useState<ModelId | undefined>();
  const [isAddingModel, setIsAddingModel] = useState(false);
  const [pendingVisibilityUpdate, setPendingVisibilityUpdate] = useState<ModelId | undefined>();

  const {
    register,
    handleSubmit,
    formState: { errors, isValid, isSubmitting },
    reset,
    getFieldState,
  } = useForm<AddModelFormData>({
    mode: 'onTouched',
  });

  const clearReset = () => {
    const currentProviderId = selectedProvider?.metadata.id;
    setWarnings({});
    setSubmitError(undefined);
    setShowModelConfigurator(false);
    setModelPanelError(undefined);
    setNewModelId('');
    setHighlightedModelId(undefined);
    setIsAddingModel(false);
    setPendingVisibilityUpdate(undefined);

    if (selectedProvider === undefined) {
      reset();
      return;
    }
    const emptyFields = selectedProvider.configuration.fields.reduce<Record<string, string>>(
      (acc, field) => {
        acc[field.key] = '';
        return acc;
      },
      {}
    );
    if (currentProviderId === selectedProvider.metadata.id) {
      reset(emptyFields);
    }
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

  const activeProviderId = selectedProvider?.metadata.id;
  const providerModels = activeProviderId ? getProviderModels(activeProviderId) : [];
  const providerModelsStatus = activeProviderId
    ? getProviderModelsStatus(activeProviderId)
    : undefined;
  const canConfigureModels = selectedProvider !== undefined && providerHadCredentials;

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
    clearReset();
    const providerConfig = await getProviderConfiguration(storage, provider.id);
    if (providerConfig !== undefined) {
      reset(providerConfig);
    }

    setProviderHadCredentials(providerConfig !== undefined);
    setSelectedProvider(providerRegistry.getProvider(provider.id));
  };

  const onSubmit = async (formDataWithAny: AddModelFormData) => {
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

  const handleToggleModelVisibility = async (entry: CatalogEntry) => {
    if (!selectedProvider) {
      return;
    }
    const providerId = selectedProvider.metadata.id;
    setModelPanelError(undefined);
    setPendingVisibilityUpdate(entry.model.id);
    try {
      await onToggleModelVisibility(providerId, entry.model.id, !(entry.model.visible ?? true));
    } catch (error) {
      setModelPanelError(
        `Failed to update visibility: ${error instanceof Error ? error.message : String(error)}`
      );
    } finally {
      setPendingVisibilityUpdate(undefined);
    }
  };

  const handleAddModelToCatalog = async () => {
    if (!selectedProvider) {
      return;
    }
    const trimmed = newModelId.trim();
    if (trimmed.length === 0) {
      setModelPanelError('Model id is required');
      return;
    }

    const providerId = selectedProvider.metadata.id;
    const existing = providerModels.find(
      (entry) => entry.model.id.toLowerCase() === trimmed.toLowerCase()
    );
    if (existing !== undefined) {
      setModelPanelError('Model already exists');
      setHighlightedModelId(existing.model.id);
      return;
    }

    setModelPanelError(undefined);
    setIsAddingModel(true);
    try {
      const entry = await onAddModel(providerId, trimmed);
      if (entry !== undefined) {
        setNewModelId('');
        setHighlightedModelId(entry.model.id);
      }
    } catch (error) {
      setModelPanelError(
        `Failed to add model: ${error instanceof Error ? error.message : String(error)}`
      );
    } finally {
      setIsAddingModel(false);
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
        className={`transition-all duration-250 min-h-1/2
        bg-background border border-border rounded-lg shadow-lg
        max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto
        ${className}
      `}
        onClick={(event) => event.stopPropagation()}
      >
        {/* eslint-disable-next-line @typescript-eslint/no-misused-promises */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6">
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

          <div className="relative overflow-hidden">
            <div
              className="flex w-[200%] transition-transform duration-300 ease-in-out"
              style={{ transform: showModelConfigurator ? 'translateX(-50%)' : 'translateX(0%)' }}
            >
              <div className="w-1/2 pr-3 sm:pr-4">
                <ProviderCredentialsSection
                  topProviders={topProviders}
                  otherProviders={otherProviders}
                  selectedProvider={selectedProvider}
                  onProviderSelected={(provider) => void onProviderSelected(provider)}
                  register={register}
                  errors={errors}
                  warnings={warnings}
                  validateField={validate}
                />

                {submitError !== undefined && (
                  <p className="my-2 px-1 text-sm text-destructive">{submitError}</p>
                )}

                {!showModelConfigurator && (
                  <button
                    type="button"
                    disabled={!canConfigureModels}
                    onClick={() => {
                      if (!canConfigureModels) {
                        return;
                      }
                      setModelPanelError(undefined);
                      setShowModelConfigurator(true);
                    }}
                    className="mt-6 w-full rounded border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors duration-150 hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Configure models
                  </button>
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
                    mt-8 px-4 py-2 text-sm bg-destructive text-destructive-foreground rounded
                    disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed
                     border border-border border-solid transition-colors
                     active:scale-95 transition-all duration-100 ease-in-out
                  "
                    >
                      <TrashIcon className="h-4 w-4 flex-shrink-0 text-current" />
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={isSubmitting || !isValid || selectedProvider === undefined}
                    aria-busy={isSubmitting}
                    className="
                      mt-8 w-full rounded border border-border border-solid bg-primary px-4 py-2 text-sm font-medium text-primary-foreground
                      disabled:cursor-not-allowed disabled:opacity-50
                      transition-colors active:scale-95 duration-100 ease-in-out
                    "
                  >
                    {providerHadCredentials
                      ? isSubmitting
                        ? 'Updating...'
                        : 'Update'
                      : isSubmitting
                        ? 'Connecting...'
                        : 'Connect'}
                  </button>
                </div>
              </div>

              <ConfigureModelsPanel
                selectedProvider={selectedProvider}
                providerModels={providerModels}
                providerModelsStatus={providerModelsStatus}
                newModelId={newModelId}
                onNewModelIdChange={setNewModelId}
                onAddModel={handleAddModelToCatalog}
                isAddingModel={isAddingModel}
                onBack={() => {
                  setShowModelConfigurator(false);
                  setModelPanelError(undefined);
                }}
                modelPanelError={modelPanelError}
                pendingVisibilityUpdate={pendingVisibilityUpdate}
                onToggleModelVisibility={handleToggleModelVisibility}
                highlightedModelId={highlightedModelId}
                onHighlightTimeout={() => setHighlightedModelId(undefined)}
                selectedCatalogModel={selectedCatalogModel}
              />
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddModelForm;
