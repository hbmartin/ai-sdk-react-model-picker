import { useEffect, useMemo, useSyncExternalStore } from 'react';
import type { CatalogSnapshot, ModelId, ProviderId } from '../types';
import type { ModelCatalog } from '../catalog/ModelCatalog';

export interface UseModelCatalogOptions {
  catalog: ModelCatalog;
  shouldInitialize: boolean;
}

export interface UseModelCatalogResult {
  catalog: ModelCatalog;
  snapshot: CatalogSnapshot;
  refresh: (providerId: ProviderId, opts?: { force?: boolean }) => void;
  refreshAll: () => void;
  addUserModel: (providerId: ProviderId, modelId: ModelId) => Promise<void>;
  removeModel: (providerId: ProviderId, modelId: ModelId) => Promise<void>;
  removeProvider: (providerId: ProviderId) => void;
}

export function useModelCatalog({
  catalog,
  shouldInitialize,
}: UseModelCatalogOptions): UseModelCatalogResult {
  const snapshot = useSyncExternalStore(
    (listener) => catalog.subscribe(listener),
    () => catalog.getSnapshot()
  );

  useEffect(() => {
    if (shouldInitialize) {
      void catalog.initialize();
    }
  }, [shouldInitialize, catalog]);

  const actions = useMemo(
    () => ({
      refresh: (providerId: ProviderId, opts?: { force?: boolean }) =>
        void catalog.refresh(providerId, opts),
      refreshAll: () => void catalog.refreshAll(),
      addUserModel: (providerId: ProviderId, modelId: ModelId) =>
        catalog.addUserModel(providerId, modelId),
      removeProvider: (providerId: ProviderId) => catalog.removeProvider(providerId),
      removeModel: (providerId: ProviderId, modelId: ModelId) =>
        catalog.removeModel(providerId, modelId),
    }),
    [catalog]
  );

  return {
    catalog,
    snapshot,
    ...actions,
  };
}
