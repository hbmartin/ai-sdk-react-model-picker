import type { ModelConfigWithProvider, ProviderId } from '../types';

export function flattenAndSortAvailableModels(
  byProvider: Record<
    ProviderId,
    { models: ModelConfigWithProvider[]; status: string; error?: string }
  >
): ModelConfigWithProvider[] {
  const all: ModelConfigWithProvider[] = [];
  for (const pid of Object.keys(byProvider) as ProviderId[]) {
    const entry = byProvider[pid];
    for (const m of entry.models) {
      all.push(m);
    }
  }

  // filter to visible
  const visible = all.filter((x) => x.model.visible !== false);

  // sort: discoveredAt desc; if missing, provider name asc then model name asc
  visible.sort((a, b) => {
    const aDisc = a.model.discoveredAt ?? 0;
    const bDisc = b.model.discoveredAt ?? 0;
    if (aDisc !== bDisc) return bDisc - aDisc;
    if (a.model.discoveredAt !== undefined || b.model.discoveredAt !== undefined) return 0;
    const pn = a.provider.name.localeCompare(b.provider.name);
    if (pn !== 0) return pn;
    return a.model.displayName.localeCompare(b.model.displayName);
  });

  return visible;
}

