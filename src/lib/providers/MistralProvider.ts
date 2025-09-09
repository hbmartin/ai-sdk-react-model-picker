type MistralModule = typeof import('@ai-sdk/mistral');
import type { MistralProviderSettings } from '@ai-sdk/mistral';
import type { LanguageModelV2 } from '@ai-sdk/provider';
import type {
  ModelConfig,
  ProviderMetadata,
  ProviderInstanceParams,
  ValidationResult,
} from '../types';
import { AIProvider, createProviderId, createModelId, ModelProviderTags } from '../types';
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
      maxTokens: 128_000,
      contextLength: 128_000,
      supportsTools: true,
      isDefault: true,
    },
    {
      id: createModelId('mistral-medium-latest'),
      displayName: 'Mistral Medium',
      maxTokens: 32_768,
      contextLength: 32_768,
      supportsTools: true,
    },
    {
      id: createModelId('mistral-small-latest'),
      displayName: 'Mistral Small',
      maxTokens: 32_768,
      contextLength: 32_768,
      supportsTools: true,
    },
    {
      id: createModelId('codestral-latest'),
      displayName: 'Codestral',
      maxTokens: 32_768,
      contextLength: 32_768,
      supportsTools: true,
    },
  ];

  validateCredentials(config: Record<string, string>): ValidationResult {
    if (typeof config['apiKey'] !== 'string' || config['apiKey'].trim() === '') {
      return {
        isValid: false,
        error: 'Mistral API key is required',
      };
    }
    const apiKey = config['apiKey'];

    if (apiKey.length < 10) {
      return {
        isValid: false,
        error: 'Mistral API key appears to be too short',
      };
    }

    return { isValid: true };
  }

  hasCredentials(config: Record<string, string>): boolean {
    return typeof config['apiKey'] === 'string' && config['apiKey'].trim() !== '';
  }

  async createInstance(params: ProviderInstanceParams): Promise<LanguageModelV2> {
    let mistral: MistralModule;

    try {
      mistral = await import('@ai-sdk/mistral');
    } catch {
      throw new Error(
        'Mistral provider requires "@ai-sdk/mistral" to be installed. ' +
          'Please install it with: npm install @ai-sdk/mistral'
      );
    }

    if (typeof params['apiKey'] !== 'string' || params['apiKey'].trim() === '') {
      throw new TypeError('Mistral API key is required');
    }

    const config: MistralProviderSettings = {
      apiKey: params.apiKey,
    };

    if (params.options) {
      Object.assign(config, params.options);
    }

    const client = mistral.createMistral(config);
    return client(params.model);
  }

  getTags(): ModelProviderTags[] {
    return [ModelProviderTags.RequiresApiKey];
  }
}
