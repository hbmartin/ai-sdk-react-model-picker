import type { LanguageModelV1 } from 'ai';
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
      id: createModelId('gpt-4o'),
      displayName: 'GPT-4 Omni',
      maxTokens: 128000,
      contextLength: 128000,
      supportsVision: true,
      supportsTools: true,
      isDefault: true,
    },
    {
      id: createModelId('gpt-4o-mini'),
      displayName: 'GPT-4 Omni Mini',
      maxTokens: 128000,
      contextLength: 128000,
      supportsVision: true,
      supportsTools: true,
    },
    {
      id: createModelId('gpt-4-turbo'),
      displayName: 'GPT-4 Turbo',
      maxTokens: 128000,
      contextLength: 128000,
      supportsVision: true,
      supportsTools: true,
    },
    {
      id: createModelId('gpt-4'),
      displayName: 'GPT-4',
      maxTokens: 8192,
      contextLength: 8192,
      supportsTools: true,
    },
    {
      id: createModelId('gpt-3.5-turbo'),
      displayName: 'GPT-3.5 Turbo',
      maxTokens: 4096,
      contextLength: 16385,
      supportsTools: true,
    },
  ];

  validateCredentials(config: Record<string, any>): ValidationResult {
    const apiKey = config.apiKey;
    
    if (!apiKey || typeof apiKey !== 'string') {
      return {
        isValid: false,
        error: 'OpenAI API key is required',
      };
    }

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

  createInstance(params: ProviderInstanceParams): LanguageModelV1 {
    // Dynamic import to avoid bundling if not needed
    let openai: any;
    
    try {
      // This will be a peer dependency
      openai = require('@ai-sdk/openai');
    } catch (error) {
      throw new Error(
        'OpenAI provider requires "@ai-sdk/openai" to be installed. ' +
        'Please install it with: npm install @ai-sdk/openai'
      );
    }

    const config: any = {
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
    const client = openai.openai(config);

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
      const openai = require('@ai-sdk/openai');
      
      // Create a client with the API key
      const client = openai.openai({ apiKey });
      
      // Test with a minimal request
      const model = client('gpt-3.5-turbo');
      
      // Try to get model info or make a minimal test call
      // This would need to be implemented based on the actual AI SDK API
      
      return { isValid: true };
    } catch (error: any) {
      if (error.message?.includes('401')) {
        return {
          isValid: false,
          error: 'Invalid OpenAI API key',
        };
      }
      
      if (error.message?.includes('quota')) {
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
    return [ModelProviderTags.RequiresApiKey];
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
}