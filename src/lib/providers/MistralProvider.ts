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
import { MistralIcon } from '../icons';

export class MistralProvider extends AIProvider {
  readonly metadata: ProviderMetadata = {
    id: createProviderId('mistral'),
    name: 'Mistral',
    description: 'Use Mistral Large, Codestral, and other Mistral AI models',
    icon: MistralIcon,
    documentationUrl: 'https://docs.mistral.ai',
    apiKeyUrl: 'https://console.mistral.ai/api-keys',
    requiredKeys: ['apiKey'],
  };

  readonly models: ModelConfig[] = [
    {
      id: createModelId('mistral-large-latest'),
      displayName: 'Mistral Large',
      maxTokens: 128000,
      contextLength: 128000,
      supportsTools: true,
      isDefault: true,
    },
    {
      id: createModelId('mistral-medium-latest'),
      displayName: 'Mistral Medium',
      maxTokens: 32768,
      contextLength: 32768,
      supportsTools: true,
    },
    {
      id: createModelId('mistral-small-latest'),
      displayName: 'Mistral Small',
      maxTokens: 32768,
      contextLength: 32768,
      supportsTools: true,
    },
    {
      id: createModelId('codestral-latest'),
      displayName: 'Codestral',
      maxTokens: 32768,
      contextLength: 32768,
      supportsTools: true,
    },
  ];

  validateCredentials(config: Record<string, any>): ValidationResult {
    const apiKey = config.apiKey;
    
    if (!apiKey || typeof apiKey !== 'string') {
      return {
        isValid: false,
        error: 'Mistral API key is required',
      };
    }

    if (apiKey.length < 10) {
      return {
        isValid: false,
        error: 'Mistral API key appears to be too short',
      };
    }

    return { isValid: true };
  }

  hasCredentials(config: Record<string, any>): boolean {
    return Boolean(config.apiKey);
  }

  createInstance(params: ProviderInstanceParams): LanguageModelV2 {
    let mistral: any;
    
    try {
      mistral = require('@ai-sdk/mistral');
    } catch (error) {
      throw new Error(
        'Mistral provider requires "@ai-sdk/mistral" to be installed. ' +
        'Please install it with: npm install @ai-sdk/mistral'
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

    const client = mistral.mistral(config);
    return client(params.model, params.config);
  }

  getTags(): ModelProviderTags[] {
    return [ModelProviderTags.RequiresApiKey];
  }
}