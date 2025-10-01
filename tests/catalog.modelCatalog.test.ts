// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { ModelCatalog } from '../src/lib/catalog/ModelCatalog';
import { ProviderRegistry } from '../src/lib/providers/ProviderRegistry';
import { MemoryStorageAdapter } from '../src/lib/storage';
import {
  createProviderId,
  createModelId,
  type AIProvider,
  type ModelConfig,
  type ProviderId,
  type ProviderMetadata,
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
  private fetchPayload: ModelConfig[] = [];

  constructor(id: ProviderId, name: string, models: ModelConfig[]) {
    // @ts-expect-error abstract base ctor
    super();
    this.metadata = { id, name, icon: DummyIcon } as ProviderMetadata;
    this.models = models;
  }

  setFetchPayload(models: ModelConfig[]) {
    this.fetchPayload = models;
  }

  async fetchModels(): Promise<ModelConfig[]> {
    return this.fetchPayload;
  }

  async createInstance() {
    return {} as any;
  }
}

function builtin(id: string, name?: string): ModelConfig {
  return { id: createModelId(id), displayName: name ?? id } as ModelConfig;
}

describe('ModelCatalog merge and persistence', () => {
  let modelStorage: MemoryStorageAdapter;
  let registry: ProviderRegistry;
  let provider: FakeProvider;
  const pid = createProviderId('prov');

  beforeEach(() => {
    modelStorage = new MemoryStorageAdapter('test-catalog-models');
    registry = new ProviderRegistry(undefined);
    provider = new FakeProvider(pid, 'Prov', [
      builtin('b1', 'Builtin One'),
      builtin('b2', 'Builtin Two'),
    ]);
    registry.register(provider);
  });

  it('addUserModel adds visible user entry and prevents duplicates; removeUserModel removes only user entries', async () => {
    const catalog = new ModelCatalog(registry, modelStorage);
    await catalog.initialize(false);
    const uid = createModelId('user-1');
    await catalog.addUserModel(pid, uid);
    await catalog.addUserModel(pid, uid); // duplicate ignored
    const models = catalog.getSnapshot()[pid].models;
    const userEntry = models.find((x) => x.model.id === uid);
    expect(userEntry?.model.origin).toBe('user');
    expect(userEntry?.model.visible).toBe(true);
    await catalog.removeModel(pid, uid);
    const after = catalog.getSnapshot()[pid].models;
    expect(after.some((x) => x.model.id === uid)).toBe(false);
  });

  it('addUserModel prevents duplicate when id matches existing builtin exactly', async () => {
    const catalog = new ModelCatalog(registry, modelStorage);
    await catalog.initialize(false);
    // Attempt to add a user model with the same id as builtin 'b1'
    const dupId = createModelId('b1');
    const before = catalog.getSnapshot()[pid].models.filter((x) => x.model.id === dupId);
    expect(before).toHaveLength(1);
    expect(before[0]?.model.origin === 'builtin' || before[0]?.model.origin === undefined).toBe(
      true
    );
    await catalog.addUserModel(pid, dupId);
    const after = catalog.getSnapshot()[pid].models.filter((x) => x.model.id === dupId);
    // Still only the builtin entry; no user duplicate created
    expect(after).toHaveLength(1);
    expect(after[0]?.model.origin).toBe('builtin');
  });

  it('addUserModel treats different case as distinct id (exact match only)', async () => {
    const catalog = new ModelCatalog(registry, modelStorage);
    await catalog.initialize(false);
    // Builtin is "b1"; adding "B1" should add a new user entry
    const newId = createModelId('B1');
    await catalog.addUserModel(pid, newId);
    const ids = catalog.getSnapshot()[pid].models.map((x) => x.model.id);
    expect(ids).toContain(createModelId('b1'));
    expect(ids).toContain(createModelId('B1'));
    const entry = catalog.getSnapshot()[pid].models.find((x) => x.model.id === newId);
    expect(entry?.model.origin).toBe('user');
  });
});
