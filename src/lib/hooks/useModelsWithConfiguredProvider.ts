import { useEffect, useRef, useState } from 'react';
import {
  type StorageAdapter,
  type ModelId,
  idsFromKey,
  type IProviderRegistry,
  type ModelConfigWithProvider,
  type ProviderId,
  providerAndModelKey,
  type KeyedModelConfigWithProvider,
} from '../types';
import {
  addProviderWithCredentials,
  addRecentlyUsedModel,
  deleteProviderWithCredentials,
  getProvidersWithCredentials,
  getRecentlyUsedModels,
  removeRecentlyUsedModels,
} from '../storage/repository';
import { ModelCatalog } from '../catalog/ModelCatalog';
import { flattenAndSortAvailableModels } from './catalogUtils';
import type { ModelPickerTelemetry, StorageAdapter as _Storage } from '../types';

// removed provider maps builder; catalog snapshot is used instead

export function useModelsWithConfiguredProvider(
  storage: StorageAdapter,
  providerRegistry: IProviderRegistry,
  options?: { telemetry?: ModelPickerTelemetry; modelStorage?: _Storage; prefetch?: boolean }
) {
  const [recentlyUsedModels, setRecentlyUsedModels] = useState<KeyedModelConfigWithProvider[]>([]);
  const [modelsWithCredentials, setModelsWithCredentials] = useState<
    KeyedModelConfigWithProvider[]
  >([]);
  const [selectedModel, setSelectedModel] = useState<KeyedModelConfigWithProvider | undefined>(
    undefined
  );
  const [isLoadingOrError, setIsLoadingOrError] = useState<{
    state: 'loading' | 'ready' | 'error';
    message?: string;
  }>({ state: 'loading' });

  // Catalog instance tied to registry + storages
  const catalogRef = useRef<ModelCatalog | undefined>(undefined);
  if (catalogRef.current === undefined) {
    catalogRef.current = new ModelCatalog(
      providerRegistry,
      storage,
      options?.modelStorage ?? storage,
      options?.telemetry
    );
  }
  const catalog = catalogRef.current;

  const deleteProvider = (providerId: ProviderId): ModelConfigWithProvider | undefined => {
    void deleteProviderWithCredentials(storage, providerId);
    const modelsWithProvider = recentlyUsedModels
      .filter((model) => model.provider.id === providerId)
      .map((model) => model.key);
    void removeRecentlyUsedModels(storage, modelsWithProvider);
    // Calculate new state arrays first
    const newRecentlyUsed = recentlyUsedModels.filter((model) => model.provider.id !== providerId);
    const newModelsWithCreds = modelsWithCredentials.filter(
      (model) => model.provider.id !== providerId
    );

    // Use the new, correct state to derive the next selected model
    const modelToSelect = newRecentlyUsed[0] ?? newModelsWithCreds[0];

    // Update all relevant state based on the new arrays
    setRecentlyUsedModels(newRecentlyUsed);
    setModelsWithCredentials(newModelsWithCreds);
    setSelectedModel(modelToSelect);
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition, sonarjs/different-types-comparison
    return modelToSelect === undefined
      ? undefined
      : { model: modelToSelect.model, provider: modelToSelect.provider };
  };

  const setSelectedProviderAndModel = (
    providerId: ProviderId,
    modelId?: ModelId
  ): ModelConfigWithProvider | undefined => {
    const provider = providerRegistry.getProvider(providerId);
    const model =
      modelId === undefined
        ? provider.getDefaultModel()
        : provider.models.find((model) => model.id === modelId);
    if (model === undefined) {
      return;
    }

    // Save selection to storage
    const modelWithProvider = { model, provider: provider.metadata };
    void addProviderWithCredentials(storage, providerId);
    void addRecentlyUsedModel(storage, providerAndModelKey(modelWithProvider));

    // Add new models to the list (i.e. this is a new provider)
    const knownModels = new Set<string>([
      ...recentlyUsedModels.map((model) => model.key),
      ...modelsWithCredentials.map((model) => model.key),
    ]);
    const modelsToBeAdded = provider.models
      .filter((providerModel) => {
        return (
          providerModel.id !== model.id &&
          !knownModels.has(
            providerAndModelKey({ model: providerModel, provider: provider.metadata })
          )
        );
      })
      .map((model) => ({
        model,
        provider: provider.metadata,
        key: providerAndModelKey({ model, provider: provider.metadata }),
      }));
    setModelsWithCredentials((prev) => [...modelsToBeAdded, ...prev]);

    // Update selection
    const modelKey = providerAndModelKey(modelWithProvider);
    const keyedModelWithProvider = { ...modelWithProvider, key: modelKey };
    setSelectedModel(keyedModelWithProvider);
    setRecentlyUsedModels((prev) => {
      const index = prev.findIndex((model) => model.key === modelKey);
      if (index === -1) {
        return [keyedModelWithProvider, ...prev];
      }
      return [keyedModelWithProvider, ...prev.slice(0, index), ...prev.slice(index + 1)];
    });

    // Remove model from credentials list
    setModelsWithCredentials((prev) => prev.filter((model) => model.key !== modelKey));

    return keyedModelWithProvider;
  };

  useEffect(() => {
    async function loadRecentlyUsed() {
      try {
        const [recentModelKeys, providersWithCredentials] = await Promise.all([
          getRecentlyUsedModels(storage),
          getProvidersWithCredentials(storage),
        ]);

        // Initialize catalog (will seed builtin and load persisted; prefetch if asked)
        await catalog.initialize(options?.prefetch !== false);

        // Build model maps from catalog snapshot
        const snapshot = catalog.getSnapshot();
        const providers = providersWithCredentials.filter((pid) => providerRegistry.hasProvider(pid));

        // Recently used list, but only for models that currently exist in snapshot
        const recent = recentModelKeys
          .map((key) => {
            const { providerId, modelId } = idsFromKey(key);
            const entry = snapshot[providerId]?.models.find((m) => m.model.id === modelId);
            if (!entry) return undefined;
            return { ...entry, key } as KeyedModelConfigWithProvider;
          })
          .filter((x): x is KeyedModelConfigWithProvider => x !== undefined);
        setSelectedModel((prev) => prev ?? recent[0]);
        setRecentlyUsedModels(recent);

        // Available models = flatten provider models from snapshot, filtered/sorted
        const flattened = flattenAndSortAvailableModels(
          Object.fromEntries(
            providers.map((pid) => [pid, snapshot[pid] ?? { models: [], status: 'idle' }])
          )
        );
        const known = new Set(recent.map((m) => m.key));
        setModelsWithCredentials(
          flattened
            .filter((m) => !known.has(providerAndModelKey(m)))
            .map((m) => ({ ...m, key: providerAndModelKey(m) }))
        );
        setIsLoadingOrError({ state: 'ready' });
      } catch (error) {
        setIsLoadingOrError({
          state: 'error',
          message: error instanceof Error ? error.message : String(error),
        });
      }
    }
    void loadRecentlyUsed();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storage, providerRegistry, catalog]);

  return {
    recentlyUsedModels,
    modelsWithCredentials,
    selectedModel,
    setSelectedProviderAndModel,
    deleteProvider,
    isLoadingOrError,
    refreshProviderModels: (providerId: ProviderId) => void catalog.refresh(providerId),
  };
}
