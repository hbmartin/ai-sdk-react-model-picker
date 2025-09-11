# VSCode Integration Guide

This library provides comprehensive support for VSCode webviews with automatic theme adaptation and proper styling.

## Features

- ✅ Automatic VSCode environment detection
- ✅ Real-time theme switching (dark/light/high-contrast)
- ✅ CSS variables inheritance from VSCode
- ✅ Font family, size, and weight inheritance
- ✅ Proper box-sizing for webview compatibility
- ✅ VSCode-specific Tailwind utility classes
- ✅ JetBrains IDE support

## Quick Start

### Basic Usage

Simply import the styles and use the components:

```tsx
import { ModelSelect } from 'ai-sdk-react-model-picker';
import 'ai-sdk-react-model-picker/styles.css';

function MyComponent() {
  return <ModelSelect {...props} />;
}
```

The components automatically detect VSCode environment and adapt their styling.

### With Theme Adapter

For enhanced theme integration, wrap your components with `VSCodeThemeAdapter`:

```tsx
import { ModelSelect, VSCodeThemeAdapter } from 'ai-sdk-react-model-picker';
import 'ai-sdk-react-model-picker/styles.css';

function MyApp() {
  return (
    <VSCodeThemeAdapter>
      <ModelSelect {...props} />
    </VSCodeThemeAdapter>
  );
}
```

## Advanced Usage

### Runtime VSCode Detection

Use the `useVSCodeContext` hook for custom logic:

```tsx
import { useVSCodeContext } from 'ai-sdk-react-model-picker';

function MyComponent() {
  const { isVSCodeEnv, themeKind, vsCodeApi } = useVSCodeContext();
  
  if (isVSCodeEnv) {
    // Apply VSCode-specific logic
    console.log('Running in VSCode with theme:', themeKind);
  }
  
  return <div>...</div>;
}
```

### VSCode-Specific Utility Classes

The library provides Tailwind utilities for VSCode CSS variables:

```tsx
// Background colors
<div className="bg-vscode-editor-bg">...</div>
<button className="bg-vscode-button-bg text-vscode-button-fg">...</button>

// Hover states
<div className="hover:bg-vscode-list-hover-bg">...</div>

// Focus states
<input className="focus:border-vscode-focus-border" />

// Scrollbars
<div className="scrollbar-vscode">...</div>
```

### Getting VSCode Theme Colors

Access VSCode theme colors programmatically:

```tsx
import { getVSCodeThemeColor } from 'ai-sdk-react-model-picker';

const buttonBg = getVSCodeThemeColor('button-background', '#0066cc');
```

### Environment-Specific Classes

Apply different styles based on environment:

```tsx
import { getEnvironmentClasses } from 'ai-sdk-react-model-picker';

const className = getEnvironmentClasses(
  'base-class',
  'vscode-specific-class',
  'jetbrains-specific-class'
);
```

## CSS Variables

The library maps VSCode CSS variables to internal variables:

| Internal Variable | VSCode Variable | Default |
|------------------|-----------------|---------|
| `--mp-background` | `--vscode-editor-background` | `#ffffff` |
| `--mp-foreground` | `--vscode-editor-foreground` | `#000000` |
| `--mp-primary` | `--vscode-button-background` | `#0066cc` |
| `--mp-border` | `--vscode-panel-border` | `#e0e0e0` |
| `--mp-muted` | `--vscode-descriptionForeground` | `#6b7280` |
| `--mp-accent` | `--vscode-input-background` | `#f3f4f6` |

## Theme Detection

The library detects themes through:

1. **Body class names**: `vscode-dark`, `vscode-light`, `vscode-high-contrast`
2. **Data attributes**: `data-vscode-theme-kind="vscode-dark"`
3. **Mutation observers**: Automatically responds to theme changes

## Troubleshooting

### Components Look Wrong in VSCode

1. **Ensure CSS is imported**: 
   ```tsx
   import 'ai-sdk-react-model-picker/styles.css';
   ```

2. **Check VSCode variables are available**:
   ```js
   const style = getComputedStyle(document.documentElement);
   console.log(style.getPropertyValue('--vscode-editor-background'));
   ```

3. **Verify environment detection**:
   ```tsx
   const { isVSCodeEnv } = useVSCodeContext();
   console.log('Is VSCode?', isVSCodeEnv);
   ```

### Dynamic Classes Not Applied

The library includes a safelist for dynamically-applied classes. If you're using custom VSCode utilities, add them to your app's Tailwind config:

```js
// tailwind.config.js
module.exports = {
  safelist: [
    { pattern: /^(bg|text|border)-vscode-/ },
  ]
}
```

### Font Issues

The library automatically inherits VSCode fonts. If fonts look wrong, check:

```css
.ai-sdk-model-picker {
  font-family: var(--vscode-font-family, fallback-fonts);
  font-size: var(--vscode-font-size, 14px);
}
```

## Best Practices

1. **Always import CSS**: The styles are essential for proper rendering
2. **Use VSCodeThemeAdapter**: Provides the best integration experience
3. **Test in VSCode**: Use the Extension Host to test in actual VSCode environment
4. **Handle non-VSCode environments**: Components work in regular web apps too
5. **Respect user themes**: Don't override VSCode variables unless necessary

## Example Integration

```tsx
import React from 'react';
import {
  ModelSelect,
  VSCodeThemeAdapter,
  useVSCodeContext,
  MemoryStorageAdapter,
  createDefaultRegistry
} from 'ai-sdk-react-model-picker';
import 'ai-sdk-react-model-picker/styles.css';

function VSCodeExtension() {
  const { isVSCodeEnv, themeKind } = useVSCodeContext();
  const storage = new MemoryStorageAdapter();
  const registry = createDefaultRegistry();
  
  return (
    <VSCodeThemeAdapter>
      <div className={isVSCodeEnv ? 'in-vscode' : 'in-browser'}>
        <h1 className="text-vscode-editor-fg">
          Model Selector {themeKind && `(${themeKind})`}
        </h1>
        <ModelSelect
          storage={storage}
          providerRegistry={registry}
          onModelChange={(model) => console.log('Selected:', model)}
        />
      </div>
    </VSCodeThemeAdapter>
  );
}

export default VSCodeExtension;
```

## Support

For issues or questions about VSCode integration, please open an issue on GitHub with the `vscode` label.