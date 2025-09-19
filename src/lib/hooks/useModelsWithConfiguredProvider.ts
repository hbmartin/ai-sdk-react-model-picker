import { useEffect, useState } from 'react';
import {
  type StorageAdapter,
  type ProviderMetadata,
  type ModelId,
  type ModelConfig,
  idsFromKey,
  type IProviderRegistry,
  type ModelConfigWithProvider,
  type ProviderId,
  providerAndModelKey,
  type AIProvider,
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

function buildProviderMaps(providers: AIProvider[]): {
  providerMetadata: Record<ProviderId, ProviderMetadata>;
  providerModels: Map<ProviderId, Map<ModelId, ModelConfig>>;
} {
  const providerMetadata: Record<ProviderId, ProviderMetadata> = {};
  const providerModels = new Map<ProviderId, Map<ModelId, ModelConfig>>();

  for (const prov of providers) {
    providerMetadata[prov.metadata.id] = prov.metadata;
    providerModels.set(
      prov.metadata.id,
      prov.models.reduce<Map<ModelId, ModelConfig>>((macc, model) => {
        macc.set(model.id, model);
        return macc;
      }, new Map())
    );
  }

  return { providerMetadata, providerModels };
}

export function useModelsWithConfiguredProvider(
  storage: StorageAdapter,
  providerRegistry: IProviderRegistry
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

        const knownProviders = new Set([
          ...recentModelKeys.map((key) => idsFromKey(key).providerId),
          ...providersWithCredentials,
        ]);
        const providers = [...knownProviders].map((providerId) => {
          // TODO: don't fail if provider not found, use some error callback and skip it
          return providerRegistry.getProvider(providerId);
        });
        const { providerMetadata, providerModels } = buildProviderMaps(providers);

        const recentlyUsedModels = recentModelKeys
          .map((key) => {
            const { providerId, modelId } = idsFromKey(key);
            const model = providerModels.get(providerId)?.get(modelId);
            if (model === undefined) {
              return undefined;
            }
            providerModels.get(providerId)?.delete(modelId);
            return {
              model,
              provider: providerMetadata[providerId],
              key,
            };
          })
          .filter((item): item is KeyedModelConfigWithProvider => item !== undefined);
        setSelectedModel((prev) => prev ?? recentlyUsedModels[0]);
        setRecentlyUsedModels(recentlyUsedModels);
        setModelsWithCredentials(
          [...providerModels.entries()].flatMap(([providerId, models]) => {
            // eslint-disable-next-line sonarjs/no-nested-functions
            return [...models.entries()].map(([_modelId, model]) => {
              return {
                model,
                provider: providerMetadata[providerId],
                key: providerAndModelKey({ model, provider: providerMetadata[providerId] }),
              };
            });
          })
        );
        setIsLoadingOrError({ state: 'ready' });
      } catch (error) {
        console.error('Failed to load recently used models:', error);
        setIsLoadingOrError({
          state: 'error',
          message: error instanceof Error ? error.message : String(error),
        });
      }
    }
    void loadRecentlyUsed();
  }, [storage, providerRegistry]);

  return {
    recentlyUsedModels,
    modelsWithCredentials,
    selectedModel,
    setSelectedProviderAndModel,
    deleteProvider,
    isLoadingOrError,
  };
}
