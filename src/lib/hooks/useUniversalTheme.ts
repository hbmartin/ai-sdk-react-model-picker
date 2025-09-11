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
    // VSCode detection takes priority
    if (document.body.className.includes('vscode-')) {
      setEnvironment('vscode');
      const vsTheme = document.body.className.includes('vscode-dark') ? 'dark' : 'light';
      setTheme(vsTheme);
      return;
    }

    // Check data attributes as fallback
    const bodyDataTheme = document.body.getAttribute('data-vscode-theme-kind');
    if (bodyDataTheme && bodyDataTheme.includes('vscode-')) {
      setEnvironment('vscode');
      const vsTheme = bodyDataTheme.includes('dark') ? 'dark' : 'light';
      setTheme(vsTheme);
      return;
    }

    // JetBrains detection
    if (
      document.body.hasAttribute('data-ide') &&
      document.body.getAttribute('data-ide') === 'jetbrains'
    ) {
      setEnvironment('jetbrains');
      // For JetBrains, check for dark theme indicators
      const isDark =
        document.body.classList.contains('dark') ||
        document.documentElement.getAttribute('data-theme') === 'dark';
      setTheme(isDark ? 'dark' : 'light');
      return;
    }

    // Fall back to system preference for web environment
    setEnvironment('web');
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setTheme(mediaQuery.matches ? 'dark' : 'light');

    const handleChange = (e: MediaQueryListEvent) => setTheme(e.matches ? 'dark' : 'light');

    // Use modern API if available
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, []);

  return { theme, environment };
}
