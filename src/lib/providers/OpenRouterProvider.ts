type OpenRouterModule = typeof import('@openrouter/ai-sdk-provider');
import type { LanguageModelV2 } from '@ai-sdk/provider';
import {
  AIProvider,
  createModelId,
  createProviderId,
  type ModelConfig,
  type ProviderInstanceParams,
  type ProviderMetadata,
} from '../types';
import { OpenRouterIcon } from '../icons';
import { apiKeyField, baseUrlField, makeConfiguration, type ConfigAPI } from './configuration';
import type { OpenRouterProviderSettings } from '@openrouter/ai-sdk-provider';

export class OpenRouterProvider extends AIProvider {
  override readonly metadata: ProviderMetadata = {
    id: createProviderId('openrouter'),
    name: 'OpenRouter',
    description: 'OpenRouter unified API for multiple AI models',
    documentationUrl: 'https://openrouter.ai/docs',
    apiKeyUrl: 'https://openrouter.ai/settings/keys',
    icon: OpenRouterIcon,
  };

  readonly models: ModelConfig[] = [
    {
      id: createModelId('openrouter/auto'),
      displayName: 'Auto (Best Available)',
      supportsVision: true,
    },
  ];

  override readonly configuration: ConfigAPI<OpenRouterProviderSettings> =
    makeConfiguration<OpenRouterProviderSettings>()({
      fields: [apiKeyField('sk-'), baseUrlField('https://openrouter.ai/api/v1')],
      requiresAtLeastOneOf: ['apiKey', 'baseURL'],
    });

  async createInstance(params: ProviderInstanceParams): Promise<LanguageModelV2> {
    // Dynamic import to avoid bundling if not needed
    let openRouter: OpenRouterModule;

    try {
      // This will be a peer dependency
      openRouter = await import('@openrouter/ai-sdk-provider');
    } catch {
      throw new Error(
        'OpenRouter provider requires "@openrouter/ai-sdk-provider" to be installed. ' +
          'Please install it with: npm install @ai-sdk/anthropic'
      );
    }
    this.configuration.assertValidConfigAndRemoveEmptyKeys(params.options);
    const client = openRouter.createOpenRouter(params.options as OpenRouterProviderSettings);
    return client(params.model);
  }
}
