type CohereModule = typeof import('@ai-sdk/cohere');
import type { CohereProviderSettings } from '@ai-sdk/cohere';
import type { LanguageModelV2 } from '@ai-sdk/provider';
import type { ModelConfig, ProviderMetadata, ProviderInstanceParams } from '../types';
import { AIProvider, createProviderId, createModelId, ModelProviderTags } from '../types';
import { CohereIcon } from '../icons';
import { apiKeyField, baseUrlField, makeConfiguration, type ConfigAPI } from './configuration';

export class CohereProvider extends AIProvider {
  readonly metadata: ProviderMetadata = {
    id: createProviderId('cohere'),
    name: 'Cohere',
    description: 'Use Command R+, Command R, and other Cohere models',
    icon: CohereIcon,
    documentationUrl: 'https://docs.cohere.com',
    apiKeyUrl: 'https://dashboard.cohere.com/api-keys',
  };

  readonly models: ModelConfig[] = [
    {
      id: createModelId('command-r-plus'),
      displayName: 'Command R+',
      maxTokens: 128_000,
      contextLength: 128_000,
      supportsTools: true,
      isDefault: true,
    },
    {
      id: createModelId('command-r'),
      displayName: 'Command R',
      maxTokens: 128_000,
      contextLength: 128_000,
      supportsTools: true,
    },
    {
      id: createModelId('command'),
      displayName: 'Command',
      maxTokens: 4096,
      contextLength: 4096,
      supportsTools: true,
    },
    {
      id: createModelId('command-light'),
      displayName: 'Command Light',
      maxTokens: 4096,
      contextLength: 4096,
    },
  ];

  override readonly configuration: ConfigAPI<CohereProviderSettings> =
    makeConfiguration<CohereProviderSettings>()({
      fields: [apiKeyField(10, true), baseUrlField('https://api.cohere.com/v2')],
    });

  async createInstance(params: ProviderInstanceParams): Promise<LanguageModelV2> {
    let cohere: CohereModule;

    try {
      cohere = await import('@ai-sdk/cohere');
    } catch {
      throw new Error(
        'Cohere provider requires "@ai-sdk/cohere" to be installed. ' +
          'Please install it with: npm install @ai-sdk/cohere'
      );
    }
    this.configuration.assertValidConfigAndRemoveEmptyKeys(params.options);
    const client = cohere.createCohere(params.options);
    return client(params.model);
  }

  getTags(): ModelProviderTags[] {
    return [ModelProviderTags.RequiresApiKey];
  }
}
