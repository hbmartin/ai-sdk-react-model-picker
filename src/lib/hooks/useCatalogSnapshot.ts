import { useCallback, useSyncExternalStore } from 'react';
import type { ProviderId, ProviderModelsStatus } from '../types';
import type { ModelCatalog } from '../catalog/ModelCatalog';

export function useCatalogSnapshot(
  catalog: ModelCatalog
): Record<ProviderId, ProviderModelsStatus> {
  const subscribe = useCallback(
    (onStoreChange: () => void) => catalog.subscribe(onStoreChange),
    [catalog]
  );
  const getSnapshot = useCallback(() => catalog.getSnapshot(), [catalog]);
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
