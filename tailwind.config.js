/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/lib/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // CSS variables for theme integration
        background: 'var(--mp-background, #ffffff)',
        foreground: 'var(--mp-foreground, #000000)',
        primary: 'var(--mp-primary, #0066cc)',
        border: 'var(--mp-border, #e0e0e0)',
        muted: 'var(--mp-muted, #6b7280)',
        destructive: 'var(--mp-destructive, #ef4444)',
        accent: 'var(--mp-accent, #f3f4f6)',
        
        // VSCode specific mappings
        'vscode-editor-background': 'var(--vscode-editor-background, #1e1e1e)',
        'vscode-editor-foreground': 'var(--vscode-editor-foreground, #d4d4d4)',
        'vscode-button-background': 'var(--vscode-button-background, #0e639c)',
        'vscode-button-foreground': 'var(--vscode-button-foreground, #ffffff)',
        'vscode-panel-border': 'var(--vscode-panel-border, #464647)',
        'vscode-input-background': 'var(--vscode-input-background, #3c3c3c)',
        'vscode-input-foreground': 'var(--vscode-input-foreground, #cccccc)',
        'vscode-list-activeBackground': 'var(--vscode-list-activeBackground, #094771)',
        'vscode-list-activeForeground': 'var(--vscode-list-activeForeground, #ffffff)',
        'vscode-dropdown-background': 'var(--vscode-dropdown-background, #3c3c3c)',
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