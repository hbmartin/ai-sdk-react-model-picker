import type { CatalogEntry, CatalogSnapshot, ProviderId } from '../types';

export function sortAvailableModels(models: CatalogEntry[]): CatalogEntry[] {
  // filter to visible
  const visible = models.filter((model) => model.model.visible !== false);

  // sort: discoveredAt desc; if missing, provider name asc then model name asc
  visible.sort((modelA, modelB) => {
    const aDisc = modelA.model.discoveredAt ?? 0;
    const bDisc = modelB.model.discoveredAt ?? 0;
    if (aDisc !== bDisc) {
      return bDisc - aDisc;
    }
    const providerNameCompare = modelA.provider.name.localeCompare(modelB.provider.name);
    if (providerNameCompare !== 0) {
      return providerNameCompare;
    }
    return modelA.model.displayName.localeCompare(modelB.model.displayName);
  });

  return visible;
}

export function filterModelsByCredentialsAndRecentlyUsed(
  providersWithCreds: ProviderId[],
  snapshot: CatalogSnapshot,
  recentlyUsedModels: CatalogEntry[]
): CatalogEntry[] {
  const recentlyUsedKeys = new Set(recentlyUsedModels.map((model) => model.key));
  const providersWithCredsSet = new Set(providersWithCreds);
  return sortAvailableModels(
    Object.values(snapshot)
      .flatMap((entry) => entry?.models ?? [])
      .filter(
        (model) => !recentlyUsedKeys.has(model.key) && providersWithCredsSet.has(model.provider.id)
      )
  );
}
