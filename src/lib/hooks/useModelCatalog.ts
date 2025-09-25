import { useEffect, useMemo, useRef, useSyncExternalStore } from 'react';
import { ModelCatalog } from '../catalog/ModelCatalog';
import type {
  IProviderRegistry,
  ModelId,
  ProviderId,
  ProviderModelsStatus,
  StorageAdapter,
} from '../types';
import type { ModelPickerTelemetry } from '../telemetry';

export interface UseModelCatalogOptions {
  storage: StorageAdapter;
  providerRegistry: IProviderRegistry;
  modelStorage?: StorageAdapter;
  telemetry?: ModelPickerTelemetry;
  catalog?: ModelCatalog;
}

export interface UseModelCatalogResult {
  catalog: ModelCatalog;
  snapshot: Record<ProviderId, ProviderModelsStatus>;
  ownsCatalog: boolean;
  revision: number;
  consumePendingInitialization(): boolean;
  refresh(providerId: ProviderId, opts?: { force?: boolean }): void;
  refreshAll(): void;
  addUserModel(providerId: ProviderId, modelId: ModelId): Promise<void>;
  removeUserModel(providerId: ProviderId, modelId: ModelId): Promise<void>;
}

interface InternalCatalogState {
  catalog: ModelCatalog;
  storage: StorageAdapter;
  modelStorage: StorageAdapter;
  providerRegistry: IProviderRegistry;
}

export function useModelCatalog({
  storage,
  providerRegistry,
  modelStorage,
  telemetry,
  catalog: externalCatalog,
}: UseModelCatalogOptions): UseModelCatalogResult {
  const catalogStateRef = useRef<InternalCatalogState>();
  const shouldInitializeRef = useRef(false);
  const revisionRef = useRef(0);

  const resolvedModelStorage = modelStorage ?? storage;
  const managesCatalog = externalCatalog === undefined;

  if (managesCatalog) {
    const current = catalogStateRef.current;
    const needsNew =
      current === undefined ||
      current.storage !== storage ||
      current.modelStorage !== resolvedModelStorage ||
      current.providerRegistry !== providerRegistry;
    if (needsNew) {
      const catalog = new ModelCatalog(
        providerRegistry,
        storage,
        resolvedModelStorage,
        telemetry
      );
      catalogStateRef.current = {
        catalog,
        storage,
        modelStorage: resolvedModelStorage,
        providerRegistry,
      };
      shouldInitializeRef.current = true;
      revisionRef.current += 1;
    }
  } else {
    catalogStateRef.current = undefined;
    shouldInitializeRef.current = false;
  }

  const catalog = managesCatalog ? catalogStateRef.current?.catalog : externalCatalog;

  if (!catalog) {
    throw new Error('useModelCatalog could not resolve a ModelCatalog instance');
  }

  useEffect(() => {
    catalog.setTelemetry(telemetry);
  }, [catalog, telemetry]);

  const snapshot = useSyncExternalStore(
    (listener) => catalog.subscribe(listener),
    () => catalog.getSnapshot(),
    () => catalog.getSnapshot()
  );

  const consumePendingInitialization = useMemo(() => {
    if (!managesCatalog) {
      return () => false;
    }
    return () => {
      if (!shouldInitializeRef.current) {
        return false;
      }
      shouldInitializeRef.current = false;
      return true;
    };
  }, [managesCatalog]);

  const actions = useMemo(
    () => ({
      refresh(providerId: ProviderId, opts?: { force?: boolean }) {
        void catalog.refresh(providerId, opts);
      },
      refreshAll() {
        void catalog.refreshAll();
      },
      addUserModel(providerId: ProviderId, modelId: ModelId) {
        return catalog.addUserModel(providerId, modelId);
      },
      removeUserModel(providerId: ProviderId, modelId: ModelId) {
        return catalog.removeUserModel(providerId, modelId);
      },
    }),
    [catalog]
  );

  return {
    catalog,
    snapshot,
    ownsCatalog: managesCatalog,
    revision: revisionRef.current,
    consumePendingInitialization,
    ...actions,
  };
}
