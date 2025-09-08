import type { Meta, StoryObj } from '@storybook/react-vite';

import { ModelCard } from '../lib/components/ModelCard';
import { ModelProviderTags } from '../lib/types';
import { OpenAIProvider } from '../lib/providers/OpenAIProvider';
import { AnthropicProvider } from '../lib/providers/AnthropicProvider';
import { GoogleProvider } from '../lib/providers/GoogleProvider';
import '../lib/styles/globals.css';

const meta = {
  title: 'Components/ModelCard',
  component: ModelCard,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A card component for displaying AI model information with capabilities and specifications',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    disabled: {
      control: 'boolean',
      description: 'Disable the card interactions',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes to apply',
    },
    title: {
      control: 'text',
      description: 'Override the default model title',
    },
    description: {
      control: 'text',
      description: 'Override the default model description',
    },
    documentationUrl: {
      control: 'text',
      description: 'Override the documentation URL',
    },
  },
  args: {
    onClick: (e, model) => console.log('Card clicked:', model),
  },
} satisfies Meta<typeof ModelCard>;

export default meta;
type Story = StoryObj<typeof meta>;

// Create sample model configurations
const openAIProvider = new OpenAIProvider();
const anthropicProvider = new AnthropicProvider();
const googleProvider = new GoogleProvider();

const gpt4Model = {
  model: openAIProvider.models[0],
  provider: openAIProvider.metadata,
};

const claudeModel = {
  model: anthropicProvider.models[0],
  provider: anthropicProvider.metadata,
};

const geminiModel = {
  model: googleProvider.models[0],
  provider: googleProvider.metadata,
};

export const Default: Story = {
  args: {
    model: gpt4Model,
  },
  render: (args) => (
    <div style={{ width: '400px' }}>
      <ModelCard {...args} />
    </div>
  ),
};

export const WithCustomTags: Story = {
  args: {
    model: claudeModel,
    tags: [ModelProviderTags.Vision, ModelProviderTags.Tools, ModelProviderTags.LongContext],
  },
  render: (args) => (
    <div style={{ width: '400px' }}>
      <ModelCard {...args} />
    </div>
  ),
};

export const WithCustomContent: Story = {
  args: {
    model: geminiModel,
    title: 'Custom Model Title',
    description: 'This is a custom description that overrides the default provider description. It can contain more detailed information about the model.',
    documentationUrl: 'https://example.com/docs',
  },
  render: (args) => (
    <div style={{ width: '400px' }}>
      <ModelCard {...args} />
    </div>
  ),
};

export const Disabled: Story = {
  args: {
    model: gpt4Model,
    disabled: true,
  },
  render: (args) => (
    <div style={{ width: '400px' }}>
      <ModelCard {...args} />
    </div>
  ),
};

export const MultipleCards: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '400px' }}>
      <ModelCard 
        model={gpt4Model} 
        onClick={(e, model) => console.log('Card clicked:', model)}
      />
      <ModelCard 
        model={claudeModel} 
        onClick={(e, model) => console.log('Card clicked:', model)}
      />
      <ModelCard 
        model={geminiModel} 
        onClick={(e, model) => console.log('Card clicked:', model)}
      />
    </div>
  ),
};

export const Grid: Story = {
  render: () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', width: '800px' }}>
      <ModelCard 
        model={gpt4Model} 
        tags={[ModelProviderTags.Vision]}
        onClick={(e, model) => console.log('Card clicked:', model)}
      />
      <ModelCard 
        model={claudeModel} 
        tags={[ModelProviderTags.LongContext]}
        onClick={(e, model) => console.log('Card clicked:', model)}
      />
      <ModelCard 
        model={geminiModel} 
        tags={[ModelProviderTags.Tools]}
        onClick={(e, model) => console.log('Card clicked:', model)}
      />
      <ModelCard 
        model={gpt4Model} 
        title="GPT-4 Vision"
        description="Specialized for image understanding"
        tags={[ModelProviderTags.Vision]}
        onClick={(e, model) => console.log('Card clicked:', model)}
      />
    </div>
  ),
};

export const NoIcon: Story = {
  args: {
    model: {
      ...gpt4Model,
      provider: {
        ...gpt4Model.provider,
        icon: undefined,
      },
    },
  },
  render: (args) => (
    <div style={{ width: '400px' }}>
      <ModelCard {...args} />
    </div>
  ),
};

export const LongContent: Story = {
  args: {
    model: gpt4Model,
    title: 'GPT-4 with Very Long Model Name That Might Overflow',
    description: 'This is a very long description that contains a lot of information about the model. It includes details about its capabilities, training data, performance benchmarks, and various use cases. The description is intentionally long to test how the component handles text overflow and wrapping in different scenarios.',
  },
  render: (args) => (
    <div style={{ width: '400px' }}>
      <ModelCard {...args} />
    </div>
  ),
};