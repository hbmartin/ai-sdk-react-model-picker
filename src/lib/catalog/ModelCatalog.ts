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
import {
  getPersistedModels,
  getHiddenModelIds,
  setPersistedModels,
} from '../storage/modelRepository';
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
  private snapshot: CatalogSnapshot;
  private readonly listeners = new Set<() => void>();
  private readonly pendingHydrations = new Map<ProviderId, Promise<void>>();
  private readonly pendingRefreshes = new Map<ProviderId, Promise<void>>();
  private readonly hiddenModelIds = new Map<ProviderId, Set<ModelId>>();

  constructor(
    private readonly providerRegistry: IProviderRegistry,
    private readonly modelStorage: StorageAdapter,
    private readonly telemetry?: ModelPickerTelemetry
  ) {
    this.snapshot = this.buildInitialState();
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
        const [persisted, hiddenIds] = await Promise.all([
          getPersistedModels(this.modelStorage, providerId),
          getHiddenModelIds(this.modelStorage, providerId),
        ]);
        if (persisted.length > 0) {
          this.mergeAddedModelsIntoSnapshot(provider, persisted, 'user');
        }
        this.applyHiddenModels(providerId, hiddenIds);
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
      const providerIdsWithCreds = await getProvidersWithCredentials(this.modelStorage);
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

  private async persistNonBuiltin(providerId: ProviderId) {
    const state = this.snapshot[providerId];
    if (!state) {
      return;
    }
    const keep: ModelConfig[] = state.models
      .filter((model) => model.model.origin !== 'builtin')
      .map((model) => model.model);
    await setPersistedModels(this.modelStorage, providerId, keep);
  }

  private async persistHiddenModels(providerId: ProviderId) {
    const hiddenSet = this.hiddenModelIds.get(providerId);
    const hiddenIds = hiddenSet === undefined ? [] : [...hiddenSet];
    await setHiddenModelIds(this.modelStorage, providerId, hiddenIds);
  }

  private applyHiddenModels(providerId: ProviderId, hiddenIds: ModelId[]): void {
    const state = this.snapshot[providerId];
    if (state === undefined) {
      if (hiddenIds.length > 0) {
        this.hiddenModelIds.set(providerId, new Set(hiddenIds));
      }
      return;
    }

    const hiddenSet = new Set(hiddenIds);
    this.hiddenModelIds.set(providerId, hiddenSet);

    if (hiddenSet.size === 0) {
      return;
    }

    this.updateProvider(providerId, (prev) => {
      let changed = false;
      const models = prev.models.map((entry) => {
        const shouldHide = hiddenSet.has(entry.model.id);
        const currentVisible = entry.model.visible ?? true;
        const nextVisible = shouldHide ? false : currentVisible;
        if (currentVisible === nextVisible) {
          return entry;
        }
        changed = true;
        return {
          ...entry,
          model: {
            ...entry.model,
            visible: nextVisible,
          },
        } satisfies CatalogEntry;
      });
      return changed ? { ...prev, models } : prev;
    });
  }

  private mergeAddedModelsIntoSnapshot(
    provider: AIProvider,
    models: ModelConfig[],
    fallbackOrigin: ModelOrigin
  ) {
    const providerId = provider.metadata.id;
    const hiddenSet = this.hiddenModelIds.get(providerId);
    const normalized = models.map((model) => {
      const entry = modelToCatalogEntry(model, provider.metadata, fallbackOrigin);
      if (hiddenSet?.has(entry.model.id) === true) {
        return {
          ...entry,
          model: {
            ...entry.model,
            visible: false,
          },
        } satisfies CatalogEntry;
      }
      return entry;
    });
    this.updateProvider(providerId, (state) => {
      const nextModels = normalized.filter(
        (nextModel) =>
          !state.models.some((existingModel) => nextModel.model.id === existingModel.model.id)
      );
      if (nextModels.length === 0) {
        return undefined;
      }
      return {
        error: undefined,
        status: 'ready',
        models: [...nextModels, ...state.models],
      };
    });
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
        const config = await getProviderConfiguration(this.modelStorage, providerId);
        const valid = config ? provider.configuration.validateConfig(config).ok : false;
        if (!valid && opts?.force !== true) {
          this.telemetry?.onProviderInvalidConfig?.(providerId);
          this.setStatus(providerId, 'missing-config');
          return;
        }
        this.setStatus(providerId, 'refreshing');
        this.telemetry?.onFetchStart?.(providerId);
        const models = await provider.fetchModels();
        this.mergeAddedModelsIntoSnapshot(provider, models, 'api');
        // TODO: remove / update builtin models based on API response
        await this.persistNonBuiltin(providerId);
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
    const providers = await getProvidersWithCredentials(this.modelStorage);
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

    await this.persistNonBuiltin(providerId);
    this.telemetry?.onUserModelAdded?.(providerId, model.id);
  }

  async setModelVisibility(
    providerId: ProviderId,
    modelId: ModelId,
    visible: boolean
  ): Promise<void> {
    if (this.ensureProviderState(providerId) === undefined) {
      return;
    }

    let didChange = false;
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
      didChange = true;
      return {
        ...prev,
        models,
      } satisfies ProviderModelsStatus;
    });

    if (!didChange) {
      return;
    }

    const hiddenSet = this.hiddenModelIds.get(providerId) ?? new Set<ModelId>();
    if (visible) {
      hiddenSet.delete(modelId);
    } else {
      hiddenSet.add(modelId);
    }
    this.hiddenModelIds.set(providerId, hiddenSet);

    await this.persistNonBuiltin(providerId);
    await this.persistHiddenModels(providerId);
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

    await this.persistNonBuiltin(providerId);
  }

  removeProvider(providerId: ProviderId): void {
    // TODO: consolidate storage removal, currently this is done in useModelsWithConfiguredProvider
    // eslint-disable-next-line sonarjs/no-unused-vars
    const { [providerId]: _, ...rest } = this.snapshot;
    this.snapshot = rest;
    this.hiddenModelIds.delete(providerId);
    this.emit();
  }
}
