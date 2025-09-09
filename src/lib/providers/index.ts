import { createProviderId } from '../types';
import { AnthropicProvider } from './AnthropicProvider';
import { AzureProvider } from './AzureProvider';
import { CohereProvider } from './CohereProvider';
import { GoogleProvider } from './GoogleProvider';
import { MistralProvider } from './MistralProvider';
import { OpenAIProvider } from './OpenAIProvider';
import { ProviderRegistry } from './ProviderRegistry';

export type {
  AIProvider,
  IProviderRegistry,
  ProviderMetadata,
  ModelConfig,
  ModelConfigWithProvider,
  ProviderInstanceParams,
  ValidationResult,
  ProviderId,
  ModelId,
  ApiKey,
  ApiUrl,
} from '../types';

// Helper function to create a registry with default providers
export function createDefaultRegistry(): ProviderRegistry {
  const registry = new ProviderRegistry(createProviderId('anthropic'));

  try {
    registry.register(new OpenAIProvider());
  } catch (error) {
    console.warn('OpenAI provider not available:', error);
  }

  try {
    registry.register(new AnthropicProvider());
  } catch (error) {
    console.warn('Anthropic provider not available:', error);
  }

  try {
    registry.register(new GoogleProvider());
  } catch (error) {
    console.warn('Google provider not available:', error);
  }

  try {
    registry.register(new AzureProvider());
  } catch (error) {
    console.warn('Azure provider not available:', error);
  }

  try {
    registry.register(new MistralProvider());
  } catch (error) {
    console.warn('Mistral provider not available:', error);
  }

  try {
    registry.register(new CohereProvider());
  } catch (error) {
    console.warn('Cohere provider not available:', error);
  }

  return registry;
}

// Popular providers for quick setup
export function createPopularProvidersRegistry(): ProviderRegistry {
  const registry = new ProviderRegistry(createProviderId('anthropic'));

  try {
    registry.register(new OpenAIProvider());
  } catch (error) {
    console.warn('OpenAI provider not available:', error);
  }
  try {
    registry.register(new AnthropicProvider());
  } catch (error) {
    console.warn('Anthropic provider not available:', error);
  }
  try {
    registry.register(new GoogleProvider());
  } catch (error) {
    console.warn('Google provider not available:', error);
  }

  return registry;
}
