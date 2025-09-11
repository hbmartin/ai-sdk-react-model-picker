import React from 'react';
import { useUniversalTheme } from '../../hooks/useUniversalTheme';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

/**
 * Example Button component demonstrating environment-conditional classes
 * Follows the pattern from the multi-environment guide
 */
export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  ...props
}) => {
  const { environment } = useUniversalTheme();

  // Base styles that work everywhere
  const baseClasses =
    'inline-flex items-center justify-center rounded-default font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1';

  // Size variants
  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  // Environment-aware color variants
  const getVariantClasses = () => {
    if (environment === 'vscode') {
      // VSCode-specific classes using the utility plugin
      return {
        primary:
          'bg-vscode-button-bg text-vscode-button-fg hover:bg-vscode-button-hover-bg focus:ring-vscode-focus-border',
        secondary:
          'bg-vscode-input-bg text-vscode-input-fg hover:bg-vscode-list-hover-bg focus:ring-vscode-focus-border',
        destructive:
          'bg-vscode-error text-vscode-button-fg hover:opacity-90 focus:ring-vscode-error',
      };
    } else {
      // Standard web environment classes
      return {
        primary: 'bg-primary text-primary-foreground hover:bg-primary-hover focus:ring-primary',
        secondary: 'bg-accent text-accent-foreground hover:bg-accent-hover focus:ring-accent',
        destructive:
          'bg-destructive text-destructive-foreground hover:bg-destructive-hover focus:ring-destructive',
      };
    }
  };

  const variantClasses = getVariantClasses()[variant];

  // Combine all classes
  const buttonClasses = [baseClasses, sizeClasses[size], variantClasses, className]
    .filter(Boolean)
    .join(' ');

  return (
    <button className={buttonClasses} {...props}>
      {children}
    </button>
  );
};

export default Button;
