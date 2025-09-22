import type { ModelConfig, ProviderId, StorageAdapter } from '../types';
import { getPersistedModels, setPersistedModels } from '../storage/modelRepository';

export class CatalogPersistence {
  constructor(private readonly modelStorage: StorageAdapter) {}

  async load(providerId: ProviderId): Promise<ModelConfig[]> {
    return getPersistedModels(this.modelStorage, providerId);
  }

  async save(providerId: ProviderId, models: ModelConfig[]): Promise<void> {
    await setPersistedModels(this.modelStorage, providerId, models);
  }
}

