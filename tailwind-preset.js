/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      colors: {
        // Modern Tailwind syntax with alpha value support
        // These can be overridden by consumers while maintaining the structure
        primary: {
          50: 'rgb(var(--color-primary-50, 239 246 255) / <alpha-value>)',
          100: 'rgb(var(--color-primary-100, 219 234 254) / <alpha-value>)',
          200: 'rgb(var(--color-primary-200, 191 219 254) / <alpha-value>)',
          300: 'rgb(var(--color-primary-300, 147 197 253) / <alpha-value>)',
          400: 'rgb(var(--color-primary-400, 96 165 250) / <alpha-value>)',
          500: 'rgb(var(--color-primary-500, 59 130 246) / <alpha-value>)',
          600: 'rgb(var(--color-primary-600, 37 99 235) / <alpha-value>)',
          700: 'rgb(var(--color-primary-700, 29 78 216) / <alpha-value>)',
          800: 'rgb(var(--color-primary-800, 30 64 175) / <alpha-value>)',
          900: 'rgb(var(--color-primary-900, 30 58 138) / <alpha-value>)',
          950: 'rgb(var(--color-primary-950, 23 37 84) / <alpha-value>)',
          DEFAULT: 'rgb(var(--color-primary, 59 130 246) / <alpha-value>)',
          hover: 'rgb(var(--color-primary-hover, 37 99 235) / <alpha-value>)',
        },
        
        // Background colors with proper alpha support
        background: {
          DEFAULT: 'rgb(var(--color-background, 255 255 255) / <alpha-value>)',
          secondary: 'rgb(var(--color-background-secondary, 249 250 251) / <alpha-value>)',
          muted: 'rgb(var(--color-background-muted, 243 244 246) / <alpha-value>)',
        },
        
        // Foreground colors
        foreground: {
          DEFAULT: 'rgb(var(--color-foreground, 0 0 0) / <alpha-value>)',
          secondary: 'rgb(var(--color-foreground-secondary, 107 114 128) / <alpha-value>)',
          muted: 'rgb(var(--color-foreground-muted, 156 163 175) / <alpha-value>)',
        },
        
        // Border colors
        border: {
          DEFAULT: 'rgb(var(--color-border, 224 224 224) / <alpha-value>)',
          muted: 'rgb(var(--color-border-muted, 229 231 235) / <alpha-value>)',
        },
        
        // Status colors
        destructive: {
          DEFAULT: 'rgb(var(--color-destructive, 239 68 68) / <alpha-value>)',
          hover: 'rgb(var(--color-destructive-hover, 220 38 38) / <alpha-value>)',
        },
        
        success: {
          DEFAULT: 'rgb(var(--color-success, 34 197 94) / <alpha-value>)',
          hover: 'rgb(var(--color-success-hover, 22 163 74) / <alpha-value>)',
        },
        
        warning: {
          DEFAULT: 'rgb(var(--color-warning, 245 158 11) / <alpha-value>)',
          hover: 'rgb(var(--color-warning-hover, 217 119 6) / <alpha-value>)',
        },
        
        // Accent colors
        accent: {
          DEFAULT: 'rgb(var(--color-accent, 243 244 246) / <alpha-value>)',
          hover: 'rgb(var(--color-accent-hover, 229 231 235) / <alpha-value>)',
        },
      },
      
      borderRadius: {
        'default': 'var(--border-radius, 0.375rem)',
        'sm': 'var(--border-radius-sm, 0.25rem)',
        'md': 'var(--border-radius-md, 0.375rem)',
        'lg': 'var(--border-radius-lg, 0.5rem)',
      },
      
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
      },
      
      spacing: {
        '18': '4.5rem',
      },
      
      animation: {
        'spin-slow': 'spin 2s linear infinite',
      },
      
      // VSCode-specific color mappings for use in the library
      colors: {
        // VSCode variables mapped to semantic names
        'vscode-editor-bg': 'var(--vscode-editor-background)',
        'vscode-editor-fg': 'var(--vscode-editor-foreground)',
        'vscode-button-bg': 'var(--vscode-button-background)',
        'vscode-button-fg': 'var(--vscode-button-foreground)',
        'vscode-button-hover-bg': 'var(--vscode-button-hoverBackground)',
        'vscode-input-bg': 'var(--vscode-input-background)',
        'vscode-input-fg': 'var(--vscode-input-foreground)',
        'vscode-input-border': 'var(--vscode-input-border)',
        'vscode-panel-border': 'var(--vscode-panel-border)',
        'vscode-list-active-bg': 'var(--vscode-list-activeSelectionBackground)',
        'vscode-list-active-fg': 'var(--vscode-list-activeSelectionForeground)',
        'vscode-list-hover-bg': 'var(--vscode-list-hoverBackground)',
        'vscode-list-hover-fg': 'var(--vscode-list-hoverForeground)',
        'vscode-dropdown-bg': 'var(--vscode-dropdown-background)',
        'vscode-dropdown-fg': 'var(--vscode-dropdown-foreground)',
        'vscode-dropdown-border': 'var(--vscode-dropdown-border)',
        'vscode-focus-border': 'var(--vscode-focusBorder)',
        'vscode-error': 'var(--vscode-errorForeground)',
        'vscode-warning': 'var(--vscode-editorWarning-foreground)',
        'vscode-info': 'var(--vscode-editorInfo-foreground)',
        'vscode-success': 'var(--vscode-terminal-ansiGreen)',
        'vscode-text-secondary': 'var(--vscode-descriptionForeground)',
        'vscode-text-link': 'var(--vscode-textLink-foreground)',
        'vscode-text-link-active': 'var(--vscode-textLink-activeForeground)',
      },
    },
  },
  plugins: [
    // VSCode plugin will be available after build
    // Consumers can optionally include: require('ai-sdk-react-model-picker/dist/tailwind-vscode-plugin')
  ],
};