import { providerAndModelKey } from '../types';
import type {
  KeyedModelConfigWithProvider,
  ModelConfigWithProvider,
  ProviderId,
  ProviderModelsStatus,
} from '../types';

export function flattenAndSortAvailableModels(
  byProvider: Record<ProviderId, ProviderModelsStatus>
): ModelConfigWithProvider[] {
  const all: ModelConfigWithProvider[] = Object.values(byProvider).flatMap((entry) => entry.models);

  // filter to visible
  const visible = all.filter((model) => model.model.visible !== false);

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

export function deriveAvailableModels(
  snapshot: Record<ProviderId, ProviderModelsStatus>,
  providerIds: ProviderId[],
  existingModels: KeyedModelConfigWithProvider[]
): KeyedModelConfigWithProvider[] {
  const byProvider = Object.fromEntries(
    providerIds.map((pid) => [pid, snapshot[pid] ?? { models: [], status: 'idle' }])
  ) as Record<ProviderId, ProviderModelsStatus>;

  const flattened = flattenAndSortAvailableModels(byProvider);
  const known = new Set(existingModels.map((model) => model.key));

  return flattened
    .filter((model) => !known.has(providerAndModelKey(model)))
    .map((model) => ({ ...model, key: providerAndModelKey(model) }));
}
