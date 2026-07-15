type OpenAICompatibleModule = typeof import('@ai-sdk/openai-compatible');
import type { OpenAICompatibleProviderSettings } from '@ai-sdk/openai-compatible';
import type { LanguageModelV4 } from '@ai-sdk/provider';
import {
  AIProvider,
  type ProviderMetadata,
  type ModelConfig,
  type ProviderInstanceParams,
  createProviderId,
  createModelId,
} from '../types';
import { ZaiIcon } from '../icons';
import { apiKeyField, baseUrlField, makeConfiguration, type ConfigAPI } from './configuration';

const DEFAULT_BASE_URL = 'https://api.z.ai/api/paas/v4';

export class ZaiProvider extends AIProvider {
  override readonly metadata: ProviderMetadata = {
    id: createProviderId('zai'),
    name: 'Z.ai (GLM)',
    description: 'GLM-4.6 and other Zhipu AI models',
    icon: ZaiIcon,
    documentationUrl: 'https://docs.z.ai/guides/llm/glm-4.6',
    apiKeyUrl: 'https://z.ai/manage-apikey/apikey-list',
  };

  override readonly models: ModelConfig[] = [
    {
      id: createModelId('glm-4.6'),
      displayName: 'GLM 4.6',
      contextLength: 200_000,
      supportsTools: true,
      isDefault: true,
      origin: 'builtin',
      visible: true,
    },
    {
      id: createModelId('glm-4.5'),
      displayName: 'GLM 4.5',
      contextLength: 128_000,
      supportsTools: true,
      origin: 'builtin',
      visible: true,
    },
    {
      id: createModelId('glm-4.5-air'),
      displayName: 'GLM 4.5 Air',
      contextLength: 128_000,
      supportsTools: true,
      origin: 'builtin',
      visible: true,
    },
  ];

  override readonly configuration: ConfigAPI<OpenAICompatibleProviderSettings> =
    makeConfiguration<OpenAICompatibleProviderSettings>()({
      // Mainland China accounts use https://open.bigmodel.cn/api/paas/v4
      fields: [apiKeyField(16, true), baseUrlField(DEFAULT_BASE_URL)],
    });

  async createInstance(params: ProviderInstanceParams): Promise<LanguageModelV4> {
    // Dynamic import to avoid bundling if not needed
    let openai: OpenAICompatibleModule;

    try {
      // This will be a peer dependency
      openai = await import('@ai-sdk/openai-compatible');
    } catch {
      throw new Error(
        'Z.ai provider requires "@ai-sdk/openai-compatible" to be installed. ' +
          'Please install it with: npm install @ai-sdk/openai-compatible'
      );
    }

    const options = params.options ?? {};
    this.configuration.assertValidConfigAndRemoveEmptyKeys(options);
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    options.baseURL ??= DEFAULT_BASE_URL;
    const client = openai.createOpenAICompatible({
      ...options,
      name: 'zai',
      baseURL: options.baseURL,
    });
    return client(params.model);
  }
}
