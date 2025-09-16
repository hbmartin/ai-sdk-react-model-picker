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
      displayName: 'Auto',
      supportsVision: true,
    },
    {
      id: createModelId('x-ai/grok-code-fast-1'),
      displayName: 'Grok Code Fast 1',
      maxTokens: 131_072,
    },
    {
      id: createModelId('openrouter/sonoma-dusk-alpha'),
      displayName: 'Sonoma Dusk Alpha',
      maxTokens: 2_000_000,
    },
    {
      id: createModelId('openrouter/sonoma-sky-alpha'),
      displayName: 'Sonoma Sky Alpha',
      maxTokens: 2_000_000,
    },
    {
      id: createModelId('deepseek/deepseek-chat-v3.1:free'),
      displayName: 'DeepSeek V3.1 (free)',
      maxTokens: 32_768,
    },
    {
      id: createModelId('z-ai/glm-4.5-air:free'),
      displayName: 'Z.AI: GLM 4.5 Air (free)',
      maxTokens: 131_072,
    },
    {
      id: createModelId('anthropic/claude-sonnet-4'),
      displayName: 'Claude 4 Sonnet',
      maxTokens: 1_000_000,
      supportsVision: true,
    },
    {
      id: createModelId('qwen/qwen3-coder'),
      displayName: 'Qwen3 Coder 480B A35B',
      maxTokens: 262_144,
    },
  ];

  override readonly configuration: ConfigAPI<OpenRouterProviderSettings> =
    makeConfiguration<OpenRouterProviderSettings>()({
      fields: [apiKeyField('sk-', true), baseUrlField('https://openrouter.ai/api/v1')],
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
          'Please install it with: npm install @openrouter/ai-sdk-provider'
      );
    }
    this.configuration.assertValidConfigAndRemoveEmptyKeys(params.options);
    const client = openRouter.createOpenRouter(params.options as OpenRouterProviderSettings);
    return client(params.model);
  }
}
