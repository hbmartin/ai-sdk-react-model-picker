type CohereModule = typeof import('@ai-sdk/cohere');
import type { CohereProviderSettings } from '@ai-sdk/cohere';
import type { LanguageModelV2 } from '@ai-sdk/provider';
import type {
  ModelConfig,
  ProviderMetadata,
  ProviderInstanceParams,
  ValidationResult,
} from '../types';
import { AIProvider, createProviderId, createModelId, ModelProviderTags } from '../types';
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
      maxTokens: 128_000,
      contextLength: 128_000,
      supportsTools: true,
      isDefault: true,
    },
    {
      id: createModelId('command-r'),
      displayName: 'Command R',
      maxTokens: 128_000,
      contextLength: 128_000,
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
    if (typeof config['apiKey'] !== 'string' || config['apiKey'].trim() === '') {
      return {
        isValid: false,
        error: 'Cohere API key is required',
      };
    }
    const apiKey = config['apiKey'];

    if (apiKey.length < 10) {
      return {
        isValid: false,
        error: 'Cohere API key appears to be too short',
      };
    }

    return { isValid: true };
  }

  hasCredentials(config: Record<string, any>): boolean {
    return typeof config['apiKey'] === 'string' && config['apiKey'].trim() !== '';
  }

  async createInstance(params: ProviderInstanceParams): Promise<LanguageModelV2> {
    let cohere: CohereModule;

    try {
      cohere = await import('@ai-sdk/cohere');
    } catch {
      throw new Error(
        'Cohere provider requires "@ai-sdk/cohere" to be installed. ' +
          'Please install it with: npm install @ai-sdk/cohere'
      );
    }

    if (typeof params['apiKey'] !== 'string' || params['apiKey'].trim() === '') {
      throw new TypeError('Cohere API key is required');
    }

    const config: CohereProviderSettings = {
      apiKey: params.apiKey,
    };

    if (params.apiBase) {
      config.baseURL = params.apiBase;
    }

    if (params.options) {
      Object.assign(config, params.options);
    }

    const client = cohere.createCohere(config);
    return client(params.model);
  }

  getTags(): ModelProviderTags[] {
    return [ModelProviderTags.RequiresApiKey];
  }
}
