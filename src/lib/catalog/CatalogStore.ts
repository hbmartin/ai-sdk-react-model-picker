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

export type CatalogSnapshotProjector = (state: CatalogState) => CatalogSnapshot;

export type CatalogStoreListener = () => void;

export class CatalogStore {
  private state: CatalogState;

  private snapshot: CatalogSnapshot;

  private projector: CatalogSnapshotProjector;

  private readonly listeners = new Set<CatalogStoreListener>();

  constructor(initialState: CatalogState, projector: CatalogSnapshotProjector) {
    this.state = initialState;
    this.projector = projector;
    this.snapshot = projector(initialState);
  }

  getState(): CatalogState {
    return this.state;
  }

  getSnapshot(): CatalogSnapshot {
    return this.snapshot;
  }

  subscribe(listener: CatalogStoreListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  updateState(updater: (state: CatalogState) => CatalogState): void {
    const nextState = updater(this.state);
    this.setState(nextState);
  }

  setState(nextState: CatalogState): void {
    if (Object.is(nextState, this.state)) {
      return;
    }

    this.state = nextState;
    this.snapshot = this.projector(this.state);
    this.emit();
  }

  setSnapshotProjector(projector: CatalogSnapshotProjector, options?: { notify?: boolean }): void {
    this.projector = projector;
    this.snapshot = this.projector(this.state);
    if (options?.notify !== false) {
      this.emit();
    }
  }

  recomputeSnapshot(options?: { notify?: boolean }): void {
    this.snapshot = this.projector(this.state);
    if (options?.notify !== false) {
      this.emit();
    }
  }

  private emit() {
    for (const listener of this.listeners) {
      listener();
    }
  }
}
