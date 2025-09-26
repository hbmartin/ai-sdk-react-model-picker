import {
  assertRecordStringString,
  type ProviderAndModelKey,
  type ProviderId,
  type StorageAdapter,
} from '../types';
import { getTelemetry } from '../telemetry';

type StorageGetter = Pick<StorageAdapter, 'get'>;

const RECENTLY_USED_MODELS_KEY = 'recentlyUsedModels' as const;
const PROVIDERS_WITH_CREDENTIALS_KEY = 'providersWithCredentials' as const;
const CONFIG_SUFFIX = 'config' as const;

function sortKeysByRecency<T>(obj: Record<string, string> | undefined): T[] {
  try {
    assertRecordStringString(obj);
  } catch (error) {
    getTelemetry()?.onStorageError?.('read', RECENTLY_USED_MODELS_KEY, error as Error);
    return [];
  }
  try {
    return (
      Object.entries(obj)
        // eslint-disable-next-line code-complete/enforce-meaningful-names
        .toSorted((a, b) => Number(b[1]) - Number(a[1]))
        .map(([key]) => key as T)
    );
  } catch (error) {
    getTelemetry()?.onStorageError?.('read', RECENTLY_USED_MODELS_KEY, error as Error);
    return [];
  }
}

export async function getRecentlyUsedModels(
  storage: StorageGetter
): Promise<ProviderAndModelKey[]> {
  return storage.get(RECENTLY_USED_MODELS_KEY).then(sortKeysByRecency<ProviderAndModelKey>);
}

export async function getSelectedProviderAndModelKey(
  storage: StorageGetter
): Promise<ProviderAndModelKey | undefined> {
  return getRecentlyUsedModels(storage).then((keys) => (keys.length > 0 ? keys[0] : undefined));
}

export async function addRecentlyUsedModel(
  storage: StorageAdapter,
  modelKey: ProviderAndModelKey
): Promise<void> {
  return storage.get(RECENTLY_USED_MODELS_KEY).then((existing) => {
    const base = existing ?? {};
    return storage.set(RECENTLY_USED_MODELS_KEY, {
      ...base,
      [modelKey]: Date.now().toString(),
    });
  });
}

export async function removeRecentlyUsedModels(
  storage: StorageAdapter,
  modelKeys: ProviderAndModelKey[]
): Promise<Record<string, string>> {
  const existing = await storage.get(RECENTLY_USED_MODELS_KEY);
  if (existing === undefined) {
    return {};
  }
  for (const modelKey of modelKeys) {
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete existing[modelKey];
  }
  return storage.set(RECENTLY_USED_MODELS_KEY, existing).then(() => existing);
}

export async function getProvidersWithCredentials(storage: StorageGetter): Promise<ProviderId[]> {
  return storage
    .get(PROVIDERS_WITH_CREDENTIALS_KEY)
    .then((providers) => Object.keys(providers ?? {}) as ProviderId[]);
}

export async function addProviderWithCredentials(
  storage: StorageAdapter,
  providerId: ProviderId
): Promise<void> {
  return storage.get(PROVIDERS_WITH_CREDENTIALS_KEY).then((existing) => {
    const base = existing ?? {};
    return storage.set(PROVIDERS_WITH_CREDENTIALS_KEY, {
      ...base,
      [providerId]: Date.now().toString(),
    });
  });
}

export async function deleteProviderWithCredentials(
  storage: StorageAdapter,
  providerId: ProviderId
): Promise<void> {
  return storage.get(PROVIDERS_WITH_CREDENTIALS_KEY).then((existing) => {
    if (existing === undefined) {
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete existing[providerId];
    return storage.set(PROVIDERS_WITH_CREDENTIALS_KEY, existing);
  });
}

function providerConfigKey(providerId: ProviderId): string {
  return `${providerId}:${CONFIG_SUFFIX}`;
}

export async function setProviderConfiguration(
  storage: StorageAdapter,
  providerId: ProviderId,
  configuration: Record<string, string>
): Promise<void> {
  return storage.set(providerConfigKey(providerId), configuration);
}

export async function getProviderConfiguration(
  storage: StorageAdapter,
  providerId: ProviderId
): Promise<Record<string, string> | undefined> {
  return storage.get(providerConfigKey(providerId));
}

export async function deleteProviderConfiguration(
  storage: StorageAdapter,
  providerId: ProviderId
): Promise<void> {
  return storage.remove(providerConfigKey(providerId));
}
