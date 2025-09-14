import {
  assertRecordStringString,
  type ProviderAndModelKey,
  type ProviderId,
  type StorageAdapter,
} from '../types';

const RECENTLY_USED_MODELS_KEY = 'recentlyUsedModels' as const;
const PROVIDERS_WITH_CREDENTIALS_KEY = 'providersWithCredentials' as const;
const CONFIG_SUFFIX = 'config' as const;

function sortKeysByRecency<T>(obj: Record<string, string> | undefined): T[] {
  try {
    assertRecordStringString(obj);
  } catch (error) {
    console.error('Invalid storage format:', error);
    return [];
  }
  try {
    return (
      Object.entries(obj)
        // eslint-disable-next-line code-complete/enforce-meaningful-names
        .toSorted((a, b) => Number(a[1]) - Number(b[1]))
        .map(([key]) => key as T)
    );
  } catch (error) {
    console.error('Invalid value format:', error);
    return [];
  }
}

export async function getRecentlyUsedModels(
  storage: Pick<StorageAdapter, 'get'>
): Promise<ProviderAndModelKey[]> {
  return storage.get(RECENTLY_USED_MODELS_KEY).then(sortKeysByRecency<ProviderAndModelKey>);
}

export async function getSelectedProviderAndModelKey(
  storage: Pick<StorageAdapter, 'get'>
): Promise<ProviderAndModelKey | undefined> {
  return getRecentlyUsedModels(storage).then((keys) => (keys.length > 0 ? keys[0] : undefined));
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

export async function getProvidersWithCredentials(
  storage: Pick<StorageAdapter, 'get'>
): Promise<ProviderId[]> {
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

export async function setProviderConfiguration(
  storage: StorageAdapter,
  providerId: ProviderId,
  configuration: Record<string, string>
): Promise<void> {
  return storage.set(`${providerId}:${CONFIG_SUFFIX}`, configuration);
}

export async function getProviderConfiguration(
  storage: StorageAdapter,
  providerId: ProviderId
): Promise<Record<string, string> | undefined> {
  return storage.get(`${providerId}:${CONFIG_SUFFIX}`);
}
