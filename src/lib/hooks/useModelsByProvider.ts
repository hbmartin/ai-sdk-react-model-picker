import { useEffect } from 'react';
import { useSyncExternalStore } from 'react';
import type { ProviderId, ProviderModelsStatus } from '../types';
import { ModelCatalog } from '../catalog/ModelCatalog';

export function useModelsByProvider(
  catalog: ModelCatalog,
  options?: { prefetch?: boolean }
): Record<ProviderId, ProviderModelsStatus & { refresh: () => void }> {
  const subscribe = (onStoreChange: () => void) => catalog.subscribe(onStoreChange);
  const getSnapshot = () => catalog.getSnapshot();
  const map = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  useEffect(() => {
    if (options?.prefetch === true) {
      void catalog.refreshAll().catch(() => undefined);
    }
  }, [catalog, options?.prefetch]);

  const out: Record<ProviderId, ProviderModelsStatus & { refresh: () => void }> = {} as any;
  for (const key of Object.keys(map) as ProviderId[]) {
    Object.assign(out, {
      [key]: {
        ...map[key],
        refresh: () => void catalog.refresh(key),
      },
    });
  }
  return out;
}

