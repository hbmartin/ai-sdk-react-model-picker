/** @type {import('tailwindcss').Config} */
import vscodePlugin from './vscode-plugin';
export default {
  content: ['./src/lib/**/*.{js,ts,jsx,tsx}'],
  safelist: [
    // VSCode theme variants
    'vscode-dark',
    'vscode-light',
    'vscode-high-contrast',
    // Core semantic utilities used by the library (ensure presence without Tailwind in consumer app)
    'bg-background',
    'bg-accent',
    'bg-primary',
    'text-foreground',
    'text-muted',
    'text-accent-foreground',
    'text-destructive',
    'border-border',
    'rounded',
    'rounded-default',
    'rounded-lg',
    'focus:ring-2',
    'focus:ring-primary',
    'focus:border-primary',
    'ring-primary',
    'hover:bg-accent',
    'hover:text-foreground',
    // Status colors used in error state UI
    'bg-red-50',
    'border-red-200',
    'text-red-700',
    // Provider tag semantic colors
    'text-warning',
    'text-success',
    'text-destructive',
    // Ensure provider tag styles are included
    'provider-tag-requires-key',
    'provider-tag-local',
    'provider-tag-free',
    'provider-tag-open-source',
    'provider-tag-vision',
    'provider-tag-tools',
    'provider-tag-long-context',
    // VSCode-specific utilities that might be dynamically applied
    { pattern: /^(bg|text|border)-vscode-/ },
    { pattern: /^hover:(bg|text|border)-vscode-/ },
    { pattern: /^focus:(bg|text|border|ring)-vscode-/ },
    // Semantic color utilities and their variants
    { pattern: /^(bg|text|border|ring)-(background|foreground|primary|accent|border|muted|destructive|success|warning)(?:-foreground)?$/ },
    { pattern: /^(hover|focus):(?:bg|text|border|ring)-(background|foreground|primary|accent|border|muted|destructive|success|warning)(?:-foreground)?$/ },
  ],
  theme: {
    extend: {
      colors: {
        // Simplified color system using CSS variables directly
        background: {
          DEFAULT: 'var(--mp-background)',
          secondary: 'var(--mp-background-secondary)',
        },
        foreground: {
          DEFAULT: 'var(--mp-foreground)',
          secondary: 'var(--mp-foreground-secondary)',
        },
        primary: {
          DEFAULT: 'var(--mp-primary)',
          hover: 'var(--mp-primary-hover)',
          foreground: 'var(--mp-primary-foreground)',
        },
        border: {
          DEFAULT: 'var(--mp-border)',
          muted: 'var(--mp-border-muted)',
        },
        muted: 'var(--mp-muted)',
        destructive: {
          DEFAULT: 'var(--mp-destructive)',
          hover: 'var(--mp-destructive-hover)',
          foreground: 'var(--mp-destructive-foreground)',
        },
        success: {
          DEFAULT: 'var(--mp-success)',
          hover: 'var(--mp-success-hover)',
          foreground: 'var(--mp-success-foreground)',
        },
        warning: {
          DEFAULT: 'var(--mp-warning)',
          hover: 'var(--mp-warning-hover)',
          foreground: 'var(--mp-warning-foreground)',
        },
        accent: {
          DEFAULT: 'var(--mp-accent)',
          hover: 'var(--mp-accent-hover)',
          foreground: 'var(--mp-accent-foreground)',
        },
        
        // VSCode specific mappings
        'vscode-editor-bg': 'var(--vscode-editor-background)',
        'vscode-editor-fg': 'var(--vscode-editor-foreground)',
        'vscode-button-bg': 'var(--vscode-button-background)',
        'vscode-button-fg': 'var(--vscode-button-foreground)',
        'vscode-panel-border': 'var(--vscode-panel-border)',
        'vscode-input-bg': 'var(--vscode-input-background)',
        'vscode-input-fg': 'var(--vscode-input-foreground)',
        'vscode-list-active-bg': 'var(--vscode-list-activeBackground)',
        'vscode-list-active-fg': 'var(--vscode-list-activeForeground)',
        'vscode-dropdown-bg': 'var(--vscode-dropdown-background)',
      },
      borderRadius: {
        DEFAULT: 'var(--mp-border-radius, 0.375rem)',
      },
      fontSize: {
        'xs': '0.75rem',
        'sm': '0.875rem',
        'base': '1rem',
        'lg': '1.125rem',
      },
      spacing: {
        '18': '4.5rem',
      },
      animation: {
        'spin-slow': 'spin 2s linear infinite',
      },
    },
  },
  plugins: [
    // VSCode-specific utility classes
    vscodePlugin,
    // Plugin to handle VSCode environment detection
    function({ addBase }) {
      addBase({
        ':root': {
          // Default theme values using hex colors directly
          '--mp-background': '#ffffff',
          '--mp-background-secondary': '#f9fafb',
          '--mp-foreground': '#000000',
          '--mp-foreground-secondary': '#6b7280',
          '--mp-primary': '#3b82f6',
          '--mp-primary-hover': '#2563eb',
          '--mp-primary-foreground': '#ffffff',
          '--mp-border': '#e0e0e0',
          '--mp-border-muted': '#e5e7eb',
          '--mp-muted': '#6b7280',
          '--mp-destructive': '#ef4444',
          '--mp-destructive-hover': '#dc2626',
          '--mp-destructive-foreground': '#ffffff',
          '--mp-success': '#22c55e',
          '--mp-success-hover': '#16a34a',
          '--mp-success-foreground': '#ffffff',
          '--mp-warning': '#f59e0b',
          '--mp-warning-hover': '#d97706',
          '--mp-warning-foreground': '#ffffff',
          '--mp-accent': '#f3f4f6',
          '--mp-accent-hover': '#e5e7eb',
          '--mp-accent-foreground': '#374151',
          '--mp-border-radius': '0.375rem',
        },
        // VSCode environment detection and mapping
        'body[data-vscode-theme-kind="vscode-dark"], body[data-vscode-theme-kind="vscode-high-contrast"]': {
          '--mp-background': 'var(--vscode-editor-background, #1e1e1e)',
          '--mp-background-secondary': 'var(--vscode-panel-background, #1f1f1f)',
          '--mp-foreground': 'var(--vscode-editor-foreground, #d4d4d4)',
          '--mp-foreground-secondary': 'var(--vscode-descriptionForeground, #cccccc)',
          '--mp-primary': 'var(--vscode-button-background, #0e639c)',
          '--mp-primary-hover': 'var(--vscode-button-hoverBackground, #1177bb)',
          '--mp-primary-foreground': 'var(--vscode-button-foreground, #ffffff)',
          '--mp-border': 'var(--vscode-panel-border, #464647)',
          '--mp-border-muted': 'var(--vscode-dropdown-border, #2a2a2b)',
          '--mp-muted': 'var(--vscode-descriptionForeground, #cccccc)',
          '--mp-destructive': 'var(--vscode-errorForeground, #f14c4c)',
          '--mp-destructive-hover': 'var(--vscode-errorForeground, #f14c4c)',
          '--mp-destructive-foreground': '#ffffff',
          '--mp-success': 'var(--vscode-terminal-ansiGreen, #23d18b)',
          '--mp-success-hover': 'var(--vscode-terminal-ansiGreen, #23d18b)',
          '--mp-success-foreground': '#ffffff',
          '--mp-warning': 'var(--vscode-editorWarning-foreground, #cca700)',
          '--mp-warning-hover': 'var(--vscode-editorWarning-foreground, #cca700)',
          '--mp-warning-foreground': 'var(--vscode-editor-background, #1e1e1e)',
          '--mp-accent': 'var(--vscode-input-background, #3c3c3c)',
          '--mp-accent-hover': 'var(--vscode-dropdown-background, #2a2d2e)',
          '--mp-accent-foreground': 'var(--vscode-input-foreground, #cccccc)',
        },
        'body[data-vscode-theme-kind="vscode-light"]': {
          '--mp-background': 'var(--vscode-editor-background, #ffffff)',
          '--mp-background-secondary': 'var(--vscode-panel-background, #f3f3f3)',
          '--mp-foreground': 'var(--vscode-editor-foreground, #000000)',
          '--mp-foreground-secondary': 'var(--vscode-descriptionForeground, #6b7280)',
          '--mp-primary': 'var(--vscode-button-background, #0066cc)',
          '--mp-primary-hover': 'var(--vscode-button-hoverBackground, #1a74d1)',
          '--mp-primary-foreground': 'var(--vscode-button-foreground, #ffffff)',
          '--mp-border': 'var(--vscode-panel-border, #e0e0e0)',
          '--mp-border-muted': 'var(--vscode-dropdown-border, #e5e7eb)',
          '--mp-muted': 'var(--vscode-descriptionForeground, #6b7280)',
          '--mp-destructive': 'var(--vscode-errorForeground, #e51400)',
          '--mp-destructive-hover': 'var(--vscode-errorForeground, #e51400)',
          '--mp-destructive-foreground': '#ffffff',
          '--mp-success': 'var(--vscode-terminal-ansiGreen, #107c10)',
          '--mp-success-hover': 'var(--vscode-terminal-ansiGreen, #107c10)',
          '--mp-success-foreground': '#ffffff',
          '--mp-warning': 'var(--vscode-editorWarning-foreground, #996f00)',
          '--mp-warning-hover': 'var(--vscode-editorWarning-foreground, #996f00)',
          '--mp-warning-foreground': 'var(--vscode-editor-background, #ffffff)',
          '--mp-accent': 'var(--vscode-input-background, #f8f8f8)',
          '--mp-accent-hover': 'var(--vscode-dropdown-background, #f3f3f3)',
          '--mp-accent-foreground': 'var(--vscode-input-foreground, #333333)',
        },
        // JetBrains IDEs support
        'body[data-ide="jetbrains"]': {
          '--mp-background': 'var(--intellij-background, #ffffff)',
          '--mp-foreground': 'var(--intellij-foreground, #000000)',
          '--mp-primary': 'var(--intellij-accent, #4a90e2)',
          '--mp-border': 'var(--intellij-border, #d0d0d0)',
        },
      });
    },
  ],
  // Allow CSS variables to work even if Tailwind classes aren't used
  corePlugins: {
    preflight: false, // Don't reset styles in library mode
  },
};
