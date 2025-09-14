import { AIProvider, createProviderId, type ProviderId } from '../types';
import { AnthropicProvider } from './AnthropicProvider';
import { AzureProvider } from './AzureProvider';
import { BedrockProvider } from './BedrockProvider';
import { CohereProvider } from './CohereProvider';
import { GoogleProvider } from './GoogleProvider';
import { MistralProvider } from './MistralProvider';
import { MoonshotProvider } from './MoonshotProvider';
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

// All providers that are available, keyed by provider id
export const allProviders: Record<ProviderId, { new (): AIProvider }> = {
  [createProviderId('openai')]: OpenAIProvider,
  [createProviderId('anthropic')]: AnthropicProvider,
  [createProviderId('google')]: GoogleProvider,
  [createProviderId('azure')]: AzureProvider,
  [createProviderId('mistral')]: MistralProvider,
  [createProviderId('cohere')]: CohereProvider,
  [createProviderId('bedrock')]: BedrockProvider,
  [createProviderId('moonshot')]: MoonshotProvider,
};

// Helper function to create a registry with default providers
export function createDefaultRegistry(
  defaultProvider: ProviderId = createProviderId('anthropic')
): ProviderRegistry {
  const registry = new ProviderRegistry(defaultProvider);
  for (const providerId in allProviders) {
    try {
      registry.register(new allProviders[providerId as ProviderId]());
    } catch (error) {
      console.warn(`${providerId} provider not available:`, error);
    }
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
