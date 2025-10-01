import type { IProviderRegistry, ProviderId, StorageAdapter } from '../types';
import { getProvidersWithCredentials } from '../storage/repository';

export async function getProvidersWithAccess(
  providerRegistry: IProviderRegistry,
  storage: StorageAdapter
): Promise<ProviderId[]> {
  const credentialed = await getProvidersWithCredentials(storage);
  const noCredIds = providerRegistry
    .getProvidersNotRequiringCredentials()
    .map(({ metadata: { id } }) => id);

  return [...new Set([...credentialed, ...noCredIds])].filter((id) =>
    providerRegistry.hasProvider(id)
  );
}
