import {
  type IProviderRegistry,
  type ProviderId,
  type ModelId,
  type ModelConfig,
  type ModelConfigWithProvider,
  type ProviderModelsStatus,
  type ModelPickerTelemetry,
} from '../types';
import { getProviderConfiguration, getProvidersWithCredentials } from '../storage/repository';
import { getPersistedModels, setPersistedModels } from '../storage/modelRepository';
import type { StorageAdapter } from '../types';

type ProviderState = {
  status: ProviderModelsStatus['status'];
  error?: string;
  models: Map<ModelId, ModelConfig>;
};

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

export class ModelCatalog {
  private readonly byProvider = new Map<ProviderId, ProviderState>();
  private readonly listeners = new Set<() => void>();
  private readonly inFlight = new Set<ProviderId>();
  private cachedSnapshot: Record<ProviderId, ProviderModelsStatus> = {} as any;

  constructor(
    private readonly providerRegistry: IProviderRegistry,
    private readonly storage: StorageAdapter,
    private readonly modelStorage: StorageAdapter,
    private readonly telemetry?: ModelPickerTelemetry
  ) {
    this.seedBuiltin();
  }

  private seedBuiltin() {
    for (const provider of this.providerRegistry.getAllProviders()) {
      const map = new Map<ModelId, ModelConfig>();
      for (const model of provider.models) {
        const nm = normalizeBuiltin(model);
        map.set(nm.id, nm);
      }
      this.byProvider.set(provider.metadata.id, { status: 'idle', models: map });
    }
    this.recomputeSnapshot();
    this.emit();
  }

  // Load persisted models and optionally prefetch
  async initialize(prefetch = true): Promise<void> {
    const allProviderIds = this.providerRegistry.getAllProviders().map((p) => p.metadata.id);
    // Load persisted models for ALL providers so offline state still shows known models
    await Promise.all(
      allProviderIds.map(async (pid) => {
        const persisted = await getPersistedModels(this.modelStorage, pid);
        if (persisted.length > 0) {
          this.mergePersisted(pid, persisted);
        }
      })
    );
    this.recomputeSnapshot();
    this.emit();

    if (prefetch) {
      const providerIdsWithCreds = await getProvidersWithCredentials(this.storage);
      await Promise.all(
        providerIdsWithCreds.map(async (pid) => {
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

  private emit() {
    for (const l of this.listeners) l();
  }

  private recomputeSnapshot() {
    const out: Record<ProviderId, ProviderModelsStatus> = {} as any;
    for (const provider of this.providerRegistry.getAllProviders()) {
      const pid = provider.metadata.id;
      const state = this.byProvider.get(pid);
      const models = state?.models ?? new Map<ModelId, ModelConfig>();
      const withProvider: ModelConfigWithProvider[] = [...models.values()].map((m) => ({
        model: m,
        provider: provider.metadata,
      }));
      const base: ProviderModelsStatus = {
        models: withProvider,
        status: state?.status ?? 'idle',
      } as ProviderModelsStatus;
      if ((state as any)?.error !== undefined) {
        (base as any).error = (state as any).error as string;
      }
      out[pid] = base;
    }
    this.cachedSnapshot = out;
  }

  getSnapshot(): Record<ProviderId, ProviderModelsStatus> {
    return this.cachedSnapshot;
  }

  private setStatus(providerId: ProviderId, status: ProviderModelsStatus['status'], error?: string) {
    const st = this.byProvider.get(providerId) ?? { status: 'idle', models: new Map<ModelId, ModelConfig>() };
    st.status = status;
    if (error === undefined) {
      delete (st as any).error;
    } else {
      (st as any).error = error;
    }
    this.byProvider.set(providerId, st);
    this.recomputeSnapshot();
    this.emit();
  }

  private async persistNonBuiltin(providerId: ProviderId) {
    const state = this.byProvider.get(providerId);
    if (!state) return;
    const keep: ModelConfig[] = [];
    for (const m of state.models.values()) {
      if (m.origin === 'api' || m.origin === 'user') {
        keep.push(m);
      }
    }
    await setPersistedModels(this.modelStorage, providerId, keep);
  }

  private mergePersisted(providerId: ProviderId, models: ModelConfig[]) {
    const state = this.byProvider.get(providerId) ?? { status: 'idle', models: new Map() };
    for (const m of models) {
      const nm = normalizePersisted(m);
      const existing = state.models.get(nm.id);
      if (existing?.discoveredAt !== undefined && nm.discoveredAt === undefined) {
        nm.discoveredAt = existing.discoveredAt;
      }
      state.models.set(nm.id, nm);
    }
    this.byProvider.set(providerId, state);
  }

  private async mergeApi(providerId: ProviderId, fetched: ModelConfig[]) {
    const state = this.byProvider.get(providerId) ?? { status: 'idle', models: new Map() };
    const fetchedIds = new Set<ModelId>();
    const ts = now();

    for (const raw of fetched) {
      const m: ModelConfig = {
        ...raw,
        origin: 'api',
        visible: raw.visible ?? true,
        discoveredAt:
          state.models.get(raw.id)?.discoveredAt !== undefined
            ? state.models.get(raw.id)!.discoveredAt
            : ts,
        updatedAt: ts,
      };
      fetchedIds.add(m.id);
      state.models.set(m.id, m);
    }

    // Hide stale API entries (keep in storage but not visible)
    for (const [id, m] of state.models.entries()) {
      if (m.origin === 'api' && !fetchedIds.has(id)) {
        state.models.set(id, { ...m, visible: false, updatedAt: ts });
      }
    }

    this.byProvider.set(providerId, state);
    await this.persistNonBuiltin(providerId);
    this.recomputeSnapshot();
  }

  async refresh(providerId: ProviderId, opts?: { force?: boolean }): Promise<void> {
    if (this.inFlight.has(providerId)) return;
    const provider = this.providerRegistry.getProvider(providerId);
    // Configuration gating
    const config = await getProviderConfiguration(this.storage, providerId);
    const valid = config ? provider.configuration.validateConfig(config).ok : false;
    if (!valid && !opts?.force) {
      this.setStatus(providerId, 'missing-config');
      return;
    }

    try {
      this.inFlight.add(providerId);
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
    const providerIds = await getProvidersWithCredentials(this.storage);
    await Promise.all(providerIds.map((pid) => this.refresh(pid)));
  }

  async addUserModel(providerId: ProviderId, modelId: ModelId): Promise<void> {
    const state = this.byProvider.get(providerId) ?? { status: 'idle', models: new Map() };

    if (state.models.has(modelId)) {
      // exact duplicate not allowed
      return;
    }
    const ts = now();
    const model: ModelConfig = {
      id: modelId,
      displayName: String(modelId),
      origin: 'user',
      visible: true,
      discoveredAt: ts,
      updatedAt: ts,
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
    if (!state) return;
    const existing = state.models.get(modelId);
    if (existing?.origin !== 'user') return; // only allow explicit removal of user entries
    state.models.delete(modelId);
    await this.persistNonBuiltin(providerId);
    this.recomputeSnapshot();
    this.emit();
  }
}
