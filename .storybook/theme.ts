import { create } from 'storybook/theming/create';

const fontStack = [
  'Inter',
  'ui-sans-serif',
  'system-ui',
  '-apple-system',
  'Segoe UI',
  'Roboto',
  'Helvetica Neue',
  'Arial',
  'Noto Sans',
  'Apple Color Emoji',
  'Segoe UI Emoji'
].join(', ');

export const lightTheme = create({
  base: 'light',
  brandTitle: 'AI SDK Model Picker',
  brandUrl: 'https://github.com/hbmartin/ai-sdk-react-model-picker',
  colorPrimary: '#3b82f6',
  colorSecondary: '#2563eb',
  appBg: '#ffffff',
  appContentBg: '#ffffff',
  appBorderColor: '#e5e7eb',
  appBorderRadius: 8,
  fontBase: fontStack,
  fontCode: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, \\"Liberation Mono\\", \\"Courier New\\", monospace',
  textColor: '#111827',
  textInverseColor: '#f9fafb',
  barBg: '#ffffff',
  barTextColor: '#374151',
  barSelectedColor: '#111827'
});

export const darkTheme = create({
  base: 'dark',
  brandTitle: 'AI SDK Model Picker',
  brandUrl: 'https://github.com/hbmartin/ai-sdk-react-model-picker',
  colorPrimary: '#60a5fa',
  colorSecondary: '#60a5fa',
  appBg: '#1e1e1e',
  appContentBg: '#1f1f1f',
  appBorderColor: '#2a2a2a',
  appBorderRadius: 8,
  fontBase: fontStack,
  fontCode: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, \\"Liberation Mono\\", \\"Courier New\\", monospace',
  textColor: '#e5e7eb',
  textInverseColor: '#111827',
  barBg: '#111827',
  barTextColor: '#d1d5db',
  barSelectedColor: '#f9fafb'
});
