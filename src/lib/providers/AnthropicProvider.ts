type AnthropicModule = typeof import('@ai-sdk/anthropic');
import type { AnthropicProviderSettings } from '@ai-sdk/anthropic';
import type { LanguageModelV2 } from '@ai-sdk/provider';
import type {
  ModelConfig,
  ProviderMetadata,
  ProviderInstanceParams,
  ValidationResult,
} from '../types';
import { AIProvider, createProviderId, createModelId, ModelProviderTags } from '../types';
import { AnthropicIcon } from '../icons';

/**
 * Anthropic provider implementation with Claude models
 * Compatible with Vercel AI SDK v5
 */
export class AnthropicProvider extends AIProvider {
  readonly metadata: ProviderMetadata = {
    id: createProviderId('anthropic'),
    name: 'Anthropic',
    description: 'Use Claude Sonnet, Claude Opus, and other Anthropic models',
    icon: AnthropicIcon,
    documentationUrl: 'https://docs.anthropic.com',
    apiKeyUrl: 'https://console.anthropic.com/account/keys',
    requiredKeys: ['apiKey'],
  };

  readonly models: ModelConfig[] = [
    {
      id: createModelId('claude-sonnet-4-20250514'),
      displayName: 'Claude Sonnet 4',
      maxTokens: 200_000,
      contextLength: 200_000,
      supportsVision: true,
      supportsTools: true,
    },
    {
      id: createModelId('claude-opus-4-1-20250805'),
      displayName: 'Claude Opus 4.1',
      maxTokens: 200_000,
      supportsVision: true,
      supportsTools: true,
      isDefault: true,
    },
    {
      id: createModelId('claude-3-5-haiku-20241022'),
      displayName: 'Claude 3.5 Haiku',
      maxTokens: 200_000,
      supportsVision: true,
      supportsTools: true,
    },
  ];

  validateCredentials(config: Record<string, string>): ValidationResult {
    if (typeof config['apiKey'] !== 'string' || config['apiKey'].trim() === '') {
      return {
        isValid: false,
        error: 'Anthropic API key is required',
      };
    }

    const apiKey = config['apiKey'];

    // Basic format validation for Anthropic API keys
    if (!apiKey.startsWith('sk-ant-') || apiKey.length < 30) {
      return {
        isValid: true,
        warning: 'API key format looks unusual; please double-check.',
      };
    }

    return { isValid: true };
  }

  hasCredentials(config: Record<string, string>): boolean {
    return typeof config['apiKey'] === 'string' && config['apiKey'].trim() !== '';
  }

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
    if (typeof params['apiKey'] !== 'string' || params['apiKey'].trim() === '') {
      throw new TypeError('Anthropic API key is required');
    }

    const config: AnthropicProviderSettings = {
      apiKey: params.apiKey,
    };

    if (params.options) {
      Object.assign(config, params.options);
    }

    // Create the Anthropic client
    const client = anthropic.createAnthropic(config);

    // Return the specific model
    return client(params.model);
  }

  /**
   * Get provider tags for display
   */
  getTags(): ModelProviderTags[] {
    return [ModelProviderTags.RequiresApiKey, ModelProviderTags.LongContext];
  }

  /**
   * Check if model supports specific capability
   */
  modelSupportsCapability(modelId: string, capability: 'vision' | 'tools'): boolean {
    const model = this.models.find((model) => model.id === modelId);
    if (!model) {
      return false;
    }

    const capabilityMap = {
      vision: model.supportsVision,
      tools: model.supportsTools,
    };

    return capabilityMap[capability] === true;
  }

  /**
   * Get model by capability
   */
  getModelsByCapability(capability: 'vision' | 'tools'): ModelConfig[] {
    return this.models.filter((model) => {
      const capabilityMap = {
        vision: model.supportsVision,
        tools: model.supportsTools,
      };

      return capabilityMap[capability] === true;
    });
  }
}
