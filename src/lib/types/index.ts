import type { ReactNode } from 'react';
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
  metadata?: Record<string, any>;
  // Additional provider-specific parameters
  parameters?: Record<string, any>;
}

// Model with provider metadata attached
export interface ModelConfigWithProvider {
  model: ModelConfig;
  provider: ProviderMetadata;
}

// Provider metadata for display and configuration
export interface ProviderMetadata {
  id: ProviderId;
  name: string;
  description?: string;
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  iconUrl?: string;
  documentationUrl?: string;
  apiKeyUrl?: string;
  // Configuration commands or missing keys for validation
  configurationKeys?: string[];
  requiredKeys?: string[];
}

// Provider instance parameters for AI SDK
export interface ProviderInstanceParams {
  model: ModelId;
  apiKey?: ApiKey;
  apiBase?: ApiUrl;
  // Additional provider-specific configuration
  config?: Record<string, any>;
  options?: Record<string, any>;
}

// Validation result for credentials and configuration
export interface ValidationResult {
  isValid: boolean;
  error?: string;
  warning?: string;
}

// Storage adapter interface for flexible storage solutions
export interface StorageAdapter {
  get<T>(key: string): Promise<T | undefined>;
  set<T>(key: string, value: T): Promise<void>;
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
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
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
  abstract readonly models: ModelConfig[];

  // Validation methods
  abstract validateCredentials(config: Record<string, any>): ValidationResult;
  abstract hasCredentials(config: Record<string, any>): boolean;

  // AI SDK v5 integration - return configured model instance
  abstract createInstance(params: ProviderInstanceParams): Promise<LanguageModelV2>;

  // Optional dynamic model loading
  async loadModels?(_storage: StorageAdapter): Promise<ModelConfig[]> {
    return this.models;
  }
}

// Provider registry interface
export interface IProviderRegistry {
  register(provider: AIProvider): ProviderId;
  getProvider(providerId: ProviderId): AIProvider;
  getAllProviders(): AIProvider[];
  getAllModels(): ModelConfigWithProvider[];
  getProviderMetadata(providerId: ProviderId): ProviderMetadata;
  hasProvider(providerId: ProviderId): boolean;
  unregister(providerId: ProviderId): boolean;
  clear(): void;
}

// Component prop interfaces
export interface ModelSelectProps {
  // Required props
  storage: StorageAdapter;
  providers: IProviderRegistry;
  selectedModelId: ModelId | null;
  onModelChange: (model: ModelConfigWithProvider) => void;

  // Optional configuration
  roles?: Role[];
  selectedRole?: string;
  onRoleChange?: (roleId: string) => void;
  onConfigureProvider?: (providerId: ProviderId) => void;
  onMissingConfiguration?: (keys: string[]) => void;
  theme?: ThemeConfig;
  className?: string;
  disabled?: boolean;

  // Storage callbacks for credentials
  onSaveApiKey?: (providerId: ProviderId, key: ApiKey) => Promise<void>;
  onLoadApiKey?: (providerId: ProviderId) => Promise<ApiKey | undefined>;
  onSaveConfig?: (config: Record<string, any>) => Promise<void>;
}

// Internal component state for forms and dialogs
export interface AddModelFormState {
  isOpen: boolean;
  selectedProvider?: ProviderMetadata;
  formData: Record<string, any>;
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
