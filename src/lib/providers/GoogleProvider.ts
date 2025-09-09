type GoogleModule = typeof import('@ai-sdk/google');
import type { GoogleGenerativeAIProviderSettings } from '@ai-sdk/google';
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

  validateCredentials(config: Record<string, string>): ValidationResult {
    if (typeof config['apiKey'] !== 'string' || config['apiKey'].trim() === '') {
      return {
        isValid: false,
        error: 'Google AI API key is required',
      };
    }
    const apiKey = config['apiKey'];

    if (apiKey.length < 10) {
      return {
        isValid: false,
        error: 'Google AI API key appears to be too short',
      };
    }

    return { isValid: true };
  }

  hasCredentials(config: Record<string, string>): boolean {
    return typeof config['apiKey'] === 'string' && config['apiKey'].trim() !== '';
  }

  async createInstance(params: ProviderInstanceParams): Promise<LanguageModelV2> {
    let google: GoogleModule;

    try {
      google = await import('@ai-sdk/google');
    } catch {
      throw new Error(
        'Google provider requires "@ai-sdk/google" to be installed. ' +
          'Please install it with: npm install @ai-sdk/google'
      );
    }

    if (typeof params['apiKey'] !== 'string' || params['apiKey'].trim() === '') {
      throw new TypeError('Google API key is required');
    }

    const config: GoogleGenerativeAIProviderSettings = {
      apiKey: params.apiKey,
    };

    if (params.baseUrl) {
      config.baseURL = params.baseUrl;
    }

    if (params.options) {
      Object.assign(config, params.options);
    }

    const client = google.createGoogleGenerativeAI(config);
    return client(params.model);
  }

  getTags(): ModelProviderTags[] {
    return [ModelProviderTags.RequiresApiKey, ModelProviderTags.LongContext];
  }
}
