import { describe, it, expect } from 'vitest';
import {
  sortAvailableModels,
  filterModelsByCredentialsAndRecentlyUsed,
} from '../src/lib/hooks/catalogUtils';
import {
  createProviderId,
  createModelId,
  providerAndModelKey,
  type CatalogEntry,
  type ProviderId,
  type ProviderModelsStatus,
} from '../src/lib/types';

const DummyIcon = (() => null) as any;

function mp(
  providerName: string,
  modelName: string,
  discoveredAt?: number,
  visible = true
): CatalogEntry {
  const providerId = createProviderId(providerName);
  const model = {
    id: createModelId(modelName),
    displayName: modelName,
    origin: 'api',
    visible,
    discoveredAt,
  };
  const provider = { id: providerId, name: providerName, icon: DummyIcon };
  return {
    provider: { id: providerId, name: providerName, icon: DummyIcon },
    model,
    key: providerAndModelKey({ provider, model }),
  } satisfies CatalogEntry;
}

describe('sortAvailableModels', () => {
  it('filters invisible and sorts by discoveredAt desc then provider/name', () => {
    const models = [
      mp('B', 'x'),
      mp('B', 'a'),
      mp('A', 'z'),
      mp('A', 'm', 1000),
      mp('A', 'n', undefined, false),
    ];
    const out = sortAvailableModels(models).map(
      (x) => `${x.provider.name}/${x.model.displayName}`
    );
    // m has discoveredAt and should come first
    expect(out[0]).toBe('A/m');
    // remaining without discoveredAt sort by provider asc then model asc
    expect(out.slice(1)).toEqual(['A/z', 'B/a', 'B/x']);
    // invisible filtered (A/n)
    expect(out.every((s) => s !== 'A/n')).toBe(true);
  });
});

describe('filterModelsByCredentialsAndRecentlyUsed', () => {
  it('excludes recently used keys and returns keyed models', () => {
    const providerA = createProviderId('A');
    const providerB = createProviderId('B');
    const snapshot: Record<ProviderId, ProviderModelsStatus> = {
      [providerA]: { models: [mp('A', 'alpha'), mp('A', 'beta')], status: 'ready' },
      [providerB]: { models: [mp('B', 'gamma')], status: 'ready' },
    };

    const used: CatalogEntry[] = [snapshot[providerA].models[0]];
    const providersWithCreds = [providerA, providerB];

    const result = filterModelsByCredentialsAndRecentlyUsed(providersWithCreds, snapshot, used);

    expect(result.map((item) => item.key)).toEqual([
      snapshot[providerA].models[1].key,
      snapshot[providerB].models[0].key,
    ]);
  });

  it('handles providers missing from snapshot gracefully', () => {
    const providerA = createProviderId('A');
    const snapshot: Record<ProviderId, ProviderModelsStatus> = {
      [providerA]: { models: [], status: 'idle' },
    };

    const result = filterModelsByCredentialsAndRecentlyUsed(
      [createProviderId('missing')],
      snapshot,
      []
    );

    expect(result).toEqual([]);
  });
});
