import { createProviderId, type ProviderCtor, type ProviderId } from '../types';
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
export const allProviders = {
  [createProviderId('openai')]: OpenAIProvider,
  [createProviderId('anthropic')]: AnthropicProvider,
  [createProviderId('google')]: GoogleProvider,
  [createProviderId('azure')]: AzureProvider,
  [createProviderId('mistral')]: MistralProvider,
  [createProviderId('cohere')]: CohereProvider,
  [createProviderId('bedrock')]: BedrockProvider,
  [createProviderId('moonshot')]: MoonshotProvider,
} satisfies Record<ProviderId, ProviderCtor>;

// Helper function to create a registry with default providers
export function createDefaultRegistry(
  defaultProvider: ProviderId = createProviderId('anthropic')
): ProviderRegistry {
  const registry = new ProviderRegistry(defaultProvider);
  for (const provider of Object.values(allProviders)) {
    try {
      registry.register(new provider());
    } catch (error) {
      console.error(`Provider not available:`, error);
    }
  }

  return registry;
}
