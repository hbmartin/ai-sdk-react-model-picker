# Basics

A lean guide to the core, controlled usage of the model picker. Use this when you want to wire storage and providers yourself without React context.

## Install

```bash
npm install ai-sdk-react-model-picker
```

Peer deps you’ll likely need:

```bash
npm install react react-dom react-hook-form
# Add only the AI SDK providers you use
npm install @ai-sdk/openai @ai-sdk/anthropic @ai-sdk/google
npm install @ai-sdk/azure @ai-sdk/mistral @ai-sdk/cohere @ai-sdk/amazon-bedrock
npm install @openrouter/ai-sdk-provider
```

Always import styles in your app:

```tsx
import 'ai-sdk-react-model-picker/styles.css';
```

## Quick Start (Controlled)

```tsx
import { ModelSelect, ProviderRegistry } from 'ai-sdk-react-model-picker';
import { OpenAIProvider, AnthropicProvider } from 'ai-sdk-react-model-picker/providers';
import { MemoryStorageAdapter } from 'ai-sdk-react-model-picker/storage';
import 'ai-sdk-react-model-picker/styles.css';

function App() {
  const storage = new MemoryStorageAdapter();
  const registry = new ProviderRegistry();
  registry.register(new OpenAIProvider());
  registry.register(new AnthropicProvider());

  return (
    <ModelSelect
      storage={storage}
      providerRegistry={registry}
      onModelChange={(model) => console.log('Selected model:', model)}
    />
  );
}
```

To create an AI SDK v5 `LanguageModelV2` for the user’s current selection:

```tsx
import { getSdkLanguageModel } from 'ai-sdk-react-model-picker';

const model = await getSdkLanguageModel(storage);
```

## Props and Types

The following code blocks are kept in lockstep with the library’s TypeScript definitions.

### ModelSelect props

From `src/lib/types/index.ts`:

```ts
export interface ModelSelectProps {
  // Required props
  readonly storage: StorageAdapter;
  readonly providerRegistry: IProviderRegistry;
  readonly onModelChange?: (model: ModelConfigWithProvider | undefined) => void;

  // Optional configuration
  readonly roles?: Role[];
  readonly selectedRole?: string;
  readonly onRoleChange?: (roleId: string) => void;
  readonly className?: string;
  readonly disabled?: boolean;
}
```

### StorageAdapter

```ts
export interface StorageAdapter {
  get(key: string): PromiseLike<Record<string, string> | undefined>;
  set(key: string, value: Record<string, string>): PromiseLike<void>;
  remove(key: string): PromiseLike<void>;
}
```

A default in-memory implementation is provided for demos/SSR:

```ts
export class MemoryStorageAdapter implements StorageAdapter { /* ... */ }
```

### ProviderRegistry (public surface)

```ts
export class ProviderRegistry implements IProviderRegistry {
  readonly topProviders: ProviderId[];
  readonly defaultProvider: ProviderId | undefined;

  constructor(defaultProvider?: ProviderId);
  register(provider: AIProvider): ProviderId;
  getProvider(providerId: ProviderId): AIProvider;
  getAllProviders(): AIProvider[];
  getAllModels(): ModelConfigWithProvider[];
  getModelsForProvider(providerId: ProviderId): ModelConfigWithProvider[];
  getProviderMetadata(providerId: ProviderId): ProviderMetadata;
  hasProvider(providerId: ProviderId): boolean;
  getProviderCount(): number;
  unregister(providerId: ProviderId): boolean;
  getProvidersByCapability(
    capability: keyof ModelConfigWithProvider['model']
  ): AIProvider[];
}
```

### getSdkLanguageModel

```ts
export async function getSdkLanguageModel(
  storage: StorageAdapter
): Promise<LanguageModelV2>;
```

## Notes

- MemoryStorageAdapter is not persistent or secure. Provide an adapter suitable for your platform (e.g., IDE secret storage, secure web storage).
- You can also use the `createDefaultRegistry()` helper to auto‑register all built‑in providers.

