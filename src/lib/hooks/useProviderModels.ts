import { useEffect, useMemo } from 'react';
import { useSyncExternalStore } from 'react';
import type { ProviderId, ProviderModelsStatus } from '../types';
import { ModelCatalog } from '../catalog/ModelCatalog';

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [catalog, providerId, options?.prefetch]);

  const value = useMemo(() => map[providerId], [map, providerId]);

  return {
    ...value,
    refresh: () => void catalog.refresh(providerId),
  };
}

