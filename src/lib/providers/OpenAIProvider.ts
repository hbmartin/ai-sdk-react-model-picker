type OpenAIModule = typeof import('@ai-sdk/openai');
import type { OpenAIProviderSettings } from '@ai-sdk/openai';
import type { LanguageModelV2 } from '@ai-sdk/provider';
import type { ModelConfig, ProviderMetadata, ProviderInstanceParams } from '../types';
import { AIProvider, createProviderId, createModelId } from '../types';
import { OpenAIIcon } from '../icons';
import { baseUrlField, makeConfiguration, apiKeyField, type ConfigAPI } from './configuration';

export class OpenAIProvider extends AIProvider {
  override readonly metadata: ProviderMetadata = {
    id: createProviderId('openai'),
    name: 'OpenAI',
    description: 'Use GPT-4o, GPT-4, or other OpenAI models',
    icon: OpenAIIcon,
    documentationUrl: 'https://platform.openai.com/docs',
    apiKeyUrl: 'https://platform.openai.com/account/api-keys',
  };

  override readonly models: ModelConfig[] = [
    {
      id: createModelId('gpt-5'),
      displayName: 'GPT-5',
      maxTokens: 400_000,
      supportsVision: true,
      supportsTools: true,
      isDefault: true,
    },
    {
      id: createModelId('gpt-5-mini'),
      displayName: 'GPT-5 Mini',
      maxTokens: 400_000,
      supportsVision: true,
      supportsTools: true,
    },
  ];

  override readonly configuration: ConfigAPI<OpenAIProviderSettings> =
    makeConfiguration<OpenAIProviderSettings>()({
      fields: [
        apiKeyField('sk-'),
        baseUrlField('https://api.openai.com/v1'),
        {
          key: 'name',
          label: 'Name',
          placeholder: 'openai',
        },
      ],
      requiresAtLeastOneOf: ['apiKey', 'baseURL'],
    });

  async createInstance(params: ProviderInstanceParams): Promise<LanguageModelV2> {
    // Dynamic import to avoid bundling if not needed
    let openai: OpenAIModule;

    try {
      // This will be a peer dependency
      openai = await import('@ai-sdk/openai');
    } catch {
      throw new Error(
        'OpenAI provider requires "@ai-sdk/openai" to be installed. ' +
          'Please install it with: npm install @ai-sdk/openai'
      );
    }

    this.configuration.assert(params.options);
    const client = openai.createOpenAI(params.options);
    return client(params.model);
  }
}
