type AzureModule = typeof import('@ai-sdk/azure');
import type { AzureOpenAIProviderSettings } from '@ai-sdk/azure';
import type { LanguageModelV2 } from '@ai-sdk/provider';
import type { ModelConfig, ProviderMetadata, ProviderInstanceParams } from '../types';
import { AIProvider, createProviderId, createModelId, ModelProviderTags } from '../types';
import { AzureIcon } from '../icons';
import { apiKeyField, baseUrlField, makeConfiguration, type ConfigAPI } from './configuration';

export class AzureProvider extends AIProvider {
  readonly metadata: ProviderMetadata = {
    id: createProviderId('azure'),
    name: 'Azure OpenAI',
    description: 'Use GPT-4 and other models through Azure OpenAI Service',
    icon: AzureIcon,
    documentationUrl: 'https://learn.microsoft.com/en-us/azure/ai-foundry/',
    apiKeyUrl: 'https://portal.azure.com',
  };

  readonly models: ModelConfig[] = [
    {
      id: createModelId('gpt-4o'),
      displayName: 'GPT-4 Omni (Azure)',
      maxTokens: 128_000,
      contextLength: 128_000,
      supportsVision: true,
      supportsTools: true,
      isDefault: true,
      origin: 'builtin',
      visible: true,
    },
    {
      id: createModelId('gpt-4-turbo'),
      displayName: 'GPT-4 Turbo (Azure)',
      maxTokens: 128_000,
      contextLength: 128_000,
      supportsVision: true,
      supportsTools: true,
      origin: 'builtin',
      visible: true,
    },
    {
      id: createModelId('gpt-4'),
      displayName: 'GPT-4 (Azure)',
      maxTokens: 8192,
      contextLength: 8192,
      supportsTools: true,
      origin: 'builtin',
      visible: true,
    },
    {
      id: createModelId('gpt-35-turbo'),
      displayName: 'GPT-3.5 Turbo (Azure)',
      maxTokens: 4096,
      contextLength: 16_385,
      supportsTools: true,
      origin: 'builtin',
      visible: true,
    },
  ];

  override readonly configuration: ConfigAPI<AzureOpenAIProviderSettings> =
    makeConfiguration<AzureOpenAIProviderSettings>()({
      fields: [
        apiKeyField(10, true),
        baseUrlField('https://{resourceName}.openai.azure.com/openai/v1{path}', true),
      ],
    });

  async createInstance(params: ProviderInstanceParams): Promise<LanguageModelV2> {
    let azure: AzureModule;

    try {
      azure = await import('@ai-sdk/azure');
    } catch {
      throw new Error(
        'Azure provider requires "@ai-sdk/azure" to be installed. ' +
          'Please install it with: npm install @ai-sdk/azure'
      );
    }
    this.configuration.assertValidConfigAndRemoveEmptyKeys(params.options);
    const client = azure.createAzure(params.options);
    return client(params.model);
  }

  getTags(): ModelProviderTags[] {
    return [ModelProviderTags.RequiresApiKey];
  }
}
