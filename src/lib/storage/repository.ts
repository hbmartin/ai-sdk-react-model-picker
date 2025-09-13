import {
  assertRecordStringString,
  type ProviderAndModelKey,
  type ProviderId,
  type StorageAdapter,
} from '../types';

const RECENTLY_USED_MODELS_KEY = 'recentlyUsedModels' as const;
const PROVIDERS_WITH_CREDENTIALS_KEY = 'providersWithCredentials' as const;

function reverseSortKeysByValue<T>(obj: Record<string, string> | undefined): T[] {
  try {
    assertRecordStringString(obj);
  } catch (error) {
    console.error('Invalid storage format:', error);
    return [];
  }
  return (
    Object.entries(obj)
      // eslint-disable-next-line code-complete/enforce-meaningful-names
      .toSorted((a, b) => a[1].localeCompare(b[1]))
      .map(([key]) => key as T)
  );
}

export async function getRecentlyUsedModels(
  storage: StorageAdapter
): Promise<ProviderAndModelKey[]> {
  return storage.get(RECENTLY_USED_MODELS_KEY).then(reverseSortKeysByValue<ProviderAndModelKey>);
}

export async function addRecentlyUsedModel(
  storage: StorageAdapter,
  modelKey: ProviderAndModelKey
): Promise<void> {
  return storage.get(RECENTLY_USED_MODELS_KEY).then((existing) => {
    return storage.set(RECENTLY_USED_MODELS_KEY, {
      ...existing,
      [modelKey]: Date.now().toString(),
    });
  });
}

export async function getProvidersWithCredentials(storage: StorageAdapter): Promise<ProviderId[]> {
  return storage
    .get(PROVIDERS_WITH_CREDENTIALS_KEY)
    .then((providers) => Object.keys(providers ?? {}) as ProviderId[]);
}

export async function addProviderWithCredentials(
  storage: StorageAdapter,
  providerId: ProviderId
): Promise<void> {
  return storage.get(PROVIDERS_WITH_CREDENTIALS_KEY).then((existing) => {
    return storage.set(PROVIDERS_WITH_CREDENTIALS_KEY, {
      ...existing,
      [providerId]: Date.now().toString(),
    });
  });
}
