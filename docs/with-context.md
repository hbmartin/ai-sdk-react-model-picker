# With Context

Use the optional React context to share model state, configuration callbacks, and roles across multiple components.

## Overview

- Wrap your tree with `ModelPickerProvider`.
- Consume state and actions via hooks like `useModelSelection()` and `useProviders()`.
- `ModelSelect` works inside the provider without passing storage/registry props.

## Example

```tsx
import {
  ModelPickerProvider,
  useModelSelection,
  useProviders,
  ModelSelect,
} from 'ai-sdk-react-model-picker';
import { ProviderRegistry, AnthropicProvider, OpenAIProvider } from 'ai-sdk-react-model-picker/providers';
import { MemoryStorageAdapter } from 'ai-sdk-react-model-picker/storage';
import 'ai-sdk-react-model-picker/styles.css';

const storage = new MemoryStorageAdapter();
const registry = new ProviderRegistry();
registry.register(new AnthropicProvider());
registry.register(new OpenAIProvider());

export function App() {
  return (
    <ModelPickerProvider
      storage={storage}
      providerRegistry={registry}
      onConfigureProvider={(id) => console.log('Configure provider:', id)}
      onMissingConfiguration={(keys) => console.warn('Missing config keys:', keys)}
    >
      <Toolbar />
      <Chat />
    </ModelPickerProvider>
  );
}

function Toolbar() {
  // ModelSelect reads storage/registry from context
  return <ModelSelect />;
}

function Chat() {
  const { selectedModel, selectedRole, selectRole } = useModelSelection();
  const { configureProvider } = useProviders();

  return (
    <div>
      <p>Model: {selectedModel?.model.displayName ?? 'None selected'}</p>
      <p>Role: {selectedRole ?? 'default'}</p>
      <button onClick={() => selectRole('chat')}>Chat role</button>
      <button onClick={() => configureProvider(selectedModel!.provider.id)}>Edit provider</button>
    </div>
  );
}
```

## Props and Types

The following code blocks mirror the library’s TypeScript definitions.

### ModelPickerProviderProps

From `src/lib/context/index.ts`:

```ts
export interface ModelPickerProviderProps {
  children: ReactNode;
  providerRegistry: IProviderRegistry;
  storage: StorageAdapter;
  initialModelId?: ModelId;
  initialRole?: string;
  roles?: Role[];
  theme?: ThemeConfig;
  onConfigureProvider: (providerId: ProviderId) => void;
  onMissingConfiguration: (keys: string[]) => void;
}
```

### useModelSelection

```ts
export function useModelSelection(): {
  selectedModelId: ModelId | undefined;
  selectedRole: string | undefined;
  selectedModel: ModelConfigWithProvider | undefined;
  isLoading: boolean;
  error: string | undefined;
  selectModel: (model: ModelConfigWithProvider | undefined) => void;
  selectRole: (roleId: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | undefined) => void;
};
```

### useProviders

```ts
export function useProviders(): {
  providerRegistry: IProviderRegistry;
  storage: StorageAdapter;
  configureProvider: (providerId: ProviderId) => void;
  handleMissingConfiguration: (keys: string[]) => void;
};
```

## Roles and Theme

- Provide `roles` to the provider to enable toggling (e.g., chat vs edit). `ModelSelect` will render a simple toggle when two roles are present.
- `theme` allows advanced styling via CSS variables and class name overrides.

## Notes

- Inside the provider, `ModelSelect` ignores its `storage` and `providerRegistry` props and uses context values. You can still pass `onModelChange` to observe selection changes.
- Use `getSdkLanguageModel(storage)` if you need to construct an AI SDK model instance outside the React tree; inside context, you can read `selectedModel` and build as needed.

