import type { SVGProps } from 'react';
import React from 'react';

// OpenAI Icon
export const OpenAIIcon: React.FC<SVGProps<SVGSVGElement>> = (props) =>
  React.createElement(
    'svg',
    {
      viewBox: '0 0 24 24',
      fill: 'currentColor',
      ...props,
    },
    React.createElement('path', {
      d: 'M22.282 9.821a5.985 5.985 0 00-.516-4.91 6.046 6.046 0 00-6.51-2.9A6.065 6.065 0 004.981 4.18a5.985 5.985 0 00-3.998 2.9 6.046 6.046 0 00.743 7.097 5.98 5.98 0 00.51 4.911 6.078 6.078 0 006.283 2.899 5.99 5.99 0 005.197-2.9 6.022 6.022 0 004.001-2.9 5.99 5.99 0 00-1.435-7.266zm-9.08 4.035a4.5 4.5 0 11-8.999.001 4.5 4.5 0 018.999-.001z',
    })
  );

// Anthropic Icon
export const AnthropicIcon: React.FC<SVGProps<SVGSVGElement>> = (props) =>
  React.createElement(
    'svg',
    {
      viewBox: '0 0 24 24',
      fill: 'currentColor',
      ...props,
    },
    React.createElement('path', {
      d: 'M12 2L2 7v10l10 5 10-5V7l-10-5zm0 2.52L19.48 8 12 11.48 4.52 8 12 4.52zm-8 4.24L11 12v8l-7-3.5v-7.74zm16 0v7.74L13 20v-8l7-3.24z',
    })
  );

// Google Icon
export const GoogleIcon: React.FC<SVGProps<SVGSVGElement>> = (props) =>
  React.createElement(
    'svg',
    {
      viewBox: '0 0 24 24',
      fill: 'currentColor',
      ...props,
    },
    React.createElement('path', {
      d: 'M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z',
      fill: '#4285F4',
    }),
    React.createElement('path', {
      d: 'M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z',
      fill: '#34A853',
    }),
    React.createElement('path', {
      d: 'M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z',
      fill: '#FBBC05',
    }),
    React.createElement('path', {
      d: 'M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z',
      fill: '#EA4335',
    })
  );

// Azure Icon
export const AzureIcon: React.FC<SVGProps<SVGSVGElement>> = (props) =>
  React.createElement(
    'svg',
    {
      viewBox: '0 0 24 24',
      fill: 'currentColor',
      ...props,
    },
    React.createElement('path', {
      d: 'M5.531 5.656L12 2l6.469 3.656v7.312L12 16.625l-6.469-3.657V5.656z',
      fill: '#0072C6',
    }),
    React.createElement('path', {
      d: 'M18.469 12.969L12 16.625v6.375l6.469-3.656v-6.375z',
      fill: '#0072C6',
      opacity: '0.8',
    }),
    React.createElement('path', {
      d: 'M5.531 12.969v6.375L12 23v-6.375l-6.469-3.656z',
      fill: '#0072C6',
      opacity: '0.6',
    })
  );

// Mistral Icon
export const MistralIcon: React.FC<SVGProps<SVGSVGElement>> = (props) =>
  React.createElement(
    'svg',
    {
      viewBox: '0 0 24 24',
      fill: 'currentColor',
      ...props,
    },
    React.createElement('path', {
      d: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v-.07zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z',
    })
  );

// Cohere Icon
export const CohereIcon: React.FC<SVGProps<SVGSVGElement>> = (props) =>
  React.createElement(
    'svg',
    {
      viewBox: '0 0 24 24',
      fill: 'currentColor',
      ...props,
    },
    React.createElement('path', {
      d: 'M12 2L2 7v10l10 5 10-5V7l-10-5zm0 2.52L19.48 8 12 11.48 4.52 8 12 4.52zm-8 4.24L11 12v8l-7-3.5v-7.74zm16 0v7.74L13 20v-8l7-3.24z',
    })
  );

// Generic AI Model Icon (fallback)
export const ModelIcon: React.FC<SVGProps<SVGSVGElement>> = (props) =>
  React.createElement(
    'svg',
    {
      viewBox: '0 0 24 24',
      fill: 'currentColor',
      ...props,
    },
    React.createElement('path', {
      d: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
    })
  );

// Cube Icon for models
export const CubeIcon: React.FC<SVGProps<SVGSVGElement>> = (props) =>
  React.createElement(
    'svg',
    {
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      strokeWidth: '2',
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
      ...props,
    },
    React.createElement('path', { d: 'm21.5 12.5-8-5-8 5v7l8 5 8-5v-7z' }),
    React.createElement('path', { d: 'm21.5 12.5-8 5-8-5' }),
    React.createElement('path', { d: 'm13.5 7.5 8 5' })
  );

// Check Icon
export const CheckIcon: React.FC<SVGProps<SVGSVGElement>> = (props) =>
  React.createElement(
    'svg',
    {
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      strokeWidth: '2',
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
      ...props,
    },
    React.createElement('polyline', {
      points: '20 6 9 17 4 12',
    })
  );

// ChevronDown Icon
export const ChevronDownIcon: React.FC<SVGProps<SVGSVGElement>> = (props) =>
  React.createElement(
    'svg',
    {
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      strokeWidth: '2',
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
      ...props,
    },
    React.createElement('polyline', {
      points: '6 9 12 15 18 9',
    })
  );

// Settings Icon
export const SettingsIcon: React.FC<SVGProps<SVGSVGElement>> = (props) =>
  React.createElement(
    'svg',
    {
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      strokeWidth: '2',
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
      ...props,
    },
    React.createElement('circle', { cx: '12', cy: '12', r: '3' }),
    React.createElement('path', {
      d: 'M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z',
    })
  );

// Plus Icon
export const PlusIcon: React.FC<SVGProps<SVGSVGElement>> = (props) =>
  React.createElement(
    'svg',
    {
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      strokeWidth: '2',
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
      ...props,
    },
    React.createElement('line', { x1: '12', y1: '5', x2: '12', y2: '19' }),
    React.createElement('line', { x1: '5', y1: '12', x2: '19', y2: '12' })
  );

// Loading Spinner Icon
export const SpinnerIcon: React.FC<SVGProps<SVGSVGElement>> = (props) =>
  React.createElement(
    'svg',
    {
      viewBox: '0 0 24 24',
      fill: 'none',
      ...props,
    },
    React.createElement('circle', {
      cx: '12',
      cy: '12',
      r: '10',
      stroke: 'currentColor',
      strokeWidth: '4',
      opacity: '0.25',
    }),
    React.createElement('path', {
      fill: 'currentColor',
      d: 'M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z',
      opacity: '0.75',
    })
  );

// Export all icons
export {
  OpenAIIcon,
  AnthropicIcon,
  GoogleIcon,
  AzureIcon,
  MistralIcon,
  CohereIcon,
  ModelIcon,
  CubeIcon,
  CheckIcon,
  ChevronDownIcon,
  SettingsIcon,
  PlusIcon,
  SpinnerIcon,
};
