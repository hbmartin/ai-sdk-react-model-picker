import { useEffect } from 'react';
import type { ProviderId, ProviderModelsStatus } from '../types';
import { useCatalogSnapshot } from './useCatalogSnapshot';
import type { ModelCatalog } from '../catalog/ModelCatalog';

export function useModelsByProvider(
  catalog: ModelCatalog,
  options?: { prefetch?: boolean }
): Record<ProviderId, ProviderModelsStatus & { refresh: () => void }> {
  const map = useCatalogSnapshot(catalog);

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
