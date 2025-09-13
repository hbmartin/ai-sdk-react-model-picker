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

const ADD_MODEL_ID = '__add_model__' as const;
const RECENTLY_USED_MODELS_KEY = 'recentlyUsedModels' as const;

type RecentlyUsedModels = Record<string, string>;

// eslint-disable-next-line sonarjs/prefer-read-only-props
export function ModelSelect({
  storage,
  providerRegistry,
  selectedModelId,
  onModelChange,
  roles,
  selectedRole,
  onRoleChange,
  onConfigureProviders,
  theme: _theme,
  className = '',
  disabled = false,
  onSaveConfig: _onSaveConfig,
}: ModelSelectProps) {
  const [showAddModelForm, setShowAddModelForm] = useState(false);
  const [modelsWithCredentials, setModelsWithCredentials] = useState<ModelConfigWithProvider[]>([]);
  const [recentlyUsedModels, setRecentlyUsedModels] = useState<RecentlyUsedModels>({});

  // Get all available models from providers
  const allModels = useMemo(() => {
    return providerRegistry.getAllModels();
  }, [providerRegistry]);

  // Load recently used models from storage
  useEffect(() => {
    async function loadRecentlyUsed() {
      try {
        const stored = await storage.get(RECENTLY_USED_MODELS_KEY);
        if (stored && typeof stored === 'object') {
          setRecentlyUsedModels(stored as RecentlyUsedModels);
        }
      } catch (error) {
        console.warn('Failed to load recently used models:', error);
      }
    }
    void loadRecentlyUsed();
  }, [storage]);

  // Load models with credentials
  useEffect(() => {
    async function loadModelsWithCredentials() {
      try {
        const modelsWithCreds = await Promise.all(
          allModels.map(async (modelWithProvider) => {
            const providerId = modelWithProvider.provider.id;
            const provider = providerRegistry.getProvider(providerId);
            try {
              const storedConfig = (await storage.get(`${providerId}:config`)) ?? {};
              const hasCredentials = provider.hasCredentials(storedConfig);
              return hasCredentials ? modelWithProvider : null;
            } catch (error) {
              console.warn(`Failed to load config for provider "${providerId}":`, error);
              return null;
            }
          })
        );
        if (!cancelled) {
          setModelsWithCredentials(modelsWithCreds.filter(Boolean) as ModelConfigWithProvider[]);
        }
      } catch (error) {
        console.error('Failed to load models with credentials:', error);
      }
    }

    let cancelled = false;
    void loadModelsWithCredentials();
    return () => {
      cancelled = true;
    };
  }, [allModels, storage, providerRegistry]);

  // Organize models into sections
  const { recentModels, unusedModels } = useMemo(() => {
    const modelKey = (m: ModelConfigWithProvider) => `${m.provider.id}:${m.model.id}`;

    // Get recently used models that have credentials, sorted by most recent
    const recentWithTimestamps = modelsWithCredentials
      .map((model) => ({
        model,
        timestamp: recentlyUsedModels[modelKey(model)],
      }))
      .filter((item) => item.timestamp)
      .sort((a, b) => Number(b.timestamp) - Number(a.timestamp));

    const recent = recentWithTimestamps.map((item) => item.model);

    // Get unused models with credentials, sorted alphabetically
    const recentKeys = new Set(recent.map(modelKey));
    const unused = modelsWithCredentials
      .filter((model) => !recentKeys.has(modelKey(model)))
      .sort((a, b) => a.model.displayName.localeCompare(b.model.displayName));

    return { recentModels: recent, unusedModels: unused };
  }, [modelsWithCredentials, recentlyUsedModels]);

  // Find selected model
  const selectedModel = selectedModelId
    ? allModels.find((model) => model.model.id === selectedModelId)
    : undefined;

  // Handle model selection
  const handleModelSelect = async (modelId: ModelId | typeof ADD_MODEL_ID) => {
    if (modelId === ADD_MODEL_ID) {
      setShowAddModelForm(true);
      return;
    }

    const model = allModels.find((m) => m.model.id === modelId);
    if (!model) {
      return;
    }

    // Update recently used models
    const modelKey = `${model.provider.id}:${model.model.id}`;
    try {
      const existing = (await storage.get(RECENTLY_USED_MODELS_KEY)) || {};
      const updated = {
        ...(existing as RecentlyUsedModels),
        [modelKey]: Date.now().toString(),
      };
      await storage.set(RECENTLY_USED_MODELS_KEY, updated);
      setRecentlyUsedModels(updated);
    } catch (error) {
      console.warn('Failed to update recently used models:', error);
    }

    onModelChange(model);
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
          <ListboxButton disabled={disabled} className="h-[18px] gap-1 border-none min-w-0 flex-1">
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
              <span className="font-semibold text-xs text-foreground">Models</span>
              <button
                type="button"
                onClick={onConfigureProviders}
                className="p-1 bg-transparent border-none rounded
        text-foreground hover:bg-accent
        transition-colors duration-150"
                title="Configure providers"
              >
                <SettingsIcon className="h-3 w-3" />
              </button>
            </div>

            {/* Models list */}
            <div className="no-scrollbar max-h-[300px]">
              {modelsWithCredentials.length === 0 ? (
                <div className="text-muted px-2 py-4 text-center text-sm">No models configured</div>
              ) : (
                <>
                  {/* Recently Used Models */}
                  {recentModels.length > 0 && (
                    <>
                      <div className="px-2 py-1 text-[10px] font-semibold text-muted uppercase">
                        Recently Used
                      </div>
                      {recentModels.map((model) => {
                        const isSelected = model.model.id === selectedModelId;
                        return (
                          <ListboxOption key={model.model.id} value={model.model.id}>
                            <div className="flex w-full items-center justify-between">
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                {model.provider.icon ? (
                                  <model.provider.icon className="h-3 w-3 text-current flex-shrink-0" />
                                ) : (
                                  <CubeIcon className="h-3 w-3 text-current flex-shrink-0" />
                                )}
                                <span className="line-clamp-1 text-xs">
                                  {model.model.displayName}
                                  <span className="text-muted ml-1.5 text-[10px] italic">
                                    {model.provider.name}
                                  </span>
                                </span>
                              </div>
                              <CheckIcon
                                className={`h-3 w-3 flex-shrink-0 ${isSelected ? '' : 'invisible'}`}
                              />
                            </div>
                          </ListboxOption>
                        );
                      })}
                    </>
                  )}

                  {/* Unused Models with Credentials */}
                  {unusedModels.length > 0 && (
                    <>
                      <div className="px-2 py-1 text-[10px] font-semibold text-muted uppercase">
                        {recentModels.length > 0 ? 'Other Available' : 'Available Models'}
                      </div>
                      {unusedModels.map((model) => {
                        const isSelected = model.model.id === selectedModelId;
                        return (
                          <ListboxOption key={model.model.id} value={model.model.id}>
                            <div className="flex w-full items-center justify-between">
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                {model.provider.icon ? (
                                  <model.provider.icon className="h-3 w-3 text-current flex-shrink-0" />
                                ) : (
                                  <CubeIcon className="h-3 w-3 text-current flex-shrink-0" />
                                )}
                                <span className="line-clamp-1 text-xs">
                                  {model.model.displayName}
                                  <span className="text-muted ml-1.5 text-[10px] italic">
                                    {model.provider.name}
                                  </span>
                                </span>
                              </div>
                              <CheckIcon
                                className={`h-3 w-3 flex-shrink-0 ${isSelected ? '' : 'invisible'}`}
                              />
                            </div>
                          </ListboxOption>
                        );
                      })}
                    </>
                  )}
                </>
              )}
            </div>

            <ListboxOption value={ADD_MODEL_ID}>
              <div
                className="text-muted flex items-center py-0.5 my-0.5 hover:text-foreground text-xs font-semibold
                        border-b-0 border-t border-r-0 border-l-0 border-border border-solid"
              >
                <PlusIcon className="mr-2 h-3 w-3" />
                Add model
              </div>
            </ListboxOption>
          </ListboxOptions>
        </div>
      </Listbox>

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
