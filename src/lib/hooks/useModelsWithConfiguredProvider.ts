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
} from '../types';
import {
  addProviderWithCredentials,
  addRecentlyUsedModel,
  getProvidersWithCredentials,
  getRecentlyUsedModels,
} from '../storage/repository';

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
      void addRecentlyUsedModel(storage, providerAndModelKey(modelWithProvider));
      void addProviderWithCredentials(storage, providerId);
      setSelectedModel(modelWithProvider);
      setRecentlyUsedModels((prev) => {
        const index = prev.findIndex((model) => model.model.id === modelId);
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
        const providerMetadata = providers.reduce<Record<ProviderId, ProviderMetadata>>(
          (acc, provider) => {
            acc[provider.metadata.id] = provider.metadata;
            return acc;
          },
          {}
        );
        const providerModels = providers.reduce<Map<ProviderId, Map<ModelId, ModelConfig>>>(
          (pacc, provider) => {
            pacc.set(
              provider.metadata.id,
              provider.models.reduce<Map<ModelId, ModelConfig>>(
                // eslint-disable-next-line sonarjs/no-nested-functions
                (macc, model) => {
                  macc.set(model.id, model);
                  return macc;
                },
                new Map()
              )
            );
            return pacc;
          },
          new Map()
        );
        const recentlyUsedModels = recentModelKeys
          .map((key) => {
            const { providerId, modelId } = idsFromKey(key);
            const model = providerModels.get(providerId)?.get(modelId);
            if (model === undefined) {
              return undefined;
            }
            providerModels.get(providerId)?.delete(modelId);
            return {
              model: model,
              provider: providerMetadata[providerId],
            };
          })
          .filter((item) => item !== undefined);
        setSelectedModel(recentlyUsedModels[0]);
        setRecentlyUsedModels(recentlyUsedModels);
        setModelsWithCredentials(
          [...providerModels.entries()].flatMap(([providerId, models]) => {
            // eslint-disable-next-line sonarjs/no-nested-functions
            return [...models.entries()].map(([_modelId, model]) => {
              return {
                model: model,
                provider: providerMetadata[providerId],
              };
            });
          })
        );
      } catch (error) {
        console.warn('Failed to load recently used models:', error);
      }
    }
    void loadRecentlyUsed();
  }, [storage, providerRegistry]);

  return { recentlyUsedModels, modelsWithCredentials, selectedModel, setSelectedModelAndProvider };
}
