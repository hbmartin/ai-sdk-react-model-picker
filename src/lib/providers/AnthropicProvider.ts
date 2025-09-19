type AnthropicModule = typeof import('@ai-sdk/anthropic');
import type { AnthropicProviderSettings } from '@ai-sdk/anthropic';
import type { LanguageModelV2 } from '@ai-sdk/provider';
import type { ModelConfig, ProviderMetadata, ProviderInstanceParams } from '../types';
import { AIProvider, createProviderId, createModelId } from '../types';
import { AnthropicIcon } from '../icons';
import { apiKeyField, baseUrlField, makeConfiguration, type ConfigAPI } from './configuration';

export class AnthropicProvider extends AIProvider {
  readonly metadata: ProviderMetadata = {
    id: createProviderId('anthropic'),
    name: 'Anthropic',
    description: 'Use Claude Sonnet, Claude Opus, and other Anthropic models',
    icon: AnthropicIcon,
    documentationUrl: 'https://docs.anthropic.com',
    apiKeyUrl: 'https://console.anthropic.com/account/keys',
  };

  readonly models: ModelConfig[] = [
    {
      id: createModelId('claude-sonnet-4-20250514'),
      displayName: 'Claude Sonnet 4',
      maxTokens: 200_000,
      contextLength: 200_000,
      supportsVision: true,
      supportsTools: true,
      isDefault: true,
      origin: 'builtin',
      visible: true,
    },
    {
      id: createModelId('claude-opus-4-1-20250805'),
      displayName: 'Claude Opus 4.1',
      maxTokens: 200_000,
      supportsVision: true,
      supportsTools: true,
      origin: 'builtin',
      visible: true,
    },
    {
      id: createModelId('claude-3-5-haiku-20241022'),
      displayName: 'Claude 3.5 Haiku',
      maxTokens: 200_000,
      supportsVision: true,
      supportsTools: true,
      origin: 'builtin',
      visible: true,
    },
  ];

  override readonly configuration: ConfigAPI<AnthropicProviderSettings> =
    makeConfiguration<AnthropicProviderSettings>()({
      fields: [apiKeyField('sk-'), baseUrlField('https://api.anthropic.com/v1')],
      requiresAtLeastOneOf: ['apiKey', 'baseURL'],
    });

  async createInstance(params: ProviderInstanceParams): Promise<LanguageModelV2> {
    // Dynamic import to avoid bundling if not needed
    let anthropic: AnthropicModule;

    try {
      // This will be a peer dependency
      anthropic = await import('@ai-sdk/anthropic');
    } catch {
      throw new Error(
        'Anthropic provider requires "@ai-sdk/anthropic" to be installed. ' +
          'Please install it with: npm install @ai-sdk/anthropic'
      );
    }
    this.configuration.assertValidConfigAndRemoveEmptyKeys(params.options);
    const client = anthropic.createAnthropic(params.options);
    return client(params.model);
  }
}
