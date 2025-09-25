/* eslint-disable @typescript-eslint/member-ordering */
import type {
  IProviderRegistry,
  ProviderId,
  ModelId,
  ModelConfig,
  CatalogEntry,
  ProviderModelsStatus,
  StorageAdapter,
} from '../types';
import { providerAndModelKey } from '../types';
import { getProviderConfiguration, getProvidersWithCredentials } from '../storage/repository';
import { getPersistedModels, setPersistedModels } from '../storage/modelRepository';
import type { ModelPickerTelemetry } from '../telemetry';
import { type CatalogProviderState, type CatalogState, type CatalogSnapshot } from './CatalogStore';

function now() {
  return Date.now();
}

function normalizeBuiltin(model: ModelConfig): ModelConfig {
  return {
    ...model,
    origin: model.origin ?? 'builtin',
    visible: model.visible ?? true,
  };
}

function normalizePersisted(model: ModelConfig): ModelConfig {
  return {
    ...model,
    origin: model.origin ?? 'api',
    visible: model.visible ?? true,
  };
}

function scheduleMicrotaskSafe(func: () => void) {
  if (typeof queueMicrotask === 'function') {
    queueMicrotask(func);
    return;
  }
  Promise.resolve()
    .then(func)
    .catch(() => undefined);
}

function modelsToRecord(models: ModelConfig[]): Record<ModelId, ModelConfig> {
  const out = {} as Record<ModelId, ModelConfig>;
  for (const model of models) {
    out[model.id] = model;
  }
  return out;
}

function setModel(
  record: Record<ModelId, ModelConfig>,
  model: ModelConfig
): Record<ModelId, ModelConfig> {
  if (record[model.id] === model) {
    return record;
  }
  return {
    ...record,
    [model.id]: model,
  };
}

function removeModel(
  record: Record<ModelId, ModelConfig>,
  modelId: ModelId
): Record<ModelId, ModelConfig> {
  if (record[modelId] === undefined) {
    return record;
  }
  const next = { ...record } as Record<ModelId, ModelConfig>;
  // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
  delete next[modelId];
  return next;
}

export class ModelCatalog {
  private state: CatalogState;

  private snapshot: CatalogSnapshot;

  private projectSnapshot: (state: CatalogState) => CatalogSnapshot;

  private readonly listeners = new Set<() => void>();

  private readonly pendingHydrations = new Map<ProviderId, Promise<void>>();

  private readonly pendingRefreshes = new Map<ProviderId, Promise<void>>();

  private knownProvidersSignature: string;

  private telemetry?: ModelPickerTelemetry | undefined;

  private signatureSyncScheduled = false;

  constructor(
    private readonly providerRegistry: IProviderRegistry,
    private readonly storage: StorageAdapter,
    private readonly modelStorage: StorageAdapter,
    telemetry?: ModelPickerTelemetry
  ) {
    this.telemetry = telemetry;
    const initialState = this.buildInitialState();
    this.projectSnapshot = this.createSnapshotProjector();
    this.state = initialState;
    this.snapshot = this.projectSnapshot(this.state);
    this.knownProvidersSignature = this.computeProviderSignature();
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  getSnapshot(): Record<ProviderId, ProviderModelsStatus> {
    const signature = this.computeProviderSignature();
    if (signature !== this.knownProvidersSignature) {
      this.scheduleProviderSync(signature);
    }
    return this.snapshot;
  }

  getProviderState(providerId: ProviderId): CatalogProviderState | undefined {
    const state = this.state.providers[providerId];
    if (state === undefined) {
      return undefined;
    }
    return {
      ...state,
      models: { ...state.models },
      pending: state.pending ? { ...state.pending } : undefined,
    };
  }

  setTelemetry(telemetry?: ModelPickerTelemetry) {
    this.telemetry = telemetry;
  }

  private emit(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }

  private setState(nextState: CatalogState, options?: { notify?: boolean }): void {
    if (Object.is(nextState, this.state)) {
      return;
    }
    this.state = nextState;
    this.snapshot = this.projectSnapshot(this.state);
    if (options?.notify !== false) {
      this.emit();
    }
  }

  private updateState(
    updater: (state: CatalogState) => CatalogState,
    options?: { notify?: boolean }
  ): void {
    const nextState = updater(this.state);
    this.setState(nextState, options);
  }

  private recomputeSnapshot(options?: { notify?: boolean }): void {
    this.snapshot = this.projectSnapshot(this.state);
    if (options?.notify !== false) {
      this.emit();
    }
  }

  private createSnapshotProjector() {
    return (state: CatalogState): CatalogSnapshot => {
      const snapshot: Record<ProviderId, ProviderModelsStatus> = {};
      for (const provider of this.providerRegistry.getAllProviders()) {
        const providerId = provider.metadata.id;
        const providerState = state.providers[providerId] ?? this.createStateFromProvider(provider);
        const models: CatalogEntry[] = Object.values(providerState.models).map((model) => {
          const providerMeta = provider.metadata;
          const base = { model, provider: providerMeta };
          return {
            ...base,
            key: providerAndModelKey(base),
          } satisfies CatalogEntry;
        });
        const base: ProviderModelsStatus = {
          models,
          status: providerState.status,
        };
        if (providerState.error !== undefined) {
          base.error = providerState.error;
        }
        snapshot[providerId] = base;
      }
      return snapshot;
    };
  }

  private buildInitialState(): CatalogState {
    const providers = this.providerRegistry.getAllProviders();
    const stateProviders: Record<ProviderId, CatalogProviderState> = {};
    for (const provider of providers) {
      stateProviders[provider.metadata.id] = this.createStateFromProvider(provider);
    }
    return { providers: stateProviders };
  }

  private createStateFromProvider(provider: { models: ModelConfig[] }): CatalogProviderState {
    const builtin = provider.models.map(normalizeBuiltin);
    return {
      status: 'idle',
      models: modelsToRecord(builtin),
      hydrated: false,
    };
  }

  private computeProviderSignature(): string {
    return this.providerRegistry
      .getAllProviders()
      .map((provider) => provider.metadata.id)
      // eslint-disable-next-line sonarjs/no-alphabetical-sort
      .toSorted()
      .join('|');
  }

  private scheduleProviderSync(signature: string): void {
    if (this.signatureSyncScheduled) {
      return;
    }
    this.signatureSyncScheduled = true;
    scheduleMicrotaskSafe(() => {
      this.applyProviderSync(signature);
    });
  }

  private applyProviderSync(signature: string): void {
    this.signatureSyncScheduled = false;
    const providers = this.providerRegistry.getAllProviders();
    let added = false;
    this.updateState((state) => {
      const nextProviders = { ...state.providers } as Record<ProviderId, CatalogProviderState>;
      for (const provider of providers) {
        const providerId = provider.metadata.id;
        if (nextProviders[providerId] === undefined) {
          nextProviders[providerId] = this.createStateFromProvider(provider);
          added = true;
        }
      }
      if (!added) {
        return state;
      }
      return {
        ...state,
        providers: nextProviders,
      };
    });
    this.knownProvidersSignature = signature;
    if (!added) {
      this.recomputeSnapshot();
    }
  }

  private ensureProviderState(providerId: ProviderId): CatalogProviderState {
    const current = this.state.providers[providerId];
    if (current !== undefined) {
      return current;
    }

    let state = this.createStateFromProvider({ models: [] });
    if (this.providerRegistry.hasProvider(providerId)) {
      const provider = this.providerRegistry.getProvider(providerId);
      state = this.createStateFromProvider(provider);
    }

    this.updateState((catalogState) => {
      if (catalogState.providers[providerId] !== undefined) {
        return catalogState;
      }
      return {
        ...catalogState,
        providers: {
          ...catalogState.providers,
          [providerId]: state,
        },
      };
    });

    return state;
  }

  private updateProvider(
    providerId: ProviderId,
    updater: (state: CatalogProviderState) => CatalogProviderState
  ): void {
    this.updateState((state) => {
      const current = state.providers[providerId];
      if (current === undefined) {
        return state;
      }
      const updated = updater(current);
      if (Object.is(updated, current)) {
        return state;
      }
      return {
        ...state,
        providers: {
          ...state.providers,
          [providerId]: updated,
        },
      };
    });
  }

  private setPending(
    providerId: ProviderId,
    key: 'hydrate' | 'refresh',
    value: boolean
  ): void {
    this.updateProvider(providerId, (state) => {
      const currentPending = state.pending ?? {};
      const nextPending = { ...currentPending };
      if (value) {
        nextPending[key] = true;
      } else {
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
        delete nextPending[key];
      }
      const pending = Object.keys(nextPending).length > 0 ? nextPending : undefined;
      if (pending === state.pending) {
        return state;
      }
      return {
        ...state,
        pending,
      };
    });
  }

  private async ensurePersistedLoaded(providerId: ProviderId): Promise<void> {
    const state = this.ensureProviderState(providerId);
    if (state.hydrated) {
      return;
    }

    const existing = this.pendingHydrations.get(providerId);
    if (existing !== undefined) {
      await existing;
      return;
    }

    const run = (async () => {
      this.setPending(providerId, 'hydrate', true);
      try {
        const persisted = await getPersistedModels(this.modelStorage, providerId);
        if (persisted.length > 0) {
          this.mergePersisted(providerId, persisted);
        }
      } finally {
        this.setPending(providerId, 'hydrate', false);
        this.updateProvider(providerId, (prev) => {
          if (prev.hydrated) {
            return prev;
          }
          return {
            ...prev,
            hydrated: true,
          };
        });
      }
    })();

    const wrapped = run.finally(() => {
      this.pendingHydrations.delete(providerId);
    });
    this.pendingHydrations.set(providerId, wrapped);
    await wrapped;
  }

  async initialize(prefetch: boolean = true): Promise<void> {
    const providerIds = this.providerRegistry
      .getAllProviders()
      .map((provider) => provider.metadata.id);

    await Promise.all(
      providerIds.map(async (providerId) => {
        this.ensureProviderState(providerId);
        await this.ensurePersistedLoaded(providerId);
      })
    );

    if (prefetch) {
      const providerIdsWithCreds = await getProvidersWithCredentials(this.storage);
      await Promise.all(
        providerIdsWithCreds.map(async (providerId: ProviderId) => {
          try {
            await this.refresh(providerId);
          } catch {
            // ignore individual refresh failures during bulk prefetch
          }
        })
      );
    }
  }

  private setStatus(
    providerId: ProviderId,
    status: ProviderModelsStatus['status'],
    error?: string
  ) {
    this.ensureProviderState(providerId);
    this.updateProvider(providerId, (state) => {
      if (state.status === status && state.error === error) {
        return state;
      }
      return {
        ...state,
        status,
        error,
      };
    });
  }

  private async persistNonBuiltin(providerId: ProviderId) {
    const state = this.state.providers[providerId];
    if (!state) {
      return;
    }
    const keep: ModelConfig[] = [];
    for (const model of Object.values(state.models)) {
      if (model.origin === 'api' || model.origin === 'user') {
        keep.push(model);
      }
    }
    await setPersistedModels(this.modelStorage, providerId, keep);
  }

  private mergePersisted(providerId: ProviderId, models: ModelConfig[]) {
    const normalized = models.map(normalizePersisted);
    this.updateProvider(providerId, (state) => {
      let changed = !state.hydrated;
      let nextModels = state.models;
      for (const model of normalized) {
        const existing = nextModels[model.id];
        if (existing?.discoveredAt !== undefined && model.discoveredAt === undefined) {
          model.discoveredAt = existing.discoveredAt;
        }
        const updated = setModel(nextModels, model);
        if (updated !== nextModels) {
          changed = true;
          nextModels = updated;
        }
      }
      if (!changed) {
        return {
          ...state,
          hydrated: true,
        };
      }
      return {
        ...state,
        models: nextModels,
        hydrated: true,
      };
    });
  }

  private async mergeApi(providerId: ProviderId, fetched: ModelConfig[]) {
    const timestamp = now();
    const normalized = fetched.map((raw) => ({
      ...raw,
      origin: 'api' as const,
      visible: raw.visible ?? true,
    }));
    this.updateProvider(providerId, (state) => {
      const fetchedIds = new Set<ModelId>();
      let nextModels = state.models;
      for (const raw of normalized) {
        const previous = nextModels[raw.id];
        const discoveredAt = previous?.discoveredAt ?? timestamp;
        const modelConfig: ModelConfig = {
          ...raw,
          discoveredAt,
          updatedAt: timestamp,
        };
        const updated = setModel(nextModels, modelConfig);
        if (updated !== nextModels) {
          nextModels = updated;
        }
        fetchedIds.add(modelConfig.id);
      }

      for (const [rawId, existing] of Object.entries(nextModels) as Array<[ModelId, ModelConfig]>) {
        if (existing.origin === 'api' && !fetchedIds.has(rawId)) {
          const updated: ModelConfig = {
            ...existing,
            visible: false,
            updatedAt: timestamp,
          };
          const replaced = setModel(nextModels, updated);
          if (replaced !== nextModels) {
            nextModels = replaced;
          }
        }
      }

      return {
        ...state,
        models: nextModels,
        lastUpdatedAt: timestamp,
      };
    });
    await this.persistNonBuiltin(providerId);
  }

  async refresh(providerId: ProviderId, opts?: { force?: boolean }): Promise<void> {
    if (this.pendingRefreshes.has(providerId)) {
      return;
    }

    if (!this.providerRegistry.hasProvider(providerId)) {
      return;
    }

    this.ensureProviderState(providerId);
    const provider = this.providerRegistry.getProvider(providerId);

    const run = (async () => {
      const config = await getProviderConfiguration(this.storage, providerId);
      const valid = config ? provider.configuration.validateConfig(config).ok : false;
      if (!valid && !opts?.force) {
        this.setStatus(providerId, 'missing-config');
        return;
      }

      this.setStatus(providerId, 'loading');
      this.setPending(providerId, 'refresh', true);
      this.telemetry?.onFetchStart?.(providerId);
      try {
        const models = await provider.getModels();
        await this.mergeApi(providerId, models);
        this.setStatus(providerId, 'ready');
        this.telemetry?.onFetchSuccess?.(providerId, models.length);
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        this.setStatus(providerId, 'error', err.message);
        this.telemetry?.onFetchError?.(providerId, err);
      } finally {
        this.setPending(providerId, 'refresh', false);
      }
    })();

    const wrapped = run.finally(() => {
      this.pendingRefreshes.delete(providerId);
    });
    this.pendingRefreshes.set(providerId, wrapped);
    await wrapped;
  }

  async refreshAll(): Promise<void> {
    const providerIds = (await getProvidersWithCredentials(this.storage)).filter((pid) =>
      this.providerRegistry.hasProvider(pid)
    );
    await Promise.all(providerIds.map((pid) => this.refresh(pid)));
  }

  async addUserModel(providerId: ProviderId, modelId: ModelId): Promise<void> {
    this.ensureProviderState(providerId);

    const current = this.state.providers[providerId];
    if (current?.models[modelId] !== undefined) {
      return;
    }

    const timestamp = now();
    const model: ModelConfig = {
      id: modelId,
      displayName: String(modelId),
      origin: 'user',
      visible: true,
      discoveredAt: timestamp,
      updatedAt: timestamp,
    };

    this.updateProvider(providerId, (state) => ({
      ...state,
      models: setModel(state.models, model),
      lastUpdatedAt: timestamp,
    }));

    await this.persistNonBuiltin(providerId);
    this.telemetry?.onUserModelAdded?.(providerId, modelId);
  }

  async removeUserModel(providerId: ProviderId, modelId: ModelId): Promise<void> {
    const state = this.state.providers[providerId];
    if (!state) {
      return;
    }
    const existing = state.models[modelId];
    if (existing?.origin !== 'user') {
      return;
    }

    this.updateProvider(providerId, (prev) => ({
      ...prev,
      models: removeModel(prev.models, modelId),
      lastUpdatedAt: now(),
    }));

    await this.persistNonBuiltin(providerId);
  }
}
