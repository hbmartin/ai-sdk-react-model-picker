import { describe, expect, it, beforeEach } from 'vitest';
import { MemoryStorageAdapter } from '../src/lib/storage';
import {
  addRecentlyUsedModel,
  getRecentlyUsedModels,
  addProviderWithCredentials,
  getProvidersWithCredentials,
} from '../src/lib/storage/repository';
import { createProviderId, createModelId, type ProviderAndModelKey } from '../src/lib/types';

describe('Storage repository versioning and behavior', () => {
  let storage: MemoryStorageAdapter;

  beforeEach(() => {
    storage = new MemoryStorageAdapter('test');
  });

  it('writes and reads versioned recently used models', async () => {
    const key = `${createProviderId('openai')}/${createModelId('gpt-5')}` as ProviderAndModelKey;
    await addRecentlyUsedModel(storage, key);

    const raw = await storage.get('recentlyUsedModels');
    expect(raw).toBeDefined();
    // @ts-expect-error Versioned payload intentionally uses special field
    expect(raw.__version).toBe(1);

    const recents = await getRecentlyUsedModels(storage);
    expect(recents).toContain(key);
  });

  it('is backward-compatible with legacy plain record format', async () => {
    const key1 = `${createProviderId('openai')}/${createModelId('gpt-5')}` as ProviderAndModelKey;
    const key2 = `${createProviderId('anthropic')}/${createModelId('claude')}` as ProviderAndModelKey;

    // Simulate legacy format
    await storage.set('recentlyUsedModels', { [key2]: '100' });
    await addRecentlyUsedModel(storage, key1);

    const recents = await getRecentlyUsedModels(storage);
    expect(recents).toContain(key1);
    expect(recents).toContain(key2);
  });

  it('tracks providers with credentials with versioned payload', async () => {
    const openai = createProviderId('openai');
    await addProviderWithCredentials(storage, openai);
    const providers = await getProvidersWithCredentials(storage);
    expect(providers).toContain(openai);

    const raw = await storage.get('providersWithCredentials');
    expect(raw).toBeDefined();
    // @ts-expect-error Versioned payload intentionally uses special field
    expect(raw.__version).toBe(1);
  });
});

