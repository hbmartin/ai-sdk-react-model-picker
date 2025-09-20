import { describe, it, expect } from 'vitest';
import { flattenAndSortAvailableModels } from '../src/lib/hooks/catalogUtils';
import { createProviderId, createModelId, type ModelConfigWithProvider } from '../src/lib/types';

const DummyIcon = (() => null) as any;

function mp(
  providerName: string,
  modelName: string,
  discoveredAt?: number,
  visible = true
): ModelConfigWithProvider {
  const providerId = createProviderId(providerName);
  return {
    provider: { id: providerId, name: providerName, icon: DummyIcon },
    model: {
      id: createModelId(modelName),
      displayName: modelName,
      origin: 'api',
      visible,
      discoveredAt,
    },
  } as ModelConfigWithProvider;
}

describe('flattenAndSortAvailableModels', () => {
  it('filters invisible and sorts by discoveredAt desc then provider/name', () => {
    const map = {
      [createProviderId('B')]: { models: [mp('B', 'x'), mp('B', 'a')], status: 'ready' },
      [createProviderId('A')]: {
        models: [mp('A', 'z'), mp('A', 'm', 1000), mp('A', 'n', undefined, false)],
        status: 'ready',
      },
    } as any;
    const out = flattenAndSortAvailableModels(map).map(
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
