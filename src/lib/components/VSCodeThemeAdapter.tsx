import { useEffect, type ReactNode } from 'react';
import { useVSCodeContext } from '../hooks/useVSCodeContext';

export interface VSCodeThemeAdapterProps {
  children: ReactNode;
  className?: string;
  enableAutoDetection?: boolean;
}

/**
 * Wrapper component that automatically adapts to VSCode theme changes
 * and applies appropriate classes and CSS variables
 */
export function VSCodeThemeAdapter({
  children,
  className = '',
  enableAutoDetection = true,
}: VSCodeThemeAdapterProps) {
  const { isVSCodeEnv, themeKind, isJetBrainsEnv } = useVSCodeContext();

  useEffect(() => {
    if (!enableAutoDetection) return;

    // Apply environment-specific classes/attributes to the document body so
    // they match CSS selectors used across the library (and VSCode webviews).
    const rootElement = document.documentElement;
    const bodyEl = document.body;

    if (isVSCodeEnv) {
      rootElement.classList.add('vscode-environment');

      // Apply theme-specific attribute/class on <body> to align with
      // CSS rules (body[data-vscode-theme-kind], body.vscode-dark, ...)
      if (themeKind) {
        // Keep data attribute for selectors
        bodyEl.setAttribute('data-vscode-theme-kind', themeKind);

        // Ensure mutually exclusive theme classes
        bodyEl.classList.remove('vscode-dark', 'vscode-light', 'vscode-high-contrast');
        bodyEl.classList.add(themeKind);
      }

      // Ensure VSCode CSS variables are accessible
      const computedStyle = getComputedStyle(document.body);
      const vscodeBackground = computedStyle.getPropertyValue('--vscode-editor-background');

      if (!vscodeBackground) {
        console.warn(
          'VSCode CSS variables not found. Ensure this component is running in a VSCode webview.'
        );
      }
    } else if (isJetBrainsEnv) {
      rootElement.classList.add('jetbrains-environment');
    } else {
      // Standard web environment - check for dark mode preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      rootElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    }

    return () => {
      // Cleanup classes on unmount
      rootElement.classList.remove('vscode-environment', 'jetbrains-environment');
      // Remove body-level VSCode attributes/classes
      bodyEl.removeAttribute('data-vscode-theme-kind');
      bodyEl.classList.remove('vscode-dark', 'vscode-light', 'vscode-high-contrast');
      rootElement.removeAttribute('data-theme');
    };
  }, [isVSCodeEnv, themeKind, isJetBrainsEnv, enableAutoDetection]);

  // Apply wrapper div with appropriate classes
  const wrapperClasses = [
    'ai-sdk-model-picker-theme-adapter',
    isVSCodeEnv && 'in-vscode',
    isJetBrainsEnv && 'in-jetbrains',
    themeKind,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return <div className={wrapperClasses}>{children}</div>;
}

export default VSCodeThemeAdapter;
