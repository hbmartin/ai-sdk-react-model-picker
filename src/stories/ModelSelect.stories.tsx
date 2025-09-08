import { useState } from 'react';
import { fn } from 'storybook/test';
import { ModelSelect } from '../lib/components/ModelSelect';
import { AnthropicProvider } from '../lib/providers/AnthropicProvider';
import { GoogleProvider } from '../lib/providers/GoogleProvider';
import { OpenAIProvider } from '../lib/providers/OpenAIProvider';
import { ProviderRegistry } from '../lib/providers/ProviderRegistry';
import { MemoryStorageAdapter } from '../lib/storage';
import type { ModelId, ModelConfigWithProvider, ModelSelectProps } from '../lib/types';
import type { Meta, StoryObj } from '@storybook/react';
import '../lib/styles/globals.css';

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
const createProviderRegistry = (_: boolean = false) => {
  const registry = new ProviderRegistry();
  registry.register(new OpenAIProvider());
  registry.register(new AnthropicProvider());
  registry.register(new GoogleProvider());
  return registry;
};

// Create storage with optional pre-configured API keys
const createStorage = (withApiKeys: boolean = false) => {
  const storage = new MemoryStorageAdapter();
  if (withApiKeys) {
    void storage.set('openai:config', { apiKey: 'sk-test-key' });
    void storage.set('anthropic:config', { apiKey: 'claude-test-key' });
  }
  return storage;
};

// Wrapper component to handle state
const ModelSelectWrapper = (props: Partial<ModelSelectProps>) => {
  // eslint-disable-next-line unicorn/no-null
  const [selectedModelId, setSelectedModelId] = useState<ModelId | null>(null);

  const handleModelChange = (model: ModelConfigWithProvider) => {
    setSelectedModelId(model.model.id);
    props.onModelChange?.(model);
  };

  return (
    <div style={{ width: '300px' }}>
      <ModelSelect {...props} selectedModelId={selectedModelId} onModelChange={handleModelChange} />
    </div>
  );
};

export const Default: Story = {
  render: () => (
    <ModelSelectWrapper
      storage={createStorage()}
      providers={createProviderRegistry()}
      onModelChange={fn()}
      onConfigureProvider={fn()}
      onMissingConfiguration={fn()}
    />
  ),
};

export const WithApiKeys: Story = {
  render: () => (
    <ModelSelectWrapper
      storage={createStorage(true)}
      providers={createProviderRegistry()}
      onModelChange={fn()}
      onConfigureProvider={fn()}
      onMissingConfiguration={fn()}
    />
  ),
};

export const WithRoles: Story = {
  render: () => {
    const [selectedRole, setSelectedRole] = useState('chat');

    return (
      <ModelSelectWrapper
        storage={createStorage(true)}
        providers={createProviderRegistry()}
        roles={[
          { id: 'chat', label: 'Chat' },
          { id: 'edit', label: 'Edit' },
        ]}
        selectedRole={selectedRole}
        onRoleChange={setSelectedRole}
        onModelChange={fn()}
        onConfigureProvider={fn()}
        onMissingConfiguration={fn()}
      />
    );
  },
};

export const Disabled: Story = {
  render: () => (
    <ModelSelectWrapper
      storage={createStorage()}
      providers={createProviderRegistry()}
      disabled={true}
      onModelChange={fn()}
      onConfigureProvider={fn()}
      onMissingConfiguration={fn()}
    />
  ),
};

export const CustomClassName: Story = {
  render: () => (
    <ModelSelectWrapper
      storage={createStorage(true)}
      providers={createProviderRegistry()}
      className="custom-model-select"
      onModelChange={fn()}
      onConfigureProvider={fn()}
      onMissingConfiguration={fn()}
    />
  ),
};

export const Loading: Story = {
  render: () => {
    // Use a slow storage adapter to simulate loading
    const slowStorage = new MemoryStorageAdapter();
    const originalGet = slowStorage.get.bind(slowStorage);
    slowStorage.get = async (key: string) => {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      return originalGet(key);
    };

    return (
      <ModelSelectWrapper
        storage={slowStorage}
        providers={createProviderRegistry()}
        onModelChange={fn()}
        onConfigureProvider={fn()}
        onMissingConfiguration={fn()}
      />
    );
  },
};

export const EmptyProviders: Story = {
  render: () => (
    <ModelSelectWrapper
      storage={createStorage()}
      providers={new ProviderRegistry()}
      onModelChange={fn()}
      onConfigureProvider={fn()}
      onMissingConfiguration={fn()}
    />
  ),
};
