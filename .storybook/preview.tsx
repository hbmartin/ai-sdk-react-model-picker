import React from 'react';
import type { Preview } from '@storybook/react';
import { lightTheme } from './theme';

// Global styles: product styles + Storybook-specific polish
import '../src/lib/styles/globals.css';
import './preview.css';

const prefersDark = () =>
  typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

const setThemeAttribute = (mode: 'light' | 'dark' | 'system') => {
  const root = document.documentElement;
  const resolved = mode === 'system' ? (prefersDark() ? 'dark' : 'light') : mode;
  root.setAttribute('data-theme', resolved);
};

const preview: Preview = {
  globalTypes: {
    theme: {
      name: 'Theme',
      description: 'Global theme for components',
      defaultValue: 'system',
      toolbar: {
        icon: 'mirror',
        items: [
          { value: 'light', icon: 'circlehollow', title: 'Light' },
          { value: 'dark', icon: 'circle', title: 'Dark' },
          { value: 'system', icon: 'browser', title: 'System' }
        ]
      }
    }
  },
  parameters: {
    layout: 'padded',
    options: {
      showPanel: true
    },
    controls: {
      expanded: true,
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i
      }
    },
    docs: {
      theme: lightTheme,
      toc: true
    },
    backgrounds: {
      default: 'App',
      values: [
        { name: 'App', value: 'var(--mp-background)' },
        { name: 'Light', value: '#ffffff' },
        { name: 'Muted', value: '#f9fafb' },
        { name: 'Dark', value: '#1e1e1e' }
      ]
    }
  },
  decorators: [
    (Story, context) => {
      // Sync HTML data-theme attribute so product CSS variables respond
      const mode = ((context.globals as any)['theme'] as 'light' | 'dark' | 'system') ?? 'system';
      setThemeAttribute(mode);

      // Wrap in a page-like container for breathing room
      return React.createElement('div', { className: 'sb-wrapper' }, React.createElement(Story, context.args));
    }
  ]
};

export default preview;
