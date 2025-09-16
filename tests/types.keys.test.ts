import { describe, expect, it } from 'vitest';
import {
  providerAndModelKey,
  idsFromKey,
  type ModelConfigWithProvider,
  createProviderId,
  createModelId,
  type IconComponent,
} from '../src/lib/types';

describe('ProviderAndModelKey encoding/decoding', () => {
  it('handles model IDs containing slashes', () => {
    const DummyIcon = (() => undefined) as unknown as IconComponent;
    const modelWithProvider: ModelConfigWithProvider = {
      provider: {
        id: createProviderId('openrouter'),
        name: 'OpenRouter',
        // minimal icon component stub
        icon: DummyIcon,
      },
      model: {
        id: createModelId('openrouter/auto'),
        displayName: 'OpenRouter Auto',
      },
    };

    const key = providerAndModelKey(modelWithProvider);
    const { providerId, modelId } = idsFromKey(key);
    expect(providerId).toBe(createProviderId('openrouter'));
    expect(modelId).toBe(createModelId('openrouter/auto'));
  });
});
