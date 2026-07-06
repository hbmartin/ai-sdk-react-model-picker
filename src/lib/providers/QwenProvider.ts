type OpenAICompatibleModule = typeof import('@ai-sdk/openai-compatible');
import type { OpenAICompatibleProviderSettings } from '@ai-sdk/openai-compatible';
import type { LanguageModelV2 } from '@ai-sdk/provider';
import {
  AIProvider,
  type ProviderMetadata,
  type ModelConfig,
  type ProviderInstanceParams,
  createProviderId,
  createModelId,
} from '../types';
import { QwenIcon } from '../icons';
import { apiKeyField, baseUrlField, makeConfiguration, type ConfigAPI } from './configuration';

const DEFAULT_BASE_URL = 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1';

export class QwenProvider extends AIProvider {
  override readonly metadata: ProviderMetadata = {
    id: createProviderId('qwen'),
    name: 'Qwen',
    description: 'Qwen 3 and other Alibaba Cloud Model Studio (DashScope) models',
    icon: QwenIcon,
    documentationUrl: 'https://www.alibabacloud.com/help/en/model-studio/models',
    apiKeyUrl: 'https://bailian.console.alibabacloud.com/?tab=model#/api-key',
  };

  override readonly models: ModelConfig[] = [
    {
      id: createModelId('qwen3-max'),
      displayName: 'Qwen3 Max',
      contextLength: 256_000,
      supportsTools: true,
      isDefault: true,
      origin: 'builtin',
      visible: true,
    },
    {
      id: createModelId('qwen3-coder-plus'),
      displayName: 'Qwen3 Coder Plus',
      contextLength: 256_000,
      supportsTools: true,
      origin: 'builtin',
      visible: true,
    },
    {
      id: createModelId('qwen-plus'),
      displayName: 'Qwen Plus',
      contextLength: 128_000,
      supportsTools: true,
      origin: 'builtin',
      visible: true,
    },
    {
      id: createModelId('qwen-turbo'),
      displayName: 'Qwen Turbo',
      contextLength: 128_000,
      supportsTools: true,
      origin: 'builtin',
      visible: true,
    },
  ];

  override readonly configuration: ConfigAPI<OpenAICompatibleProviderSettings> =
    makeConfiguration<OpenAICompatibleProviderSettings>()({
      // Mainland China accounts use https://dashscope.aliyuncs.com/compatible-mode/v1
      fields: [apiKeyField('sk-', true), baseUrlField(DEFAULT_BASE_URL)],
    });

  async createInstance(params: ProviderInstanceParams): Promise<LanguageModelV2> {
    // Dynamic import to avoid bundling if not needed
    let openai: OpenAICompatibleModule;

    try {
      // This will be a peer dependency
      openai = await import('@ai-sdk/openai-compatible');
    } catch {
      throw new Error(
        'Qwen provider requires "@ai-sdk/openai-compatible" to be installed. ' +
          'Please install it with: npm install @ai-sdk/openai-compatible'
      );
    }

    const options = params.options ?? {};
    this.configuration.assertValidConfigAndRemoveEmptyKeys(options);
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    options.baseURL ??= DEFAULT_BASE_URL;
    const client = openai.createOpenAICompatible({
      ...options,
      name: 'qwen',
      baseURL: options.baseURL,
    });
    return client(params.model);
  }
}
