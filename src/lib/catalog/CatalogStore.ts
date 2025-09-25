import type { ModelConfig, ModelId, ProviderId, ProviderModelsStatus } from '../types';

export interface CatalogProviderPendingState {
  hydrate?: boolean;
  refresh?: boolean;
}

export interface CatalogProviderState {
  status: ProviderModelsStatus['status'];
  error?: string;
  models: Record<ModelId, ModelConfig>;
  pending?: CatalogProviderPendingState;
  hydrated?: boolean;
  lastUpdatedAt?: number;
}

export interface CatalogState {
  providers: Record<ProviderId, CatalogProviderState>;
}

export type CatalogSnapshot = Record<ProviderId, ProviderModelsStatus>;
