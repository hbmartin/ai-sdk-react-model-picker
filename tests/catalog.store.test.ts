import { describe, expect, it, vi } from 'vitest';

import {
  CatalogStore,
  type CatalogState,
  type CatalogSnapshot,
  type CatalogProviderState,
} from '../src/lib/catalog/CatalogStore';
import {
  createModelId,
  createProviderId,
  type ModelConfig,
  type ProviderId,
  type ProviderMetadata,
  type ProviderModelsStatus,
  type ModelConfigWithProvider,
  type IconComponent,
} from '../src/lib/types';

const StubIcon: IconComponent = () => null;

const createProviderMetadata = (id: ProviderId, name: string): ProviderMetadata => ({
  id,
  name,
  icon: StubIcon,
});

function makeSnapshotProjector(
  metadata: Record<ProviderId, ProviderMetadata>
): (state: CatalogState) => CatalogSnapshot {
  return (state: CatalogState): CatalogSnapshot => {
    const entries: [ProviderId, ProviderModelsStatus][] = [];
    for (const [rawId, providerState] of Object.entries(state.providers)) {
      const providerId = rawId as ProviderId;
      const providerMeta = metadata[providerId] ?? createProviderMetadata(providerId, rawId);
      const models: ModelConfigWithProvider[] = Object.values(providerState.models).map((model) => ({
        model,
        provider: providerMeta,
      }));
      const status: ProviderModelsStatus = {
        status: providerState.status,
        models,
      };
      if (providerState.error !== undefined) {
        status.error = providerState.error;
      }
      entries.push([providerId, status]);
    }
    return Object.fromEntries(entries) as CatalogSnapshot;
  };
}

const baseModel = (id: string, displayName?: string): ModelConfig => ({
  id: createModelId(id),
  displayName: displayName ?? id,
});

const seedProviderState = (status: CatalogProviderState['status']): CatalogProviderState => ({
  status,
  models: {},
});

describe('CatalogStore', () => {
  const providerA = createProviderId('provider-a');
  const providerB = createProviderId('provider-b');

  const metadata = {
    [providerA]: createProviderMetadata(providerA, 'Provider A'),
    [providerB]: createProviderMetadata(providerB, 'Provider B'),
  } as Record<ProviderId, ProviderMetadata>;

  const projector = makeSnapshotProjector(metadata);

  it('notifies listeners when state changes and recomputes snapshot', () => {
    const initialState: CatalogState = {
      providers: {
        [providerA]: {
          ...seedProviderState('idle'),
          models: {
            [createModelId('model-1')]: baseModel('model-1', 'Model One'),
          },
        },
      },
    };

    const store = new CatalogStore(initialState, projector);
    const listener = vi.fn();
    store.subscribe(listener);

    const nextState: CatalogState = {
      providers: {
        ...initialState.providers,
        [providerA]: {
          ...initialState.providers[providerA],
          status: 'ready',
          models: {
            ...initialState.providers[providerA].models,
            [createModelId('model-2')]: baseModel('model-2', 'Model Two'),
          },
        },
      },
    };

    store.setState(nextState);

    expect(listener).toHaveBeenCalledTimes(1);
    const snapshot = store.getSnapshot();
    expect(snapshot[providerA].status).toBe('ready');
    expect(snapshot[providerA].models).toHaveLength(2);
  });

  it('skips notifications when updater returns existing state reference', () => {
    const initialState: CatalogState = {
      providers: {
        [providerA]: seedProviderState('idle'),
      },
    };
    const store = new CatalogStore(initialState, projector);
    const listener = vi.fn();
    store.subscribe(listener);

    store.updateState((state) => state);

    expect(listener).not.toHaveBeenCalled();
  });

  it('allows projector to be replaced and recomputes snapshot', () => {
    const initialState: CatalogState = {
      providers: {
        [providerA]: {
          ...seedProviderState('ready'),
          models: {
            [createModelId('model-1')]: baseModel('model-1'),
          },
        },
      },
    };

    const store = new CatalogStore(initialState, projector);
    const listener = vi.fn();
    store.subscribe(listener);

    const newMetadata = {
      ...metadata,
      [providerA]: createProviderMetadata(providerA, 'Updated Provider'),
    } as Record<ProviderId, ProviderMetadata>;

    store.setSnapshotProjector(makeSnapshotProjector(newMetadata));

    expect(listener).toHaveBeenCalledTimes(1);
    expect(store.getSnapshot()[providerA].models[0].provider.name).toBe('Updated Provider');
  });

  it('recomputes snapshot on demand', () => {
    const initialState: CatalogState = {
      providers: {
        [providerB]: seedProviderState('idle'),
      },
    };
    const store = new CatalogStore(initialState, projector);
    const listener = vi.fn();
    store.subscribe(listener);

    store.recomputeSnapshot();

    expect(listener).toHaveBeenCalledTimes(1);
    expect(store.getSnapshot()[providerB].status).toBe('idle');
  });
});

