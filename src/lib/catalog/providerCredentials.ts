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

  for (const providerId of credentialedProviders) {
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
