// @vitest-environment jsdom
import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ModelCatalog } from '../src/lib/catalog/ModelCatalog';
import { useProviderModels } from '../src/lib/hooks/useProviderModels';
import { ProviderRegistry } from '../src/lib/providers/ProviderRegistry';
import { MemoryStorageAdapter } from '../src/lib/storage';
import {
  addProviderWithCredentials,
  setProviderConfiguration,
} from '../src/lib/storage/repository';
import {
  createProviderId,
  createModelId,
  type AIProvider,
  type ModelConfig,
  type ProviderId,
  type ProviderMetadata,
} from '../src/lib/types';

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
    // @ts-expect-error abstract so this is ok
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

describe('useProviderModels', () => {
  it('prefetches on mount and exposes models/status', async () => {
    const storage = new MemoryStorageAdapter('pm');
    const modelStorage = new MemoryStorageAdapter('pm2');
    const registry = new ProviderRegistry(undefined);
    const pid = createProviderId('prov');
    const provider = new FakeProvider(pid, 'Prov', [builtin('b')]);
    provider.setFetch([apiModel('m')]);
    registry.register(provider);
    await addProviderWithCredentials(storage, pid);
    await setProviderConfiguration(storage, pid, { token: 'x' });

    const catalog = new ModelCatalog(registry, storage, modelStorage);
    await catalog.initialize(false);

    const { result } = renderHook(() => useProviderModels(catalog, pid, { prefetch: true }));
    await waitFor(() => {
      expect(result.current.status).toBe('ready');
      expect(result.current.models.some((x) => x.model.id === createModelId('m'))).toBe(true);
    });
  });
});
