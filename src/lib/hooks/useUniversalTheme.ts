import { useState, useEffect } from 'react';

export interface UniversalTheme {
  theme: 'light' | 'dark';
  environment: 'web' | 'vscode' | 'jetbrains';
}

/**
 * Universal theme hook that detects environment and theme automatically
 * Follows the pattern recommended in the multi-environment guide
 *
 * @returns {UniversalTheme} Current theme and environment
 */
export function useUniversalTheme(): UniversalTheme {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [environment, setEnvironment] = useState<'web' | 'vscode' | 'jetbrains'>('web');

  useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }
    // VSCode detection takes priority
    if (document.body.className.includes('vscode-')) {
      setEnvironment('vscode');
      const vsTheme = document.body.className.includes('vscode-dark') ? 'dark' : 'light';
      setTheme(vsTheme);
      return;
    }

    // Check data attributes as fallback
    const bodyDataTheme =
      document.body.dataset['vscode-theme-kind'] ?? document.body.dataset['vscodeThemeKind'];
    if (bodyDataTheme?.includes('vscode-') === true) {
      setEnvironment('vscode');
      const vsTheme = bodyDataTheme.includes('dark') ? 'dark' : 'light';
      setTheme(vsTheme);
      return;
    }

    // JetBrains detection
    if (
      document.body.dataset['ide'] !== undefined &&
      document.body.dataset['ide'] === 'jetbrains'
    ) {
      setEnvironment('jetbrains');
      // For JetBrains, check for dark theme indicators
      const isDark =
        document.body.classList.contains('dark') ||
        document.documentElement.dataset['theme'] === 'dark';
      setTheme(isDark ? 'dark' : 'light');
      return;
    }

    // Fall back to system preference for web environment
    setEnvironment('web');
    const mediaQuery = globalThis.window.matchMedia('(prefers-color-scheme: dark)');
    setTheme(mediaQuery.matches ? 'dark' : 'light');

    const handleChange = (event: MediaQueryListEvent) => setTheme(event.matches ? 'dark' : 'light');

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return { theme, environment };
}
