import { useState, useEffect, useRef } from 'react';

export interface VSCodeContext {
  isVSCodeEnv: boolean;
  themeKind: 'vscode-dark' | 'vscode-light' | 'vscode-high-contrast' | null;
  isJetBrainsEnv: boolean;
}

/**
 * Hook to detect and track VSCode/JetBrains environment and theme changes
 * Provides runtime detection of IDE environment and automatic theme adaptation
 */
export function useVSCodeContext(): VSCodeContext {
  const [context, setContext] = useState<VSCodeContext>(() => {
    // Initial detection
    const isVSCodeEnv = typeof (window as any).acquireVsCodeApi === 'function';
    const isJetBrainsEnv =
      document.body.hasAttribute('data-ide') &&
      document.body.getAttribute('data-ide') === 'jetbrains';

    let themeKind: VSCodeContext['themeKind'] = null;

    if (isVSCodeEnv) {
      // Get initial theme
      const bodyClasses = document.body.className;
      if (bodyClasses.includes('vscode-dark')) {
        themeKind = 'vscode-dark';
      } else if (bodyClasses.includes('vscode-light')) {
        themeKind = 'vscode-light';
      } else if (bodyClasses.includes('vscode-high-contrast')) {
        themeKind = 'vscode-high-contrast';
      } else {
        // Check data attribute as fallback
        const dataTheme = document.body.getAttribute('data-vscode-theme-kind');
        if (
          dataTheme === 'vscode-dark' ||
          dataTheme === 'vscode-light' ||
          dataTheme === 'vscode-high-contrast'
        ) {
          themeKind = dataTheme;
        }
      }
    }

    return {
      isVSCodeEnv,
      themeKind,
      isJetBrainsEnv,
    };
  });

  const observerRef = useRef<MutationObserver | null>(null);

  useEffect(() => {
    if (!context.isVSCodeEnv) return;

    // Setup MutationObserver for theme changes
    const handleThemeChange = () => {
      const bodyClasses = document.body.className;
      const dataTheme = document.body.getAttribute('data-vscode-theme-kind');

      let newThemeKind: VSCodeContext['themeKind'] = null;

      if (bodyClasses.includes('vscode-dark') || dataTheme === 'vscode-dark') {
        newThemeKind = 'vscode-dark';
      } else if (bodyClasses.includes('vscode-light') || dataTheme === 'vscode-light') {
        newThemeKind = 'vscode-light';
      } else if (
        bodyClasses.includes('vscode-high-contrast') ||
        dataTheme === 'vscode-high-contrast'
      ) {
        newThemeKind = 'vscode-high-contrast';
      }

      if (newThemeKind !== context.themeKind) {
        setContext((prev) => ({ ...prev, themeKind: newThemeKind }));
      }
    };

    observerRef.current = new MutationObserver(handleThemeChange);

    observerRef.current.observe(document.body, {
      attributes: true,
      attributeFilter: ['class', 'data-vscode-theme-kind'],
    });

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
    };
  }, [context.isVSCodeEnv, context.themeKind]);

  // Also listen for system theme changes when not in VSCode
  useEffect(() => {
    if (context.isVSCodeEnv || context.isJetBrainsEnv) return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (e: MediaQueryListEvent) => {
      // This will trigger CSS variable updates via our CSS rules
      document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
    };

    // Check for addEventListener support (modern browsers)
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }

    return undefined;
  }, [context.isVSCodeEnv, context.isJetBrainsEnv]);

  return context;
}

/**
 * Utility to get a VSCode theme color at runtime
 * Returns the computed value or fallback
 */
export function getVSCodeThemeColor(colorKey: string, fallback?: string): string | null {
  const cssVar = `--vscode-${colorKey}`;
  const value = getComputedStyle(document.documentElement).getPropertyValue(cssVar);
  return value || fallback || null;
}

/**
 * Apply VSCode-specific classes to an element based on environment
 */
export function getEnvironmentClasses(
  baseClasses: string,
  vsCodeClasses?: string,
  jetBrainsClasses?: string
): string {
  const isVSCode = typeof (window as any).acquireVsCodeApi === 'function';
  const isJetBrains =
    document.body.hasAttribute('data-ide') &&
    document.body.getAttribute('data-ide') === 'jetbrains';

  if (isVSCode && vsCodeClasses) {
    return `${baseClasses} ${vsCodeClasses}`;
  }

  if (isJetBrains && jetBrainsClasses) {
    return `${baseClasses} ${jetBrainsClasses}`;
  }

  return baseClasses;
}
