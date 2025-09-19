// Styles (ensure CSS is emitted for consumers who rely on the exported styles.css)
import './styles/globals.css';

// Components
export { ModelSelect } from './components/ModelSelect';
export { ModelCard } from './components/ModelCard';
export { ModelProviderTag } from './components/ModelProviderTag';
export { Toggle } from './components/Toggle';
export { AddModelForm } from './components/AddModelForm';

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
export { useVSCodeContext, getEnvironmentClasses, useUniversalTheme } from './hooks';
export type { VSCodeContext, UniversalTheme } from './hooks';
export { useProviderModels } from './hooks/useProviderModels';
export { useModelsByProvider } from './hooks/useModelsByProvider';
export { flattenAndSortAvailableModels } from './hooks/catalogUtils';

// Providers
export { createDefaultRegistry, allProviders } from './providers';
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
export { assertRecordStringString, idsFromKey } from './types';
export { getSelectedProviderAndModelKey, getProviderConfiguration } from './storage/repository';
export { ModelCatalog } from './catalog/ModelCatalog';

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
  ProviderAndModelKey,
} from './types';

// Utils
export { getSdkLanguageModel } from './utils';
