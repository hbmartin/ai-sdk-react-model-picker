/* eslint-disable @typescript-eslint/member-ordering */
import type {
  IProviderRegistry,
  ProviderId,
  ModelConfig,
  CatalogEntry,
  ProviderModelsStatus,
  StorageAdapter,
  CatalogSnapshot,
  AIProvider,
  ProviderMetadata,
  ModelOrigin,
  ProviderStatus,
  ModelId,
  ProviderAndModelKey,
} from '../types';
import { createModelId, idsFromKey, providerAndModelKey } from '../types';
import { getPersistedModels, setPersistedModels } from '../storage/modelRepository';
import { getProviderConfiguration, getProvidersWithCredentials } from '../storage/repository';
import type { ModelPickerTelemetry } from '../telemetry';

function modelToCatalogEntry(
  model: ModelConfig,
  providerMetadata: ProviderMetadata,
  fallbackOrigin: ModelOrigin
): CatalogEntry {
  const base = {
    model: {
      ...model,
      origin: model.origin ?? fallbackOrigin,
      visible: model.visible ?? true,
    },
    provider: providerMetadata,
  };
  return {
    ...base,
    key: providerAndModelKey(base),
  };
}

export class ModelCatalog {
  private snapshot: CatalogSnapshot;
  private readonly listeners = new Set<() => void>();
  private readonly pendingHydrations = new Map<ProviderId, Promise<void>>();
  private readonly pendingRefreshes = new Map<ProviderId, Promise<void>>();

  constructor(
    private readonly providerRegistry: IProviderRegistry,
    private readonly providerStorage: StorageAdapter,
    private readonly modelStorage: StorageAdapter,
    private readonly telemetry?: ModelPickerTelemetry
  ) {
    this.snapshot = this.buildInitialState();
  }

  getPendingRefreshes(providerId: ProviderId): Promise<void> | undefined {
    return this.pendingRefreshes.get(providerId) ?? this.pendingHydrations.get(providerId);
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  getSnapshot(): CatalogSnapshot {
    return this.snapshot;
  }

  getModel(key: ProviderAndModelKey): CatalogEntry | undefined {
    const { providerId, modelId } = idsFromKey(key);
    const provider = this.snapshot[providerId];
    if (provider === undefined) {
      return undefined;
    }
    const model = provider.models.find((model) => model.model.id === modelId);
    if (model === undefined) {
      return undefined;
    }
    return { ...model, key };
  }

  private emit(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }

  private buildInitialState(): CatalogSnapshot {
    const providers = this.providerRegistry.getAllProviders();
    const stateProviders: CatalogSnapshot = {};
    for (const provider of providers) {
      stateProviders[provider.metadata.id] = this.createStateFromProvider(provider);
    }
    return stateProviders;
  }

  private createStateFromProvider(provider: AIProvider): ProviderModelsStatus {
    const builtin = provider.models.map((model) =>
      modelToCatalogEntry(model, provider.metadata, 'builtin')
    );
    return {
      status: 'idle',
      models: builtin,
    };
  }

  private ensureProviderState(providerId: ProviderId): ProviderModelsStatus | undefined {
    const current = this.snapshot[providerId];
    if (current !== undefined) {
      return current;
    }

    if (!this.providerRegistry.hasProvider(providerId)) {
      this.telemetry?.onProviderNotFound?.(providerId);
      return undefined;
    }
    const provider = this.providerRegistry.getProvider(providerId);
    const state = this.createStateFromProvider(provider);
    this.snapshot = { ...this.snapshot, [providerId]: state };
    this.emit();

    return state;
  }

  private updateProvider(
    providerId: ProviderId,
    updater: (state: ProviderModelsStatus) => ProviderModelsStatus | undefined
  ): void {
    const state = this.snapshot[providerId];
    if (state === undefined) {
      return;
    }
    const updated = updater(state);
    if (updated === undefined || Object.is(updated, state)) {
      return;
    }
    updated.lastUpdatedAt = Date.now();
    this.snapshot = { ...this.snapshot, [providerId]: updated };
    this.emit();
  }

  private async loadPersistedModels(provider: AIProvider): Promise<void> {
    const providerId = provider.metadata.id;
    if (this.ensureProviderState(providerId) === undefined) {
      return;
    }

    const existing = this.pendingHydrations.get(providerId);
    if (existing !== undefined) {
      await existing;
      return;
    }
    this.setStatus(providerId, 'hydrating');

    const run = (async () => {
      try {
        const persisted = await getPersistedModels(this.modelStorage, providerId);
        const changed = persisted.length > 0
          ? this.mergeModelsIntoSnapshot(provider, persisted, 'user')
          : false;
        if (!changed) {
          this.setStatus(providerId, 'ready');
        }
      } catch (error) {
        this.telemetry?.onStorageError?.(
          'read',
          providerId,
          error instanceof Error ? error : new Error(String(error))
        );
        this.setStatus(providerId, 'ready');
      }
    })().finally(() => {
      this.pendingHydrations.delete(providerId);
    });

    this.pendingHydrations.set(providerId, run);
    await run;
  }

  // eslint-disable-next-line code-complete/no-boolean-params
  async initialize(prefetch: boolean = true): Promise<void> {
    const providers = this.providerRegistry.getAllProviders();

    await Promise.all(
      providers.map(async (provider) => {
        // TODO: error handling
        await this.loadPersistedModels(provider);
      })
    );

    if (prefetch) {
      const providerIdsWithCreds = await getProvidersWithCredentials(this.providerStorage);
      for (const providerId of providerIdsWithCreds) {
        try {
          await this.refresh(providerId);
        } catch (error) {
          this.telemetry?.onFetchError?.(
            providerId,
            error instanceof Error ? error : new Error(String(error))
          );
        }
      }
    }
  }

  private setStatus(providerId: ProviderId, status: ProviderStatus, error?: string) {
    const state = this.ensureProviderState(providerId);
    if (state === undefined) {
      return;
    }
    this.updateProvider(providerId, (prev) => {
      return {
        ...prev,
        status,
        error,
      };
    });
  }

  private async persistProviderModels(providerId: ProviderId): Promise<void> {
    const state = this.snapshot[providerId];
    if (!state) {
      return;
    }
    const models: ModelConfig[] = state.models.map((entry) => entry.model);
    await setPersistedModels(this.modelStorage, providerId, models);
  }

  private mergeModelsIntoSnapshot(
    provider: AIProvider,
    models: ModelConfig[],
    fallbackOrigin: ModelOrigin
  ): boolean {
    const providerId = provider.metadata.id;
    if (models.length === 0) {
      return false;
    }

    const overrides = new Map<ModelId, ModelConfig>();
    for (const model of models) {
      overrides.set(model.id, model);
    }

    let didChange = false;
    this.updateProvider(providerId, (state) => {
      let changed = false;
      const updatedModels = state.models.map((entry) => {
        const override = overrides.get(entry.model.id);
        if (override === undefined) {
          return entry;
        }
        overrides.delete(entry.model.id);
        const mergedModel: ModelConfig = {
          ...entry.model,
          ...override,
          origin: override.origin ?? entry.model.origin ?? fallbackOrigin,
        } satisfies ModelConfig;
        if (this.modelsEqual(entry.model, mergedModel)) {
          return entry;
        }
        changed = true;
        return {
          ...entry,
          model: mergedModel,
        } satisfies CatalogEntry;
      });

      const newEntries: CatalogEntry[] = [];
      for (const model of overrides.values()) {
        const entry = modelToCatalogEntry(model, provider.metadata, fallbackOrigin);
        newEntries.push(entry);
      }

      if (!changed && newEntries.length === 0) {
        return undefined;
      }

      didChange = true;
      return {
        error: undefined,
        status: 'ready',
        models: [...newEntries, ...updatedModels],
      };
    });

    return didChange;
  }

  private modelsEqual(a: ModelConfig, b: ModelConfig): boolean {
    const keys = new Set<keyof ModelConfig>();
    for (const key of Object.keys(a) as (keyof ModelConfig)[]) {
      keys.add(key);
    }
    for (const key of Object.keys(b) as (keyof ModelConfig)[]) {
      keys.add(key);
    }
    for (const key of keys) {
      if (a[key] !== b[key]) {
        return false;
      }
    }
    return true;
  }

  async refresh(providerId: ProviderId, opts?: { force?: boolean }): Promise<void> {
    if (this.ensureProviderState(providerId) === undefined) {
      return;
    }

    const existing = this.pendingRefreshes.get(providerId);
    if (existing !== undefined) {
      await existing;
      return;
    }

    const provider = this.providerRegistry.getProvider(providerId);

    const run = (async () => {
      try {
        const config = await getProviderConfiguration(this.providerStorage, providerId);
        const valid = config ? provider.configuration.validateConfig(config).ok : false;
        if (!valid && opts?.force !== true) {
          this.telemetry?.onProviderInvalidConfig?.(providerId);
          this.setStatus(providerId, 'missing-config');
          return;
        }
        this.setStatus(providerId, 'refreshing');
        this.telemetry?.onFetchStart?.(providerId);
        const models = await provider.fetchModels();
        if (models.length > 0) {
          const changed = this.mergeModelsIntoSnapshot(provider, models, 'api');
          // TODO: remove / update builtin models based on API response
          if (changed) {
            await this.persistProviderModels(providerId);
          } else {
            this.setStatus(providerId, 'ready');
          }
        } else {
          this.setStatus(providerId, 'ready');
        }
        this.telemetry?.onFetchSuccess?.(providerId, models.length);
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        this.telemetry?.onFetchError?.(providerId, err);
        this.setStatus(providerId, 'ready', err.message);
      }
    })().finally(() => {
      this.pendingRefreshes.delete(providerId);
    });
    this.pendingRefreshes.set(providerId, run);
    await run;
  }

  async refreshAll(): Promise<void> {
    const providers = await getProvidersWithCredentials(this.providerStorage);
    const providersWithCreds = providers.filter((pid) => this.providerRegistry.hasProvider(pid));
    for (const pid of providersWithCreds) {
      await this.refresh(pid);
    }
  }

  async addUserModel(providerId: ProviderId, modelId: string): Promise<void> {
    this.ensureProviderState(providerId);

    const current = this.snapshot[providerId];
    if (current === undefined || current.models.some((model) => model.model.id === modelId)) {
      return;
    }

    const model: ModelConfig = {
      id: createModelId(modelId),
      displayName: modelId,
      origin: 'user',
      visible: true,
      discoveredAt: Date.now(),
    };
    const providerMetadata = this.providerRegistry.getProvider(providerId).metadata;
    const modelEntry: CatalogEntry = {
      model,
      provider: providerMetadata,
      key: providerAndModelKey({
        model,
        provider: providerMetadata,
      }),
    };

    this.updateProvider(providerId, (state) => ({
      ...state,
      models: [modelEntry, ...state.models],
    }));

    await this.persistProviderModels(providerId);
    this.telemetry?.onUserModelAdded?.(providerId, model.id);
  }

  async setModelVisibility(
    providerId: ProviderId,
    modelId: ModelId,
    // eslint-disable-next-line code-complete/no-boolean-params
    visible: boolean
  ): Promise<void> {
    if (this.ensureProviderState(providerId) === undefined) {
      return;
    }

    this.updateProvider(providerId, (prev) => {
      const index = prev.models.findIndex((entry) => entry.model.id === modelId);
      if (index === -1) {
        return prev;
      }
      const entry = prev.models[index];
      const currentVisible = entry.model.visible ?? true;
      if (currentVisible === visible) {
        return prev;
      }
      const models = [...prev.models];
      models[index] = {
        ...entry,
        model: {
          ...entry.model,
          visible,
        },
      } satisfies CatalogEntry;
      return {
        ...prev,
        models,
      } satisfies ProviderModelsStatus;
    });

    await this.persistProviderModels(providerId);
  }

  async removeModel(providerId: ProviderId, modelId: string): Promise<void> {
    const state = this.snapshot[providerId];
    if (state === undefined) {
      return;
    }
    const remaining = state.models.filter((model) => model.model.id !== modelId);
    if (remaining.length === state.models.length) {
      return;
    }

    this.updateProvider(providerId, (prev) => ({
      ...prev,
      models: remaining,
    }));

    await this.persistProviderModels(providerId);
  }

  removeProvider(providerId: ProviderId): void {
    // TODO: consolidate storage removal, currently this is done in useModelsWithConfiguredProvider
    // eslint-disable-next-line sonarjs/no-unused-vars
    const { [providerId]: _, ...rest } = this.snapshot;
    this.snapshot = rest;
    this.emit();
  }
}
