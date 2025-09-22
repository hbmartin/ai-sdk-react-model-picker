import { useCallback, useRef } from 'react';
import { ModelCatalog } from '../catalog/ModelCatalog';
import type {
  IProviderRegistry,
  StorageAdapter,
} from '../types';
import type { ModelPickerTelemetry } from '../telemetry';

interface CatalogState {
  catalog: ModelCatalog;
  storage: StorageAdapter;
  modelStorage: StorageAdapter;
  providerRegistry: IProviderRegistry;
}

export interface UseCatalogControllerOptions {
  telemetry?: ModelPickerTelemetry;
  modelStorage?: StorageAdapter;
  catalog?: ModelCatalog;
}

export interface CatalogController {
  catalog?: ModelCatalog;
  ownsCatalog: boolean;
  consumePendingInitialization(): boolean;
}

export function useCatalogController(
  storage: StorageAdapter,
  providerRegistry: IProviderRegistry,
  options: UseCatalogControllerOptions
): CatalogController {
  const catalogStateRef = useRef<CatalogState | undefined>(undefined);
  const pendingInitializationRef = useRef<'internal' | undefined>(undefined);

  const manageCatalog = options.catalog === undefined;
  const modelStorageAdapter = options.modelStorage ?? storage;

  if (manageCatalog) {
    const current = catalogStateRef.current;
    const needsNew =
      current === undefined ||
      current.storage !== storage ||
      current.modelStorage !== modelStorageAdapter ||
      current.providerRegistry !== providerRegistry;
    if (needsNew) {
      const catalog = new ModelCatalog(
        providerRegistry,
        storage,
        modelStorageAdapter,
        options.telemetry
      );
      catalogStateRef.current = {
        catalog,
        storage,
        modelStorage: modelStorageAdapter,
        providerRegistry,
      };
      pendingInitializationRef.current = 'internal';
    }
  } else {
    catalogStateRef.current = undefined;
    pendingInitializationRef.current = undefined;
  }

  const catalog = manageCatalog ? catalogStateRef.current?.catalog : options.catalog;
  catalog?.setTelemetry(options.telemetry);

  const consumePendingInitialization = useCallback(() => {
    const token = pendingInitializationRef.current;
    pendingInitializationRef.current = undefined;
    return token === 'internal';
  }, []);

  return {
    catalog,
    ownsCatalog: manageCatalog,
    consumePendingInitialization,
  };
}

