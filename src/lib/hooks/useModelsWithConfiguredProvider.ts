import { useEffect, useMemo, useState } from 'react';
import { createModelId, providerAndModelKey } from '../types';
import type {
  StorageAdapter,
  ModelId,
  IProviderRegistry,
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
  const { snapshot, refresh, removeProvider, addUserModel, setModelVisibility } = useModelCatalog({
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
    const providerSnapshot = snapshot[providerId];

    let catalogEntry: CatalogEntry | undefined;

    if (modelId === undefined) {
      catalogEntry =
        providerSnapshot?.models.find((entry) => entry.model.isDefault === true) ??
        providerSnapshot?.models[0];
      if (catalogEntry === undefined) {
        const fallbackModel = provider.getDefaultModel();
        catalogEntry = {
          model: fallbackModel,
          provider: provider.metadata,
          key: providerAndModelKey({ model: fallbackModel, provider: provider.metadata }),
        };
      }
    } else {
      catalogEntry = providerSnapshot?.models.find((entry) => entry.model.id === modelId);
      if (catalogEntry === undefined) {
        const fallbackModel = provider.models.find((model) => model.id === modelId);
        if (fallbackModel === undefined) {
          return;
        }
        catalogEntry = {
          model: fallbackModel,
          provider: provider.metadata,
          key: providerAndModelKey({ model: fallbackModel, provider: provider.metadata }),
        };
      }
    }

    if (catalogEntry === undefined) {
      return;
    }

    void addProviderWithCredentials(storage, providerId);
    void addRecentlyUsedModel(storage, catalogEntry.key);

    setProvidersWithCreds((prev) => (prev.includes(providerId) ? prev : [providerId, ...prev]));

    const entry: CatalogEntry = {
      model: catalogEntry.model,
      provider: catalogEntry.provider,
      key: catalogEntry.key,
    };

    setSelectedModel(entry);
    setRecentlyUsedModels((prev) => {
      const index = prev.findIndex((model) => model.key === entry.key);
      if (index === -1) {
        return [entry, ...prev];
      }
      return [entry, ...prev.slice(0, index), ...prev.slice(index + 1)];
    });

    return entry;
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

  const getProviderModels = (providerId: ProviderId): CatalogEntry[] => {
    return snapshot[providerId]?.models ?? [];
  };

  const getProviderModelsStatus = (providerId: ProviderId) => snapshot[providerId];

  const toggleModelVisibility = (providerId: ProviderId, modelId: ModelId, visible: boolean) => {
    return setModelVisibility(providerId, modelId, visible);
  };

  const addUserModelAndSelect = async (
    providerId: ProviderId,
    rawModelId: string
  ): Promise<CatalogEntry | undefined> => {
    const trimmed = rawModelId.trim();
    if (trimmed.length === 0) {
      return undefined;
    }
    const branded = createModelId(trimmed);
    await addUserModel(providerId, branded);
    return setSelectedProviderAndModel(providerId, branded);
  };

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
    getProviderModels,
    getProviderModelsStatus,
    toggleModelVisibility,
    addUserModelAndSelect,
  };
}
