type OllamaModule = typeof import('ollama-ai-provider-v2');
import type { LanguageModelV2 } from '@ai-sdk/provider';
import type { ModelConfig, ProviderMetadata, ProviderInstanceParams } from '../types';
import { AIProvider, createModelId, createProviderId, isObject } from '../types';
import { OllamaIcon } from '../icons';
import { baseUrlField, makeConfiguration, type ConfigAPI } from './configuration';
import type { OllamaProviderSettings } from 'ollama-ai-provider-v2';

interface OllamaModelDetails {
  format?: string;
  family?: string;
  families?: string[] | null;
  parameter_size?: string;
  quantization_level?: string;
}

interface OllamaModel {
  name: string;
  modified_at?: string;
  size?: number;
  digest?: string;
  details?: OllamaModelDetails | null;
}

interface OllamaModelListResponse {
  models: OllamaModel[];
}

function isOllamaModel(value: unknown): value is OllamaModel {
  if (!isObject(value)) {
    return false;
  }

  const candidate = value as {
    name?: unknown;
    modified_at?: unknown;
    size?: unknown;
    digest?: unknown;
    details?: unknown;
  };

  if (typeof candidate.name !== 'string' || candidate.name.trim().length === 0) {
    return false;
  }

  if (candidate.modified_at !== undefined && typeof candidate.modified_at !== 'string') {
    return false;
  }

  if (candidate.size !== undefined && typeof candidate.size !== 'number') {
    return false;
  }

  if (candidate.digest !== undefined && typeof candidate.digest !== 'string') {
    return false;
  }

  if (candidate.details !== undefined && candidate.details !== null) {
    if (!isObject(candidate.details)) {
      return false;
    }

    const details = candidate.details as {
      families?: unknown;
    };

    if (
      details.families !== undefined &&
      details.families !== null &&
      (!Array.isArray(details.families) ||
        details.families.some((family) => typeof family !== 'string'))
    ) {
      return false;
    }
  }

  return true;
}

function isOllamaModelListResponse(value: unknown): value is OllamaModelListResponse {
  if (!isObject(value)) {
    return false;
  }

  const candidate = value as { models?: unknown };

  if (!Array.isArray(candidate.models)) {
    return false;
  }

  return candidate.models.every((item) => isOllamaModel(item));
}

export class OllamaProvider extends AIProvider {
  override readonly metadata: ProviderMetadata = {
    id: createProviderId('ollama'),
    name: 'Ollama',
    description: 'Use local AI models like gpt-oss, Qwen, Gemma, DeepSeek hosted on your computer.',
    icon: OllamaIcon,
    documentationUrl: 'https://docs.ollama.com/quickstart',
    fetchModelListPath: '/api/tags',
  };

  override readonly models: ModelConfig[] = [];

  override readonly configuration: ConfigAPI<OllamaProviderSettings> =
    makeConfiguration<OllamaProviderSettings>()({
      fields: [baseUrlField('http://localhost:11434/api')],
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
        : 'http://localhost:11434/api';

    let requestUrl: URL;
    try {
      const base = new URL(baseUrl);
      requestUrl = new URL(this.metadata.fetchModelListPath, base.origin);
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      throw new Error(`Invalid Ollama base URL: ${reason}`);
    }

    const response = await fetch(requestUrl);
    if (!response.ok) {
      throw new Error(
        `Failed to fetch Ollama models: ${String(response.status)} ${response.statusText}`
      );
    }

    const payload = (await response.json()) as unknown;
    if (!isOllamaModelListResponse(payload)) {
      throw new TypeError('Unexpected Ollama model list response payload');
    }

    // TODO: consider how discoveredAt effects sorting
    return payload.models.map((model) => ({
      id: createModelId(model.name),
      displayName: model.name,
      contextLength: undefined,
      supportsTools: false,
      discoveredAt: Date.now(),
    }));
  }

  // TODO: need to handle case where params.options is undefined?
  async createInstance(params: ProviderInstanceParams): Promise<LanguageModelV2> {
    // Dynamic import to avoid bundling if not needed
    let ollama: OllamaModule;

    try {
      // This will be a peer dependency
      ollama = await import('ollama-ai-provider-v2');
    } catch {
      throw new Error(
        'Ollama provider requires "ollama-ai-provider-v2" to be installed. ' +
          'Please install it with: npm install ollama-ai-provider-v2'
      );
    }

    const options = params.options ?? {};

    const baseURL = options.baseURL?.trim().length ? options.baseURL : 'http://localhost:11434/api';
    const compatibility =
      options.compatibility === 'compatible' || options.compatibility === 'strict'
        ? options.compatibility
        : 'strict';

    const clientOptions: OllamaProviderSettings = {
      baseURL,
      compatibility,
    };
    this.configuration.assertValidConfigAndRemoveEmptyKeys(options);

    const client = ollama.createOllama(clientOptions);
    return client(params.model);
  }
}
