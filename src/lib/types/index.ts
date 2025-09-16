import type { ComponentType, ReactNode, SVGProps } from 'react';
import type { LanguageModelV2 } from '@ai-sdk/provider';
import type { ConfigAPI } from '../providers/configuration';

// Branded types for type safety
export type Brand<T, B> = T & { readonly __brand: B };
export type ProviderId = Brand<string, 'ProviderId'>;
export type ModelId = Brand<string, 'ModelId'>;
export type ApiKey = Brand<string, 'ApiKey'>;
export type ApiUrl = Brand<string, 'ApiUrl'>;
const KEY_DELIMITER = '/' as const;
export type ProviderAndModelKey = `${ProviderId}${typeof KEY_DELIMITER}${ModelId}` &
  Brand<string, 'ProviderAndModelKey'>;

// Core model configuration
export interface ModelConfig {
  id: ModelId;
  displayName: string;
  isDefault?: boolean;
  maxTokens?: number;
  supportsVision?: boolean;
  supportsTools?: boolean;
  contextLength?: number;
}

// Model with provider metadata attached
export interface ModelConfigWithProvider {
  model: ModelConfig;
  provider: ProviderMetadata;
}

export interface KeyedModelConfigWithProvider extends ModelConfigWithProvider {
  key: ProviderAndModelKey;
}

export function providerAndModelKey(model: ModelConfigWithProvider): ProviderAndModelKey {
  return `${model.provider.id}${KEY_DELIMITER}${model.model.id}` as ProviderAndModelKey;
}

export function idsFromKey(key: ProviderAndModelKey): { providerId: ProviderId; modelId: ModelId } {
  // Split only at the first delimiter to allow model IDs containing '/'
  const idx = key.indexOf(KEY_DELIMITER);
  if (idx === -1) {
    throw new TypeError('Invalid ProviderAndModelKey format');
  }
  const providerId = key.slice(0, idx) as ProviderId;
  const modelId = key.slice(idx + KEY_DELIMITER.length) as ModelId;
  return { providerId, modelId };
}

export type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

// Provider metadata for display and configuration
export interface ProviderMetadata {
  id: ProviderId;
  name: string;
  description?: string;
  icon: IconComponent;
  iconUrl?: string;
  documentationUrl?: string;
  apiKeyUrl?: string;
}

// Provider instance parameters for AI SDK
export interface ProviderInstanceParams {
  model: ModelId;
  options?: Record<string, string>;
}

// Validation result for credentials and configuration
export interface ValidationResult {
  isValid: boolean;
  error?: string;
  warning?: string;
}

// Storage adapter interface for flexible storage solutions
export interface StorageAdapter {
  get(key: string): PromiseLike<Record<string, string> | undefined>;
  set(key: string, value: Record<string, string>): PromiseLike<void>;
  remove(key: string): PromiseLike<void>;
}

function isObject(value: unknown): value is object {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function assertRecordStringString(value: unknown): asserts value is Record<string, string> {
  if (!isObject(value)) {
    throw new Error('Value is not an object');
  }

  for (const [key, val] of Object.entries(value)) {
    if (typeof val !== 'string') {
      throw new TypeError(`Value at key "${key}" is not a string`);
    }
  }
}

// Provider capability tags
export enum ModelProviderTags {
  RequiresApiKey = 'Requires API Key',
  Local = 'Local',
  Free = 'Free',
  OpenSource = 'Open-Source',
  Vision = 'Vision',
  Tools = 'Tools/Functions',
  LongContext = 'Long Context',
}

// Role configuration for model selection
export interface Role {
  id: string;
  label: string;
  icon?: IconComponent;
}

// Theme configuration for styling
export interface ThemeConfig {
  // CSS variables mapping for non-Tailwind users
  colors?: {
    background?: string;
    foreground?: string;
    primary?: string;
    border?: string;
    muted?: string;
    destructive?: string;
    accent?: string;
  };
  // Custom class overrides
  classNames?: {
    button?: string;
    dropdown?: string;
    dialog?: string;
    input?: string;
    card?: string;
    tag?: string;
  };
}

// Abstract base class for AI providers
export abstract class AIProvider {
  abstract readonly metadata: ProviderMetadata;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  abstract readonly configuration: ConfigAPI<any>;
  // TODO: require callers to use getModels() instead
  abstract readonly models: ModelConfig[];

  hasCredentials(config: Record<string, string>): boolean {
    return this.configuration.validateConfig(config).ok;
  }

  validateCredentials(config: Record<string, string>): ValidationResult {
    const results = this.configuration.validateConfig(config);
    if (!results.ok) {
      return {
        isValid: false,
        error: results.message ?? `${this.metadata.name} configuration is invalid`,
      };
    }

    if (results.fieldValidationWarnings.length > 0) {
      return {
        isValid: true,
        warning: results.fieldValidationWarnings.join('\n'),
      };
    }

    return { isValid: true };
  }

  // Optional dynamic model loading
  // eslint-disable-next-line @typescript-eslint/require-await
  async getModels(): Promise<ModelConfig[]> {
    return this.models;
  }

  getDefaultModel(): ModelConfig {
    return this.models.find((model) => model.isDefault === true) ?? this.models[0];
  }

  // AI SDK v5 integration - return configured model instance
  abstract createInstance(params: ProviderInstanceParams): Promise<LanguageModelV2>;
}

// Provider registry interface
export interface IProviderRegistry {
  readonly defaultProvider: ProviderId | undefined;
  readonly topProviders: ProviderId[];
  register(provider: AIProvider): ProviderId;
  getProvider(providerId: ProviderId): AIProvider;
  getAllProviders(): AIProvider[];
  getAllModels(): ModelConfigWithProvider[];
  getModelsForProvider(providerId: ProviderId): ModelConfigWithProvider[];
  getProviderMetadata(providerId: ProviderId): ProviderMetadata;
  hasProvider(providerId: ProviderId): boolean;
}

// Component prop interfaces
export interface ModelSelectProps {
  // Required props
  readonly storage: StorageAdapter;
  readonly providerRegistry: IProviderRegistry;
  readonly onModelChange?: (model: ModelConfigWithProvider | undefined) => void;

  // Optional configuration
  readonly roles?: Role[];
  readonly selectedRole?: string;
  readonly onRoleChange?: (roleId: string) => void;
  readonly className?: string;
  readonly disabled?: boolean;
}

// Internal component state for forms and dialogs
export interface AddModelFormState {
  isOpen: boolean;
  selectedProvider?: ProviderMetadata;
  formData: Record<string, string>;
  isSubmitting: boolean;
  errors: Record<string, string>;
}

// Helper type for component children
export interface ComponentWithChildren {
  children: ReactNode;
}

export type ProviderCtor = new () => AIProvider;

// Export branded type constructors
export const createProviderId = (id: string): ProviderId => id as ProviderId;
export const createModelId = (id: string): ModelId => id as ModelId;
export const createApiKey = (key: string): ApiKey => key as ApiKey;
export const createApiUrl = (url: string): ApiUrl => url as ApiUrl;
