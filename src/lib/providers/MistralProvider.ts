type MistralModule = typeof import('@ai-sdk/mistral');
import type { MistralProviderSettings } from '@ai-sdk/mistral';
import type { LanguageModelV2 } from '@ai-sdk/provider';
import type { ModelConfig, ProviderMetadata, ProviderInstanceParams } from '../types';
import { AIProvider, createProviderId, createModelId, ModelProviderTags } from '../types';
import { MistralIcon } from '../icons';
import { apiKeyField, baseUrlField, makeConfiguration, type ConfigAPI } from './configuration';

export class MistralProvider extends AIProvider {
  readonly metadata: ProviderMetadata = {
    id: createProviderId('mistral'),
    name: 'Mistral',
    description: 'Use Mistral Large, Codestral, and other Mistral AI models',
    icon: MistralIcon,
    documentationUrl: 'https://docs.mistral.ai',
    apiKeyUrl: 'https://console.mistral.ai/api-keys',
  };

  readonly models: ModelConfig[] = [
    {
      id: createModelId('mistral-large-latest'),
      displayName: 'Mistral Large',
      maxTokens: 128_000,
      contextLength: 128_000,
      supportsTools: true,
      isDefault: true,
    },
    {
      id: createModelId('mistral-medium-latest'),
      displayName: 'Mistral Medium',
      maxTokens: 32_768,
      contextLength: 32_768,
      supportsTools: true,
    },
    {
      id: createModelId('mistral-small-latest'),
      displayName: 'Mistral Small',
      maxTokens: 32_768,
      contextLength: 32_768,
      supportsTools: true,
    },
    {
      id: createModelId('codestral-latest'),
      displayName: 'Codestral',
      maxTokens: 32_768,
      contextLength: 32_768,
      supportsTools: true,
    },
  ];

  override readonly configuration: ConfigAPI<MistralProviderSettings> =
    makeConfiguration<MistralProviderSettings>()({
      fields: [apiKeyField(10, true), baseUrlField('https://api.mistral.ai/v1')],
    });

  async createInstance(params: ProviderInstanceParams): Promise<LanguageModelV2> {
    let mistral: MistralModule;

    try {
      mistral = await import('@ai-sdk/mistral');
    } catch {
      throw new Error(
        'Mistral provider requires "@ai-sdk/mistral" to be installed. ' +
          'Please install it with: npm install @ai-sdk/mistral'
      );
    }
    this.configuration.assertValidConfigAndRemoveEmptyKeys(params.options);
    const client = mistral.createMistral(params.options);
    return client(params.model);
  }

  getTags(): ModelProviderTags[] {
    return [ModelProviderTags.RequiresApiKey];
  }
}
