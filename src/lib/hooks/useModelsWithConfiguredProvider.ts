import { useCallback, useEffect, useMemo, useState } from 'react';
import { idsFromKey, providerAndModelKey } from '../types';
import type {
  StorageAdapter,
  ModelId,
  IProviderRegistry,
  ModelConfigWithProvider,
  ProviderId,
  CatalogEntry,
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
import { deriveAvailableModels } from './catalogUtils';
import type { ModelPickerTelemetry } from '../telemetry';
import { useModelCatalog } from './useModelCatalog';

export interface UseModelsWithConfiguredProviderOptions {
  telemetry?: ModelPickerTelemetry;
  modelStorage?: StorageAdapter;
  prefetch?: boolean;
  catalog?: ModelCatalog;
}

export function useModelsWithConfiguredProvider(
  storage: StorageAdapter,
  providerRegistry: IProviderRegistry,
  options?: UseModelsWithConfiguredProviderOptions
) {
  const [recentlyUsedModels, setRecentlyUsedModels] = useState<CatalogEntry[]>([]);
  const [providersWithCreds, setProvidersWithCreds] = useState<ProviderId[]>([]);
  const [selectedModel, setSelectedModel] = useState<CatalogEntry | undefined>(
    undefined
  );
  const [isLoadingOrError, setIsLoadingOrError] = useState<{
    state: 'loading' | 'ready' | 'error';
    message?: string;
  }>({ state: 'loading' });
  const {
    catalog,
    snapshot,
    consumePendingInitialization,
  } = useModelCatalog({
    storage,
    providerRegistry,
    telemetry: options?.telemetry,
    modelStorage: options?.modelStorage,
    catalog: options?.catalog,
  });

  const deleteProvider = (providerId: ProviderId): CatalogEntry | undefined => {
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
    const nextSnapshot = catalog.getSnapshot();
    const nextAvailable = deriveAvailableModels(nextSnapshot, nextProviders, nextRecentlyUsed);

    const modelToSelect = nextRecentlyUsed[0] ?? nextAvailable[0];
    setSelectedModel(modelToSelect);
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition, sonarjs/different-types-comparison
    return modelToSelect;
  };

  const setSelectedProviderAndModel = (
    providerId: ProviderId,
    modelId?: ModelId
  ): CatalogEntry | undefined => {
    const provider = providerRegistry.getProvider(providerId);
    const model =
      modelId === undefined
        ? provider.getDefaultModel()
        : provider.models.find((model) => model.id === modelId);
    if (model === undefined) {
      return;
    }

    // Save selection to storage
    const modelWithProvider: ModelConfigWithProvider = { model, provider: provider.metadata };
    void addProviderWithCredentials(storage, providerId);
    void addRecentlyUsedModel(storage, providerAndModelKey(modelWithProvider));

    // Ensure provider is tracked for availability
    setProvidersWithCreds((prev) => (prev.includes(providerId) ? prev : [providerId, ...prev]));

    // Update selection
    const modelKey = providerAndModelKey(modelWithProvider);
    const catalogEntry: CatalogEntry = { ...modelWithProvider, key: modelKey };
    setSelectedModel(catalogEntry);
    setRecentlyUsedModels((prev) => {
      const index = prev.findIndex((model) => model.key === modelKey);
      if (index === -1) {
        return [catalogEntry, ...prev];
      }
      return [catalogEntry, ...prev.slice(0, index), ...prev.slice(index + 1)];
    });

    return catalogEntry;
  };

  useEffect(() => {
    const shouldReset = consumePendingInitialization();

    async function loadRecentlyUsed() {
      try {
        if (shouldReset) {
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
        if (shouldReset) {
          await catalog?.initialize(options?.prefetch !== false);
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
            const providerEntry = snap[providerId];
            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition, sonarjs/no-nested-functions
            const entry = providerEntry?.models.find((model) => model.model.id === modelId);
            if (entry === undefined) {
              return undefined;
            }
            return { ...entry, key } as CatalogEntry;
          })
          .filter((x): x is CatalogEntry => x !== undefined);
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
  }, [storage, providerRegistry, catalog, options?.prefetch, consumePendingInitialization]);

  // Available models derived from current snapshot and providers with credentials
  const modelsWithCredentials: CatalogEntry[] = useMemo(
    () => deriveAvailableModels(snapshot, providersWithCreds, recentlyUsedModels),
    [providersWithCreds, snapshot, recentlyUsedModels]
  );

  return {
    recentlyUsedModels,
    modelsWithCredentials,
    selectedModel,
    setSelectedProviderAndModel,
    deleteProvider,
    isLoadingOrError,
    refreshProviderModels: (providerId: ProviderId) => {
      void catalog?.refresh(providerId);
    },
  };
}
