type BedrockModule = typeof import('@ai-sdk/amazon-bedrock');
import type { AmazonBedrockProviderSettings } from '@ai-sdk/amazon-bedrock';
import type { LanguageModelV2 } from '@ai-sdk/provider';
import {
  AIProvider,
  type ProviderMetadata,
  type ModelConfig,
  type ProviderInstanceParams,
  createProviderId,
  createModelId,
} from '../types';
import { BedrockIcon } from '../icons';
import { makeConfiguration, type ConfigAPI } from './configuration';

const awsRegionRegex = /^[a-z]{2}-[a-z]+-\d+$/;
const awsAccessKeyIdRegex = /^[\dA-Z]{20}$/;
const awsSecretAccessKeyRegex = /^[\d+/=A-Za-z]{40}$/;

export class BedrockProvider extends AIProvider {
  override readonly metadata: ProviderMetadata = {
    id: createProviderId('bedrock'),
    name: 'AWS Bedrock',
    description: 'AWS Bedrock unified API for multiple foundation models',
    icon: BedrockIcon,
    documentationUrl: 'https://docs.aws.amazon.com/bedrock/',
    apiKeyUrl: 'https://ai-sdk.dev/providers/ai-sdk-providers/amazon-bedrock#authentication',
  };

  override readonly models: ModelConfig[] = [
    // Anthropic models on Bedrock
    {
      id: createModelId('anthropic.claude-3-5-sonnet-20241022-v2:0'),
      displayName: 'Claude 3.5 Sonnet v2',
      isDefault: true,
      maxTokens: 200_000,
      supportsVision: true,
    },
    {
      id: createModelId('anthropic.claude-3-5-sonnet-20240620-v1:0'),
      displayName: 'Claude 3.5 Sonnet',
      maxTokens: 200_000,
      supportsVision: true,
    },
    {
      id: createModelId('anthropic.claude-3-opus-20240229-v1:0'),
      displayName: 'Claude 3 Opus',
      maxTokens: 200_000,
      supportsVision: true,
    },
    {
      id: createModelId('anthropic.claude-3-sonnet-20240229-v1:0'),
      displayName: 'Claude 3 Sonnet',
      maxTokens: 200_000,
      supportsVision: true,
    },
    {
      id: createModelId('anthropic.claude-3-haiku-20240307-v1:0'),
      displayName: 'Claude 3 Haiku',
      maxTokens: 200_000,
      supportsVision: true,
    },

    // Amazon models
    {
      id: createModelId('amazon.nova-pro-v1:0'),
      displayName: 'Amazon Nova Pro',
      maxTokens: 300_000,
      supportsVision: true,
    },
    {
      id: createModelId('amazon.nova-lite-v1:0'),
      displayName: 'Amazon Nova Lite',
      maxTokens: 300_000,
      supportsVision: true,
    },
    {
      id: createModelId('amazon.nova-micro-v1:0'),
      displayName: 'Amazon Nova Micro',
      maxTokens: 128_000,
      supportsVision: false,
    },

    // Meta models
    {
      id: createModelId('meta.llama3-2-90b-instruct-v1:0'),
      displayName: 'Llama 3.2 90B Instruct',
      maxTokens: 131_072,
      supportsVision: false,
    },
    {
      id: createModelId('meta.llama3-2-11b-instruct-v1:0'),
      displayName: 'Llama 3.2 11B Instruct',
      maxTokens: 131_072,
      supportsVision: false,
    },
    {
      id: createModelId('meta.llama3-1-405b-instruct-v1:0'),
      displayName: 'Llama 3.1 405B Instruct',
      maxTokens: 131_072,
      supportsVision: false,
    },
    {
      id: createModelId('meta.llama3-1-70b-instruct-v1:0'),
      displayName: 'Llama 3.1 70B Instruct',
      maxTokens: 131_072,
      supportsVision: false,
    },
    {
      id: createModelId('meta.llama3-1-8b-instruct-v1:0'),
      displayName: 'Llama 3.1 8B Instruct',
      maxTokens: 131_072,
      supportsVision: false,
    },

    // Mistral models
    {
      id: createModelId('mistral.mistral-large-2407-v1:0'),
      displayName: 'Mistral Large 2407',
      maxTokens: 131_072,
      supportsVision: false,
    },
    {
      id: createModelId('mistral.mistral-small-2402-v1:0'),
      displayName: 'Mistral Small 2402',
      maxTokens: 32_768,
      supportsVision: false,
    },
    {
      id: createModelId('mistral.mixtral-8x7b-instruct-v0:1'),
      displayName: 'Mixtral 8x7B Instruct',
      maxTokens: 32_768,
      supportsVision: false,
    },

    // AI21 models
    {
      id: createModelId('ai21.jamba-1-5-large-v1:0'),
      displayName: 'AI21 Jamba 1.5 Large',
      maxTokens: 262_144,
      supportsVision: false,
    },
    {
      id: createModelId('ai21.jamba-1-5-mini-v1:0'),
      displayName: 'AI21 Jamba 1.5 Mini',
      maxTokens: 262_144,
      supportsVision: false,
    },

    // Cohere models
    {
      id: createModelId('cohere.command-r-plus-v1:0'),
      displayName: 'Cohere Command R+',
      maxTokens: 128_000,
      supportsVision: false,
    },
    {
      id: createModelId('cohere.command-r-v1:0'),
      displayName: 'Cohere Command R',
      maxTokens: 128_000,
      supportsVision: false,
    },
  ];

  override readonly configuration: ConfigAPI<AmazonBedrockProviderSettings> =
    makeConfiguration<AmazonBedrockProviderSettings>()({
      fields: [
        {
          key: 'region',
          label: 'AWS Region',
          placeholder: 'us-east-1',
          required: true,
          validation: (value: string | undefined) => {
            if (value === undefined) {
              return { error: 'AWS region is required' };
            }
            if (!awsRegionRegex.test(value)) {
              return { error: 'AWS region format is invalid.' };
            }
            return undefined;
          },
        },
        {
          key: 'accessKeyId',
          label: 'Access Key ID',
          placeholder: 'AKIA...',
          required: true,
          validation: (value: string | undefined) => {
            if (value === undefined) {
              return { error: 'Access key ID is required' };
            }
            if (!awsAccessKeyIdRegex.test(value)) {
              return {
                error: 'Access key ID must be exactly 20 upper case or numeric characters.',
              };
            }
            return undefined;
          },
        },
        {
          key: 'secretAccessKey',
          label: 'Secret Access Key',
          placeholder: '...',
          required: true,
          validation: (value: string | undefined) => {
            if (value === undefined) {
              return { error: 'Secret access key is required' };
            }
            if (!awsSecretAccessKeyRegex.test(value)) {
              return {
                error: 'Secret access key must be exactly 40 characters.',
              };
            }
            return undefined;
          },
        },
        {
          key: 'sessionToken',
          label: 'Session Token',
          placeholder: '...',
          required: false,
        },
      ],
    });

  async createInstance(params: ProviderInstanceParams): Promise<LanguageModelV2> {
    // Dynamic import to avoid bundling if not needed
    let bedrock: BedrockModule;

    try {
      // This will be a peer dependency
      bedrock = await import('@ai-sdk/amazon-bedrock');
    } catch {
      throw new Error(
        'Bedrock provider requires "@ai-sdk/amazon-bedrock" to be installed. ' +
          'Please install it with: npm install @ai-sdk/amazon-bedrock'
      );
    }

    this.configuration.assertValidConfigAndRemoveEmptyKeys(params.options);
    const client = bedrock.createAmazonBedrock(params.options);
    return client(params.model);
  }
}
