import { useState } from 'react';
import { fn } from 'storybook/test';
import { Toggle, type ToggleProps } from '../src/lib/components/Toggle';
import type { Meta, StoryObj } from '@storybook/react';
import '../src/lib/styles/globals.css';

const meta = {
  title: 'Components/Toggle',
  component: Toggle,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A two-option toggle component for switching between states',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    optionOne: {
      control: 'text',
      description: 'Label for the first option',
    },
    optionTwo: {
      control: 'text',
      description: 'Label for the second option',
    },
    selected: {
      control: 'boolean',
      description: 'When true, optionOne is selected; when false, optionTwo is selected',
    },
    disabled: {
      control: 'boolean',
      description: 'Disable the toggle',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes to apply',
    },
  },
  args: {
    onClick: () => fn(),
  },
} satisfies Meta<typeof Toggle>;

export default meta;
type Story = StoryObj<typeof meta>;

// Wrapper component to handle state
const ToggleWrapper = (props: Partial<ToggleProps>) => {
  const [selected, setSelected] = useState(props.selected ?? true);

  const handleClick = () => {
    setSelected(!selected);
    props.onClick?.();
  };

  return <Toggle {...props} selected={selected} onClick={handleClick} />;
};

export const Default: Story = {
  args: {
    optionOne: 'Option 1',
    optionTwo: 'Option 2',
    selected: true,
  },
  render: (args) => <ToggleWrapper {...args} />,
};

export const ChatEdit: Story = {
  args: {
    optionOne: 'Chat',
    optionTwo: 'Edit',
    selected: true,
  },
  render: (args) => <ToggleWrapper {...args} />,
};

export const OnOff: Story = {
  args: {
    optionOne: 'On',
    optionTwo: 'Off',
    selected: true,
  },
  render: (args) => <ToggleWrapper {...args} />,
};

export const LightDark: Story = {
  args: {
    optionOne: 'Light',
    optionTwo: 'Dark',
    selected: true,
  },
  render: (args) => <ToggleWrapper {...args} />,
};

export const Disabled: Story = {
  args: {
    optionOne: 'Enabled',
    optionTwo: 'Disabled',
    selected: true,
    disabled: true,
  },
};

export const LongLabels: Story = {
  args: {
    optionOne: 'Development Mode',
    optionTwo: 'Production Mode',
    selected: true,
  },
  render: (args) => <ToggleWrapper {...args} />,
};

export const CustomClassName: Story = {
  args: {
    optionOne: 'Custom',
    optionTwo: 'Style',
    selected: true,
    className: 'custom-toggle',
  },
  render: (args) => (
    <div>
      <ToggleWrapper {...args} />
      <style>{`
        .custom-toggle {
          font-size: 18px;
          font-weight: bold;
        }
      `}</style>
    </div>
  ),
};

export const MultipleToggles: Story = {
  render: () => {
    const [mode, setMode] = useState(true);
    const [theme, setTheme] = useState(true);
    const [feature, setFeature] = useState(false);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label
            style={{ marginBottom: '8px', display: 'block', fontSize: '14px', fontWeight: '600' }}
          >
            Model Mode
          </label>
          <Toggle
            optionOne="Chat"
            optionTwo="Edit"
            selected={mode}
            onClick={() => setMode(!mode)}
          />
        </div>

        <div>
          <label
            style={{ marginBottom: '8px', display: 'block', fontSize: '14px', fontWeight: '600' }}
          >
            Theme
          </label>
          <Toggle
            optionOne="Light"
            optionTwo="Dark"
            selected={theme}
            onClick={() => setTheme(!theme)}
          />
        </div>

        <div>
          <label
            style={{ marginBottom: '8px', display: 'block', fontSize: '14px', fontWeight: '600' }}
          >
            Advanced Features
          </label>
          <Toggle
            optionOne="On"
            optionTwo="Off"
            selected={feature}
            onClick={() => setFeature(!feature)}
          />
        </div>
      </div>
    );
  },
};

export const StateDisplay: Story = {
  render: () => {
    const [selected, setSelected] = useState(true);

    return (
      <div style={{ textAlign: 'center' }}>
        <Toggle
          optionOne="Active"
          optionTwo="Inactive"
          selected={selected}
          onClick={() => setSelected(!selected)}
        />
        <p style={{ marginTop: '20px', fontSize: '16px' }}>
          Current state: <strong>{selected ? 'Active' : 'Inactive'}</strong>
        </p>
      </div>
    );
  },
};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
      <div style={{ fontSize: '12px' }}>
        <Toggle optionOne="Small" optionTwo="Size" selected={true} onClick={() => fn()} />
      </div>

      <div style={{ fontSize: '16px' }}>
        <Toggle optionOne="Normal" optionTwo="Size" selected={true} onClick={() => fn()} />
      </div>

      <div style={{ fontSize: '20px' }}>
        <Toggle optionOne="Large" optionTwo="Size" selected={true} onClick={() => fn()} />
      </div>
    </div>
  ),
};
