import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';

type BaseStyles = Partial<Record<string, Record<string, string | undefined>>>;

interface TailwindPluginContext {
  addBase: (styles: BaseStyles) => void;
  theme: (path: string) => string | undefined;
}

interface TailwindPreset {
  plugins: [
    (context: TailwindPluginContext) => void,
    ...Array<(context: TailwindPluginContext) => void>,
  ];
}

const require = createRequire(import.meta.url);
const preset = require('../tailwind-preset.cjs') as TailwindPreset;

const renderBaseStyles = (themeValues: Record<string, string> = {}) => {
  let baseStyles: BaseStyles = {};
  const plugin = preset.plugins[0];

  plugin({
    addBase(styles) {
      baseStyles = styles;
    },
    theme: (path) => themeValues[path],
  });

  return baseStyles;
};

const getRule = (styles: BaseStyles, selector: string) => {
  const rule = styles[selector];
  if (rule === undefined) {
    throw new Error(`Missing base rule for ${selector}`);
  }
  return rule;
};

describe('tailwind preset color token generation', () => {
  it('normalizes supported CSS colors to RGB triplets', () => {
    const root = getRule(
      renderBaseStyles({
        'colors.background.DEFAULT': 'oklch(1 0 0)',
        'colors.foreground.DEFAULT': '#1234',
        'colors.primary.500': 'rgba(255, 128, 64, 0.5)',
        'colors.primary.600': 'hsl(120 100% 25%)',
      }),
      ':root'
    );

    expect(root['--mp-background-rgb']).toBe('255 255 255');
    expect(root['--mp-foreground-rgb']).toBe('17 34 51');
    expect(root['--mp-primary-rgb']).toBe('255 128 64');
    expect(root['--mp-primary-hover-rgb']).toBe('0 128 0');
  });

  it('sets dark muted foreground variables independently', () => {
    const dark = getRule(
      renderBaseStyles({
        'colors.foreground.darkMuted': 'hsl(0 0% 80%)',
      }),
      '.dark, [data-theme="dark"]'
    );

    expect(dark['--mp-muted-rgb']).toBe('204 204 204');
    expect(dark['--mp-muted']).toBe('204 204 204');
  });
});
