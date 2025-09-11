// Components
export { ModelSelect } from './components/ModelSelect';
export { ModelCard } from './components/ModelCard';
export { ModelProviderTag } from './components/ModelProviderTag';
export { Toggle } from './components/Toggle';
export { AddModelForm } from './components/AddModelForm';
export { VSCodeThemeAdapter } from './components/VSCodeThemeAdapter';
export type { VSCodeThemeAdapterProps } from './components/VSCodeThemeAdapter';

// Context and hooks
export {
  ModelPickerProvider,
  useModelPicker,
  useSelectedModel,
  useAllModels,
  useModelSelection,
  useProviders,
} from './context';
export type { ModelPickerProviderProps } from './context';

// VSCode/IDE integration hooks
export { useVSCodeContext, getVSCodeThemeColor, getEnvironmentClasses } from './hooks';
export type { VSCodeContext } from './hooks';

// Providers
export { createDefaultRegistry, createPopularProvidersRegistry } from './providers';
export { ProviderRegistry } from './providers/ProviderRegistry';
export { AnthropicProvider } from './providers/AnthropicProvider';
export { OpenAIProvider } from './providers/OpenAIProvider';
export { AzureProvider } from './providers/AzureProvider';
export { GoogleProvider } from './providers/GoogleProvider';
export { MistralProvider } from './providers/MistralProvider';
export { CohereProvider } from './providers/CohereProvider';
export { makeConfiguration, apiKeyField, baseUrlField } from './providers/configuration';
export type {
  ConfigAPI,
  ConfigurationField,
  ConfigTypeValidationResult,
} from './providers/configuration';

// Storage
export { MemoryStorageAdapter } from './storage';

// Types
export type {
  ModelSelectProps,
  ModelConfig,
  ModelConfigWithProvider,
  ProviderMetadata,
  StorageAdapter,
  Role,
  ThemeConfig,
  ModelProviderTags,
  ProviderId,
  ModelId,
  ApiKey,
  ApiUrl,
  AIProvider,
  IProviderRegistry,
  ProviderInstanceParams,
  ValidationResult,
} from './types';

// Core CSS - users must import this
import './styles/globals.css';
