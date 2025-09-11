/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/lib/**/*.{js,ts,jsx,tsx}'],
  safelist: [
    // VSCode theme variants
    'vscode-dark',
    'vscode-light',
    'vscode-high-contrast',
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
  ],
  theme: {
    extend: {
      colors: {
        // Modern Tailwind CSS variables with alpha support
        background: {
          DEFAULT: 'rgb(var(--mp-background, 255 255 255) / <alpha-value>)',
          secondary: 'rgb(var(--mp-background-secondary, 249 250 251) / <alpha-value>)',
        },
        foreground: {
          DEFAULT: 'rgb(var(--mp-foreground, 0 0 0) / <alpha-value>)',
          secondary: 'rgb(var(--mp-foreground-secondary, 107 114 128) / <alpha-value>)',
        },
        primary: {
          DEFAULT: 'rgb(var(--mp-primary, 59 130 246) / <alpha-value>)',
          hover: 'rgb(var(--mp-primary-hover, 37 99 235) / <alpha-value>)',
        },
        border: {
          DEFAULT: 'rgb(var(--mp-border, 224 224 224) / <alpha-value>)',
          muted: 'rgb(var(--mp-border-muted, 229 231 235) / <alpha-value>)',
        },
        muted: 'rgb(var(--mp-muted, 107 114 128) / <alpha-value>)',
        destructive: {
          DEFAULT: 'rgb(var(--mp-destructive, 239 68 68) / <alpha-value>)',
          hover: 'rgb(var(--mp-destructive-hover, 220 38 38) / <alpha-value>)',
        },
        accent: {
          DEFAULT: 'rgb(var(--mp-accent, 243 244 246) / <alpha-value>)',
          hover: 'rgb(var(--mp-accent-hover, 229 231 235) / <alpha-value>)',
        },
        
        // VSCode specific mappings with alpha support
        'vscode-editor-bg': 'rgb(var(--vscode-editor-background, 30 30 30) / <alpha-value>)',
        'vscode-editor-fg': 'rgb(var(--vscode-editor-foreground, 212 212 212) / <alpha-value>)',
        'vscode-button-bg': 'rgb(var(--vscode-button-background, 14 99 156) / <alpha-value>)',
        'vscode-button-fg': 'rgb(var(--vscode-button-foreground, 255 255 255) / <alpha-value>)',
        'vscode-panel-border': 'rgb(var(--vscode-panel-border, 70 70 71) / <alpha-value>)',
        'vscode-input-bg': 'rgb(var(--vscode-input-background, 60 60 60) / <alpha-value>)',
        'vscode-input-fg': 'rgb(var(--vscode-input-foreground, 204 204 204) / <alpha-value>)',
        'vscode-list-active-bg': 'rgb(var(--vscode-list-activeBackground, 9 71 113) / <alpha-value>)',
        'vscode-list-active-fg': 'rgb(var(--vscode-list-activeForeground, 255 255 255) / <alpha-value>)',
        'vscode-dropdown-bg': 'rgb(var(--vscode-dropdown-background, 60 60 60) / <alpha-value>)',
      },
      borderRadius: {
        'default': 'var(--mp-border-radius, 0.375rem)',
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
    require('./src/lib/tailwind/vscode-plugin'),
    // Plugin to handle VSCode environment detection
    function({ addBase, theme }) {
      addBase({
        ':root': {
          // Default theme values (light mode)
          '--mp-background': '#ffffff',
          '--mp-foreground': '#000000',
          '--mp-primary': '#0066cc',
          '--mp-border': '#e0e0e0',
          '--mp-muted': '#6b7280',
          '--mp-destructive': '#ef4444',
          '--mp-accent': '#f3f4f6',
          '--mp-border-radius': '0.375rem',
        },
        // VSCode environment detection and mapping
        'body[data-vscode-theme-kind="vscode-dark"], body[data-vscode-theme-kind="vscode-high-contrast"]': {
          '--mp-background': 'var(--vscode-editor-background, #1e1e1e)',
          '--mp-foreground': 'var(--vscode-editor-foreground, #d4d4d4)',
          '--mp-primary': 'var(--vscode-button-background, #0e639c)',
          '--mp-border': 'var(--vscode-panel-border, #464647)',
          '--mp-muted': 'var(--vscode-descriptionForeground, #ccccccaa)',
          '--mp-accent': 'var(--vscode-input-background, #3c3c3c)',
        },
        'body[data-vscode-theme-kind="vscode-light"]': {
          '--mp-background': 'var(--vscode-editor-background, #ffffff)',
          '--mp-foreground': 'var(--vscode-editor-foreground, #000000)',
          '--mp-primary': 'var(--vscode-button-background, #0066cc)',
          '--mp-border': 'var(--vscode-panel-border, #e0e0e0)',
          '--mp-muted': 'var(--vscode-descriptionForeground, #6b7280)',
          '--mp-accent': 'var(--vscode-input-background, #f8f8f8)',
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
}