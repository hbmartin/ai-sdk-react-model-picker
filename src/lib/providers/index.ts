import { createProviderId, type ProviderCtor, type ProviderId } from '../types';
import { getTelemetry } from '../telemetry';
import { AnthropicProvider } from './AnthropicProvider';
import { AzureProvider } from './AzureProvider';
import { BedrockProvider } from './BedrockProvider';
import { ClaudeCodeProvider } from './ClaudeCodeProvider';
import { CohereProvider } from './CohereProvider';
import { DeepseekProvider } from './DeepseekProvider';
import { GoogleProvider } from './GoogleProvider';
import { LmStudioProvider } from './LmStudioProvider';
import { MistralProvider } from './MistralProvider';
import { MoonshotProvider } from './MoonshotProvider';
import { OllamaProvider } from './OllamaProvider';
import { OpenAIProvider } from './OpenAIProvider';
import { OpenRouterProvider } from './OpenRouterProvider';
import { ProviderRegistry } from './ProviderRegistry';
import { QwenProvider } from './QwenProvider';
import { ZaiProvider } from './ZaiProvider';

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
  [createProviderId('claude-code')]: ClaudeCodeProvider,
  [createProviderId('google')]: GoogleProvider,
  [createProviderId('bedrock')]: BedrockProvider,
  [createProviderId('cohere')]: CohereProvider,
  [createProviderId('deepseek')]: DeepseekProvider,
  [createProviderId('lmstudio')]: LmStudioProvider,
  [createProviderId('ollama')]: OllamaProvider,
  [createProviderId('mistral')]: MistralProvider,
  [createProviderId('moonshot')]: MoonshotProvider,
  [createProviderId('openrouter')]: OpenRouterProvider,
  [createProviderId('qwen')]: QwenProvider,
  [createProviderId('zai')]: ZaiProvider,
  [createProviderId('azure')]: AzureProvider,
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
      const err = error instanceof Error ? error : new Error(String(error));
      getTelemetry()?.onProviderInitError?.(provider.name, err);
    }
  }

  return registry;
}
