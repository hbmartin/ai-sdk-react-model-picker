type OpenAIModule = typeof import('@ai-sdk/openai');
import type { OpenAIProviderSettings } from '@ai-sdk/openai';
import type { LanguageModelV2 } from '@ai-sdk/provider';
import type {
  ModelConfig,
  ProviderMetadata,
  ProviderInstanceParams,
  ValidationResult,
} from '../types';
import { AIProvider, createProviderId, createModelId, ModelProviderTags } from '../types';
import { OpenAIIcon } from '../icons';

/**
 * OpenAI provider implementation with GPT models
 * Compatible with Vercel AI SDK v5
 */
export class OpenAIProvider extends AIProvider {
  readonly metadata: ProviderMetadata = {
    id: createProviderId('openai'),
    name: 'OpenAI',
    description: 'Use GPT-4o, GPT-4, or other OpenAI models',
    icon: OpenAIIcon,
    documentationUrl: 'https://platform.openai.com/docs',
    apiKeyUrl: 'https://platform.openai.com/account/api-keys',
    requiredKeys: ['apiKey'],
  };

  readonly models: ModelConfig[] = [
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

  validateCredentials(config: Record<string, any>): ValidationResult {
    if (
      config.apiKey === undefined ||
      config.apiKey === null ||
      typeof config.apiKey !== 'string'
    ) {
      return {
        isValid: false,
        error: 'OpenAI API key is required',
      };
    }
    const apiKey = config.apiKey;

    // Basic format validation for OpenAI API keys
    if (!apiKey.startsWith('sk-')) {
      return {
        isValid: false,
        error: 'OpenAI API key must start with "sk-"',
      };
    }

    if (apiKey.length < 20) {
      return {
        isValid: false,
        error: 'OpenAI API key appears to be too short',
      };
    }

    return { isValid: true };
  }

  hasCredentials(config: Record<string, any>): boolean {
    return Boolean(config.apiKey);
  }

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

    const config: OpenAIProviderSettings = {
      apiKey: params.apiKey,
    };

    // Add custom API base if provided
    if (params.apiBase) {
      config.baseURL = params.apiBase;
    }

    // Add any additional options
    if (params.options) {
      Object.assign(config, params.options);
    }

    // Create the OpenAI client
    const client = openai.createOpenAI(config);

    // Return the specific model
    return client(params.model);
  }

  /**
   * Get provider tags for display
   */
  getTags(): ModelProviderTags[] {
    return [ModelProviderTags.RequiresApiKey];
  }

  /**
   * Check if model supports specific capability
   */
  modelSupportsCapability(modelId: string, capability: 'vision' | 'tools'): boolean {
    const model = this.models.find((m) => m.id === modelId);
    if (!model) return false;

    const capabilityMap = {
      vision: model.supportsVision,
      tools: model.supportsTools,
    };

    return capabilityMap[capability] === true;
  }
}
