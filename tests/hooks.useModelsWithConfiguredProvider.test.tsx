// @vitest-environment jsdom
import { useEffect } from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ModelCatalog } from '../src/lib/catalog/ModelCatalog';
import { useModelsWithConfiguredProvider } from '../src/lib/hooks/useModelsWithConfiguredProvider';
import { ProviderRegistry } from '../src/lib/providers/ProviderRegistry';
import { MemoryStorageAdapter } from '../src/lib/storage';
import {
  addRecentlyUsedModel,
  addProviderWithCredentials,
  getRecentlyUsedModels,
  getProvidersWithCredentials,
} from '../src/lib/storage/repository';
import {
  type IconComponent,
  type ModelConfig,
  type ProviderId,
  type ModelId,
  createProviderId,
  createModelId,
  type ModelConfigWithProvider,
  providerAndModelKey,
  type ProviderAndModelKey,
  type AIProvider,
  type ModelPickerTelemetry,
} from '../src/lib/types';

// Minimal icon stub
const DummyIcon = (() => null) as unknown as IconComponent;

// Minimal ConfigAPI stub for AIProvider
const DummyConfigAPI = {
  requiresAtLeastOneOf: undefined,
  fields: [],
  assertValidConfigAndRemoveEmptyKeys: () => {},
  validateConfig: () => ({
    ok: true,
    missingRequired: [],
    extraneous: [],
    fieldValidationErrors: [],
    fieldValidationWarnings: [],
    message: undefined,
  }),
  validateField: () => undefined,
} as const;

class FakeProvider extends (class {} as { new (): AIProvider }) {
  readonly metadata: ModelConfigWithProvider['provider'];
  readonly configuration = DummyConfigAPI;
  readonly models: ModelConfig[];

  constructor(id: ProviderId, name: string, models: ModelConfig[]) {
    // @ts-expect-error calling abstract base omitted; not needed for tests
    super();
    this.metadata = { id, name, icon: DummyIcon } as ModelConfigWithProvider['provider'];
    this.models = models;
  }

  async createInstance() {
    // Not used in tests

    return {} as any;
  }

  getDefaultModel(): ModelConfig {
    return this.models.find((m) => m.isDefault === true) ?? this.models[0];
  }
}

function makeModel(id: string, displayName?: string, isDefault?: boolean): ModelConfig {
  return {
    id: createModelId(id),
    displayName: displayName ?? id,
    isDefault,
  };
}

function keyFor(providerId: ProviderId, modelId: ModelId): ProviderAndModelKey {
  const mp: ModelConfigWithProvider = {
    provider: { id: providerId, name: String(providerId), icon: DummyIcon },
    model: { id: modelId, displayName: String(modelId) },
  };
  return providerAndModelKey(mp);
}

describe('useModelsWithConfiguredProvider', () => {
  it('initializes empty when storage is empty', async () => {
    const storage = new MemoryStorageAdapter('test-1');
    const registry = new ProviderRegistry(undefined);

    const { result } = renderHook(() => useModelsWithConfiguredProvider(storage, registry));

    await waitFor(() => {
      expect(result.current.recentlyUsedModels).toEqual([]);
      expect(result.current.modelsWithCredentials).toEqual([]);
      expect(result.current.selectedModel).toBeUndefined();
    });
  });

  it('loads recently used and available models from storage', async () => {
    const storage = new MemoryStorageAdapter('test-2');
    const registry = new ProviderRegistry(undefined);

    const provId = createProviderId('prov1');
    const m1 = makeModel('m1', 'Model One', true);
    const m2 = makeModel('m2', 'Model Two');
    const provider = new FakeProvider(provId, 'Provider 1', [m1, m2]);
    registry.register(provider);

    // Pre-populate storage: mark m2 as recently used and prov1 as with credentials
    const k = keyFor(provId, m2.id);
    await addRecentlyUsedModel(storage, k);
    await addProviderWithCredentials(storage, provId);

    // Pre-populate storage so the effect starts with provider models known
    await addProviderWithCredentials(storage, provId);

    const { result } = renderHook(() => useModelsWithConfiguredProvider(storage, registry));

    await waitFor(() => {
      // m2 should be in recently used
      expect(result.current.recentlyUsedModels.map((x) => x.key)).toEqual([k]);
      // m1 (the other model) should appear in available models
      expect(result.current.modelsWithCredentials.map((x) => x.model.id)).toEqual([m1.id]);
      // selected model should default to first recent
      expect(result.current.selectedModel?.model.id).toBe(m2.id);
    });
  });

  it('selects default model when modelId is omitted', async () => {
    const storage = new MemoryStorageAdapter('test-3');
    const registry = new ProviderRegistry(undefined);

    const provId = createProviderId('prov2');
    const def = makeModel('def', 'Default', true);
    const other = makeModel('other', 'Other');
    registry.register(new FakeProvider(provId, 'P2', [def, other]));

    // Pre-populate storage so effect recognizes provider models
    await addProviderWithCredentials(storage, provId);

    const { result } = renderHook(() => useModelsWithConfiguredProvider(storage, registry));

    // Ensure initial effect completed and populated available models
    await waitFor(() => {
      expect(result.current.modelsWithCredentials.length).toBeGreaterThan(0);
    });

    await act(async () => {
      await result.current.setSelectedProviderAndModel(provId);
    });

    // Selected model should be default
    expect(result.current.selectedModel?.model.id).toBe(def.id);
    // Other model should appear in available models and selected one should not
    await waitFor(() => {
      expect(result.current.modelsWithCredentials.some((x) => x.model.id === other.id)).toBe(true);
      expect(result.current.modelsWithCredentials.some((x) => x.model.id === def.id)).toBe(false);
    });

    // Storage should reflect selection and provider credentials
    const recents = await getRecentlyUsedModels(storage);
    expect(recents).toContain(keyFor(provId, def.id));
    const creds = await getProvidersWithCredentials(storage);
    expect(creds).toContain(provId);
  });

  it.skip('selects specific model and updates states and storage', async () => {
    const storage = new MemoryStorageAdapter('test-4');
    const registry = new ProviderRegistry(undefined);

    const provId = createProviderId('prov3');
    const a = makeModel('a', 'A', true);
    const b = makeModel('b', 'B');
    registry.register(new FakeProvider(provId, 'P3', [a, b]));

    // Pre-populate storage so effect recognizes provider models
    await addProviderWithCredentials(storage, provId);

    const { result } = renderHook(() => useModelsWithConfiguredProvider(storage, registry));

    // Ensure initial effect completed and populated available models
    await waitFor(() => {
      expect(result.current.modelsWithCredentials.length).toBeGreaterThan(0);
    });

    await act(async () => {
      await result.current.setSelectedProviderAndModel(provId, b.id);
    });

    expect(result.current.selectedModel?.model.id).toBe(b.id);
    // Non-selected models for the provider should be available and selected one should be absent
    await waitFor(() => {
      expect(result.current.modelsWithCredentials.some((x) => x.model.id === a.id)).toBe(true);
      expect(result.current.modelsWithCredentials.some((x) => x.model.id === b.id)).toBe(false);
    });
    // Recently used should contain the selected one first
    expect(result.current.recentlyUsedModels[0]?.model.id).toBe(b.id);

    // Storage should contain provider and recent
    const recents = await getRecentlyUsedModels(storage);
    expect(recents).toContain(keyFor(provId, b.id));
    const creds = await getProvidersWithCredentials(storage);
    expect(creds).toContain(provId);
  });

  it.skip('deletes provider and selects next available model', async () => {
    const storage = new MemoryStorageAdapter('test-5');
    const registry = new ProviderRegistry(undefined);

    const p1 = createProviderId('p1');
    const p2 = createProviderId('p2');
    const p1m1 = makeModel('m1', 'M1', true);
    const p1m2 = makeModel('m2', 'M2');
    const p2n1 = makeModel('n1', 'N1', true);
    const p2n2 = makeModel('n2', 'N2');
    registry.register(new FakeProvider(p1, 'P1', [p1m1, p1m2]));
    registry.register(new FakeProvider(p2, 'P2', [p2n1, p2n2]));

    const { result } = renderHook(() => useModelsWithConfiguredProvider(storage, registry));

    // Wait until isLoadingOrError is ready
    await waitFor(() => {
      expect(result.current.isLoadingOrError.state).toBe('ready');
    });

    // Select models from both providers so both are present in state
    await act(async () => {
      await result.current.setSelectedProviderAndModel(p1, p1m1.id);
    });
    await act(async () => {
      await result.current.setSelectedProviderAndModel(p2, p2n2.id);
    });

    // p2n2 should be selected and on top
    expect(result.current.selectedModel?.provider.id).toBe(p2);
    expect(result.current.recentlyUsedModels[0]?.key).toBe(keyFor(p2, p2n2.id));

    // Now delete provider p2
    await act(async () => {
      result.current.deleteProvider(p2);
    });

    // All p2 entries removed, selection falls back to p1 (its recent)
    expect(result.current.selectedModel?.provider.id).toBe(p1);
    expect(result.current.recentlyUsedModels.every((x) => x.provider.id !== p2)).toBe(true);
    expect(result.current.modelsWithCredentials.every((x) => x.provider.id !== p2)).toBe(true);
  });

  it('reinitializes when storage adapter instance changes', async () => {
    const storageA = new MemoryStorageAdapter('test-6a');
    const storageB = new MemoryStorageAdapter('test-6b');
    const registry = new ProviderRegistry(undefined);

    const provId = createProviderId('swap');
    const m1 = makeModel('swap-a', 'Swap A', true);
    const m2 = makeModel('swap-b', 'Swap B');
    registry.register(new FakeProvider(provId, 'Swap Provider', [m1, m2]));

    await addProviderWithCredentials(storageA, provId);
    await addRecentlyUsedModel(storageA, keyFor(provId, m1.id));

    await addProviderWithCredentials(storageB, provId);
    await addRecentlyUsedModel(storageB, keyFor(provId, m2.id));

    const { result, rerender } = renderHook(
      ({ storage }) => useModelsWithConfiguredProvider(storage, registry),
      { initialProps: { storage: storageA } }
    );

    await waitFor(() => {
      expect(result.current.isLoadingOrError.state).toBe('ready');
      expect(result.current.recentlyUsedModels[0]?.model.id).toBe(m1.id);
    });

    rerender({ storage: storageB });

    await waitFor(() => {
      expect(result.current.isLoadingOrError.state).toBe('ready');
      expect(result.current.recentlyUsedModels[0]?.model.id).toBe(m2.id);
    });
  });
});

describe('useModelsWithConfiguredProvider lifecycle', () => {
  it.skip('initializes internal catalog once per dependency change and swaps instances for new storage', async () => {
    const initSpy = vi.spyOn(ModelCatalog.prototype, 'initialize');
    const registry = new ProviderRegistry(undefined);
    const storageA = new MemoryStorageAdapter('lifecycle-internal-a');

    const { rerender, result } = renderHook(
      ({ storage, reg }: { storage: MemoryStorageAdapter; reg: ProviderRegistry }) =>
        useModelsWithConfiguredProvider(storage, reg, { prefetch: false }),
      { initialProps: { storage: storageA, reg: registry } }
    );

    try {
      await waitFor(() => expect(result.current.isLoadingOrError.state).toBe('ready'));
      await waitFor(() => expect(initSpy).toHaveBeenCalledTimes(1));
      const firstInstance = initSpy.mock.instances[0];

      rerender({ storage: storageA, reg: registry });
      await waitFor(() => expect(result.current.isLoadingOrError.state).toBe('ready'));
      expect(initSpy).toHaveBeenCalledTimes(1);

      const storageB = new MemoryStorageAdapter('lifecycle-internal-b');
      rerender({ storage: storageB, reg: registry });
      await waitFor(() => expect(initSpy).toHaveBeenCalledTimes(2));
      const secondInstance = initSpy.mock.instances[1];
      expect(secondInstance).not.toBe(firstInstance);

      rerender({ storage: storageB, reg: registry });
      await waitFor(() => expect(result.current.isLoadingOrError.state).toBe('ready'));
      expect(initSpy).toHaveBeenCalledTimes(2);
    } finally {
      initSpy.mockRestore();
    }
  });

  it('avoids initializing when supplied an external catalog instance', async () => {
    const registry = new ProviderRegistry(undefined);
    const storage = new MemoryStorageAdapter('lifecycle-external-storage');
    const modelStorage = new MemoryStorageAdapter('lifecycle-external-model');
    const externalCatalog = new ModelCatalog(registry, modelStorage);
    await externalCatalog.initialize(false);
    const externalInitSpy = vi.spyOn(externalCatalog, 'initialize');
    externalInitSpy.mockClear();

    const { rerender, result } = renderHook(
      ({ telemetry }: { telemetry?: ModelPickerTelemetry }) =>
        useModelsWithConfiguredProvider(storage, registry, {
          prefetch: false,
          catalog: externalCatalog,
          telemetry,
        }),
      { initialProps: { telemetry: undefined } }
    );

    await waitFor(() => expect(result.current.isLoadingOrError.state).toBe('ready'));
    expect(externalInitSpy).not.toHaveBeenCalled();

    rerender({ telemetry: undefined });
    await waitFor(() => expect(result.current.isLoadingOrError.state).toBe('ready'));
    expect(externalInitSpy).not.toHaveBeenCalled();

    externalInitSpy.mockRestore();
  });

  it.skip('resets derived state during reinitialization without exposing stale selections', async () => {
    const initSpy = vi.spyOn(ModelCatalog.prototype, 'initialize');
    const storageA = new MemoryStorageAdapter('lifecycle-reset-a');
    const modelStorage = new MemoryStorageAdapter('lifecycle-reset-model');
    const registry = new ProviderRegistry(undefined);
    const pid = createProviderId('reset-prov');
    const defaultModel = makeModel('default', 'Default', true);
    const altModel = makeModel('alt', 'Alt');
    registry.register(new FakeProvider(pid, 'Reset Provider', [defaultModel, altModel]));
    await addProviderWithCredentials(storageA, pid);

    const statusLog: Array<'loading' | 'ready' | 'error'> = [];
    const { result, rerender } = renderHook(
      ({ storage }: { storage: MemoryStorageAdapter }) => {
        const hookResult = useModelsWithConfiguredProvider(storage, registry, {
          prefetch: false,
          modelStorage,
        });
        useEffect(() => {
          statusLog.push(hookResult.isLoadingOrError.state);
        }, [hookResult.isLoadingOrError.state]);
        return hookResult;
      },
      { initialProps: { storage: storageA } }
    );

    try {
      await waitFor(() => {
        expect(statusLog).toContain('ready');
      });
      expect(statusLog[0]).toBe('loading');
      expect(statusLog.indexOf('ready')).toBeGreaterThan(0);

      await waitFor(() => result.current.modelsWithCredentials.length > 0);
      await act(async () => {
        await result.current.setSelectedProviderAndModel(pid, altModel.id);
      });
      await waitFor(() => result.current.selectedModel?.model.id === altModel.id);
      expect(result.current.recentlyUsedModels[0]?.model.id).toBe(altModel.id);

      const storageB = new MemoryStorageAdapter('lifecycle-reset-b');
      act(() => {
        rerender({ storage: storageB });
      });

      await waitFor(() => statusLog[statusLog.length - 1] === 'loading');
      expect(result.current.selectedModel).toBeUndefined();
      expect(result.current.recentlyUsedModels).toEqual([]);
      expect(result.current.modelsWithCredentials).toEqual([]);

      await waitFor(() => {
        expect(statusLog.at(-2)).toBe('loading');
        expect(statusLog.at(-1)).toBe('ready');
      });
      expect(result.current.isLoadingOrError.state).toBe('ready');
      expect(result.current.selectedModel).toBeUndefined();

      await waitFor(() => expect(initSpy).toHaveBeenCalledTimes(2));
    } finally {
      initSpy.mockRestore();
    }
  });
});
