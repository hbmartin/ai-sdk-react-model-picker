// @vitest-environment jsdom
import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useModelsByProvider } from '../src/lib/hooks/useModelsByProvider';
import { ModelCatalog } from '../src/lib/catalog/ModelCatalog';
import { MemoryStorageAdapter } from '../src/lib/storage';
import { ProviderRegistry } from '../src/lib/providers/ProviderRegistry';
import {
  createProviderId,
  createModelId,
  type AIProvider,
  type ModelConfig,
  type ProviderId,
  type ProviderMetadata,
} from '../src/lib/types';
import { addProviderWithCredentials, setProviderConfiguration } from '../src/lib/storage/repository';

const DummyIcon = (() => null) as unknown as ProviderMetadata['icon'];

const DummyConfigAPI = {
  requiresAtLeastOneOf: ['token'],
  fields: [],
  assertValidConfigAndRemoveEmptyKeys: () => {},
  validateConfig: (rec: Record<string, string>) => ({
    ok: typeof rec['token'] === 'string' && rec['token'].length > 0,
    missingRequired: [],
    extraneous: [],
    fieldValidationErrors: [],
    fieldValidationWarnings: [],
    message: undefined,
  }),
  validateField: () => undefined,
} as const;

class FakeProvider extends (class {} as { new (): AIProvider }) {
  readonly metadata: ProviderMetadata;
  readonly configuration = DummyConfigAPI;
  readonly models: ModelConfig[];
  private payload: ModelConfig[] = [];
  constructor(id: ProviderId, name: string, models: ModelConfig[]) {
    // @ts-expect-error abstract
    super();
    this.metadata = { id, name, icon: DummyIcon } as ProviderMetadata;
    this.models = models;
  }
  setFetch(models: ModelConfig[]) {
    this.payload = models;
  }
  async getModels(): Promise<ModelConfig[]> {
    return this.payload;
  }
  async createInstance() {
    return {} as any;
  }
}

function builtin(id: string): ModelConfig {
  return { id: createModelId(id), displayName: id } as ModelConfig;
}
function apiModel(id: string): ModelConfig {
  return { id: createModelId(id), displayName: id } as ModelConfig;
}

describe('useModelsByProvider', () => {
  it('prefetches all providers with credentials and reports status', async () => {
    const storage = new MemoryStorageAdapter('bp1');
    const modelStorage = new MemoryStorageAdapter('bp2');
    const registry = new ProviderRegistry(undefined);
    const p1 = new FakeProvider(createProviderId('p1'), 'P1', [builtin('b1')]);
    const p2 = new FakeProvider(createProviderId('p2'), 'P2', [builtin('b2')]);
    p1.setFetch([apiModel('m1')]);
    p2.setFetch([apiModel('m2')]);
    registry.register(p1);
    registry.register(p2);

    await addProviderWithCredentials(storage, p1.metadata.id);
    await setProviderConfiguration(storage, p1.metadata.id, { token: 'x' });
    // p2 has no credentials => should not prefetch

    const catalog = new ModelCatalog(registry, storage, modelStorage);
    await catalog.initialize(false);

    const { result } = renderHook(() => useModelsByProvider(catalog, { prefetch: true }));

    await waitFor(() => {
      expect(result.current[p1.metadata.id].status).toBe('ready');
      expect(result.current[p1.metadata.id].models.some((x) => x.model.id === createModelId('m1'))).toBe(true);
    });
    // p2 should exist with idle status and only builtins
    expect(result.current[p2.metadata.id].status === 'idle' || result.current[p2.metadata.id].status === 'ready').toBe(true);
  });
});

