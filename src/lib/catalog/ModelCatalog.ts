/* eslint-disable @typescript-eslint/member-ordering */
import type {
  IProviderRegistry,
  ProviderId,
  ModelId,
  ModelConfig,
  ModelConfigWithProvider,
  ProviderModelsStatus,
  ModelPickerTelemetry,
  StorageAdapter,
} from '../types';
import { getPersistedModels, setPersistedModels } from '../storage/modelRepository';
import { getProviderConfiguration, getProvidersWithCredentials } from '../storage/repository';

interface ProviderState {
  status: ProviderModelsStatus['status'];
  error?: string;
  models: Map<ModelId, ModelConfig>;
}

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

export class ModelCatalog {
  private readonly byProvider = new Map<ProviderId, ProviderState>();
  private readonly listeners = new Set<() => void>();
  private readonly inFlight = new Set<ProviderId>();
  private readonly hydratedProviders = new Set<ProviderId>();
  private readonly pendingHydrations = new Map<ProviderId, Promise<void>>();
  private cachedSnapshot: Record<ProviderId, ProviderModelsStatus> = {};
  private knownProvidersSignature = '';
  private telemetry?: ModelPickerTelemetry | undefined;

  constructor(
    private readonly providerRegistry: IProviderRegistry,
    private readonly storage: StorageAdapter,
    private readonly modelStorage: StorageAdapter,
    telemetry?: ModelPickerTelemetry
  ) {
    this.telemetry = telemetry;
    this.seedBuiltin();
  }

  private seedBuiltin() {
    for (const provider of this.providerRegistry.getAllProviders()) {
      const map = new Map<ModelId, ModelConfig>();
      for (const model of provider.models) {
        const normalizedModel = normalizeBuiltin(model);
        map.set(normalizedModel.id, normalizedModel);
      }
      this.byProvider.set(provider.metadata.id, { status: 'idle', models: map });
    }
    this.recomputeSnapshot();
    this.emit();
  }

  private ensureProviderState(providerId: ProviderId): ProviderState {
    let state = this.byProvider.get(providerId);
    if (state !== undefined) {
      return state;
    }

    const providerExists = this.providerRegistry.hasProvider(providerId);
    if (!providerExists) {
      state = { status: 'idle', models: new Map<ModelId, ModelConfig>() };
      this.byProvider.set(providerId, state);
      return state;
    }

    const provider = this.providerRegistry.getProvider(providerId);
    const map = new Map<ModelId, ModelConfig>();
    for (const model of provider.models) {
      const normalizedModel = normalizeBuiltin(model);
      map.set(normalizedModel.id, normalizedModel);
    }
    state = { status: 'idle', models: map };
    this.byProvider.set(providerId, state);

    if (!this.hydratedProviders.has(providerId) && !this.pendingHydrations.has(providerId)) {
      this.ensurePersistedLoaded(providerId).catch(() => undefined);
    }

    if (providerExists) {
      scheduleMicrotaskSafe(() => {
        this.recomputeSnapshot();
        this.emit();
      });
    }

    return state;
  }

  private async ensurePersistedLoaded(providerId: ProviderId): Promise<void> {
    if (this.hydratedProviders.has(providerId)) {
      return;
    }
    const existing = this.pendingHydrations.get(providerId);
    if (existing !== undefined) {
      await existing;
      return;
    }

    const run = (async () => {
      try {
        const persisted = await getPersistedModels(this.modelStorage, providerId);
        if (persisted.length > 0) {
          this.mergePersisted(providerId, persisted);
        }
      } finally {
        this.hydratedProviders.add(providerId);
      }
    })();

    const wrapped = run.finally(() => {
      this.pendingHydrations.delete(providerId);
    });
    this.pendingHydrations.set(providerId, wrapped);
    await wrapped;
  }

  // Load persisted models and optionally prefetch
  // eslint-disable-next-line code-complete/no-boolean-params
  async initialize(prefetch: boolean = true): Promise<void> {
    const allProviderIds = this.providerRegistry
      .getAllProviders()
      .map((provider) => provider.metadata.id);
    // Load persisted models for ALL providers so offline state still shows known models
    await Promise.all(
      allProviderIds.map(async (pid: ProviderId) => {
        this.ensureProviderState(pid);
        await this.ensurePersistedLoaded(pid);
      })
    );
    this.recomputeSnapshot();
    this.emit();

    if (prefetch) {
      const providerIdsWithCreds = await getProvidersWithCredentials(this.storage);
      await Promise.all(
        providerIdsWithCreds.map(async (pid: ProviderId) => {
          await this.refresh(pid).catch(() => undefined);
        })
      );
    }
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  getSnapshot(): Record<ProviderId, ProviderModelsStatus> {
    const signature = this.providerRegistry
      .getAllProviders()
      .map((provider) => provider.metadata.id)
      // eslint-disable-next-line code-complete/enforce-meaningful-names, sonarjs/no-nested-conditional
      .toSorted((a, b) => (a < b ? -1 : a > b ? 1 : 0))
      .join('|');
    if (signature !== this.knownProvidersSignature) {
      scheduleMicrotaskSafe(() => {
        this.recomputeSnapshot();
        this.emit();
      });
    }
    return this.cachedSnapshot;
  }

  setTelemetry(telemetry?: ModelPickerTelemetry) {
    this.telemetry = telemetry;
  }

  private emit() {
    for (const listener of this.listeners) {
      listener();
    }
  }

  private recomputeSnapshot() {
    const providers = this.providerRegistry.getAllProviders();
    const signature = providers
      .map((provider) => provider.metadata.id)
      .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))
      .join('|');
    const out: Record<ProviderId, ProviderModelsStatus> = {};
    for (const provider of providers) {
      const pid = provider.metadata.id;
      const state = this.ensureProviderState(pid);
      const models = state?.models ?? new Map<ModelId, ModelConfig>();
      const withProvider: ModelConfigWithProvider[] = [...models.values()].map((model) => ({
        model,
        provider: provider.metadata,
      }));
      const base: ProviderModelsStatus = {
        models: withProvider,
        status: state?.status ?? 'idle',
      } as ProviderModelsStatus;
      if (state?.error !== undefined) {
        base.error = state.error;
      }
      out[pid] = base;
    }
    this.cachedSnapshot = out;
    this.knownProvidersSignature = signature;
  }

  private setStatus(
    providerId: ProviderId,
    status: ProviderModelsStatus['status'],
    error?: string
  ) {
    const st = this.ensureProviderState(providerId);
    st.status = status;
    if (error === undefined) {
      delete st.error;
    } else {
      st.error = error;
    }
    this.byProvider.set(providerId, st);
    this.recomputeSnapshot();
    this.emit();
  }

  private async persistNonBuiltin(providerId: ProviderId) {
    const state = this.byProvider.get(providerId);
    if (!state) {
      return;
    }
    const keep: ModelConfig[] = [];
    for (const model of state.models.values()) {
      if (model.origin === 'api' || model.origin === 'user') {
        keep.push(model);
      }
    }
    await setPersistedModels(this.modelStorage, providerId, keep);
  }

  private mergePersisted(providerId: ProviderId, models: ModelConfig[]) {
    const state = this.ensureProviderState(providerId);
    for (const m of models) {
      const nm = normalizePersisted(m);
      const existing = state.models.get(nm.id);
      if (existing?.discoveredAt !== undefined && nm.discoveredAt === undefined) {
        nm.discoveredAt = existing.discoveredAt;
      }
      state.models.set(nm.id, nm);
    }
    this.byProvider.set(providerId, state);
    this.recomputeSnapshot();
    this.emit();
  }

  private async mergeApi(providerId: ProviderId, fetched: ModelConfig[]) {
    const state = this.ensureProviderState(providerId);
    const fetchedIds = new Set<ModelId>();
    const timestamp = now();

    for (const raw of fetched) {
      const discoveredAt = state.models.get(raw.id)?.discoveredAt;
      const modelConfig: ModelConfig = {
        ...raw,
        origin: 'api',
        visible: raw.visible ?? true,
        discoveredAt: discoveredAt ?? timestamp,
        updatedAt: timestamp,
      };
      fetchedIds.add(modelConfig.id);
      state.models.set(modelConfig.id, modelConfig);
    }

    // Hide stale API entries (keep in storage but not visible)
    for (const [id, modelConfig] of state.models.entries()) {
      if (modelConfig.origin === 'api' && !fetchedIds.has(id)) {
        state.models.set(id, { ...modelConfig, visible: false, updatedAt: timestamp });
      }
    }

    this.byProvider.set(providerId, state);
    await this.persistNonBuiltin(providerId);
    this.recomputeSnapshot();
    this.emit();
  }

  async refresh(providerId: ProviderId, opts?: { force?: boolean }): Promise<void> {
    if (this.inFlight.has(providerId)) {
      return;
    }
    if (!this.providerRegistry.hasProvider(providerId)) {
      return;
    }
    const provider = this.providerRegistry.getProvider(providerId);
    this.ensureProviderState(providerId);
    this.inFlight.add(providerId);
    try {
      const config = await getProviderConfiguration(this.storage, providerId);
      const valid = config ? provider.configuration.validateConfig(config).ok : false;
      if (!valid && !opts?.force) {
        this.setStatus(providerId, 'missing-config');
        return;
      }

      this.setStatus(providerId, 'loading');
      this.telemetry?.onFetchStart?.(providerId);
      const models = await provider.getModels();
      await this.mergeApi(providerId, models);
      this.setStatus(providerId, 'ready');
      this.telemetry?.onFetchSuccess?.(providerId, models.length);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.setStatus(providerId, 'error', err.message);
      this.telemetry?.onFetchError?.(providerId, err);
    } finally {
      this.inFlight.delete(providerId);
    }
  }

  async refreshAll(): Promise<void> {
    const providerIds = (await getProvidersWithCredentials(this.storage)).filter((pid) =>
      this.providerRegistry.hasProvider(pid)
    );
    await Promise.all(providerIds.map((pid) => this.refresh(pid)));
  }

  async addUserModel(providerId: ProviderId, modelId: ModelId): Promise<void> {
    const state = this.ensureProviderState(providerId);

    if (state.models.has(modelId)) {
      // exact duplicate not allowed
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
    state.models.set(modelId, model);
    this.byProvider.set(providerId, state);
    await this.persistNonBuiltin(providerId);
    this.telemetry?.onUserModelAdded?.(providerId, modelId);
    this.recomputeSnapshot();
    this.emit();
  }

  async removeUserModel(providerId: ProviderId, modelId: ModelId): Promise<void> {
    const state = this.byProvider.get(providerId);
    if (!state) {
      return;
    }
    const existing = state.models.get(modelId);
    if (existing?.origin !== 'user') {
      return;
    } // only allow explicit removal of user entries
    state.models.delete(modelId);
    await this.persistNonBuiltin(providerId);
    this.recomputeSnapshot();
    this.emit();
  }
}
