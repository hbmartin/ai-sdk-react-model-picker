import { useEffect, useMemo } from 'react';
import type { ProviderId, ProviderModelsStatus } from '../types';
import { useModelCatalog } from './useModelCatalog';
import type { UseModelCatalogOptions } from './useModelCatalog';

export interface UseProviderModelsOptions extends UseModelCatalogOptions {
  prefetch?: boolean;
}

export function useProviderModels(
  providerId: ProviderId,
  options: UseProviderModelsOptions
): ProviderModelsStatus & { refresh: () => void } {
  const { prefetch, ...catalogOptions } = options;
  const { snapshot, refresh } = useModelCatalog(catalogOptions);

  useEffect(() => {
    if (prefetch === true) {
      refresh(providerId);
    }
  }, [prefetch, providerId, refresh]);

  const value = useMemo<ProviderModelsStatus>(
    () => snapshot[providerId] ?? { models: [], status: 'idle' },
    [snapshot, providerId]
  );

  return {
    ...value,
    refresh: () => refresh(providerId),
  };
}
