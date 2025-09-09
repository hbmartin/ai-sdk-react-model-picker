import type {
  AIProvider,
  IProviderRegistry,
  ProviderId,
  ModelConfigWithProvider,
  ProviderMetadata,
} from '../types';

/**
 * Central registry for managing AI providers
 * Based on the secure-design pattern but adapted for React model picker
 */
export class ProviderRegistry implements IProviderRegistry {
  private readonly providers = new Map<ProviderId, AIProvider>();
  private storagePrefix = 'model-picker';
  constructor(readonly defaultProvider: ProviderId | undefined) {}

  /**
   * Register a new AI provider
   * @param provider The provider instance to register
   * @returns The provider ID
   * @throws Error if provider is already registered
   */
  register(provider: AIProvider): ProviderId {
    const providerId = provider.metadata.id;

    if (this.providers.has(providerId)) {
      throw new Error(`Provider '${providerId}' already registered`);
    }

    this.providers.set(providerId, provider);
    return providerId;
  }

  /**
   * Get a specific provider by ID
   * @param providerId The provider ID to lookup
   * @returns The provider instance
   * @throws Error if provider not found
   */
  getProvider(providerId: ProviderId): AIProvider {
    const provider = this.providers.get(providerId);

    if (!provider) {
      throw new Error(`Could not find provider '${providerId}' in the registry`);
    }

    return provider;
  }

  /**
   * Get all registered providers
   * @returns Array of all provider instances
   */
  getAllProviders(): AIProvider[] {
    return [...this.providers.values()];
  }

  /**
   * Get all models from all providers with their provider metadata
   * @returns Array of models with provider information attached
   */
  getAllModels(): ModelConfigWithProvider[] {
    return [...this.providers.entries()].flatMap(([providerId, provider]) =>
      provider.models.map((model) => ({
        model,
        provider: this.getProviderMetadata(providerId),
      }))
    );
  }

  /**
   * Get metadata for a specific provider
   * @param providerId The provider ID
   * @returns Provider metadata
   */
  getProviderMetadata(providerId: ProviderId): ProviderMetadata {
    const provider = this.getProvider(providerId);
    return provider.metadata;
  }

  /**
   * Get the total number of registered providers
   * @returns Number of providers
   */
  getProviderCount(): number {
    return this.providers.size;
  }

  /**
   * Check if a provider is registered
   * @param providerId The provider ID to check
   * @returns True if provider exists
   */
  hasProvider(providerId: ProviderId): boolean {
    return this.providers.has(providerId);
  }

  /**
   * Unregister a provider
   * @param providerId The provider ID to remove
   * @returns True if provider was removed, false if not found
   */
  unregister(providerId: ProviderId): boolean {
    return this.providers.delete(providerId);
  }

  /**
   * Clear all registered providers
   */
  clear(): void {
    this.providers.clear();
  }

  /**
   * Set the storage prefix for namespacing provider data
   * @param prefix Storage namespace prefix
   */
  setStoragePrefix(prefix: string): void {
    this.storagePrefix = prefix;
  }

  /**
   * Get the current storage prefix
   * @returns Current storage prefix
   */
  getStoragePrefix(): string {
    return this.storagePrefix;
  }

  /**
   * Get all models for a specific provider
   * @param providerId The provider ID
   * @returns Array of models for the provider
   */
  getModelsForProvider(providerId: ProviderId): ModelConfigWithProvider[] {
    const provider = this.getProvider(providerId);

    return provider.models.map((model) => ({
      model,
      provider: provider.metadata,
    }));
  }

  /**
   * Find providers that support a specific capability
   * @param capability The capability to search for (e.g., vision, tools)
   * @returns Array of providers supporting the capability
   */
  getProvidersByCapability(capability: keyof ModelConfigWithProvider['model']): AIProvider[] {
    return this.getAllProviders().filter((provider) =>
      provider.models.some((model) => model[capability] === true)
    );
  }
}
