/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      colors: {
        // Modern Tailwind syntax with alpha value support
        // These can be overridden by consumers while maintaining the structure
        primary: {
          50: 'rgb(var(--mp-primary-50, 239 246 255) / <alpha-value>)',
          100: 'rgb(var(--mp-primary-100, 219 234 254) / <alpha-value>)',
          200: 'rgb(var(--mp-primary-200, 191 219 254) / <alpha-value>)',
          300: 'rgb(var(--mp-primary-300, 147 197 253) / <alpha-value>)',
          400: 'rgb(var(--mp-primary-400, 96 165 250) / <alpha-value>)',
          500: 'rgb(var(--mp-primary-500, 59 130 246) / <alpha-value>)',
          600: 'rgb(var(--mp-primary-600, 37 99 235) / <alpha-value>)',
          700: 'rgb(var(--mp-primary-700, 29 78 216) / <alpha-value>)',
          800: 'rgb(var(--mp-primary-800, 30 64 175) / <alpha-value>)',
          900: 'rgb(var(--mp-primary-900, 30 58 138) / <alpha-value>)',
          950: 'rgb(var(--mp-primary-950, 23 37 84) / <alpha-value>)',
          DEFAULT: 'rgb(var(--mp-primary-rgb, 59 130 246) / <alpha-value>)',
          hover: 'rgb(var(--mp-primary-hover-rgb, 37 99 235) / <alpha-value>)',
        },

        // Background colors with proper alpha support
        background: {
          DEFAULT: 'rgb(var(--mp-background-rgb, 255 255 255) / <alpha-value>)',
          secondary: 'rgb(var(--mp-background-secondary-rgb, 249 250 251) / <alpha-value>)',
          muted: 'rgb(var(--mp-background-muted-rgb, 243 244 246) / <alpha-value>)',
        },

        // Foreground colors
        foreground: {
          DEFAULT: 'rgb(var(--mp-foreground-rgb, 0 0 0) / <alpha-value>)',
          secondary: 'rgb(var(--mp-foreground-secondary-rgb, 107 114 128) / <alpha-value>)',
          muted: 'rgb(var(--mp-muted-rgb, 156 163 175) / <alpha-value>)',
        },

        // Border colors
        border: {
          DEFAULT: 'rgb(var(--mp-border-rgb, 224 224 224) / <alpha-value>)',
          muted: 'rgb(var(--mp-border-muted-rgb, 229 231 235) / <alpha-value>)',
        },

        // Status colors
        destructive: {
          DEFAULT: 'rgb(var(--mp-destructive-rgb, 239 68 68) / <alpha-value>)',
          hover: 'rgb(var(--mp-destructive-hover-rgb, 220 38 38) / <alpha-value>)',
        },

        success: {
          DEFAULT: 'rgb(var(--mp-success-rgb, 34 197 94) / <alpha-value>)',
          hover: 'rgb(var(--mp-success-hover-rgb, 22 163 74) / <alpha-value>)',
        },

        warning: {
          DEFAULT: 'rgb(var(--mp-warning-rgb, 245 158 11) / <alpha-value>)',
          hover: 'rgb(var(--mp-warning-hover-rgb, 217 119 6) / <alpha-value>)',
        },

        // Accent colors
        accent: {
          DEFAULT: 'rgb(var(--mp-accent-rgb, 243 244 246) / <alpha-value>)',
          hover: 'rgb(var(--mp-accent-hover-rgb, 229 231 235) / <alpha-value>)',
        },

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

      borderRadius: {
        DEFAULT: 'var(--mp-border-radius, 0.375rem)',
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
      
    },
  },
  plugins: [
    // Map consumer Tailwind theme tokens to CSS variables used by the library.
    function ({ addBase, theme }) {
      const resolve = (path, fallback) => {
        try {
          const v = theme(path);
          return v === undefined ? fallback : v;
        } catch {
          return fallback;
        }
      };

      const hexToRgb = (hex) => {
        if (typeof hex !== 'string') return undefined;
        let h = hex.trim();
        if (h.startsWith('rgb(')) {
          const m = h.match(/rgba?\(([^)]+)\)/);
          if (m) {
            const parts = m[1].split(/[\s,\/]+/).filter(Boolean);
            const [r, g, b] = parts.map((n) => parseInt(n, 10));
            if (Number.isFinite(r) && Number.isFinite(g) && Number.isFinite(b)) {
              return `${r} ${g} ${b}`;
            }
          }
          return undefined;
        }
        if (!h.startsWith('#')) return undefined;
        h = h.slice(1);
        if (h.length === 3) {
          h = h.split('').map((c) => c + c).join('');
          } else if (h.length === 4) { // #RGBA
            h = h.split('').map((c, i) => (i < 3 ? c + c : '')).join('');
          } else if (h.length === 8) { // #RRGGBBAA
            h = h.slice(0, 6);
          }
        const num = parseInt(h, 16);
        if (!Number.isFinite(num)) return undefined;
        const r = (num >> 16) & 255;
        const g = (num >> 8) & 255;
        const b = num & 255;
        return `${r} ${g} ${b}`;
      };

      const toRgb = (val, fallbackHex) => hexToRgb(val) || hexToRgb(fallbackHex);

      const fallbacks = {
        white: '#ffffff',
        black: '#000000',
        gray100: resolve('colors.gray.100', '#f3f4f6'),
        gray200: resolve('colors.gray.200', '#e5e7eb'),
        gray300: resolve('colors.gray.300', '#d1d5db'),
        gray700: resolve('colors.gray.700', '#374151'),
        gray800: resolve('colors.gray.800', '#1f2937'),
        gray900: resolve('colors.gray.900', '#111827'),
        zinc900: resolve('colors.zinc.900', '#18181b'),
        zinc100: resolve('colors.zinc.100', '#f4f4f5'),
        blue500: resolve('colors.blue.500', '#3b82f6'),
        blue600: resolve('colors.blue.600', '#2563eb'),
        red500: resolve('colors.red.500', '#ef4444'),
        red600: resolve('colors.red.600', '#dc2626'),
        green500: resolve('colors.green.500', '#22c55e'),
        green600: resolve('colors.green.600', '#16a34a'),
        amber500: resolve('colors.amber.500', '#f59e0b'),
        amber600: resolve('colors.amber.600', '#d97706'),
      };

      const primary = toRgb(resolve('colors.primary.500', fallbacks.blue500), fallbacks.blue500);
      const primaryHover = toRgb(resolve('colors.primary.600', fallbacks.blue600), fallbacks.blue600);

      const destructive = toRgb(resolve('colors.destructive.DEFAULT', fallbacks.red500), fallbacks.red500) || toRgb(fallbacks.red500, fallbacks.red500);
      const destructiveHover = toRgb(resolve('colors.destructive.hover', fallbacks.red600), fallbacks.red600) || toRgb(fallbacks.red600, fallbacks.red600);
      const success = toRgb(resolve('colors.success.DEFAULT', fallbacks.green500), fallbacks.green500) || toRgb(fallbacks.green500, fallbacks.green500);
      const successHover = toRgb(resolve('colors.success.hover', fallbacks.green600), fallbacks.green600) || toRgb(fallbacks.green600, fallbacks.green600);
      const warning = toRgb(resolve('colors.warning.DEFAULT', fallbacks.amber500), fallbacks.amber500) || toRgb(fallbacks.amber500, fallbacks.amber500);
      const warningHover = toRgb(resolve('colors.warning.hover', fallbacks.amber600), fallbacks.amber600) || toRgb(fallbacks.amber600, fallbacks.amber600);

      addBase({
        ':root': {
          // Core semantic tokens (RGB triplets)
          '--mp-background-rgb': toRgb(resolve('colors.background.DEFAULT', fallbacks.white), fallbacks.white),
          '--mp-background-secondary-rgb': toRgb(resolve('colors.background.secondary', fallbacks.gray100), fallbacks.gray100),
          '--mp-foreground-rgb': toRgb(resolve('colors.foreground.DEFAULT', fallbacks.gray900), fallbacks.gray900),
          '--mp-foreground-secondary-rgb': toRgb(resolve('colors.foreground.secondary', fallbacks.gray700), fallbacks.gray700),
          '--mp-primary-rgb': primary,
          '--mp-primary-hover-rgb': primaryHover,
          '--mp-primary-foreground-rgb': toRgb(resolve('colors.primary.foreground', fallbacks.white), fallbacks.white),
          '--mp-border-rgb': toRgb(resolve('colors.border.DEFAULT', fallbacks.gray200), fallbacks.gray200),
          '--mp-border-muted-rgb': toRgb(resolve('colors.border.muted', fallbacks.gray300), fallbacks.gray300),
          '--mp-muted-rgb': toRgb(resolve('colors.foreground.muted', fallbacks.gray700), fallbacks.gray700),
          '--mp-destructive-rgb': destructive,
          '--mp-destructive-hover-rgb': destructiveHover,
          '--mp-destructive-foreground-rgb': toRgb(resolve('colors.destructive.foreground', fallbacks.white), fallbacks.white),
          '--mp-success-rgb': success,
          '--mp-success-hover-rgb': successHover,
          '--mp-success-foreground-rgb': toRgb(resolve('colors.success.foreground', fallbacks.white), fallbacks.white),
          '--mp-warning-rgb': warning,
          '--mp-warning-hover-rgb': warningHover,
          '--mp-warning-foreground-rgb': toRgb(resolve('colors.warning.foreground', fallbacks.black), fallbacks.black),
          '--mp-accent-rgb': toRgb(resolve('colors.accent.DEFAULT', fallbacks.gray100), fallbacks.gray100),
          '--mp-accent-hover-rgb': toRgb(resolve('colors.accent.hover', fallbacks.gray200), fallbacks.gray200),
          '--mp-accent-foreground-rgb': toRgb(resolve('colors.accent.foreground', fallbacks.gray700), fallbacks.gray700),
          '--mp-border-radius': '0.375rem',
          // Backwards-compat: also set non -rgb vars to the same triplets
          '--mp-background': toRgb(resolve('colors.background.DEFAULT', fallbacks.white), fallbacks.white),
          '--mp-background-secondary': toRgb(resolve('colors.background.secondary', fallbacks.gray100), fallbacks.gray100),
          '--mp-foreground': toRgb(resolve('colors.foreground.DEFAULT', fallbacks.gray900), fallbacks.gray900),
          '--mp-foreground-secondary': toRgb(resolve('colors.foreground.secondary', fallbacks.gray700), fallbacks.gray700),
          '--mp-primary': primary,
          '--mp-primary-hover': primaryHover,
          '--mp-primary-foreground': toRgb(resolve('colors.primary.foreground', fallbacks.white), fallbacks.white),
          '--mp-border': toRgb(resolve('colors.border.DEFAULT', fallbacks.gray200), fallbacks.gray200),
          '--mp-border-muted': toRgb(resolve('colors.border.muted', fallbacks.gray300), fallbacks.gray300),
          '--mp-muted': toRgb(resolve('colors.foreground.muted', fallbacks.gray700), fallbacks.gray700),
          '--mp-destructive': destructive,
          '--mp-destructive-hover': destructiveHover,
          '--mp-destructive-foreground': toRgb(resolve('colors.destructive.foreground', fallbacks.white), fallbacks.white),
          '--mp-success': success,
          '--mp-success-hover': successHover,
          '--mp-success-foreground': toRgb(resolve('colors.success.foreground', fallbacks.white), fallbacks.white),
          '--mp-warning': warning,
          '--mp-warning-hover': warningHover,
          '--mp-warning-foreground': toRgb(resolve('colors.warning.foreground', fallbacks.black), fallbacks.black),
          '--mp-accent': toRgb(resolve('colors.accent.DEFAULT', fallbacks.gray100), fallbacks.gray100),
          '--mp-accent-hover': toRgb(resolve('colors.accent.hover', fallbacks.gray200), fallbacks.gray200),
          '--mp-accent-foreground': toRgb(resolve('colors.accent.foreground', fallbacks.gray700), fallbacks.gray700),
        },
        '.dark, [data-theme="dark"]': {
          '--mp-background-rgb': toRgb(resolve('colors.background.dark', fallbacks.zinc900), fallbacks.zinc900),
          '--mp-background-secondary-rgb': toRgb(resolve('colors.background.darkSecondary', fallbacks.gray800), fallbacks.gray800),
          '--mp-foreground-rgb': toRgb(resolve('colors.foreground.dark', fallbacks.zinc100), fallbacks.zinc100),
          '--mp-foreground-secondary-rgb': toRgb(resolve('colors.foreground.darkSecondary', fallbacks.gray300), fallbacks.gray300),
          '--mp-border-rgb': toRgb(resolve('colors.border.dark', fallbacks.gray700), fallbacks.gray700),
          '--mp-border-muted-rgb': toRgb(resolve('colors.border.darkMuted', fallbacks.gray700), fallbacks.gray700),
          '--mp-accent-rgb': toRgb(resolve('colors.accent.dark', fallbacks.gray800), fallbacks.gray800),
          '--mp-accent-hover-rgb': toRgb(resolve('colors.accent.darkHover', fallbacks.gray700), fallbacks.gray700),
          // Backwards-compat mirror
          '--mp-background': toRgb(resolve('colors.background.dark', fallbacks.zinc900), fallbacks.zinc900),
          '--mp-background-secondary': toRgb(resolve('colors.background.darkSecondary', fallbacks.gray800), fallbacks.gray800),
          '--mp-foreground': toRgb(resolve('colors.foreground.dark', fallbacks.zinc100), fallbacks.zinc100),
          '--mp-foreground-secondary': toRgb(resolve('colors.foreground.darkSecondary', fallbacks.gray300), fallbacks.gray300),
          '--mp-border': toRgb(resolve('colors.border.dark', fallbacks.gray700), fallbacks.gray700),
          '--mp-border-muted': toRgb(resolve('colors.border.darkMuted', fallbacks.gray700), fallbacks.gray700),
          '--mp-accent': toRgb(resolve('colors.accent.dark', fallbacks.gray800), fallbacks.gray800),
          '--mp-accent-hover': toRgb(resolve('colors.accent.darkHover', fallbacks.gray700), fallbacks.gray700),
          // Keep primary/semantic status colors, but consumers can override with their own dark tokens}
        },
      });
    },
  ],
};
