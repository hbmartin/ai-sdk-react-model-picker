import type { LanguageModelV2 } from '@ai-sdk/provider';
import type {
  ModelConfig,
  ProviderMetadata,
  ProviderInstanceParams,
  ValidationResult,
} from '../types';
import { AIProvider, createProviderId, createModelId, ModelProviderTags } from '../types';
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
      id: createModelId('gemini-2.5-pro'),
      displayName: 'Gemini 2.5 Pro',
      maxTokens: 1_048_576,
      supportsVision: true,
      supportsTools: true,
      isDefault: true,
    },
    {
      id: createModelId('gemini-2.5-flash'),
      displayName: 'Gemini 2.5 Flash',
      maxTokens: 1_048_576,
      supportsVision: true,
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

  async createInstance(params: ProviderInstanceParams): Promise<LanguageModelV2> {
    let google: any;

    try {
      google = await import('@ai-sdk/google');
    } catch {
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
