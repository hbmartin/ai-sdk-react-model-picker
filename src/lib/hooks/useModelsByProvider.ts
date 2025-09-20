import { useEffect, useSyncExternalStore } from 'react';
import type { ProviderId, ProviderModelsStatus } from '../types';
import type { ModelCatalog } from '../catalog/ModelCatalog';

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

  return Object.fromEntries(
    Object.entries(map).map(([key, status]) => [
      key,
      {
        ...status,
        refresh: () => void catalog.refresh(key as ProviderId),
      },
    ])
  ) as Record<ProviderId, ProviderModelsStatus & { refresh: () => void }>;
}
