import { ModelProviderTags } from '../types';
import { useUniversalTheme } from '../hooks/useUniversalTheme';

export interface ModelProviderTagProps {
  readonly tag: ModelProviderTags;
  readonly className?: string;
}

/**
 * Display tag for model provider capabilities
 * Uses environment-conditional classes following the multi-environment guide pattern
 */
export function ModelProviderTag({ tag, className = '' }: ModelProviderTagProps) {
  const { environment } = useUniversalTheme();

  // Base styles that work everywhere
  const baseClasses = 'inline-flex items-center px-2 py-1 text-xs font-medium rounded-md';

  // Environment-aware color variants
  const getTagClasses = () => {
    if (environment === 'vscode') {
      // VSCode-specific tag styles using utility classes
      return {
        [ModelProviderTags.RequiresApiKey]:
          'bg-vscode-error/20 text-vscode-error border border-vscode-error/30',
        [ModelProviderTags.Local]:
          'bg-vscode-success/20 text-vscode-success border border-vscode-success/30',
        [ModelProviderTags.Free]:
          'bg-vscode-warning/20 text-vscode-warning border border-vscode-warning/30',
        [ModelProviderTags.OpenSource]:
          'bg-vscode-button-bg/20 text-vscode-button-fg border border-vscode-button-bg/30',
        [ModelProviderTags.Vision]:
          'bg-vscode-text-link/20 text-vscode-text-link border border-vscode-text-link/30',
        [ModelProviderTags.Tools]:
          'bg-vscode-info/20 text-vscode-info border border-vscode-info/30',
        [ModelProviderTags.LongContext]:
          'bg-vscode-warning/15 text-vscode-warning border border-vscode-warning/25',
      };
    } else {
      // Standard web environment using semantic color classes
      return {
        [ModelProviderTags.RequiresApiKey]:
          'bg-destructive/10 text-destructive border border-destructive/20',
        [ModelProviderTags.Local]: 'bg-success/10 text-success border border-success/20',
        [ModelProviderTags.Free]: 'bg-warning/10 text-warning border border-warning/20',
        [ModelProviderTags.OpenSource]: 'bg-primary/10 text-primary border border-primary/20',
        [ModelProviderTags.Vision]: 'bg-primary/15 text-primary border border-primary/25',
        [ModelProviderTags.Tools]: 'bg-accent/50 text-accent-foreground border border-border',
        [ModelProviderTags.LongContext]: 'bg-warning/5 text-warning border border-warning/15',
      };
    }
  };

  const tagClasses =
    getTagClasses()[tag] || 'bg-accent text-accent-foreground border border-border';

  // Combine all classes
  const allClasses = [baseClasses, tagClasses, className].filter(Boolean).join(' ');

  return (
    <span className={allClasses} title={`This model ${tag.toLowerCase()}`}>
      {tag}
    </span>
  );
}

export default ModelProviderTag;
