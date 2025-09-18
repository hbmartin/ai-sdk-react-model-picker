import { useCallback, useMemo, useState } from 'react';
import { type ModelSelectProps, type ProviderAndModelKey, idsFromKey } from '../types';
import { useOptionalModelPicker } from '../context';
import { useModelsWithConfiguredProvider } from '../hooks/useModelsWithConfiguredProvider';
import { ChevronDownIcon, PlusIcon } from '../icons';
import { AddModelForm } from './AddModelForm';
import { ModelOption } from './ModelOption';
import { Toggle } from './Toggle';
import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from './ui/Listbox';

const ADD_MODEL_ID = '__add_model__' as const;
const ADD_MODEL_LABEL = 'Add Model Provider' as const;

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
  const context = useOptionalModelPicker();
  const effectiveStorage = context?.storage ?? storage;
  const effectiveProviderRegistry = context?.providerRegistry ?? providerRegistry;
  const effectiveRoles = context?.roles ?? roles;
  const effectiveSelectedRole = context?.state.selectedRole ?? selectedRole;
  const effectiveOnRoleChange = context?.selectRole ?? onRoleChange;
  const [showAddModelForm, setShowAddModelForm] = useState(false);
  const {
    recentlyUsedModels,
    modelsWithCredentials,
    selectedModel,
    setSelectedProviderAndModel,
    deleteProvider,
    isLoadingOrError,
  } = useModelsWithConfiguredProvider(effectiveStorage, effectiveProviderRegistry);

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
    const modelWithProvider = setSelectedProviderAndModel(providerId, modelId);
    if (modelWithProvider) {
      // Notify both context (if present) and prop callback
      context?.selectModel(modelWithProvider);
      onModelChange?.(modelWithProvider);
    }
  };

  const shouldOpenList = useCallback(() => {
    if (recentlyUsedModels.length === 0 && modelsWithCredentials.length === 0) {
      setShowAddModelForm(true);
      return false;
    }
    return true;
  }, [recentlyUsedModels, modelsWithCredentials]);

  const buttonLabel: string = useMemo(() => {
    switch (isLoadingOrError.state) {
      case 'loading': {
        return 'Loading...';
      }
      case 'ready': {
        return selectedModel?.model.displayName ?? ADD_MODEL_LABEL;
      }
      case 'error': {
        return isLoadingOrError.message ?? 'Failed to load models';
      }
    }
  }, [isLoadingOrError, selectedModel]);

  return (
    <div className={`ai-sdk-model-picker ${className}`}>
      {/* Role selector (if roles provided) */}
      {effectiveRoles && effectiveRoles.length > 0 && (
        <div className="mb-3">
          <Toggle
            optionOne={effectiveRoles[0]?.label || 'Option 1'}
            optionTwo={effectiveRoles[1]?.label || 'Option 2'}
            selected={effectiveSelectedRole === effectiveRoles[0]?.id}
            onClick={() => {
              if (effectiveOnRoleChange && effectiveRoles.length > 1) {
                effectiveOnRoleChange(
                  effectiveSelectedRole === effectiveRoles[0].id
                    ? effectiveRoles[1].id
                    : effectiveRoles[0].id
                );
              }
            }}
          />
        </div>
      )}

      <Listbox value={selectedModel?.key} onChange={handleModelSelect}>
        <div className="relative flex">
          <ListboxButton
            disabled={disabled || isLoadingOrError.state === 'loading'}
            aria-busy={isLoadingOrError.state === 'loading'}
            className="h-[18px] gap-1 border-none min-w-0 flex-1 text-muted hover:text-foreground py-0 px-1 text-xs"
            shouldOpenList={shouldOpenList}
          >
            <span className="line-clamp-1 break-all hover:brightness-110 text-left">
              {buttonLabel}
            </span>
            <ChevronDownIcon
              className="hidden h-2 w-2 flex-shrink-0 hover:brightness-110 min-[200px]:flex"
              aria-hidden="true"
            />
          </ListboxButton>

          <ListboxOptions className="min-w-[160px]">
            <div className="no-scrollbar max-h-[300px] mb-1">
              {modelsWithCredentials.length === 0 && recentlyUsedModels.length === 0 ? (
                <div className="text-muted px-2 py-4 text-center text-xs">No models configured</div>
              ) : (
                <>
                  <div className="px-2 py-1 text-[10px] font-semibold text-muted uppercase">
                    Recently Used
                  </div>
                  {recentlyUsedModels.map((model) => (
                    <ModelOption key={model.key} model={model} />
                  ))}

                  {modelsWithCredentials.length > 0 && (
                    <div className="px-2 py-1 text-[10px] font-semibold text-muted uppercase">
                      Available Models
                    </div>
                  )}
                  {modelsWithCredentials.map((model) => (
                    <ModelOption key={model.key} model={model} />
                  ))}
                </>
              )}
            </div>
            <hr className="bg-accent h-px border-0 m-0" />
            <ListboxOption value={ADD_MODEL_ID} className="text-muted hover:text-foreground">
              <div className="flex items-center py-1 text-xs font-semibold">
                <PlusIcon className="mr-2 h-3 w-3" />
                {ADD_MODEL_LABEL}
              </div>
            </ListboxOption>
          </ListboxOptions>
        </div>
      </Listbox>

      {showAddModelForm && (
        <AddModelForm
          providerRegistry={effectiveProviderRegistry}
          storage={effectiveStorage}
          onClose={() => setShowAddModelForm(false)}
          onProviderConfigured={(provider) => {
            const modelWithProvider = setSelectedProviderAndModel(provider.id);
            setShowAddModelForm(false);
            if (modelWithProvider) {
              context?.selectModel(modelWithProvider);
            }
            onModelChange?.(modelWithProvider);
          }}
          onProviderDeleted={(providerId) => {
            const model = deleteProvider(providerId);
            context?.selectModel(model);
            onModelChange?.(model);
          }}
        />
      )}
    </div>
  );
}

export default ModelSelect;
export type { ModelSelectProps };
