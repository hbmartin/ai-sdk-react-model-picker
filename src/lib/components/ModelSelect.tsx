/* eslint-disable sonarjs/no-nested-conditional */
import { useState, useEffect, useMemo } from 'react';
import type { ModelSelectProps, ModelConfigWithProvider, ModelId } from '../types';
import {
  CubeIcon,
  CheckIcon,
  ChevronDownIcon,
  SettingsIcon,
  PlusIcon,
  SpinnerIcon,
} from '../icons';
import { AddModelForm } from './AddModelForm';
import { Toggle } from './Toggle';
import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from './ui/Listbox';

interface ModelOption {
  model: ModelConfigWithProvider;
  hasCredentials: boolean;
  isAutoDetected?: boolean;
}

const ADD_MODEL_ID = '__add_model__' as const;

// Typed comparator to avoid any/unknown inference in linters
// eslint-disable-next-line code-complete/enforce-meaningful-names
const compareModelOptions = (a: ModelOption, b: ModelOption): number => {
  if (a.hasCredentials && !b.hasCredentials) {
    return -1;
  }
  if (!a.hasCredentials && b.hasCredentials) {
    return 1;
  }
  return a.model.model.displayName.localeCompare(b.model.model.displayName);
};

// eslint-disable-next-line sonarjs/prefer-read-only-props
export function ModelSelect({
  storage,
  providerRegistry,
  selectedModelId,
  onModelChange,
  roles,
  selectedRole,
  onRoleChange,
  onConfigureProvider,
  theme: _theme,
  className = '',
  disabled = false,
  onSaveApiKey: _onSaveApiKey,
  onLoadApiKey: _onLoadApiKey,
  onSaveConfig: _onSaveConfig,
}: ModelSelectProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showAddModelForm, setShowAddModelForm] = useState(false);
  const [modelOptions, setModelOptions] = useState<readonly ModelOption[]>([]);

  // Get all available models from providers
  const allModels = useMemo(() => {
    return providerRegistry.getAllModels();
  }, [providerRegistry]);

  // Load API keys and model configuration
  // TODO: optimize this to only load for currently selected provider
  useEffect(() => {
    async function loadModelOptions() {
      if (!cancelled) {
        setIsLoading(true);
      }
      try {
        const options: ModelOption[] = await Promise.all(
          allModels.map(async (modelWithProvider) => {
            const providerId = modelWithProvider.provider.id;
            const provider = providerRegistry.getProvider(providerId);
            try {
              const storedConfig = (await storage.get(`${providerId}:config`)) ?? {};
              const hasCredentials = provider.hasCredentials(storedConfig);
              return {
                model: modelWithProvider,
                hasCredentials: hasCredentials,
                isAutoDetected: false, // TODO: Implement auto-detection logic
              } as ModelOption;
            } catch (error) {
              console.warn(`Failed to load config for provider "${providerId}":`, error);
              return {
                model: modelWithProvider,
                hasCredentials: false,
                isAutoDetected: false,
              } as ModelOption;
            }
          })
        );
        if (!cancelled) {
          setModelOptions(options);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    let cancelled = false;
    void loadModelOptions();
    return () => {
      cancelled = true;
    };
  }, [allModels, storage, providerRegistry]);

  // Sort options: those with API keys first, then alphabetically
  const sortedOptions = useMemo<readonly ModelOption[]>(() => {
    return modelOptions.toSorted(compareModelOptions);
  }, [modelOptions]);

  // Find selected model
  const selectedModel = selectedModelId
    ? allModels.find((model) => model.model.id === selectedModelId)
    : undefined;

  // Handle model selection
  const handleModelSelect = (modelId: ModelId) => {
    if ((modelId as unknown) === ADD_MODEL_ID) {
      setShowAddModelForm(true);
      return;
    }

    const modelOption = sortedOptions.find((opt) => opt.model.model.id === modelId);
    if (!modelOption) {
      return;
    }

    // eslint-disable-next-line sonarjs/no-commented-code
    // if (!modelOption.hasApiKey) {
    //   // Handle missing API key
    //   const requiredKeys = modelOption.model.provider.requiredKeys ?? ['apiKey'];
    //   onMissingConfiguration?.(requiredKeys);
    //   return;
    // }

    onModelChange(modelOption.model);
  };

  // Handle configuration button click
  const handleConfigureProvider = () => {
    if (selectedModel) {
      onConfigureProvider?.(selectedModel.provider.id);
    }
  };

  const displayTitle = selectedModel?.model.displayName ?? 'Select model';

  return (
    <div className={`ai-sdk-model-picker ${className}`}>
      {/* Role selector (if roles provided) */}
      {roles && roles.length > 0 && (
        <div className="mb-3">
          <Toggle
            optionOne={roles[0]?.label || 'Option 1'}
            optionTwo={roles[1]?.label || 'Option 2'}
            selected={selectedRole === roles[0]?.id}
            onClick={() => {
              if (onRoleChange && roles.length > 1) {
                onRoleChange(selectedRole === roles[0].id ? roles[1].id : roles[0].id);
              }
            }}
          />
        </div>
      )}

      {/* Model selector */}
      <Listbox value={selectedModelId} onChange={handleModelSelect}>
        <div className="relative flex">
          <ListboxButton
            disabled={disabled || isLoading}
            className="text-muted h-[18px] gap-1 border-none min-w-0 flex-1"
          >
            <span className="line-clamp-1 break-all hover:brightness-110 text-left">
              {displayTitle}
            </span>
            <ChevronDownIcon
              className="hidden h-2 w-2 flex-shrink-0 hover:brightness-110 min-[200px]:flex"
              aria-hidden="true"
            />
          </ListboxButton>

          <ListboxOptions className="min-w-[160px]">
            {/* Header */}
            <div className="flex items-center justify-between gap-1 px-2 py-1 border-b border-border">
              <span className="font-semibold text-sm">Models</span>
              <button
                type="button"
                onClick={handleConfigureProvider}
                className="p-1 text-muted hover:text-foreground transition-colors"
                title="Configure provider"
              >
                <SettingsIcon className="h-3 w-3" />
              </button>
            </div>

            {/* Models list */}
            <div className="no-scrollbar max-h-[300px] overflow-y-auto">
              {isLoading ? (
                <div className="text-muted flex items-center gap-2 px-2 pb-2 pt-1 text-xs">
                  <SpinnerIcon className="animate-spin h-3 w-3" />
                  <span>Loading models</span>
                </div>
              ) : sortedOptions.length === 0 ? (
                <div className="text-muted px-2 py-4 text-center text-sm">No models configured</div>
              ) : (
                sortedOptions.map((option) => {
                  const isSelected = option.model.model.id === selectedModelId;
                  // TODO: this should check all required keys
                  const showMissingKey = !option.hasCredentials;

                  return (
                    <ListboxOption
                      key={option.model.model.id}
                      value={option.model.model.id}
                      disabled={showMissingKey}
                      className="px-3 py-2"
                    >
                      <div className="flex w-full items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <CubeIcon className="h-3 w-3 flex-shrink-0" />
                          <span className="line-clamp-1 text-xs">
                            {option.model.model.displayName}
                            {option.isAutoDetected === true && (
                              <span className="text-muted ml-1.5 text-[10px] italic">
                                (autodetected)
                              </span>
                            )}
                            {showMissingKey && (
                              <span className="ml-1.5 text-[10px] italic text-destructive">
                                (Missing API key)
                              </span>
                            )}
                          </span>
                        </div>
                        <CheckIcon
                          className={`h-3 w-3 flex-shrink-0 ${isSelected ? '' : 'invisible'}`}
                        />
                      </div>
                    </ListboxOption>
                  );
                })
              )}
            </div>

            {/* Add model button */}
            {!isLoading && (
              <ListboxOption
                value={ADD_MODEL_ID}
                onClick={() => setShowAddModelForm(true)}
                className="border-t border-border bg-accent"
              >
                <div className="text-muted flex items-center py-0.5 hover:text-foreground text-xs">
                  <PlusIcon className="mr-2 h-3 w-3" />
                  Add model
                </div>
              </ListboxOption>
            )}
          </ListboxOptions>
        </div>
      </Listbox>

      {/* Add Model Form Dialog */}
      {showAddModelForm && (
        <AddModelForm
          providerRegistry={providerRegistry}
          storage={storage}
          onClose={() => setShowAddModelForm(false)}
          onModelAdded={(model) => {
            setShowAddModelForm(false);
            onModelChange(model);
          }}
        />
      )}
    </div>
  );
}

export default ModelSelect;
export type { ModelSelectProps };
