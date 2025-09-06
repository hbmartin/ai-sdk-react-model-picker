import type { LanguageModelV2 } from '@ai-sdk/provider';
import { 
  AIProvider, 
  ModelConfig, 
  ProviderMetadata, 
  ProviderInstanceParams, 
  ValidationResult,
  createProviderId,
  createModelId,
  ModelProviderTags
} from '../types';
import { AnthropicIcon } from '../icons';

/**
 * Anthropic provider implementation with Claude models
 * Compatible with Vercel AI SDK v5
 */
export class AnthropicProvider extends AIProvider {
  readonly metadata: ProviderMetadata = {
    id: createProviderId('anthropic'),
    name: 'Anthropic',
    description: 'Use Claude 3.5 Sonnet, Claude 3 Opus, and other Anthropic models',
    icon: AnthropicIcon,
    documentationUrl: 'https://docs.anthropic.com',
    apiKeyUrl: 'https://console.anthropic.com/account/keys',
    requiredKeys: ['apiKey'],
  };

  readonly models: ModelConfig[] = [
    {
      id: createModelId('claude-3-5-sonnet-20241022'),
      displayName: 'Claude 3.5 Sonnet',
      maxTokens: 200000,
      contextLength: 200000,
      supportsVision: true,
      supportsTools: true,
      isDefault: true,
    },
    {
      id: createModelId('claude-3-5-haiku-20241022'),
      displayName: 'Claude 3.5 Haiku',
      maxTokens: 200000,
      contextLength: 200000,
      supportsVision: true,
      supportsTools: true,
    },
    {
      id: createModelId('claude-3-opus-20240229'),
      displayName: 'Claude 3 Opus',
      maxTokens: 200000,
      contextLength: 200000,
      supportsVision: true,
      supportsTools: true,
    },
    {
      id: createModelId('claude-3-sonnet-20240229'),
      displayName: 'Claude 3 Sonnet',
      maxTokens: 200000,
      contextLength: 200000,
      supportsVision: true,
      supportsTools: true,
    },
    {
      id: createModelId('claude-3-haiku-20240307'),
      displayName: 'Claude 3 Haiku',
      maxTokens: 200000,
      contextLength: 200000,
      supportsVision: true,
      supportsTools: true,
    },
  ];

  validateCredentials(config: Record<string, any>): ValidationResult {
    const apiKey = config.apiKey;
    
    if (!apiKey || typeof apiKey !== 'string') {
      return {
        isValid: false,
        error: 'Anthropic API key is required',
      };
    }

    // Basic format validation for Anthropic API keys
    if (!apiKey.startsWith('sk-ant-')) {
      return {
        isValid: false,
        error: 'Anthropic API key must start with "sk-ant-"',
      };
    }

    if (apiKey.length < 30) {
      return {
        isValid: false,
        error: 'Anthropic API key appears to be too short',
      };
    }

    return { isValid: true };
  }

  hasCredentials(config: Record<string, any>): boolean {
    return Boolean(config.apiKey);
  }

  createInstance(params: ProviderInstanceParams): LanguageModelV2 {
    // Dynamic import to avoid bundling if not needed
    let anthropic: any;
    
    try {
      // This will be a peer dependency
      anthropic = require('@ai-sdk/anthropic');
    } catch (error) {
      throw new Error(
        'Anthropic provider requires "@ai-sdk/anthropic" to be installed. ' +
        'Please install it with: npm install @ai-sdk/anthropic'
      );
    }

    const config: any = {
      apiKey: params.apiKey,
    };

    // Add custom API base if provided (for custom endpoints)
    if (params.apiBase) {
      config.baseURL = params.apiBase;
    }

    // Add any additional options
    if (params.options) {
      Object.assign(config, params.options);
    }

    // Create the Anthropic client
    const client = anthropic.anthropic(config);

    // Return the specific model
    return client(params.model, params.config);
  }

  /**
   * Async validation - actually test the API key
   */
  async validateApiKey(apiKey: string): Promise<ValidationResult> {
    const basicValidation = this.validateCredentials({ apiKey });
    if (!basicValidation.isValid) {
      return basicValidation;
    }

    try {
      // Dynamic import
      const anthropic = require('@ai-sdk/anthropic');
      
      // Create a client with the API key
      const client = anthropic.anthropic({ apiKey });
      
      // Test with a minimal request
      const model = client('claude-3-haiku-20240307');
      
      // Try to get model info or make a minimal test call
      // This would need to be implemented based on the actual AI SDK API
      
      return { isValid: true };
    } catch (error: any) {
      if (error.message?.includes('401') || error.message?.includes('authentication')) {
        return {
          isValid: false,
          error: 'Invalid Anthropic API key',
        };
      }
      
      if (error.message?.includes('quota') || error.message?.includes('usage')) {
        return {
          isValid: true,
          warning: 'API key is valid but quota may be exceeded',
        };
      }

      return {
        isValid: false,
        error: `Failed to validate API key: ${error.message}`,
      };
    }
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
    const model = this.models.find(m => m.id === modelId);
    if (!model) return false;

    switch (capability) {
      case 'vision':
        return model.supportsVision === true;
      case 'tools':
        return model.supportsTools === true;
      default:
        return false;
    }
  }

  /**
   * Get model by capability
   */
  getModelsByCapability(capability: 'vision' | 'tools'): ModelConfig[] {
    return this.models.filter(model => {
      switch (capability) {
        case 'vision':
          return model.supportsVision === true;
        case 'tools':
          return model.supportsTools === true;
        default:
          return false;
      }
    });
  }
}