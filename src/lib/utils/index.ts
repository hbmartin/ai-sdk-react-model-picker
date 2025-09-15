import type { LanguageModelV2 } from '@ai-sdk/provider';
import { idsFromKey } from '../types';
import type { StorageAdapter } from '../types';
import { allProviders } from '../providers';
import { getSelectedProviderAndModelKey, getProviderConfiguration } from '../storage/repository';

export async function getModel(storage: StorageAdapter): Promise<LanguageModelV2> {
  const modelAndProviderKey = await getSelectedProviderAndModelKey(storage);
  if (modelAndProviderKey === undefined) {
    throw new Error('Could not find a selected model');
  }
  const { providerId, modelId } = idsFromKey(modelAndProviderKey);
  const provider = allProviders[providerId];
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition, sonarjs/different-types-comparison
  if (provider === undefined) {
    throw new Error(`Could not find the required provider: ${providerId}`);
  }
  const config = await getProviderConfiguration(storage, providerId);
  if (config === undefined) {
    throw new Error(`Could not find the required provider configuration: ${providerId}`);
  }

  return new provider().createInstance({ model: modelId, options: config });
}
