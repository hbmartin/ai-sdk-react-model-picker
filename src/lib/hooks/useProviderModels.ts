import { useEffect, useMemo, useSyncExternalStore } from 'react';
import type { ProviderId, ProviderModelsStatus } from '../types';
import type { ModelCatalog } from '../catalog/ModelCatalog';

export function useProviderModels(
  catalog: ModelCatalog,
  providerId: ProviderId,
  options?: { prefetch?: boolean }
): ProviderModelsStatus & { refresh: () => void } {
  const subscribe = (onStoreChange: () => void) => catalog.subscribe(onStoreChange);
  const getSnapshot = () => catalog.getSnapshot();
  const map = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  useEffect(() => {
    if (options?.prefetch === true) {
      void catalog.refresh(providerId).catch(() => undefined);
    }
  }, [catalog, providerId, options?.prefetch]);

  const value = useMemo<ProviderModelsStatus>(
    () => map[providerId] ?? ({ models: [], status: 'idle' } as ProviderModelsStatus),
    [map, providerId]
  );
  return {
    ...value,
    refresh: () => void catalog.refresh(providerId),
  };
}
