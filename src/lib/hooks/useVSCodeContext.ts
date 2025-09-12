import { useState, useEffect, useRef } from 'react';

export interface VSCodeContext {
  isVSCodeEnv: boolean;
  themeKind: 'vscode-dark' | 'vscode-light' | 'vscode-high-contrast' | undefined;
  isJetBrainsEnv: boolean;
}

/**
 * Hook to detect and track VSCode/JetBrains environment and theme changes
 * Provides runtime detection of IDE environment and automatic theme adaptation
 */
export function useVSCodeContext(): VSCodeContext {
  const [context, setContext] = useState<VSCodeContext>(() => {
    if (typeof document === 'undefined') {
      return {
        isVSCodeEnv: false,
        themeKind: undefined,
        isJetBrainsEnv: false,
      };
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
    const isVSCodeEnv = typeof (globalThis.window as any)['acquireVsCodeApi'] === 'function';
    const isJetBrainsEnv = document.body.dataset['ide'] === 'jetbrains';

    let themeKind: VSCodeContext['themeKind'] = undefined;

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
        const dataTheme = document.body.dataset['vscodeThemeKind'];
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

  const observerRef = useRef<MutationObserver | undefined>(undefined);

  useEffect(() => {
    if (!context.isVSCodeEnv) {
      return;
    }

    // Setup MutationObserver for theme changes
    const handleThemeChange = () => {
      const bodyClasses = document.body.className;
      const dataTheme = document.body.dataset['vscodeThemeKind'];

      let newThemeKind: VSCodeContext['themeKind'] = undefined;

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
        observerRef.current = undefined;
      }
    };
  }, [context.isVSCodeEnv, context.themeKind]);

  // Also listen for system theme changes when not in VSCode
  useEffect(() => {
    if (context.isVSCodeEnv || context.isJetBrainsEnv) {
      return;
    }

    const mediaQuery = globalThis.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (event: MediaQueryListEvent) => {
      // This will trigger CSS variable updates via our CSS rules
      document.documentElement.dataset['theme'] = event.matches ? 'dark' : 'light';
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [context.isVSCodeEnv, context.isJetBrainsEnv]);

  return context;
}

/**
 * Apply VSCode-specific classes to an element based on environment
 */
export function getEnvironmentClasses(
  baseClasses: string,
  vsCodeClasses?: string,
  jetBrainsClasses?: string
): string {
  if (typeof document === 'undefined') {
    return baseClasses;
  }
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
  const isVSCode = typeof (globalThis.window as any).acquireVsCodeApi === 'function';
  const isJetBrains =
    Object.hasOwn(document.body.dataset, 'ide') && document.body.dataset['ide'] === 'jetbrains';

  if (isVSCode && vsCodeClasses !== undefined) {
    return `${baseClasses} ${vsCodeClasses}`;
  }

  if (isJetBrains && jetBrainsClasses !== undefined) {
    return `${baseClasses} ${jetBrainsClasses}`;
  }

  return baseClasses;
}
