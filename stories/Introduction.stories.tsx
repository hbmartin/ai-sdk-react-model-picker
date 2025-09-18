import React from 'react';
import type { Meta } from '@storybook/react';

const meta: Meta = {
  title: 'Overview/Introduction',
  parameters: {
    docs: {
      page: () => (
        <div>
          <h1>AI SDK React Model Picker</h1>
          <p>
            A flexible, theme-aware React component library for selecting and managing AI models.
            Built for Vercel's AI SDK v5 with special support for IDE integrations.
          </p>

          <h2>Installation</h2>
          <pre>
            <code>npm i ai-sdk-react-model-picker react-hook-form</code>
          </pre>

          <p>If you use Tailwind, you can consume the preset exported by this library.</p>
          <pre>
            <code>{`// tailwind.config.js
module.exports = {
  presets: [require('ai-sdk-react-model-picker/tailwind-preset')],
};`}</code>
          </pre>

          <p>Or import the compiled CSS in your app entry:</p>
          <pre>
            <code>{`import 'ai-sdk-react-model-picker/styles.css';`}</code>
          </pre>

          <h2>Quick Start</h2>
          <pre>
            <code>{`import { ModelSelect } from 'ai-sdk-react-model-picker';
import { ProviderRegistry } from 'ai-sdk-react-model-picker';
import { OpenAIProvider, AnthropicProvider, GoogleProvider } from 'ai-sdk-react-model-picker';
import { MemoryStorageAdapter } from 'ai-sdk-react-model-picker';

const registry = new ProviderRegistry();
registry.register(new OpenAIProvider());
registry.register(new AnthropicProvider());
registry.register(new GoogleProvider());

const storage = new MemoryStorageAdapter();

export default function Example() {
  return (
    <div style={{ width: 320 }}>
      <ModelSelect
        storage={storage}
        providerRegistry={registry}
        onModelChange={(m) => console.log('Selected model', m)}
      />
    </div>
  );
}`}</code>
          </pre>

          <h2>Theming</h2>
          <p>
            Components respect CSS variables and adapt to light/dark. Toggle theme via the toolbar
            in the top-right of Storybook. Key variables include <code>--mp-background</code>,
            <code>--mp-foreground</code>, and <code>--mp-primary</code>.
          </p>

          <h2>Components</h2>
          <ul>
            <li>
              <strong>ModelSelect</strong> — end-to-end model picker with providers, roles, and persistence.
            </li>
            <li>
              <strong>ModelCard</strong> — present model information with tags and docs link.
            </li>
            <li>
              <strong>ModelProviderTag</strong> — small label for capabilities/requirements.
            </li>
            <li>
              <strong>Toggle</strong> — simple, accessible toggle.
            </li>
          </ul>
        </div>
      )
    }
  }
};

export default meta;

// This file intentionally exports no stories; it's a Docs-only page.

