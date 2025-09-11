/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/lib/**/*.{js,ts,jsx,tsx}'],
  safelist: [
    // VSCode theme variants
    'vscode-dark',
    'vscode-light',
    'vscode-high-contrast',
    // Core semantic utilities used by the library (ensure presence without Tailwind in consumer app)
    'bg-background',
    'bg-background/50',
    'bg-accent',
    'bg-accent/50',
    'bg-primary',
    'text-foreground',
    'text-muted',
    'text-accent-foreground',
    'text-destructive',
    'border-border',
    'rounded-default',
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
    'bg-warning/5',
    'text-warning',
    'bg-success/10',
    'text-success',
    'bg-destructive/10',
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
          foreground: 'rgb(var(--mp-primary-foreground, 255 255 255) / <alpha-value>)',
        },
        border: {
          DEFAULT: 'rgb(var(--mp-border, 224 224 224) / <alpha-value>)',
          muted: 'rgb(var(--mp-border-muted, 229 231 235) / <alpha-value>)',
        },
        muted: 'rgb(var(--mp-muted, 107 114 128) / <alpha-value>)',
        destructive: {
          DEFAULT: 'rgb(var(--mp-destructive, 239 68 68) / <alpha-value>)',
          hover: 'rgb(var(--mp-destructive-hover, 220 38 38) / <alpha-value>)',
          foreground: 'rgb(var(--mp-destructive-foreground, 255 255 255) / <alpha-value>)',
        },
        success: {
          DEFAULT: 'rgb(var(--mp-success, 34 197 94) / <alpha-value>)',
          hover: 'rgb(var(--mp-success-hover, 22 163 74) / <alpha-value>)',
          foreground: 'rgb(var(--mp-success-foreground, 255 255 255) / <alpha-value>)',
        },
        warning: {
          DEFAULT: 'rgb(var(--mp-warning, 245 158 11) / <alpha-value>)',
          hover: 'rgb(var(--mp-warning-hover, 217 119 6) / <alpha-value>)',
          foreground: 'rgb(var(--mp-warning-foreground, 255 255 255) / <alpha-value>)',
        },
        accent: {
          DEFAULT: 'rgb(var(--mp-accent, 243 244 246) / <alpha-value>)',
          hover: 'rgb(var(--mp-accent-hover, 229 231 235) / <alpha-value>)',
          foreground: 'rgb(var(--mp-accent-foreground, 55 65 81) / <alpha-value>)',
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
  // Note: Prefix disabled for now to avoid breaking existing components
  // Consider adding 'mp-' prefix in future major version
  // prefix: 'mp-',
  // Allow CSS variables to work even if Tailwind classes aren't used
  corePlugins: {
    preflight: false, // Don't reset styles in library mode
  },
}
