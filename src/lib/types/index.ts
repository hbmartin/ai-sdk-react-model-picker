import type { ComponentType, ReactNode, SVGProps } from 'react';
import type { LanguageModelV2 } from '@ai-sdk/provider';

// Branded types for type safety
export type Brand<T, B> = T & { readonly __brand: B };
export type ProviderId = Brand<string, 'ProviderId'>;
export type ModelId = Brand<string, 'ModelId'>;
export type ApiKey = Brand<string, 'ApiKey'>;
export type ApiUrl = Brand<string, 'ApiUrl'>;

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

export type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

// Provider metadata for display and configuration
export interface ProviderMetadata {
  id: ProviderId;
  name: string;
  description?: string;
  icon?: IconComponent;
  iconUrl?: string;
  documentationUrl?: string;
  apiKeyUrl?: string;
  // Configuration commands or missing keys for validation
  optionalKeys?: string[];
  requiredKeys: (string | [string, string][])[];
}

export function isExclusiveKey(key: string | [string, string][]): key is [string, string][] {
  return typeof key !== 'string';
}

// Provider instance parameters for AI SDK
export interface ProviderInstanceParams {
  model: ModelId;
  apiKey?: ApiKey;
  baseUrl?: ApiUrl;
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
  get(key: string): Promise<string | undefined>;
  set(key: string, value: string | Record<string, string>): Promise<void>;
  remove(key: string): Promise<void>;
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
  // TODO: require callers to use loadModels() instead
  abstract readonly models: ModelConfig[];

  // Optional dynamic model loading
  // eslint-disable-next-line @typescript-eslint/require-await
  async loadModels?(): Promise<ModelConfig[]> {
    return this.models;
  }

  // Validation methods
  abstract validateCredentials(config: Record<string, string>): ValidationResult;
  abstract hasCredentials(config: Record<string, string>): boolean;

  // AI SDK v5 integration - return configured model instance
  abstract createInstance(params: ProviderInstanceParams): Promise<LanguageModelV2>;
}

// Provider registry interface
export interface IProviderRegistry {
  readonly defaultProvider: ProviderId | undefined;
  register(provider: AIProvider): ProviderId;
  getProvider(providerId: ProviderId): AIProvider;
  getAllProviders(): AIProvider[];
  getAllModels(): ModelConfigWithProvider[];
  getModelsForProvider(providerId: ProviderId): ModelConfigWithProvider[];
  getProviderMetadata(providerId: ProviderId): ProviderMetadata;
  hasProvider(providerId: ProviderId): boolean;
  unregister(providerId: ProviderId): boolean;
  clear(): void;
}

// Component prop interfaces
export interface ModelSelectProps {
  // Required props
  readonly storage: StorageAdapter;
  readonly providerRegistry: IProviderRegistry;
  readonly selectedModelId: ModelId | undefined;
  readonly onModelChange: (model: ModelConfigWithProvider) => void;

  // Optional configuration
  readonly roles?: Role[];
  readonly selectedRole?: string;
  readonly onRoleChange?: (roleId: string) => void;
  readonly onConfigureProvider?: (providerId: ProviderId) => void;
  readonly onMissingConfiguration?: (keys: string[]) => void;
  readonly theme?: ThemeConfig;
  readonly className?: string;
  readonly disabled?: boolean;

  // Storage callbacks for credentials
  readonly onSaveApiKey?: (providerId: ProviderId, key: ApiKey) => Promise<void>;
  readonly onLoadApiKey?: (providerId: ProviderId) => Promise<ApiKey | undefined>;
  readonly onSaveConfig?: (config: Record<string, string>) => Promise<void>;
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

// Export branded type constructors
export const createProviderId = (id: string): ProviderId => id as ProviderId;
export const createModelId = (id: string): ModelId => id as ModelId;
export const createApiKey = (key: string): ApiKey => key as ApiKey;
export const createApiUrl = (url: string): ApiUrl => url as ApiUrl;
