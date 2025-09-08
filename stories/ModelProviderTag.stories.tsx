import { ModelProviderTag } from '../src/lib/components/ModelProviderTag';
import { ModelProviderTags } from '../src/lib/types';
import type { Meta, StoryObj } from '@storybook/react';
import '../src/lib/styles/globals.css';

const meta = {
  title: 'Components/ModelProviderTag',
  component: ModelProviderTag,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A tag component for displaying model capabilities and requirements',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    tag: {
      control: 'select',
      options: Object.values(ModelProviderTags),
      description: 'The type of tag to display',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes to apply',
    },
  },
} satisfies Meta<typeof ModelProviderTag>;

export default meta;
type Story = StoryObj<typeof meta>;

export const RequiresApiKey: Story = {
  args: {
    tag: ModelProviderTags.RequiresApiKey,
  },
};

export const Local: Story = {
  args: {
    tag: ModelProviderTags.Local,
  },
};

export const Free: Story = {
  args: {
    tag: ModelProviderTags.Free,
  },
};

export const OpenSource: Story = {
  args: {
    tag: ModelProviderTags.OpenSource,
  },
};

export const Vision: Story = {
  args: {
    tag: ModelProviderTags.Vision,
  },
};

export const Tools: Story = {
  args: {
    tag: ModelProviderTags.Tools,
  },
};

export const LongContext: Story = {
  args: {
    tag: ModelProviderTags.LongContext,
  },
};

export const AllTags: Story = {
  render: () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', maxWidth: '400px' }}>
      {Object.values(ModelProviderTags).map((tag) => (
        <ModelProviderTag key={tag} tag={tag} />
      ))}
    </div>
  ),
};

export const TagsInContext: Story = {
  render: () => (
    <div style={{ padding: '20px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
      <h3 style={{ marginBottom: '12px', fontSize: '18px', fontWeight: '600' }}>GPT-4 Turbo</h3>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
        <ModelProviderTag tag={ModelProviderTags.Vision} />
        <ModelProviderTag tag={ModelProviderTags.Tools} />
        <ModelProviderTag tag={ModelProviderTags.LongContext} />
      </div>
      <p style={{ fontSize: '14px', color: '#666' }}>
        Advanced language model with vision capabilities and extended context window.
      </p>
    </div>
  ),
};

export const CustomClassName: Story = {
  args: {
    tag: ModelProviderTags.Vision,
    className: 'custom-tag-class',
  },
  render: (args) => (
    <div>
      <ModelProviderTag {...args} />
      <style>{`
        .custom-tag-class {
          font-size: 18px !important;
          padding: 8px 16px !important;
        }
      `}</style>
    </div>
  ),
};

export const TagGroups: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h4 style={{ marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#666' }}>
          Access Requirements
        </h4>
        <div style={{ display: 'flex', gap: '8px' }}>
          <ModelProviderTag tag={ModelProviderTags.RequiresApiKey} />
          <ModelProviderTag tag={ModelProviderTags.Free} />
          <ModelProviderTag tag={ModelProviderTags.Local} />
        </div>
      </div>

      <div>
        <h4 style={{ marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#666' }}>
          Capabilities
        </h4>
        <div style={{ display: 'flex', gap: '8px' }}>
          <ModelProviderTag tag={ModelProviderTags.Vision} />
          <ModelProviderTag tag={ModelProviderTags.Tools} />
          <ModelProviderTag tag={ModelProviderTags.LongContext} />
        </div>
      </div>

      <div>
        <h4 style={{ marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#666' }}>
          Type
        </h4>
        <div style={{ display: 'flex', gap: '8px' }}>
          <ModelProviderTag tag={ModelProviderTags.OpenSource} />
        </div>
      </div>
    </div>
  ),
};
