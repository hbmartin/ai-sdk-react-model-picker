type OpenAIModule = typeof import('@ai-sdk/openai-compatible');
import type { OpenAICompatibleProviderSettings } from '@ai-sdk/openai-compatible';
import type { LanguageModelV4 } from '@ai-sdk/provider';
import type { ModelConfig, ProviderMetadata, ProviderInstanceParams } from '../types';
import { AIProvider, createModelId, createProviderId, isObject } from '../types';
import { LmStudioIcon } from '../icons';
import { baseUrlField, makeConfiguration, type ConfigAPI } from './configuration';

interface LmStudioModel {
  id: string;
  // '/api/v0/models' returns 'llm', 'vlm', and 'embeddings' today, but the set
  // is not documented as closed — treat any other value as a usable model
  type: string;
  max_context_length?: number;
  capabilities?: string[];
}

interface LmStudioModelListResponse {
  data: LmStudioModel[];
}

function isLmStudioModel(value: unknown): value is LmStudioModel {
  if (!isObject(value)) {
    return false;
  }

  const candidate = value as {
    id?: unknown;
    type?: unknown;
    max_context_length?: unknown;
    capabilities?: unknown;
  };

  if (typeof candidate.id !== 'string' || candidate.id.trim().length === 0) {
    return false;
  }

  if (typeof candidate.type !== 'string') {
    return false;
  }

  if (
    candidate.max_context_length !== undefined &&
    typeof candidate.max_context_length !== 'number'
  ) {
    return false;
  }

  if (
    candidate.capabilities !== undefined &&
    (!Array.isArray(candidate.capabilities) ||
      candidate.capabilities.some((capability) => typeof capability !== 'string'))
  ) {
    return false;
  }

  return true;
}

function isLmStudioModelListResponse(value: unknown): value is LmStudioModelListResponse {
  if (!isObject(value)) {
    return false;
  }

  const candidate = value as { data?: unknown };

  return Array.isArray(candidate.data);
}

export class LmStudioProvider extends AIProvider {
  override readonly metadata: ProviderMetadata = {
    id: createProviderId('lmstudio'),
    name: 'LMStudio',
    description: 'Use local AI models like gpt-oss, Qwen, Gemma, DeepSeek hosted on your computer.',
    icon: LmStudioIcon,
    documentationUrl: 'https://lmstudio.ai/docs/app/api/endpoints/openai',
    fetchModelListPath: '/api/v0/models',
  };

  override readonly models: ModelConfig[] = [];

  override readonly configuration: ConfigAPI<OpenAICompatibleProviderSettings> =
    makeConfiguration<OpenAICompatibleProviderSettings>()({
      fields: [baseUrlField('http://localhost:1234/v1')],
    });

  override async fetchModels(
    options: ProviderInstanceParams['options'] | undefined
  ): Promise<ModelConfig[]> {
    if (this.metadata.fetchModelListPath === undefined) {
      return [];
    }

    this.configuration.assertValidConfigAndRemoveEmptyKeys(options);

    const baseUrl =
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition, sonarjs/different-types-comparison
      options !== undefined && 'baseURL' in options && options.baseURL.trim().length > 0
        ? options.baseURL
        : 'http://localhost:1234/v1';

    let requestUrl: URL;
    try {
      const base = new URL(baseUrl);
      requestUrl = new URL(this.metadata.fetchModelListPath, base.origin);
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      throw new Error(`Invalid LM Studio base URL: ${reason}`, { cause: error });
    }

    const response = await fetch(requestUrl);
    if (!response.ok) {
      throw new Error(
        `Failed to fetch LM Studio models: ${String(response.status)} ${response.statusText}`
      );
    }

    const payload = (await response.json()) as unknown;
    if (!isLmStudioModelListResponse(payload)) {
      throw new TypeError('Unexpected LM Studio model list response payload');
    }

    // Skip entries we don't understand instead of rejecting the whole list;
    // with JIT loading enabled the list includes every downloaded model
    // (loaded or not), and formats vary across LM Studio versions.
    // TODO: consider how discoveredAt effects sorting
    return payload.data
      .filter((model) => isLmStudioModel(model))
      .filter((model) => model.type !== 'embeddings')
      .map((model) => ({
        id: createModelId(model.id),
        displayName: model.id,
        contextLength: model.max_context_length,
        supportsTools: model.capabilities?.includes('tool_use') ?? false,
        supportsVision: model.type === 'vlm' || (model.capabilities?.includes('vision') ?? false),
        discoveredAt: Date.now(),
      }));
  }

  async createInstance(params: ProviderInstanceParams): Promise<LanguageModelV4> {
    // Dynamic import to avoid bundling if not needed
    let openai: OpenAIModule;

    try {
      // This will be a peer dependency
      openai = await import('@ai-sdk/openai-compatible');
    } catch {
      throw new Error(
        'LmStudio provider requires "@ai-sdk/openai-compatible" to be installed. ' +
          'Please install it with: npm install @ai-sdk/openai-compatible'
      );
    }

    this.configuration.assertValidConfigAndRemoveEmptyKeys(params.options);
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    params.options.baseURL ??= 'http://localhost:1234/v1';
    const client = openai.createOpenAICompatible(params.options);
    return client(params.model);
  }
}
