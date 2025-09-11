const plugin = require('tailwindcss/plugin');

/**
 * Tailwind plugin for VSCode-specific utility classes
 * Provides direct access to VSCode CSS variables through utility classes
 */
module.exports = plugin(function({ addUtilities, theme }) {
  // VSCode color mappings for common use cases
  const vscodeColors = {
    // Editor colors
    'editor-bg': 'var(--vscode-editor-background)',
    'editor-fg': 'var(--vscode-editor-foreground)',
    'editor-selection-bg': 'var(--vscode-editor-selectionBackground)',
    
    // Button colors
    'button-bg': 'var(--vscode-button-background)',
    'button-fg': 'var(--vscode-button-foreground)',
    'button-hover-bg': 'var(--vscode-button-hoverBackground)',
    'button-secondary-bg': 'var(--vscode-button-secondaryBackground)',
    'button-secondary-fg': 'var(--vscode-button-secondaryForeground)',
    
    // Input colors
    'input-bg': 'var(--vscode-input-background)',
    'input-fg': 'var(--vscode-input-foreground)',
    'input-border': 'var(--vscode-input-border)',
    'input-placeholder': 'var(--vscode-input-placeholderForeground)',
    
    // Dropdown colors
    'dropdown-bg': 'var(--vscode-dropdown-background)',
    'dropdown-fg': 'var(--vscode-dropdown-foreground)',
    'dropdown-border': 'var(--vscode-dropdown-border)',
    
    // List colors
    'list-bg': 'var(--vscode-list-background)',
    'list-active-bg': 'var(--vscode-list-activeSelectionBackground)',
    'list-active-fg': 'var(--vscode-list-activeSelectionForeground)',
    'list-hover-bg': 'var(--vscode-list-hoverBackground)',
    'list-hover-fg': 'var(--vscode-list-hoverForeground)',
    
    // Panel colors
    'panel-bg': 'var(--vscode-panel-background)',
    'panel-border': 'var(--vscode-panel-border)',
    
    // Badge colors
    'badge-bg': 'var(--vscode-badge-background)',
    'badge-fg': 'var(--vscode-badge-foreground)',
    
    // Status colors
    'error': 'var(--vscode-errorForeground)',
    'warning': 'var(--vscode-editorWarning-foreground)',
    'info': 'var(--vscode-editorInfo-foreground)',
    'success': 'var(--vscode-terminal-ansiGreen)',
    
    // Focus colors
    'focus-border': 'var(--vscode-focusBorder)',
    
    // Text colors
    'text-link': 'var(--vscode-textLink-foreground)',
    'text-link-active': 'var(--vscode-textLink-activeForeground)',
    'text-secondary': 'var(--vscode-descriptionForeground)',
    
    // Scrollbar colors
    'scrollbar': 'var(--vscode-scrollbar-shadow)',
    'scrollbar-thumb': 'var(--vscode-scrollbarSlider-background)',
    'scrollbar-thumb-hover': 'var(--vscode-scrollbarSlider-hoverBackground)',
    'scrollbar-thumb-active': 'var(--vscode-scrollbarSlider-activeBackground)',
  };

  const utilities = {};
  
  // Generate utility classes for each VSCode color
  Object.entries(vscodeColors).forEach(([key, value]) => {
    // Background utilities
    utilities[`.bg-vscode-${key}`] = { 
      backgroundColor: value 
    };
    
    // Text color utilities
    utilities[`.text-vscode-${key}`] = { 
      color: value 
    };
    
    // Border color utilities
    utilities[`.border-vscode-${key}`] = { 
      borderColor: value 
    };
    
    // Ring color utilities (for focus states)
    utilities[`.ring-vscode-${key}`] = { 
      '--tw-ring-color': value 
    };
    
    // Outline color utilities
    utilities[`.outline-vscode-${key}`] = { 
      outlineColor: value 
    };
  });
  
  // Add hover variants
  Object.entries(vscodeColors).forEach(([key, value]) => {
    utilities[`.hover\\:bg-vscode-${key}:hover`] = { 
      backgroundColor: value 
    };
    utilities[`.hover\\:text-vscode-${key}:hover`] = { 
      color: value 
    };
    utilities[`.hover\\:border-vscode-${key}:hover`] = { 
      borderColor: value 
    };
  });
  
  // Add focus variants
  Object.entries(vscodeColors).forEach(([key, value]) => {
    utilities[`.focus\\:bg-vscode-${key}:focus`] = { 
      backgroundColor: value 
    };
    utilities[`.focus\\:text-vscode-${key}:focus`] = { 
      color: value 
    };
    utilities[`.focus\\:border-vscode-${key}:focus`] = { 
      borderColor: value 
    };
    utilities[`.focus\\:ring-vscode-${key}:focus`] = { 
      '--tw-ring-color': value 
    };
  });
  
  // Add group-hover variants for nested elements
  Object.entries(vscodeColors).forEach(([key, value]) => {
    utilities[`.group:hover .group-hover\\:bg-vscode-${key}`] = { 
      backgroundColor: value 
    };
    utilities[`.group:hover .group-hover\\:text-vscode-${key}`] = { 
      color: value 
    };
  });
  
  // Add VSCode-specific scrollbar utilities
  utilities['.scrollbar-vscode'] = {
    '&::-webkit-scrollbar': {
      width: '14px',
      height: '14px',
    },
    '&::-webkit-scrollbar-track': {
      backgroundColor: 'transparent',
    },
    '&::-webkit-scrollbar-thumb': {
      backgroundColor: 'var(--vscode-scrollbarSlider-background)',
      borderRadius: '0',
    },
    '&::-webkit-scrollbar-thumb:hover': {
      backgroundColor: 'var(--vscode-scrollbarSlider-hoverBackground)',
    },
    '&::-webkit-scrollbar-thumb:active': {
      backgroundColor: 'var(--vscode-scrollbarSlider-activeBackground)',
    },
    '&::-webkit-scrollbar-corner': {
      backgroundColor: 'transparent',
    },
  };
  
  // Add VSCode-specific focus ring utility
  utilities['.focus-ring-vscode'] = {
    '&:focus': {
      outline: 'none',
      boxShadow: `0 0 0 1px var(--vscode-focusBorder)`,
    },
    '&:focus-visible': {
      outline: 'none',
      boxShadow: `0 0 0 1px var(--vscode-focusBorder)`,
    },
  };
  
  addUtilities(utilities);
});