/* eslint-disable sonarjs/no-nested-conditional */
import { useState, type MouseEvent } from 'react';
import { ModelProviderTags, type ModelConfigWithProvider } from '../types';
import { ModelProviderTag } from './ModelProviderTag';

export interface ModelCardProps {
  readonly model: ModelConfigWithProvider;
  readonly title?: string;
  readonly description?: string;
  readonly tags?: ModelProviderTags[];
  readonly documentationUrl?: string;
  readonly onClick?: (e: MouseEvent<HTMLDivElement>, model: ModelConfigWithProvider) => void;
  readonly disabled?: boolean;
  readonly className?: string;
}

// eslint-disable-next-line code-complete/no-magic-numbers-except-zero-one
const LONG_CONTEXT_THRESHOLD = 50_000;

/**
 * Card component for displaying model information
 * Migrated from Continue's ModelCard with controlled behavior
 */
export function ModelCard({
  model,
  title,
  description,
  tags = [],
  documentationUrl,
  onClick,
  disabled = false,
  className = '',
}: ModelCardProps) {
  const [hovered, setHovered] = useState(false);

  // Use provided title/description or fall back to model data
  const displayTitle = title ?? model.model.displayName;
  const displayDescription = description ?? model.provider.description ?? '';
  const docUrl = documentationUrl ?? model.provider.documentationUrl;

  // Auto-generate tags based on model capabilities
  const autoTags: ModelProviderTags[] = [];
  if (model.model.supportsVision === true) {
    autoTags.push(ModelProviderTags.Vision);
  }
  if (model.model.supportsTools === true) {
    autoTags.push(ModelProviderTags.Tools);
  }
  if (
    model.model.contextLength !== undefined &&
    model.model.contextLength > LONG_CONTEXT_THRESHOLD
  ) {
    autoTags.push(ModelProviderTags.LongContext);
  }

  const allTags = [...new Set([...tags, ...autoTags])];

  return (
    <div
      className={`
        relative w-full border border-border rounded-default transition-all duration-500
        ${
          disabled
            ? 'opacity-50 cursor-not-allowed'
            : hovered
              ? 'border-primary bg-primary bg-opacity-10 cursor-pointer shadow-sm'
              : 'hover:shadow-sm'
        }
        ${className}
      `}
      onMouseEnter={() => !disabled && setHovered(true)}
      onMouseLeave={() => !disabled && setHovered(false)}
      onClick={
        disabled
          ? undefined
          : (event) => {
              // Don't trigger if clicking on a link
              if ((event.target as HTMLElement).closest('a')) {
                return;
              }
              onClick?.(event, model);
            }
      }
    >
      <div className="px-4 py-3">
        {/* Header with icon and title */}
        <div className="flex items-center mb-3">
          <div className="mr-3 w-6 h-6 flex-shrink-0">
            <model.provider.icon className="w-6 h-6 text-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground truncate">{displayTitle}</h3>
        </div>

        {/* Tags */}
        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {allTags.map((tag) => (
              <ModelProviderTag key={tag} tag={tag} />
            ))}
          </div>
        )}

        {/* Description */}
        {displayDescription && (
          <p className="text-muted text-sm mb-3 leading-relaxed">{displayDescription}</p>
        )}

        {/* Model specifications */}
        <div className="flex flex-wrap gap-4 text-xs text-muted">
          {model.model.maxTokens !== undefined && (
            <span>Max tokens: {model.model.maxTokens.toLocaleString()}</span>
          )}
          {model.model.contextLength !== undefined && (
            <span>Context: {model.model.contextLength.toLocaleString()}</span>
          )}
        </div>

        {/* Documentation link */}
        {typeof docUrl === 'string' && docUrl.trim() !== '' && (
          <a
            href={docUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="
              absolute top-3 right-3 p-1.5 
              text-muted hover:text-foreground 
              transition-colors duration-200
            "
            title="Read the documentation"
            aria-label="Read the documentation"
            onClick={(event) => event.stopPropagation()}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
            </svg>
          </a>
        )}
      </div>
    </div>
  );
}

export default ModelCard;
