import { useEffect, useMemo, useRef, useState } from 'react';
import { useSyncExternalStore } from 'react';
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
  options?: {
    telemetry?: ModelPickerTelemetry;
    modelStorage?: _Storage;
    prefetch?: boolean;
    catalog?: ModelCatalog;
    manageStorage?: boolean;
  }
) {
  const [recentlyUsedModels, setRecentlyUsedModels] = useState<KeyedModelConfigWithProvider[]>([]);
  const [providersWithCreds, setProvidersWithCreds] = useState<ProviderId[]>([]);
  const [selectedModel, setSelectedModel] = useState<KeyedModelConfigWithProvider | undefined>(
    undefined
  );
  const [isLoadingOrError, setIsLoadingOrError] = useState<{
    state: 'loading' | 'ready' | 'error';
    message?: string;
  }>({ state: 'loading' });

  // Catalog instance tied to registry + storages
  const catalogRef = useRef<ModelCatalog | undefined>(undefined);
  let createdInternal = false;
  if (options?.catalog === undefined && catalogRef.current === undefined) {
    catalogRef.current = new ModelCatalog(
      providerRegistry,
      storage,
      options?.modelStorage ?? storage,
      options?.telemetry
    );
    createdInternal = true;
  }
  const catalog = options?.catalog ?? (catalogRef.current as ModelCatalog);

  const deleteProvider = (providerId: ProviderId): ModelConfigWithProvider | undefined => {
    void deleteProviderWithCredentials(storage, providerId);
    const recentKeysToRemove = recentlyUsedModels
      .filter((model) => model.provider.id === providerId)
      .map((model) => model.key);
    void removeRecentlyUsedModels(storage, recentKeysToRemove);

    // Compute next state locally for consistency
    const nextRecentlyUsed = recentlyUsedModels.filter((m) => m.provider.id !== providerId);
    const nextProviders = providersWithCreds.filter((pid) => pid !== providerId);
    setProvidersWithCreds(nextProviders);
    setRecentlyUsedModels(nextRecentlyUsed);

    // Derive available after updates
    const map = Object.fromEntries(
      nextProviders.map((pid) => [pid, catalog.getSnapshot()[pid] ?? { models: [], status: 'idle' }])
    ) as Record<ProviderId, { models: ModelConfigWithProvider[]; status: string; error?: string }>;
    const flattened = flattenAndSortAvailableModels(map);
    const known = new Set(nextRecentlyUsed.map((m) => m.key));
    const nextAvailable = flattened
      .filter((m) => !known.has(providerAndModelKey(m)))
      .map((m) => ({ ...m, key: providerAndModelKey(m) }));

    const modelToSelect = nextRecentlyUsed[0] ?? nextAvailable[0];
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
    if (options?.manageStorage !== false) {
      void addProviderWithCredentials(storage, providerId);
      void addRecentlyUsedModel(storage, providerAndModelKey(modelWithProvider));
    }

    // Ensure provider is tracked for availability
    setProvidersWithCreds((prev) =>
      prev.includes(providerId) ? prev : [providerId, ...prev]
    );

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

    return keyedModelWithProvider;
  };

  useEffect(() => {
    async function loadRecentlyUsed() {
      try {
        const [recentModelKeys, providersWithCredentials] = await Promise.all([
          getRecentlyUsedModels(storage),
          getProvidersWithCredentials(storage),
        ]);

        // Initialize catalog (only if we own the instance)
        if (createdInternal) {
          await catalog.initialize(options?.prefetch !== false);
        }

        // Track providers with credentials
        const providers = providersWithCredentials.filter((pid) =>
          providerRegistry.hasProvider(pid)
        );
        setProvidersWithCreds(providers);

        // Recently used list, but only for models that currently exist in snapshot
        const snap = catalog.getSnapshot();
        const recent = recentModelKeys
          .map((key) => {
            const { providerId, modelId } = idsFromKey(key);
            const entry = snap[providerId]?.models.find((m) => m.model.id === modelId);
            if (!entry) return undefined;
            return { ...entry, key } as KeyedModelConfigWithProvider;
          })
          .filter((x): x is KeyedModelConfigWithProvider => x !== undefined);
        setSelectedModel((prev) => prev ?? recent[0]);
        setRecentlyUsedModels(recent);
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
  }, [storage, providerRegistry, catalog, createdInternal, options?.prefetch]);

  // Subscribe to catalog to react to refresh updates
  const subscribe = (onStoreChange: () => void) => catalog.subscribe(onStoreChange);
  const getSnapshot = () => catalog.getSnapshot();
  const snap = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  // Available models derived from current snapshot and providers with credentials
  const modelsWithCredentials: KeyedModelConfigWithProvider[] = useMemo(() => {
    const map = Object.fromEntries(
      providersWithCreds.map((pid) => [pid, snap[pid] ?? { models: [], status: 'idle' }])
    ) as Record<ProviderId, { models: ModelConfigWithProvider[]; status: string; error?: string }>;
    const flattened = flattenAndSortAvailableModels(map);
    const known = new Set(recentlyUsedModels.map((m) => m.key));
    return flattened
      .filter((m) => !known.has(providerAndModelKey(m)))
      .map((m) => ({ ...m, key: providerAndModelKey(m) }));
  }, [providersWithCreds, snap, recentlyUsedModels]);

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
