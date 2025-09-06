import React, { useState, useEffect, useMemo } from 'react';
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
  hasApiKey: boolean;
  isAutoDetected?: boolean;
}

/**
 * Main model selection component - fully controlled
 * Migrated from Continue's ModelSelect with controlled behavior
 */
export function ModelSelect({
  storage,
  providers,
  selectedModelId,
  onModelChange,
  roles,
  selectedRole,
  onRoleChange,
  onConfigureProvider,
  onMissingConfiguration,
  theme: _theme,
  className = '',
  disabled = false,
  onSaveApiKey: _onSaveApiKey,
  onLoadApiKey: _onLoadApiKey,
  onSaveConfig: _onSaveConfig,
}: ModelSelectProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showAddModelForm, setShowAddModelForm] = useState(false);
  const [modelOptions, setModelOptions] = useState<ModelOption[]>([]);

  // Get all available models from providers
  const allModels = useMemo(() => {
    return providers.getAllModels();
  }, [providers]);

  // Load API keys and model configuration
  useEffect(() => {
    async function loadModelOptions() {
      setIsLoading(true);

      const options: ModelOption[] = [];

      for (const modelWithProvider of allModels) {
        const providerId = modelWithProvider.provider.id;
        const provider = providers.getProvider(providerId);

        // Check if provider has credentials stored
        const storedConfig = (await storage.get(`${providerId}:config`)) || {};
        const hasCredentials = provider.hasCredentials(storedConfig);

        options.push({
          model: modelWithProvider,
          hasApiKey: hasCredentials,
          isAutoDetected: false, // TODO: Implement auto-detection logic
        });
      }

      setModelOptions(options);
      setIsLoading(false);
    }

    loadModelOptions();
  }, [allModels, storage, providers]);

  // Sort options: those with API keys first, then alphabetically
  const sortedOptions = useMemo(() => {
    return modelOptions.toSorted((a, b) => {
      // First sort by API key availability
      if (a.hasApiKey && !b.hasApiKey) return -1;
      if (!a.hasApiKey && b.hasApiKey) return 1;

      // Then sort alphabetically
      return a.model.model.displayName.localeCompare(b.model.model.displayName);
    });
  }, [modelOptions]);

  // Find selected model
  const selectedModel = selectedModelId
    ? allModels.find((m) => m.model.id === selectedModelId)
    : null;

  // Handle model selection
  const handleModelSelect = async (modelId: ModelId) => {
    const modelOption = sortedOptions.find((opt) => opt.model.model.id === modelId);
    if (!modelOption) return;

    if (!modelOption.hasApiKey) {
      // Handle missing API key
      const requiredKeys = modelOption.model.provider.requiredKeys || ['apiKey'];
      onMissingConfiguration?.(requiredKeys);
      return;
    }

    onModelChange(modelOption.model);
  };

  // Handle add model button click
  const handleAddModel = () => {
    if (sortedOptions.length === 0) {
      // If no models available, show form immediately
      setShowAddModelForm(true);
    } else {
      setShowAddModelForm(true);
    }
  };

  // Handle configuration button click
  const handleConfigureProvider = () => {
    if (selectedModel) {
      onConfigureProvider?.(selectedModel.provider.id);
    }
  };

  const displayTitle = selectedModel?.model.displayName || 'Select model';

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
              if (onRoleChange && roles[0] && roles[1]) {
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
                sortedOptions.map((option, idx) => {
                  const isSelected = option.model.model.id === selectedModelId;
                  const showMissingKey = !option.hasApiKey;

                  return (
                    <ListboxOption
                      key={idx}
                      value={option.model.model.id}
                      disabled={showMissingKey}
                      className="px-3 py-2"
                    >
                      <div className="flex w-full items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <CubeIcon className="h-3 w-3 flex-shrink-0" />
                          <span className="line-clamp-1 text-xs">
                            {option.model.model.displayName}
                            {option.isAutoDetected && (
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
                value="__add_model__"
                onClick={handleAddModel}
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
          providers={providers}
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
