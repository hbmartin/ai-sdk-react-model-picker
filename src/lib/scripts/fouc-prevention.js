/**
 * Flash of Unstyled Content (FOUC) Prevention Script
 *
 * This script should be included as an inline script in the <head> of your document
 * BEFORE any React components are rendered. It sets up theme detection and CSS variables
 * immediately to prevent visual flashing when the component library loads.
 *
 * Usage:
 * 1. For VSCode extensions: Not needed - VSCode handles its own theming
 * 2. For web applications: Include this script inline in your HTML head
 * 3. For React apps: Include in index.html or use a helmet/head manager
 *
 * @example
 * <!-- In your HTML head -->
 * <script>
 *   // Paste the content of this file here as an inline script
 * </script>
 */

(function () {
  'use strict';

  // Early VSCode detection - if we're in VSCode, let it handle theming
  const isVSCode = typeof acquireVsCodeApi === 'function';
  if (isVSCode) {
    // VSCode webview handles its own theming, no FOUC prevention needed
    return;
  }

  // Early JetBrains detection
  const isJetBrains =
    document.documentElement.hasAttribute('data-jetbrains-ide') ||
    (typeof window !== 'undefined' && window.JetBrainsIde);
  if (isJetBrains) {
    document.documentElement.setAttribute('data-ide', 'jetbrains');
    return;
  }

  // For standard web environments, detect and apply theme immediately
  const detectAndApplyTheme = () => {
    // Check for stored theme preference
    let theme = 'light';

    try {
      const storedTheme = localStorage.getItem('theme');
      if (storedTheme && (storedTheme === 'dark' || storedTheme === 'light')) {
        theme = storedTheme;
      } else {
        // Fall back to system preference
        const prefersDark =
          window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        theme = prefersDark ? 'dark' : 'light';
      }
    } catch (e) {
      // localStorage might not be available, fall back to system preference
      const prefersDark =
        window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      theme = prefersDark ? 'dark' : 'light';
    }

    // Apply theme to document root immediately
    const rootEl = document.documentElement;
    rootEl.setAttribute('data-theme', theme);
    rootEl.classList.remove('light', 'dark');
    rootEl.classList.add(theme);

    // Set CSS variables for immediate styling
    const root = document.documentElement;

    if (theme === 'dark') {
      // Dark theme variables
      root.style.setProperty('--mp-background', '30 30 30');
      root.style.setProperty('--mp-background-secondary', '37 37 37');
      root.style.setProperty('--mp-foreground', '212 212 212');
      root.style.setProperty('--mp-foreground-secondary', '156 163 175');
      root.style.setProperty('--mp-primary', '96 165 250');
      root.style.setProperty('--mp-primary-hover', '59 130 246');
      root.style.setProperty('--mp-border', '75 85 99');
      root.style.setProperty('--mp-border-muted', '55 65 81');
      root.style.setProperty('--mp-muted', '156 163 175');
      root.style.setProperty('--mp-destructive', '248 113 113');
      root.style.setProperty('--mp-destructive-hover', '239 68 68');
      root.style.setProperty('--mp-accent', '55 65 81');
      root.style.setProperty('--mp-accent-hover', '75 85 99');
    } else {
      // Light theme variables (default)
      root.style.setProperty('--mp-background', '255 255 255');
      root.style.setProperty('--mp-background-secondary', '249 250 251');
      root.style.setProperty('--mp-foreground', '0 0 0');
      root.style.setProperty('--mp-foreground-secondary', '107 114 128');
      root.style.setProperty('--mp-primary', '59 130 246');
      root.style.setProperty('--mp-primary-hover', '37 99 235');
      root.style.setProperty('--mp-border', '224 224 224');
      root.style.setProperty('--mp-border-muted', '229 231 235');
      root.style.setProperty('--mp-muted', '107 114 128');
      root.style.setProperty('--mp-destructive', '239 68 68');
      root.style.setProperty('--mp-destructive-hover', '220 38 38');
      root.style.setProperty('--mp-accent', '243 244 246');
      root.style.setProperty('--mp-accent-hover', '229 231 235');
    }
  };

  // Apply theme immediately if DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', detectAndApplyTheme);
  } else {
    detectAndApplyTheme();
  }

  // Listen for system theme changes
  if (window.matchMedia) {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleSystemThemeChange = (e) => {
      // Only auto-switch if user hasn't set a manual preference
      try {
        const storedTheme = localStorage.getItem('theme');
        if (!storedTheme) {
          detectAndApplyTheme();
        }
      } catch (ex) {
        // If localStorage is not available, always follow system preference
        detectAndApplyTheme();
      }
    };

    // Use modern API if available
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleSystemThemeChange);
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handleSystemThemeChange);
    }
  }

  // Expose theme management functions for manual control
  window.ModelPickerTheme = {
    setTheme: function (newTheme) {
      if (newTheme !== 'light' && newTheme !== 'dark') {
        console.warn('ModelPickerTheme.setTheme: Invalid theme. Use "light" or "dark".');
        return;
      }

      try {
        localStorage.setItem('theme', newTheme);
      } catch (e) {
        console.warn('ModelPickerTheme.setTheme: Could not save theme preference.');
      }

      detectAndApplyTheme();
    },

    getTheme: function () {
      return document.documentElement.getAttribute('data-theme') || 'light';
    },

    clearTheme: function () {
      try {
        localStorage.removeItem('theme');
      } catch (e) {
        console.warn('ModelPickerTheme.clearTheme: Could not clear theme preference.');
      }
      detectAndApplyTheme();
    },
  };
})();
