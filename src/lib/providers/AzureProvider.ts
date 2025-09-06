import type { LanguageModelV2 } from '@ai-sdk/provider';
import type {
  ModelConfig,
  ProviderMetadata,
  ProviderInstanceParams,
  ValidationResult,
} from '../types';
import { AIProvider, createProviderId, createModelId, ModelProviderTags } from '../types';
import { AzureIcon } from '../icons';

export class AzureProvider extends AIProvider {
  readonly metadata: ProviderMetadata = {
    id: createProviderId('azure'),
    name: 'Azure OpenAI',
    description: 'Use GPT-4 and other models through Azure OpenAI Service',
    icon: AzureIcon,
    documentationUrl: 'https://docs.microsoft.com/en-us/azure/cognitive-services/openai',
    apiKeyUrl: 'https://portal.azure.com',
    requiredKeys: ['apiKey', 'resourceName'],
  };

  readonly models: ModelConfig[] = [
    {
      id: createModelId('gpt-4o'),
      displayName: 'GPT-4 Omni (Azure)',
      maxTokens: 128_000,
      contextLength: 128_000,
      supportsVision: true,
      supportsTools: true,
      isDefault: true,
    },
    {
      id: createModelId('gpt-4-turbo'),
      displayName: 'GPT-4 Turbo (Azure)',
      maxTokens: 128_000,
      contextLength: 128_000,
      supportsVision: true,
      supportsTools: true,
    },
    {
      id: createModelId('gpt-4'),
      displayName: 'GPT-4 (Azure)',
      maxTokens: 8192,
      contextLength: 8192,
      supportsTools: true,
    },
    {
      id: createModelId('gpt-35-turbo'),
      displayName: 'GPT-3.5 Turbo (Azure)',
      maxTokens: 4096,
      contextLength: 16_385,
      supportsTools: true,
    },
  ];

  validateCredentials(config: Record<string, any>): ValidationResult {
    const { apiKey, resourceName } = config;

    if (!apiKey || typeof apiKey !== 'string') {
      return {
        isValid: false,
        error: 'Azure OpenAI API key is required',
      };
    }

    if (!resourceName || typeof resourceName !== 'string') {
      return {
        isValid: false,
        error: 'Azure OpenAI resource name is required',
      };
    }

    if (apiKey.length < 10) {
      return {
        isValid: false,
        error: 'Azure OpenAI API key appears to be too short',
      };
    }

    return { isValid: true };
  }

  hasCredentials(config: Record<string, any>): boolean {
    return Boolean(config.apiKey && config.resourceName);
  }

  async createInstance(params: ProviderInstanceParams): Promise<LanguageModelV2> {
    let azure: any;

    try {
      azure = await import('@ai-sdk/azure');
    } catch {
      throw new Error(
        'Azure provider requires "@ai-sdk/azure" to be installed. ' +
          'Please install it with: npm install @ai-sdk/azure'
      );
    }

    const config: any = {
      apiKey: params.apiKey,
      resourceName: params.config?.resourceName,
      apiVersion: params.config?.apiVersion || '2024-02-15-preview',
    };

    if (params.options) {
      Object.assign(config, params.options);
    }

    const client = azure.azure(config);
    return client(params.model, params.config);
  }

  getTags(): ModelProviderTags[] {
    return [ModelProviderTags.RequiresApiKey];
  }
}
