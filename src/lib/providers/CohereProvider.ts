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
import { CohereIcon } from '../icons';

export class CohereProvider extends AIProvider {
  readonly metadata: ProviderMetadata = {
    id: createProviderId('cohere'),
    name: 'Cohere',
    description: 'Use Command R+, Command R, and other Cohere models',
    icon: CohereIcon,
    documentationUrl: 'https://docs.cohere.com',
    apiKeyUrl: 'https://dashboard.cohere.com/api-keys',
    requiredKeys: ['apiKey'],
  };

  readonly models: ModelConfig[] = [
    {
      id: createModelId('command-r-plus'),
      displayName: 'Command R+',
      maxTokens: 128000,
      contextLength: 128000,
      supportsTools: true,
      isDefault: true,
    },
    {
      id: createModelId('command-r'),
      displayName: 'Command R',
      maxTokens: 128000,
      contextLength: 128000,
      supportsTools: true,
    },
    {
      id: createModelId('command'),
      displayName: 'Command',
      maxTokens: 4096,
      contextLength: 4096,
      supportsTools: true,
    },
    {
      id: createModelId('command-light'),
      displayName: 'Command Light',
      maxTokens: 4096,
      contextLength: 4096,
    },
  ];

  validateCredentials(config: Record<string, any>): ValidationResult {
    const apiKey = config.apiKey;
    
    if (!apiKey || typeof apiKey !== 'string') {
      return {
        isValid: false,
        error: 'Cohere API key is required',
      };
    }

    if (apiKey.length < 10) {
      return {
        isValid: false,
        error: 'Cohere API key appears to be too short',
      };
    }

    return { isValid: true };
  }

  hasCredentials(config: Record<string, any>): boolean {
    return Boolean(config.apiKey);
  }

  createInstance(params: ProviderInstanceParams): LanguageModelV2 {
    let cohere: any;
    
    try {
      cohere = require('@ai-sdk/cohere');
    } catch (error) {
      throw new Error(
        'Cohere provider requires "@ai-sdk/cohere" to be installed. ' +
        'Please install it with: npm install @ai-sdk/cohere'
      );
    }

    const config: any = {
      apiKey: params.apiKey,
    };

    if (params.apiBase) {
      config.baseURL = params.apiBase;
    }

    if (params.options) {
      Object.assign(config, params.options);
    }

    const client = cohere.cohere(config);
    return client(params.model, params.config);
  }

  getTags(): ModelProviderTags[] {
    return [ModelProviderTags.RequiresApiKey];
  }
}