import { useCallback, useEffect, useState } from 'react';
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
} from '../types';
import {
  addProviderWithCredentials,
  addRecentlyUsedModel,
  getProvidersWithCredentials,
  getRecentlyUsedModels,
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
  const [recentlyUsedModels, setRecentlyUsedModels] = useState<ModelConfigWithProvider[]>([]);
  const [modelsWithCredentials, setModelsWithCredentials] = useState<ModelConfigWithProvider[]>([]);
  const [selectedModel, setSelectedModel] = useState<ModelConfigWithProvider | undefined>(
    undefined
  );

  const setSelectedModelAndProvider = useCallback(
    (modelId: ModelId, providerId: ProviderId): ModelConfigWithProvider | undefined => {
      const provider = providerRegistry.getProvider(providerId);
      const model = provider.models.find((model) => model.id === modelId);
      if (model === undefined) {
        return;
      }
      const modelWithProvider = { model, provider: provider.metadata };
      const modelKey = providerAndModelKey(modelWithProvider);
      void addRecentlyUsedModel(storage, providerAndModelKey(modelWithProvider));
      void addProviderWithCredentials(storage, providerId);
      setSelectedModel(modelWithProvider);
      setRecentlyUsedModels((prev) => {
        const index = prev.findIndex((model) => providerAndModelKey(model) === modelKey);
        if (index === -1) {
          return [modelWithProvider, ...prev];
        }
        return [modelWithProvider, ...prev.slice(0, index), ...prev.slice(index + 1)];
      });
      return modelWithProvider;
    },
    [storage, providerRegistry]
  );

  useEffect(() => {
    async function loadRecentlyUsed() {
      try {
        const recentModelKeys = await getRecentlyUsedModels(storage);
        const providersWithCredentials = await getProvidersWithCredentials(storage);
        const knownProviders = new Set([
          ...recentModelKeys.map((key) => idsFromKey(key).providerId),
          ...providersWithCredentials,
        ]);
        const providers = [...knownProviders].map((providerId) => {
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
            };
          })
          .filter((item) => item !== undefined);
        setSelectedModel((prev) => prev ?? recentlyUsedModels[0]);
        setRecentlyUsedModels(recentlyUsedModels);
        setModelsWithCredentials(
          [...providerModels.entries()].flatMap(([providerId, models]) => {
            // eslint-disable-next-line sonarjs/no-nested-functions
            return [...models.entries()].map(([_modelId, model]) => {
              return {
                model,
                provider: providerMetadata[providerId],
              };
            });
          })
        );
      } catch (error) {
        console.error('Failed to load recently used models:', error);
      }
    }
    void loadRecentlyUsed();
  }, [storage, providerRegistry]);

  return { recentlyUsedModels, modelsWithCredentials, selectedModel, setSelectedModelAndProvider };
}
