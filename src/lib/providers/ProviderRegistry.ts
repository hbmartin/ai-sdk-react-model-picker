import {
  type AIProvider,
  type IProviderRegistry,
  type ProviderId,
  type ProviderMetadata,
  createProviderId,
} from '../types';

export class ProviderRegistry implements IProviderRegistry {
  readonly topProviders = [
    createProviderId('anthropic'),
    createProviderId('openai'),
    createProviderId('google'),
  ];
  private readonly providers = new Map<ProviderId, AIProvider>();
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
}
