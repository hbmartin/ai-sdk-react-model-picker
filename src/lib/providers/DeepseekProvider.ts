type DeepseekModule = typeof import('@ai-sdk/deepseek');
import type { DeepSeekProviderSettings } from '@ai-sdk/deepseek';
import type { LanguageModelV2 } from '@ai-sdk/provider';
import type { ModelConfig, ProviderMetadata, ProviderInstanceParams } from '../types';
import { AIProvider, createProviderId, createModelId } from '../types';
import { DeepSeekIcon } from '../icons';
import { apiKeyField, baseUrlField, makeConfiguration, type ConfigAPI } from './configuration';

export class DeepseekProvider extends AIProvider {
  readonly metadata: ProviderMetadata = {
    id: createProviderId('deepseek'),
    name: 'DeepSeek',
    description: 'Use DeepSeek Chat, DeepSeek V3.1, and other DeepSeek models',
    icon: DeepSeekIcon,
    documentationUrl: 'https://docs.deepseek.com',
    apiKeyUrl: 'https://platform.deepseek.com/api_keys',
  };

  readonly models: ModelConfig[] = [
    {
      id: createModelId('deepseek-chat'),
      displayName: 'DeepSeek Chat',
      contextLength: 128_000,
      supportsVision: false,
      supportsTools: true,
      isDefault: true,
    },
  ];

  override readonly configuration: ConfigAPI<DeepSeekProviderSettings> =
    makeConfiguration<DeepSeekProviderSettings>()({
      fields: [apiKeyField('sk-'), baseUrlField('https://api.deepseek.com/v1')],
      requiresAtLeastOneOf: ['apiKey', 'baseURL'],
    });

  async createInstance(params: ProviderInstanceParams): Promise<LanguageModelV2> {
    // Dynamic import to avoid bundling if not needed
    let deepseek: DeepseekModule;

    try {
      // This will be a peer dependency
      deepseek = await import('@ai-sdk/deepseek');
    } catch {
      throw new Error(
        'DeepSeek provider requires "@ai-sdk/deepseek" to be installed. ' +
          'Please install it with: npm install @ai-sdk/deepseek'
      );
    }
    this.configuration.assertValidConfigAndRemoveEmptyKeys(params.options);
    const client = deepseek.createDeepSeek(params.options);
    return client(params.model);
  }
}
