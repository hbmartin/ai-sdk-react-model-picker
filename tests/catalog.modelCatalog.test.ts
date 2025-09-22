// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ModelCatalog } from '../src/lib/catalog/ModelCatalog';
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

  async getModels(): Promise<ModelConfig[]> {
    return this.fetchPayload;
  }

  async createInstance() {
    return {} as any;
  }
}

function builtin(id: string, name?: string): ModelConfig {
  return { id: createModelId(id), displayName: name ?? id } as ModelConfig;
}

function apiModel(id: string, name?: string): ModelConfig {
  // API payload may omit origin/visible; catalog normalizes
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

async function flushMicrotasks(iterations = 3) {
  for (let i = 0; i < iterations; i += 1) {
    await Promise.resolve();
  }
}

describe('ModelCatalog merge and persistence', () => {
  let storage: MemoryStorageAdapter;
  let modelStorage: MemoryStorageAdapter;
  let registry: ProviderRegistry;
  let provider: FakeProvider;
  const pid = createProviderId('prov');

  beforeEach(() => {
    storage = new MemoryStorageAdapter('test-catalog');
    modelStorage = new MemoryStorageAdapter('test-catalog-models');
    registry = new ProviderRegistry(undefined);
    provider = new FakeProvider(pid, 'Prov', [
      builtin('b1', 'Builtin One'),
      builtin('b2', 'Builtin Two'),
    ]);
    registry.register(provider);
  });

  it('upserts API models and persists only api/user entries', async () => {
    await addProviderWithCredentials(storage, pid);
    await setProviderConfiguration(storage, pid, { token: 'x' });

    provider.setFetchPayload([apiModel('m1', 'API One')]);
    const catalog = new ModelCatalog(registry, storage, modelStorage);
    await catalog.initialize(false);
    await catalog.refresh(pid);

    const map = catalog.getSnapshot();
    const models = map[pid].models;
    expect(models.some((x) => x.model.id === createModelId('b1'))).toBe(true);
    expect(models.some((x) => x.model.id === createModelId('m1') && x.model.origin === 'api')).toBe(
      true
    );

    // Persisted models should contain only api/user
    const persistedRaw = await modelStorage.get(`models:${pid}`);
    expect(persistedRaw && typeof persistedRaw['__json'] === 'string').toBe(true);
    const env = JSON.parse(persistedRaw!['__json']);
    expect(env.models.every((m: ModelConfig) => m.origin === 'api' || m.origin === 'user')).toBe(
      true
    );
  });

  it('marks stale API models as invisible but keeps them persisted', async () => {
    await addProviderWithCredentials(storage, pid);
    await setProviderConfiguration(storage, pid, { token: 'x' });

    provider.setFetchPayload([apiModel('m1', 'API One'), apiModel('m2', 'API Two')]);
    const catalog = new ModelCatalog(registry, storage, modelStorage);
    await catalog.initialize(false);
    await catalog.refresh(pid);

    // Next fetch drops m2
    provider.setFetchPayload([apiModel('m1', 'API One')]);
    await catalog.refresh(pid);

    const models = catalog.getSnapshot()[pid].models;
    const m2 = models.find((x) => x.model.id === createModelId('m2'));
    expect(m2?.model.visible).toBe(false);
  });

  it('preserves discoveredAt across updates and updates updatedAt', async () => {
    await addProviderWithCredentials(storage, pid);
    await setProviderConfiguration(storage, pid, { token: 'x' });
    provider.setFetchPayload([apiModel('m1', 'API One')]);
    const catalog = new ModelCatalog(registry, storage, modelStorage);
    await catalog.initialize(false);
    await catalog.refresh(pid);
    const before = catalog
      .getSnapshot()
      [pid].models.find((x) => x.model.id === createModelId('m1'))!.model;
    expect(before.discoveredAt).toBeDefined();

    provider.setFetchPayload([apiModel('m1', 'API One')]);
    await catalog.refresh(pid);
    const after = catalog
      .getSnapshot()
      [pid].models.find((x) => x.model.id === createModelId('m1'))!.model;
    expect(after.discoveredAt).toBe(before.discoveredAt);
    expect((after.updatedAt ?? 0) >= (before.updatedAt ?? 0)).toBe(true);
  });

  it('addUserModel adds visible user entry and prevents duplicates; removeUserModel removes only user entries', async () => {
    const catalog = new ModelCatalog(registry, storage, modelStorage);
    await catalog.initialize(false);
    const uid = createModelId('user-1');
    await catalog.addUserModel(pid, uid);
    await catalog.addUserModel(pid, uid); // duplicate ignored
    const models = catalog.getSnapshot()[pid].models;
    const userEntry = models.find((x) => x.model.id === uid);
    expect(userEntry?.model.origin).toBe('user');
    expect(userEntry?.model.visible).toBe(true);
    await catalog.removeUserModel(pid, uid);
    const after = catalog.getSnapshot()[pid].models;
    expect(after.some((x) => x.model.id === uid)).toBe(false);
  });

  it('addUserModel prevents duplicate when id matches existing builtin exactly', async () => {
    const catalog = new ModelCatalog(registry, storage, modelStorage);
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

  it('addUserModel prevents duplicate when id matches existing API model exactly', async () => {
    await addProviderWithCredentials(storage, pid);
    await setProviderConfiguration(storage, pid, { token: 'x' });
    provider.setFetchPayload([apiModel('dup')]);
    const catalog = new ModelCatalog(registry, storage, modelStorage);
    await catalog.initialize(false);
    await catalog.refresh(pid);

    const dupId = createModelId('dup');
    const before = catalog.getSnapshot()[pid].models.filter((x) => x.model.id === dupId);
    expect(before).toHaveLength(1);
    expect(before[0]?.model.origin).toBe('api');
    await catalog.addUserModel(pid, dupId);
    const after = catalog.getSnapshot()[pid].models.filter((x) => x.model.id === dupId);
    expect(after).toHaveLength(1);
    expect(after[0]?.model.origin).toBe('api');
  });

  it('addUserModel treats different case as distinct id (exact match only)', async () => {
    const catalog = new ModelCatalog(registry, storage, modelStorage);
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

  it('gates refresh when config is invalid and sets missing-config status', async () => {
    await addProviderWithCredentials(storage, pid);
    // No configuration set => invalid
    const catalog = new ModelCatalog(registry, storage, modelStorage);
    await catalog.initialize(false);
    await catalog.refresh(pid);
    const status = catalog.getSnapshot()[pid].status;
    expect(status === 'missing-config' || status === 'idle').toBe(true);
  });

  it('initialize with prefetch refreshes providers with credentials if config valid', async () => {
    await addProviderWithCredentials(storage, pid);
    await setProviderConfiguration(storage, pid, { token: 'x' });
    provider.setFetchPayload([apiModel('m1')]);
    const catalog = new ModelCatalog(registry, storage, modelStorage);
    await catalog.initialize(true);
    const snap = catalog.getSnapshot();
    expect(snap[pid].status).toBe('ready');
    expect(snap[pid].models.some((x) => x.model.id === createModelId('m1'))).toBe(true);
  });

  it('prevents overlapping refresh sequences for the same provider', async () => {
    await addProviderWithCredentials(storage, pid);
    await setProviderConfiguration(storage, pid, { token: 'x' });

    const catalog = new ModelCatalog(registry, storage, modelStorage);
    await catalog.initialize(false);

    const deferred = createDeferred<ModelConfig[]>();
    const getModelsSpy = vi.fn(() => deferred.promise);
    (provider as any).getModels = getModelsSpy;

    const first = catalog.refresh(pid);
    const second = catalog.refresh(pid);

    await second;

    deferred.resolve([apiModel('latest')]);
    await first;

    expect(getModelsSpy).toHaveBeenCalledTimes(1);

    const snapshot = catalog.getSnapshot();
    expect(snapshot[pid].status).toBe('ready');
    expect(snapshot[pid].models.some((entry) => entry.model.id === createModelId('latest'))).toBe(
      true
    );
  });

  it('exposes refresh pending state while fetch is in flight', async () => {
    await addProviderWithCredentials(storage, pid);
    await setProviderConfiguration(storage, pid, { token: 'x' });

    const catalog = new ModelCatalog(registry, storage, modelStorage);
    await catalog.initialize(false);

    const deferred = createDeferred<ModelConfig[]>();
    const getModelsSpy = vi.fn(() => deferred.promise);
    (provider as any).getModels = getModelsSpy;

    const refreshPromise = catalog.refresh(pid);

    await new Promise((resolve) => setTimeout(resolve, 0));

    const pendingState = catalog.getProviderState(pid);
    expect(pendingState?.pending?.refresh).toBe(true);

    deferred.resolve([apiModel('new-model')]);
    await refreshPromise;

    const finalState = catalog.getProviderState(pid);
    expect(finalState?.pending?.refresh).toBeUndefined();
  });

  it('adds newly registered providers to the snapshot with builtin models', async () => {
    const catalog = new ModelCatalog(registry, storage, modelStorage);
    await catalog.initialize(false);

    const newPid = createProviderId('late');
    const lateProvider = new FakeProvider(newPid, 'Late', [
      builtin('late-default', 'Late Default'),
    ]);
    registry.register(lateProvider);

    catalog.getSnapshot();
    await flushMicrotasks();
    const snapshot = catalog.getSnapshot();
    expect(snapshot[newPid]).toBeDefined();
    expect(snapshot[newPid].models.some((m) => m.model.id === createModelId('late-default'))).toBe(
      true
    );
  });

  it('updates provider signature after recomputing snapshot without duplicate notifications', async () => {
    const catalog = new ModelCatalog(registry, storage, modelStorage);
    await catalog.initialize(false);

    const newPid = createProviderId('signature-check');
    const lateProvider = new FakeProvider(newPid, 'Signature Check', [
      builtin('sig-builtin', 'Signature Builtin'),
    ]);
    registry.register(lateProvider);

    const notifications: number[] = [];
    const unsubscribe = catalog.subscribe(() => {
      notifications.push(Date.now());
    });

    catalog.getSnapshot();
    await flushMicrotasks();
    expect(notifications.length).toBe(1);

    notifications.length = 0;
    catalog.getSnapshot();
    await flushMicrotasks();
    expect(notifications.length).toBe(0);

    unsubscribe();

    const snapshot = catalog.getSnapshot();
    expect(snapshot[newPid]).toBeDefined();
  });

  it('processes rapid provider registrations without starving pending updates', async () => {
    const catalog = new ModelCatalog(registry, storage, modelStorage);
    await catalog.initialize(false);

    const initialSnapshot = catalog.getSnapshot();
    const initialKeys = Object.keys(initialSnapshot).sort();

    const emissions: string[] = [];
    const unsubscribe = catalog.subscribe(() => {
      const snapshot = catalog.getSnapshot();
      emissions.push(Object.keys(snapshot).sort().join('|'));
    });

    const additions: ProviderId[] = [];
    for (let i = 0; i < 6; i += 1) {
      const newPid = createProviderId(`rapid-${i}`);
      additions.push(newPid);
      const provider = new FakeProvider(newPid, `Rapid ${i}`, [builtin(`rapid-model-${i}`)]);
      registry.register(provider);
      catalog.getSnapshot();
    }

    await flushMicrotasks(additions.length + 1);

    const finalSnapshot = catalog.getSnapshot();
    const expectedKeys = [...initialKeys, ...additions.map((pid) => pid)].sort();
    expect(Object.keys(finalSnapshot).sort()).toEqual(expectedKeys);
    expect(emissions.length).toBeGreaterThanOrEqual(1);
    expect(emissions.at(-1)).toBe(expectedKeys.join('|'));

    unsubscribe();
  });
});
