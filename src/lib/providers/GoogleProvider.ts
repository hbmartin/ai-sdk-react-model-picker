type GoogleModule = typeof import('@ai-sdk/google');
import type { GoogleGenerativeAIProviderSettings } from '@ai-sdk/google';
import type { LanguageModelV2 } from '@ai-sdk/provider';
import type { ModelConfig, ProviderMetadata, ProviderInstanceParams } from '../types';
import { AIProvider, createProviderId, createModelId, ModelProviderTags } from '../types';
import { GoogleIcon } from '../icons';
import { apiKeyField, baseUrlField, makeConfiguration, type ConfigAPI } from './configuration';

export class GoogleProvider extends AIProvider {
  readonly metadata: ProviderMetadata = {
    id: createProviderId('google'),
    name: 'Google',
    description: 'Use Gemini Pro, Gemini Flash, and other Google models',
    icon: GoogleIcon,
    documentationUrl: 'https://ai.google.dev',
    apiKeyUrl: 'https://aistudio.google.com/app/apikey',
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

  override readonly configuration: ConfigAPI<GoogleGenerativeAIProviderSettings> =
    makeConfiguration<GoogleGenerativeAIProviderSettings>()({
      fields: [
        apiKeyField(10, true),
        baseUrlField('https://generativelanguage.googleapis.com/v1beta'),
      ],
    });

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
    this.configuration.assert(params.options);
    const client = google.createGoogleGenerativeAI(params.options);
    return client(params.model);
  }

  getTags(): ModelProviderTags[] {
    return [ModelProviderTags.RequiresApiKey, ModelProviderTags.LongContext];
  }
}
