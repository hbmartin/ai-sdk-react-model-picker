import { useEffect, useMemo, useState } from 'react';
import { providerAndModelKey } from '../types';
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
import { filterModelsByCredentialsAndRecentlyUsed } from './catalogUtils';
import { useModelCatalog } from './useModelCatalog';
import type { ModelPickerTelemetry } from '../telemetry';

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
  const [selectedModel, setSelectedModel] = useState<CatalogEntry | undefined>(undefined);
  const [isLoadingOrError, setIsLoadingOrError] = useState<{
    state: 'loading' | 'ready' | 'error';
    message?: string;
  }>({ state: 'loading' });
  const catalog = useMemo(
    () =>
      options?.catalog ??
      new ModelCatalog(providerRegistry, options?.modelStorage ?? storage, options?.telemetry),
    [providerRegistry, storage, options?.catalog, options?.modelStorage, options?.telemetry]
  );
  const { snapshot, refresh, removeProvider } = useModelCatalog({
    catalog,
    shouldInitialize: options?.prefetch !== false,
  });

  const deleteProvider = (providerId: ProviderId): CatalogEntry | undefined => {
    void deleteProviderWithCredentials(storage, providerId);
    // TODO: consolidate storage removal, currently this is how cred models are updated (reacting to snapshot changes)
    removeProvider(providerId);
    const recentKeysToRemove = recentlyUsedModels
      .filter((model) => model.provider.id === providerId)
      .map((model) => model.key);
    void removeRecentlyUsedModels(storage, recentKeysToRemove);

    // Compute next state locally for consistency
    const nextRecentlyUsed = recentlyUsedModels.filter((model) => model.provider.id !== providerId);
    const nextProviders = providersWithCreds.filter((pid) => pid !== providerId);
    setProvidersWithCreds(nextProviders);
    setRecentlyUsedModels(nextRecentlyUsed);

    // modelsWithCredentials is updated reactively from the catalog snapshot
    // TODO: unify so that updates flow in a common way
    // for now this works since we're filtering by provider id anyway
    const modelToSelect: CatalogEntry | undefined =
      nextRecentlyUsed[0] ??
      modelsWithCredentials.find((model) => model.provider.id !== providerId);
    setSelectedModel(modelToSelect);

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
        : catalog.getModel(providerAndModelKey(modelId, providerId))?.model;
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
    async function loadRecentlyUsed() {
      try {
        setIsLoadingOrError({ state: 'loading' });

        const [recentModelKeys, providersWithCredentials] = await Promise.all([
          getRecentlyUsedModels(storage),
          getProvidersWithCredentials(storage),
        ]);

        // Track providers with credentials
        const providers = providersWithCredentials.filter((pid) =>
          providerRegistry.hasProvider(pid)
        );
        setProvidersWithCreds(providers);

        // Recently used list, but only for models that currently exist in snapshot
        const recent = recentModelKeys
          .map((key) => catalog.getModel(key))
          .filter((x): x is CatalogEntry => x !== undefined);
        setRecentlyUsedModels(recent);
        setSelectedModel((prev) => prev ?? recent[0]);
        setIsLoadingOrError({ state: 'ready' });
      } catch (error) {
        setIsLoadingOrError({
          state: 'error',
          message: error instanceof Error ? error.message : String(error),
        });
      }
    }
    void loadRecentlyUsed();
  }, [storage, providerRegistry, catalog]);

  // Available models derived from current snapshot and providers with credentials
  const modelsWithCredentials: CatalogEntry[] = useMemo(() => {
    return filterModelsByCredentialsAndRecentlyUsed(
      providersWithCreds,
      snapshot,
      recentlyUsedModels
    );
  }, [snapshot, recentlyUsedModels, providersWithCreds]);

  return {
    recentlyUsedModels,
    modelsWithCredentials,
    selectedModel,
    setSelectedProviderAndModel,
    deleteProvider,
    isLoadingOrError,
    refreshProviderModels: (providerId: ProviderId) => {
      refresh(providerId);
    },
  };
}
