import type { IProviderRegistry, ProviderId, StorageAdapter } from '../types';
import { getProvidersWithCredentials } from '../storage/repository';

export async function getProvidersWithAccess(
  providerRegistry: IProviderRegistry,
  storage: StorageAdapter
): Promise<ProviderId[]> {
  const credentialedProviders = await getProvidersWithCredentials(storage);
  const providersNotRequiringCredentials = providerRegistry
    .getProvidersNotRequiringCredentials()
    .map((provider) => provider.metadata.id);

  const allProviders = new Set<ProviderId>();

// You can collapse the two loops into a single chained operation,
// reducing boilerplate while preserving order & uniqueness.
export async function getProvidersWithAccess(
  providerRegistry: IProviderRegistry,
  storage: StorageAdapter
): Promise<ProviderId[]> {
  const credentialed = await getProvidersWithCredentials(storage);
  const noCredIds = providerRegistry
    .getProvidersNotRequiringCredentials()
    .map(({ metadata: { id } }) => id);

  return [
    ...new Set([
      ...credentialed,
      ...noCredIds
    ])
  ].filter(id => providerRegistry.hasProvider(id));
}
    if (providerRegistry.hasProvider(providerId)) {
      allProviders.add(providerId);
    }
  }

  for (const providerId of providersNotRequiringCredentials) {
    if (providerRegistry.hasProvider(providerId)) {
      allProviders.add(providerId);
    }
  }

  return [...allProviders];
}
