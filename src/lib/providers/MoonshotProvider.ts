type OpenAIModule = typeof import('@ai-sdk/openai');
import type { OpenAIProviderSettings } from '@ai-sdk/openai';
import type { LanguageModelV2 } from '@ai-sdk/provider';
import {
  AIProvider,
  type ProviderMetadata,
  type ModelConfig,
  type ProviderInstanceParams,
  createProviderId,
  createModelId,
} from '../types';
import { MoonshotIcon } from '../icons';
import { apiKeyField, makeConfiguration, type ConfigAPI } from './configuration';

export class MoonshotProvider extends AIProvider {
  override readonly metadata: ProviderMetadata = {
    id: createProviderId('moonshot'),
    name: 'Moonshot AI',
    description: 'Moonshot AI Kimi models with long context capabilities',
    icon: MoonshotIcon,
    documentationUrl: 'https://platform.moonshot.ai/docs/introduction',
    apiKeyUrl: 'https://platform.moonshot.ai/console/api-keys',
  };

  override readonly models: ModelConfig[] = [
    {
      id: createModelId('kimi-k2-0905-preview'),
      displayName: 'Kimi K2 (256k)',
      maxTokens: 256_000,
    },
    {
      id: createModelId('kimi-k2-0711-preview'),
      displayName: 'Kimi K2 (128k MoE)',
      maxTokens: 128_000,
    },
    {
      id: createModelId('kimi-k2-turbo-preview'),
      displayName: 'Kimi K2 Turbo',
      isDefault: true,
      maxTokens: 256_000,
    },
    {
      id: createModelId('moonshot-v1-128k'),
      displayName: 'Moonshot v1 128K',
      maxTokens: 128_000,
    },
  ];

  override readonly configuration: ConfigAPI<OpenAIProviderSettings> =
    makeConfiguration<OpenAIProviderSettings>()({
      fields: [apiKeyField('sk-', true)],
    });

  async createInstance(params: ProviderInstanceParams): Promise<LanguageModelV2> {
    // Dynamic import to avoid bundling if not needed
    let openai: OpenAIModule;

    try {
      // This will be a peer dependency
      openai = await import('@ai-sdk/openai');
    } catch {
      throw new Error(
        'Moonshot provider requires "@ai-sdk/openai" to be installed. ' +
          'Please install it with: npm install @ai-sdk/openai'
      );
    }

    this.configuration.assert(params.options);
    const client = openai.createOpenAI({
      ...params.options,
      baseURL: 'https://api.moonshot.ai/v1',
    });
    return client(params.model);
  }
}
