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
import { GoogleIcon } from '../icons';

export class GoogleProvider extends AIProvider {
  readonly metadata: ProviderMetadata = {
    id: createProviderId('google'),
    name: 'Google',
    description: 'Use Gemini Pro, Gemini Flash, and other Google models',
    icon: GoogleIcon,
    documentationUrl: 'https://ai.google.dev',
    apiKeyUrl: 'https://aistudio.google.com/app/apikey',
    requiredKeys: ['apiKey'],
  };

  readonly models: ModelConfig[] = [
    {
      id: createModelId('gemini-1.5-pro-latest'),
      displayName: 'Gemini 1.5 Pro',
      maxTokens: 1048576,
      contextLength: 1048576,
      supportsVision: true,
      supportsTools: true,
      isDefault: true,
    },
    {
      id: createModelId('gemini-1.5-flash-latest'),
      displayName: 'Gemini 1.5 Flash',
      maxTokens: 1048576,
      contextLength: 1048576,
      supportsVision: true,
      supportsTools: true,
    },
    {
      id: createModelId('gemini-pro'),
      displayName: 'Gemini Pro',
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
        error: 'Google AI API key is required',
      };
    }

    if (apiKey.length < 10) {
      return {
        isValid: false,
        error: 'Google AI API key appears to be too short',
      };
    }

    return { isValid: true };
  }

  hasCredentials(config: Record<string, any>): boolean {
    return Boolean(config.apiKey);
  }

  createInstance(params: ProviderInstanceParams): LanguageModelV2 {
    let google: any;
    
    try {
      google = require('@ai-sdk/google');
    } catch (error) {
      throw new Error(
        'Google provider requires "@ai-sdk/google" to be installed. ' +
        'Please install it with: npm install @ai-sdk/google'
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

    const client = google.google(config);
    return client(params.model, params.config);
  }

  getTags(): ModelProviderTags[] {
    return [ModelProviderTags.RequiresApiKey, ModelProviderTags.LongContext];
  }
}