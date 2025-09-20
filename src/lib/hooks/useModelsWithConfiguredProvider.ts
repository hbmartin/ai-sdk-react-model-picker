import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { idsFromKey, providerAndModelKey } from '../types';
import type {
  ModelPickerTelemetry,
  ProviderModelsStatus,
  StorageAdapter as _Storage,
  StorageAdapter,
  ModelId,
  IProviderRegistry,
  ModelConfigWithProvider,
  ProviderId,
  KeyedModelConfigWithProvider,
} from '../types';
import { ModelCatalog } from '../catalog/ModelCatalog';
import {
  addProviderWithCredentials,
  addRecentlyUsedModel,
  deleteProviderWithCredentials,
  getProvidersWithCredentials,
  getRecentlyUsedModels,
  removeRecentlyUsedModels,
} from '../storage/repository';
import { flattenAndSortAvailableModels } from './catalogUtils';

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

  const catalogStateRef = useRef<{
    catalog: ModelCatalog;
    storage: StorageAdapter;
    modelStorage: StorageAdapter;
    providerRegistry: IProviderRegistry;
  }>();

  const manageCatalog = options?.catalog === undefined;
  const modelStorageAdapter = options?.modelStorage ?? storage;

  let createdInternal = false;
  if (manageCatalog) {
    const current = catalogStateRef.current;
    const needsNew =
      current === undefined ||
      current.storage !== storage ||
      current.modelStorage !== modelStorageAdapter ||
      current.providerRegistry !== providerRegistry;
    if (needsNew) {
      const newCatalog = new ModelCatalog(
        providerRegistry,
        storage,
        modelStorageAdapter,
        options?.telemetry
      );
      catalogStateRef.current = {
        catalog: newCatalog,
        storage,
        modelStorage: modelStorageAdapter,
        providerRegistry,
      };
      createdInternal = true;
    }
  } else {
    catalogStateRef.current = undefined;
  }

  const catalog = manageCatalog
    ? (catalogStateRef.current as { catalog: ModelCatalog }).catalog
    : options.catalog!;

  catalog.setTelemetry(options?.telemetry);

  const deleteProvider = (providerId: ProviderId): ModelConfigWithProvider | undefined => {
    void deleteProviderWithCredentials(storage, providerId);
    const recentKeysToRemove = recentlyUsedModels
      .filter((model) => model.provider.id === providerId)
      .map((model) => model.key);
    void removeRecentlyUsedModels(storage, recentKeysToRemove);

    // Compute next state locally for consistency
    const nextRecentlyUsed = recentlyUsedModels.filter((model) => model.provider.id !== providerId);
    const nextProviders = providersWithCreds.filter((pid) => pid !== providerId);
    setProvidersWithCreds(nextProviders);
    setRecentlyUsedModels(nextRecentlyUsed);

    // Derive available after updates
    const map = Object.fromEntries(
      nextProviders.map((pid) => [
        pid,
        catalog.getSnapshot()[pid] ?? { models: [], status: 'idle' },
      ])
    ) as Record<ProviderId, ProviderModelsStatus>;
    const flattened = flattenAndSortAvailableModels(map);
    const known = new Set(nextRecentlyUsed.map((model) => model.key));
    const nextAvailable = flattened
      .filter((model) => !known.has(providerAndModelKey(model)))
      .map((model) => ({ ...model, key: providerAndModelKey(model) }));

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
    setProvidersWithCreds((prev) => (prev.includes(providerId) ? prev : [providerId, ...prev]));

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
        if (createdInternal) {
          setSelectedModel(undefined);
          setProvidersWithCreds([]);
          setRecentlyUsedModels([]);
        }
        setIsLoadingOrError({ state: 'loading' });

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
            const entry = snap[providerId].models.find((model) => model.model.id === modelId);
            if (!entry) {
              return undefined;
            }
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
  }, [storage, providerRegistry, catalog, createdInternal, options?.prefetch]);

  // Subscribe to catalog to react to refresh updates
  const subscribe = (onStoreChange: () => void) => catalog.subscribe(onStoreChange);
  const getSnapshot = () => catalog.getSnapshot();
  const snap = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  // Available models derived from current snapshot and providers with credentials
  const modelsWithCredentials: KeyedModelConfigWithProvider[] = useMemo(() => {
    const map = Object.fromEntries(
      providersWithCreds.map((pid) => [pid, snap[pid] ?? { models: [], status: 'idle' }])
    ) as Record<ProviderId, ProviderModelsStatus>;
    const flattened = flattenAndSortAvailableModels(map);
    const known = new Set(recentlyUsedModels.map((model) => model.key));
    return flattened
      .filter((model) => !known.has(providerAndModelKey(model)))
      .map((model) => ({ ...model, key: providerAndModelKey(model) }));
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
