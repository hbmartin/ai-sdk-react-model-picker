import {
  assertRecordStringString,
  type ProviderAndModelKey,
  type ProviderId,
  type StorageAdapter,
} from '../types';

type StorageGetter = Pick<StorageAdapter, 'get'>;

const RECENTLY_USED_MODELS_KEY = 'recentlyUsedModels' as const;
const PROVIDERS_WITH_CREDENTIALS_KEY = 'providersWithCredentials' as const;
const CONFIG_SUFFIX = 'config' as const;

// Versioned map payload: { __v: 1, items: Record<string,string> }
interface VersionedMapV1<T extends string = string> {
  readonly __version: 1;
  readonly items: Record<T, string>;
}

function isVersionedMapV1<T extends string = string>(value: unknown): value is VersionedMapV1<T> {
  return (
    typeof value === 'object' &&
    value !== null &&
    '__version' in (value as Record<string, unknown>) &&
    (value as { __version?: unknown }).__version === 1 &&
    'items' in (value as Record<string, unknown>)
  );
}

async function readVersionedMap<T extends string = string>(
  storage: StorageGetter,
  key: string
): Promise<Record<T, string>> {
  const raw = await storage.get(key);
  if (raw === undefined) {
    return {} as Record<T, string>;
  }
  if (isVersionedMapV1<T>(raw)) {
    try {
      assertRecordStringString(raw.items);
      return raw.items;
    } catch (error) {
      console.error('Invalid versioned storage format:', error);
      return {} as Record<T, string>;
    }
  }
  // Back-compat: plain record
  try {
    assertRecordStringString(raw);
    return raw as Record<T, string>;
  } catch (error) {
    console.error('Invalid legacy storage format:', error);
    return {} as Record<T, string>;
  }
}

async function writeVersionedMap<T extends string = string>(
  storage: StorageAdapter,
  key: string,
  items: Record<T, string>
): Promise<void> {
  // Defensive copy
  const copy: Record<string, string> = { ...items };
  const payload: VersionedMapV1<T> = { __version: 1, items: copy as Record<T, string> };
  await storage.set(key, payload as unknown as Record<string, string>);
}

function sortKeysByRecency<T extends string>(obj: Record<T, string>): T[] {
  try {
    return (
      Object.entries(obj)
        // eslint-disable-next-line code-complete/enforce-meaningful-names
        .toSorted((a, b) => Number(b[1]) - Number(a[1]))
        .map(([key]) => key as T)
    );
  } catch (error) {
    console.error('Invalid value format:', error);
    return [];
  }
}

export async function getRecentlyUsedModels(
  storage: StorageGetter
): Promise<ProviderAndModelKey[]> {
  const items = await readVersionedMap<ProviderAndModelKey>(storage, RECENTLY_USED_MODELS_KEY);
  return sortKeysByRecency<ProviderAndModelKey>(items);
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
  const items = await readVersionedMap<ProviderAndModelKey>(storage, RECENTLY_USED_MODELS_KEY);
  items[modelKey] = Date.now().toString();
  return writeVersionedMap(storage, RECENTLY_USED_MODELS_KEY, items);
}

export async function removeRecentlyUsedModels(
  storage: StorageAdapter,
  modelKeys: ProviderAndModelKey[]
): Promise<Record<string, string>> {
  const items = await readVersionedMap<ProviderAndModelKey>(storage, RECENTLY_USED_MODELS_KEY);
  for (const modelKey of modelKeys) {
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete items[modelKey];
  }
  await writeVersionedMap(storage, RECENTLY_USED_MODELS_KEY, items);
  return items;
}

export async function getProvidersWithCredentials(storage: StorageGetter): Promise<ProviderId[]> {
  const items = await readVersionedMap<ProviderId>(storage, PROVIDERS_WITH_CREDENTIALS_KEY);
  return Object.keys(items) as ProviderId[];
}

export async function addProviderWithCredentials(
  storage: StorageAdapter,
  providerId: ProviderId
): Promise<void> {
  const items = await readVersionedMap<ProviderId>(storage, PROVIDERS_WITH_CREDENTIALS_KEY);
  items[providerId] = Date.now().toString();
  return writeVersionedMap(storage, PROVIDERS_WITH_CREDENTIALS_KEY, items);
}

export async function deleteProviderWithCredentials(
  storage: StorageAdapter,
  providerId: ProviderId
): Promise<void> {
  const items = await readVersionedMap<ProviderId>(storage, PROVIDERS_WITH_CREDENTIALS_KEY);
  // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
  delete items[providerId];
  await writeVersionedMap(storage, PROVIDERS_WITH_CREDENTIALS_KEY, items);
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
  const config = await storage.get(providerConfigKey(providerId));
  if (config === undefined) {
    return undefined;
  }
  try {
    assertRecordStringString(config);
    return config;
  } catch (error) {
    console.error('Invalid provider configuration format:', error);
    return undefined;
  }
}

export async function deleteProviderConfiguration(
  storage: StorageAdapter,
  providerId: ProviderId
): Promise<void> {
  return storage.remove(providerConfigKey(providerId));
}
