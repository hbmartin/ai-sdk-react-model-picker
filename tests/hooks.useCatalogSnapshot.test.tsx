// @vitest-environment jsdom
import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ModelCatalog } from '../src/lib/catalog/ModelCatalog';
import { useCatalogSnapshot } from '../src/lib/hooks/useCatalogSnapshot';
import { ProviderRegistry } from '../src/lib/providers/ProviderRegistry';
import { MemoryStorageAdapter } from '../src/lib/storage';
import {
  addProviderWithCredentials,
  setProviderConfiguration,
} from '../src/lib/storage/repository';
import {
  createProviderId,
  createModelId,
  type ModelConfig,
  type ProviderId,
  type ProviderMetadata,
  type AIProvider,
} from '../src/lib/types';

const DummyIcon = (() => null) as unknown as ProviderMetadata['icon'];

function makeConfigAPI(requiredKey?: string) {
  return {
    requiresAtLeastOneOf: requiredKey ? [requiredKey] : undefined,
    fields: [],
    assertValidConfigAndRemoveEmptyKeys: () => {},
    validateConfig: (record: Record<string, string>) => {
      const ok = requiredKey
        ? typeof record[requiredKey] === 'string' && record[requiredKey].length > 0
        : true;
      return {
        ok,
        missingRequired: [],
        extraneous: [],
        fieldValidationErrors: [],
        fieldValidationWarnings: [],
        message: ok ? undefined : `Missing required: ${requiredKey}`,
      } as const;
    },
    validateField: () => undefined,
  } as const;
}

class FakeProvider extends (class {} as { new (): AIProvider }) {
  readonly metadata: ProviderMetadata;
  readonly configuration = makeConfigAPI('token');
  readonly models: ModelConfig[];
  private fetcher: () => Promise<ModelConfig[] | readonly ModelConfig[]>;

  constructor(id: ProviderId, name: string, models: ModelConfig[]) {
    // @ts-expect-error abstract base ctor
    super();
    this.metadata = { id, name, icon: DummyIcon } as ProviderMetadata;
    this.models = models;
    this.fetcher = async () => this.models;
  }

  setFetcher(fetcher: () => Promise<ModelConfig[] | readonly ModelConfig[]>) {
    this.fetcher = fetcher;
  }

  async getModels(): Promise<ModelConfig[]> {
    const payload = await this.fetcher();
    return [...payload];
  }

  async createInstance() {
    return {} as any;
  }
}

function builtin(id: string, name?: string): ModelConfig {
  return { id: createModelId(id), displayName: name ?? id } as ModelConfig;
}

function createDeferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject } as const;
}

describe('useCatalogSnapshot microtask scheduling', () => {
  it('delivers each distinct snapshot without dropping loading state or repeating identical renders', async () => {
    const storage = new MemoryStorageAdapter('snapshot-hook-storage');
    const modelStorage = new MemoryStorageAdapter('snapshot-hook-models');
    const registry = new ProviderRegistry(undefined);

    const pid = createProviderId('hook-provider');
    const builtinModel = builtin('builtin-default');
    const provider = new FakeProvider(pid, 'Hook Provider', [builtinModel]);
    registry.register(provider);

    await addProviderWithCredentials(storage, pid);
    await setProviderConfiguration(storage, pid, { token: 'secret' });

    const catalog = new ModelCatalog(registry, storage, modelStorage);
    await catalog.initialize(false);

    const snapshotSignatures: string[] = [];
    const { unmount } = renderHook(() => {
      const snap = useCatalogSnapshot(catalog);
      const providerSnap = snap[pid];
      if (providerSnap) {
        const modelsSignature = providerSnap.models
          .map((entry) => entry.model.id)
          .sort()
          .join(',');
        snapshotSignatures.push(`${providerSnap.status}|${modelsSignature}`);
      }
      return snap;
    });

    const builtinId = builtinModel.id;
    expect(snapshotSignatures).toEqual([`idle|${builtinId}`]);

    const deferred = createDeferred<ModelConfig[]>();
    provider.setFetcher(() => deferred.promise);

    let refreshPromise!: Promise<void>;
    await act(async () => {
      refreshPromise = catalog.refresh(pid);
    });

    await waitFor(() => {
      expect(snapshotSignatures.length).toBe(2);
    });
    expect(snapshotSignatures[1]).toBe(`loading|${builtinId}`);

    const apiModelId = createModelId('api-model');
    const combinedSignature = [builtinId, apiModelId].sort().join(',');

    await act(async () => {
      deferred.resolve([
        {
          id: apiModelId,
          displayName: 'API Model',
        } as ModelConfig,
      ]);
      await refreshPromise;
    });

    await waitFor(() => {
      expect(snapshotSignatures.length).toBe(4);
    });

    expect(snapshotSignatures).toEqual([
      `idle|${builtinId}`,
      `loading|${builtinId}`,
      `loading|${combinedSignature}`,
      `ready|${combinedSignature}`,
    ]);

    unmount();
  });
});
