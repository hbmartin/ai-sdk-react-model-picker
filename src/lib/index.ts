// Main exports - only the essentials for simple usage
export { ModelSelect } from './components/ModelSelect';
export { ModelCard } from './components/ModelCard';
export { ModelProviderTag } from './components/ModelProviderTag';
export { Toggle } from './components/Toggle';

// Essential types
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
} from './types';

// Core CSS - users must import this
import './styles/globals.css';
