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

    // Apply environment-specific classes to the root element
    const rootElement = document.documentElement;

    if (isVSCodeEnv) {
      rootElement.classList.add('vscode-environment');

      // Apply theme-specific classes
      if (themeKind) {
        rootElement.setAttribute('data-vscode-theme', themeKind);
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
      rootElement.removeAttribute('data-vscode-theme');
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
