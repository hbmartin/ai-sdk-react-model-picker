import { useState } from 'react';
import { fn } from 'storybook/test';
import { ModelSelect } from '../src/lib/components/ModelSelect';
import { AnthropicProvider } from '../src/lib/providers/AnthropicProvider';
import { GoogleProvider } from '../src/lib/providers/GoogleProvider';
import { OpenAIProvider } from '../src/lib/providers/OpenAIProvider';
import { ProviderRegistry } from '../src/lib/providers/ProviderRegistry';
import { MemoryStorageAdapter } from '../src/lib/storage';
import type { ModelConfigWithProvider, ModelSelectProps } from '../src/lib/types';
import type { Meta, StoryObj } from '@storybook/react';
import '../src/lib/styles/globals.css';

const meta = {
  title: 'Components/ModelSelect',
  component: ModelSelect,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A flexible model selection component for AI providers',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    disabled: {
      control: 'boolean',
      description: 'Disable the model select dropdown',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes to apply',
    },
  },
} satisfies Meta<typeof ModelSelect>;

export default meta;
type Story = StoryObj<typeof meta>;

// Create providers with some having API keys
const createProviderRegistry = () => {
  const registry = new ProviderRegistry(undefined);
  registry.register(new OpenAIProvider());
  registry.register(new AnthropicProvider());
  registry.register(new GoogleProvider());
  return registry;
};

// Create storage with optional pre-configured API keys
// eslint-disable-next-line code-complete/no-boolean-params
const createStorage = (withApiKeys: boolean = false) => {
  const storage = new MemoryStorageAdapter();
  if (withApiKeys) {
    void storage.set('openai:config', { apiKey: 'sk-test-key' });
    void storage.set('anthropic:config', { apiKey: 'sk-ant-test-key' });
  }
  return storage;
};

// Wrapper component to handle state
const ModelSelectWrapper = (props: Partial<ModelSelectProps>) => {
  const handleModelChange = (model: ModelConfigWithProvider | undefined) => {
    props.onModelChange?.(model);
  };

  return (
    <div style={{ width: '300px' }}>
      <ModelSelect {...props} onModelChange={handleModelChange} />
    </div>
  );
};

export const Default: Story = {
  render: () => (
    <ModelSelectWrapper
      storage={createStorage()}
      providerRegistry={createProviderRegistry()}
      onModelChange={fn()}
    />
  ),
};

export const WithApiKeys: Story = {
  render: () => (
    <ModelSelectWrapper
      storage={createStorage(true)}
      providerRegistry={createProviderRegistry()}
      onModelChange={fn()}
    />
  ),
};

export const WithRoles: Story = {
  render: () => {
    const [selectedRole, setSelectedRole] = useState('chat');

    return (
      <ModelSelectWrapper
        storage={createStorage(true)}
        providerRegistry={createProviderRegistry()}
        roles={[
          { id: 'chat', label: 'Chat' },
          { id: 'edit', label: 'Edit' },
        ]}
        selectedRole={selectedRole}
        onRoleChange={setSelectedRole}
        onModelChange={fn()}
      />
    );
  },
};

export const Disabled: Story = {
  render: () => (
    <ModelSelectWrapper
      storage={createStorage()}
      providerRegistry={createProviderRegistry()}
      disabled
      onModelChange={fn()}
    />
  ),
};

export const CustomClassName: Story = {
  render: () => (
    <ModelSelectWrapper
      storage={createStorage(true)}
      providerRegistry={createProviderRegistry()}
      className="custom-model-select"
      onModelChange={fn()}
    />
  ),
};

export const Loading: Story = {
  render: () => {
    // Use a slow storage adapter to simulate loading
    const slowStorage = new MemoryStorageAdapter();
    const originalGet = slowStorage.get.bind(slowStorage);
    slowStorage.get = async (key: string) => {
      // eslint-disable-next-line code-complete/no-magic-numbers-except-zero-one
      const LOAD_DELAY_MS = 2000;
      await new Promise((resolve) => setTimeout(resolve, LOAD_DELAY_MS));
      return originalGet(key);
    };

    return (
      <ModelSelectWrapper
        storage={slowStorage}
        providerRegistry={createProviderRegistry()}
        onModelChange={fn()}
      />
    );
  },
};

export const EmptyProviders: Story = {
  render: () => (
    <ModelSelectWrapper
      storage={createStorage()}
      providerRegistry={new ProviderRegistry()}
      onModelChange={fn()}
    />
  ),
};
