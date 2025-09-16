# AI SDK React Model Picker

A flexible, theme-aware React component library for selecting and managing AI models. Built for seamless integration with [Vercel's AI SDK v5](https://ai-sdk.dev/), with special support for VSCode extensions and JetBrains IDEs. Based on [Continue.dev](https://github.com/continuedev/continue).

[![npm version](https://badge.fury.io/js/ai-sdk-react-model-picker.svg)](https://www.npmjs.com/package/ai-sdk-react-model-picker)
[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/hbmartin/ai-sdk-react-model-picker)
[![CI](https://github.com/hbmartin/ai-sdk-react-model-picker/actions/workflows/ci.yml/badge.svg)](https://github.com/hbmartin/ai-sdk-react-model-picker/actions/workflows/ci.yml)
[![NPM License](https://img.shields.io/npm/l/ai-sdk-react-model-picker?color=blue)](https://github.com/hbmartin/ai-sdk-react-model-picker/blob/main/LICENSE.txt)
[![Storybook](https://img.shields.io/badge/Storybook-white?logo=storybook)](https://hbmartin.github.io/ai-sdk-react-model-picker)

## Features

🎯 **Controlled Where It Matters** - Storage-driven selection with optional callbacks  
🔧 **Provider Extensibility** - Easy-to-extend provider system with built-in validation  
🎨 **Theme Aware** - Auto-detects VSCode, JetBrains IDEs, and web environments  
⚡ **AI SDK v5 Ready** - Direct integration with Vercel AI SDK  
📦 **Progressive Enhancement** - Simple defaults, advanced APIs via subpath exports  
🔒 **Type Safe** - Full TypeScript support with branded types  
💾 **Flexible Storage** - Pluggable storage adapters (localStorage, sessionStorage, custom)  
🎭 **Minimal Dependencies** - No Redux, React Router, or IDE-specific APIs

## Installation

```bash
npm install ai-sdk-react-model-picker
```

### Peer Dependencies

Install the AI SDK providers you plan to use:

```bash
# Core (always needed)
npm install react react-dom react-hook-form

# AI SDK providers (install as needed)
npm install @ai-sdk/openai @ai-sdk/anthropic @ai-sdk/google
npm install @ai-sdk/azure @ai-sdk/mistral @ai-sdk/cohere @ai-sdk/amazon-bedrock
npm install @openrouter/ai-sdk-provider
```

### Important: CSS Import

The library's CSS must be imported separately in your application:

```tsx
// Import at the top of your app or entry file
import 'ai-sdk-react-model-picker/styles.css';
```

## Setup by Environment

### Web Applications

#### Standard React App Setup

```tsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import { ModelSelect } from 'ai-sdk-react-model-picker';
import {
  ProviderRegistry,
  OpenAIProvider,
  AnthropicProvider,
} from 'ai-sdk-react-model-picker/providers';
import { MemoryStorageAdapter } from 'ai-sdk-react-model-picker/storage';
import 'ai-sdk-react-model-picker/styles.css'; // Required!

function App() {
  // Setup providers and storage
  const storage = new MemoryStorageAdapter();
  const registry = new ProviderRegistry();
  registry.register(new OpenAIProvider());
  registry.register(new AnthropicProvider());

  const handleModelChange = async (_model) => {
    // Selection is persisted to storage by the component
    // You can react to changes here if needed
  };

  return (
    <ModelSelect
      storage={storage}
      providerRegistry={registry}
      onModelChange={handleModelChange}
    />
  );
}

// Mount to DOM
const container = document.getElementById('root');
const root = createRoot(container);
root.render(<App />);
```

#### Webpack Configuration for VSCode Extension

```javascript
// webpack.config.js
module.exports = [
  // Extension config
  {
    target: 'node',
    entry: './src/extension.ts',
    // ... extension config
  },
  // Webview config
  {
    target: 'web',
    entry: './src/webview/index.tsx',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'webview.js',
    },
    externals: {
      vscode: 'commonjs vscode',
    },
    resolve: {
      extensions: ['.ts', '.tsx', '.js', '.jsx'],
      alias: {
        // Ensure single React instance
        react: path.resolve('./node_modules/react'),
        'react-dom': path.resolve('./node_modules/react-dom'),
      },
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: 'ts-loader',
          exclude: /node_modules/,
        },
        {
          test: /\.css$/,
          use: ['style-loader', 'css-loader'],
        },
      ],
    },
  },
];
```

## Quick Start

```tsx
import { ModelSelect } from 'ai-sdk-react-model-picker';
import {
  ProviderRegistry,
  OpenAIProvider,
  AnthropicProvider,
} from 'ai-sdk-react-model-picker/providers';
import { MemoryStorageAdapter } from 'ai-sdk-react-model-picker/storage';
import 'ai-sdk-react-model-picker/styles.css';

function App() {
  // Setup providers and storage
  const storage = new MemoryStorageAdapter();
  const registry = new ProviderRegistry();
  registry.register(new OpenAIProvider());
  registry.register(new AnthropicProvider());

  const handleModelChange = async (_model) => {
    // When you need a LanguageModelV2 instance for the selected model:
    // import { getSdkLanguageModel } from 'ai-sdk-react-model-picker';
    // const aiModel = await getSdkLanguageModel(storage);
  };

  return (
    <ModelSelect
      storage={storage}
      providerRegistry={registry}
      onModelChange={handleModelChange}
    />
  );
}
```

## Core Concepts

### Providers

Providers represent AI service providers (OpenAI, Anthropic, etc.) and handle:

- Model definitions and capabilities
- API key validation
- AI SDK client creation

Built-in providers:

- **OpenAI** - GPT-4o, GPT-4 Turbo, GPT-3.5 Turbo
- **Anthropic** - Claude 3.5 Sonnet, Claude 3 Opus/Sonnet/Haiku
- **Google** - Gemini 1.5 Pro/Flash, Gemini Pro
- **Azure OpenAI** - Azure-hosted OpenAI models
- **Mistral** - Mistral Large/Medium/Small, Codestral
- **Cohere** - Command R+, Command R, Command

### Storage Adapters

Handle persistence of API keys and configuration:

```tsx
import { MemoryStorageAdapter } from 'ai-sdk-react-model-picker/storage';

const memoryStorage = new MemoryStorageAdapter();

// Custom implementation
class CustomStorage implements StorageAdapter {
  async get<T>(key: string): Promise<T | undefined> {
    /* ... */
  }
  async set<T>(key: string, value: T): Promise<void> {
    /* ... */
  }
  async remove(key: string): Promise<void> {
    /* ... */
  }
}

Security note: The default `MemoryStorageAdapter` is not persistent and not secure. In production, inject a secure storage implementation appropriate for your platform, e.g. `localStorage` (web), `chrome.storage` (extensions), or secret storage APIs in IDEs.

Example (web) `localStorage` adapter:

```ts
class LocalStorageAdapter implements StorageAdapter {
  async get(key: string): Promise<Record<string, string> | undefined> {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as Record<string, string>) : undefined;
  }
  async set(key: string, value: Record<string, string>): Promise<void> {
    localStorage.setItem(key, JSON.stringify(value));
  }
  async remove(key: string): Promise<void> {
    localStorage.removeItem(key);
  }
}
```
```

## API Reference

### ModelSelect

Main component for model selection.

```tsx
interface ModelSelectProps {
  // Required
  storage: StorageAdapter;
  providerRegistry: IProviderRegistry;
  onModelChange?: (model: ModelConfigWithProvider | undefined) => void;

  // Optional
  roles?: Role[];
  selectedRole?: string;
  onRoleChange?: (roleId: string) => void;
  className?: string;
  disabled?: boolean;
}
```

### Provider Registry

Manages all available providers.

```tsx
import { ProviderRegistry } from 'ai-sdk-react-model-picker/providers';

const registry = new ProviderRegistry();

// Register providers
registry.register(new OpenAIProvider());
registry.register(new AnthropicProvider());

// Get provider-specific models
const openaiModels = registry.getModelsForProvider('openai');
```

### Custom Providers

Extend the `AIProvider` base class:

```tsx
import { AIProvider } from 'ai-sdk-react-model-picker/providers';

class CustomProvider extends AIProvider {
  metadata = {
    id: 'custom-provider',
    name: 'My Custom Provider',
    description: 'Custom AI provider',
    apiKeyUrl: 'https://custom-provider.com/api-keys',
    requiredKeys: ['apiKey'],
  };

  models = [
    {
      id: 'custom-model-1',
      displayName: 'Custom Model 1',
      maxTokens: 4096,
      supportsTools: true,
    },
  ];

  validateCredentials(config) {
    if (!config.apiKey?.startsWith('custom-')) {
      return { isValid: false, error: 'Invalid API key format' };
    }
    return { isValid: true };
  }

  hasCredentials(config) {
    return Boolean(config.apiKey);
  }

  createInstance(params) {
    // Return AI SDK compatible model
    return createCustomModel(params);
  }
}
```

## Advanced Usage

### With Context Provider

For apps with multiple components that need model state:

```tsx
import { ModelPickerProvider } from 'ai-sdk-react-model-picker/context';

function App() {
  return (
    <ModelPickerProvider
      storage={storage}
      providerRegistry={registry}
      onConfigureProvider={(id) => console.log('Configure', id)}
    >
      <ModelSelect />
      <ModelInfo />
      <ChatInterface />
    </ModelPickerProvider>
  );
}

function ChatInterface() {
  const { selectedModel, selectModel } = useModelSelection();

  // Use selected model...
}
```

### Role-Based Selection

Support different model roles (chat, edit, etc.):

```tsx
const roles = [
  { id: 'chat', label: 'Chat', icon: ChatIcon },
  { id: 'edit', label: 'Edit', icon: EditIcon },
];

<ModelSelect
  roles={roles}
  selectedRole="chat"
  onRoleChange={(roleId) => setCurrentRole(roleId)}
  // ... other props
/>;
```

## Troubleshooting

### Invalid Hook Call Error

This error typically occurs when:

1. **React is duplicated in your bundle**

   ```bash
   # Check for duplicate React instances
   npm ls react

   # If using npm link for development
   cd your-library
   npm link ../your-app/node_modules/react
   npm link ../your-app/node_modules/react-dom
   ```

2. **Component is not properly mounted in React tree**

   ```tsx
   // ❌ Wrong - calling component as function
   const picker = ModelSelect({ ...props });

   // ✅ Correct - using as JSX element
   const picker = <ModelSelect {...props} />;
   ```

3. **Missing React DOM root (especially in VSCode)**

   ```tsx
   // ❌ Wrong - direct render
   ReactDOM.render(<App />, container);

   // ✅ Correct - using createRoot (React 18+)
   const root = createRoot(container);
   root.render(<App />);
   ```

### CSS Not Loading

**Ensure you import the CSS file:**

```tsx
import 'ai-sdk-react-model-picker/styles.css';
```

**For VSCode extensions, include CSS in webview:**

```typescript
const styleUri = webview.asWebviewUri(
  vscode.Uri.joinPath(
    extensionUri,
    'node_modules',
    'ai-sdk-react-model-picker',
    'dist',
    'styles.css'
  )
);
```

### TypeScript Errors

**Cannot find module './styles/globals.css':**

```typescript
// Add to your global.d.ts or types file
declare module '*.css' {
  const content: Record<string, string>;
  export default content;
}
```

### VSCode Webview Not Updating

**Enable retainContextWhenHidden:**

```typescript
const panel = vscode.window.createWebviewPanel(
  'modelPicker',
  'Model Picker',
  vscode.ViewColumn.One,
  {
    enableScripts: true,
    retainContextWhenHidden: true, // Keeps state when hidden
  }
);
```

## Styling

### Default Styles

Import the default styles:

```tsx
import 'ai-sdk-react-model-picker/styles.css';
```

### Custom CSS Variables

Override default theme variables:

```css
:root {
  --mp-background: #ffffff;
  --mp-foreground: #000000;
  --mp-primary: #0066cc;
  --mp-border: #e0e0e0;
  --mp-muted: #6b7280;
  --mp-destructive: #ef4444;
  --mp-accent: #f3f4f6;
}
```

### Tailwind CSS Integration

The library works with or without Tailwind CSS:

- No Tailwind: just import `ai-sdk-react-model-picker/styles.css` and you’re done.
- With Tailwind: optionally add the preset to map your theme tokens to our CSS variables.

Tailwind preset setup:

```js
// tailwind.config.js
module.exports = {
  presets: [require('ai-sdk-react-model-picker/tailwind-preset')],
  // ...your config
};
```

This enables classes like `bg-primary`, `text-foreground`, `bg-accent`, and semantic foregrounds like `text-primary-foreground` and `text-destructive-foreground` to follow your app’s theme.

## TypeScript Support

Full TypeScript support with branded types for better type safety:

```tsx
import type {
  ModelId,
  ProviderId,
  ApiKey,
  ModelConfigWithProvider,
} from 'ai-sdk-react-model-picker';

// Branded types prevent mixing different ID types
const modelId: ModelId = 'gpt-4o' as ModelId;
const providerId: ProviderId = 'openai' as ProviderId;
```

## Contributing

Contributions are welcome!

### Development Setup

```bash
git clone https://github.com/yourusername/ai-sdk-react-model-picker
cd ai-sdk-react-model-picker
npm install
npm run dev
```

### Adding New Providers

1. Extend the `AIProvider` base class
2. Implement required methods (`validateCredentials`, `hasCredentials`, `createInstance`)
3. Add provider to the registry
4. Create provider icon component
5. Add tests

## License

[Licensed under the Apache License, Version 2.0](LICENSE.txt)

- Copyright 2023 Continue Dev, Inc.
- Copyright 2025 Harold Martin
- Logos are the property of their respective creators.
### Missing provider package / dynamic import error

If you see an error like “OpenAI provider requires @ai-sdk/openai to be installed” when creating a model instance, install the corresponding AI SDK provider package as a peer dependency:

```bash
npm install @ai-sdk/openai # or @ai-sdk/anthropic, @ai-sdk/google, etc.
```

For OpenRouter support, install:

```bash
npm install @openrouter/ai-sdk-provider
```
