import { useCallback, useState } from 'react';
import {
  type ModelSelectProps,
  providerAndModelKey,
  type ProviderAndModelKey,
  idsFromKey,
} from '../types';
import { useModelsWithConfiguredProvider } from '../hooks/useModelsWithConfiguredProvider';
import { CheckIcon, ChevronDownIcon, SettingsIcon, PlusIcon } from '../icons';
import { AddModelForm } from './AddModelForm';
import { Toggle } from './Toggle';
import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from './ui/Listbox';

const ADD_MODEL_ID = '__add_model__' as const;

// eslint-disable-next-line sonarjs/prefer-read-only-props
export function ModelSelect({
  storage,
  providerRegistry,
  onModelChange,
  roles,
  selectedRole,
  onRoleChange,
  className = '',
  disabled = false,
}: ModelSelectProps) {
  const [showAddModelForm, setShowAddModelForm] = useState(false);
  const [showConfigureProviders, setShowConfigureProviders] = useState(false);
  const { recentlyUsedModels, modelsWithCredentials, selectedModel, setSelectedModelAndProvider } =
    useModelsWithConfiguredProvider(storage, providerRegistry);

  // Handle model selection
  const handleModelSelect = (key: ProviderAndModelKey | typeof ADD_MODEL_ID) => {
    if (key === ADD_MODEL_ID) {
      setShowAddModelForm(true);
      return;
    }
    const { providerId, modelId } = idsFromKey(key);
    if (modelId === selectedModel?.model.id && providerId === selectedModel.provider.id) {
      return;
    }
    const modelWithProvider = setSelectedModelAndProvider(modelId, providerId);
    if (modelWithProvider) {
      onModelChange(modelWithProvider);
    }
  };

  const shouldOpenList = useCallback(() => {
    if (recentlyUsedModels.length === 0 && modelsWithCredentials.length === 0) {
      setShowAddModelForm(true);
      return false;
    }
    return true;
  }, [recentlyUsedModels, modelsWithCredentials]);

  const displayTitle = selectedModel?.model.displayName ?? 'Add model';

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
      <Listbox
        value={selectedModel ? providerAndModelKey(selectedModel) : undefined}
        onChange={handleModelSelect}
      >
        <div className="relative flex">
          <ListboxButton
            disabled={disabled}
            className="h-[18px] gap-1 border-none min-w-0 flex-1 text-muted hover:text-foreground py-0 px-1 text-xs"
            shouldOpenList={shouldOpenList}
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
              <span className="font-semibold text-xs text-foreground">Models</span>
              <button
                type="button"
                onClick={() => setShowConfigureProviders(true)}
                className="p-1 bg-transparent border-none rounded
        text-foreground hover:bg-accent
        transition-colors duration-150"
                title="Configure providers"
              >
                <SettingsIcon className="h-3 w-3" />
              </button>
              {showConfigureProviders && <span>Sorry, not implemented yet</span>}
            </div>

            {/* Models list */}
            <div className="no-scrollbar max-h-[300px]">
              {modelsWithCredentials.length === 0 ? (
                <div className="text-muted px-2 py-4 text-center text-xs">No models configured</div>
              ) : (
                <>
                  {/* Recently Used Models */}
                  {recentlyUsedModels.length > 0 && (
                    <>
                      <div className="px-2 py-1 text-[10px] font-semibold text-muted uppercase">
                        Recently Used
                      </div>
                      {recentlyUsedModels.map((model) => {
                        const isSelected =
                          model.model.id === selectedModel?.model.id &&
                          model.provider.id === selectedModel.provider.id;
                        return (
                          <ListboxOption
                            key={providerAndModelKey(model)}
                            value={providerAndModelKey(model)}
                          >
                            <div className="flex w-full items-center justify-between">
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                <model.provider.icon
                                  className="h-3 w-3 text-current flex-shrink-0"
                                  aria-hidden="true"
                                />
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
                  {modelsWithCredentials.length > 0 && (
                    <>
                      {modelsWithCredentials.map((model) => {
                        const isSelected =
                          model.model.id === selectedModel?.model.id &&
                          model.provider.id === selectedModel.provider.id;
                        return (
                          <ListboxOption
                            key={providerAndModelKey(model)}
                            value={providerAndModelKey(model)}
                          >
                            <div className="flex w-full items-center justify-between">
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                <model.provider.icon
                                  className="h-3 w-3 text-current flex-shrink-0"
                                  aria-hidden="true"
                                />
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
          onProviderConfigured={(provider) => {
            const model = providerRegistry.getProvider(provider.id).getDefaultModel();
            setSelectedModelAndProvider(model.id, provider.id);
            setShowAddModelForm(false);
            onModelChange({ model, provider });
          }}
        />
      )}
    </div>
  );
}

export default ModelSelect;
export type { ModelSelectProps };
