import { ModelProviderTags } from '../types';

export interface ModelProviderTagProps {
  tag: ModelProviderTags;
  className?: string;
}

const TAG_STYLES: Record<ModelProviderTags, string> = {
  [ModelProviderTags.RequiresApiKey]: 'provider-tag-requires-key',
  [ModelProviderTags.Local]: 'provider-tag-local',
  [ModelProviderTags.Free]: 'provider-tag-free',
  [ModelProviderTags.OpenSource]: 'provider-tag-open-source',
  [ModelProviderTags.Vision]: 'provider-tag-vision',
  [ModelProviderTags.Tools]: 'provider-tag-tools',
  [ModelProviderTags.LongContext]: 'provider-tag-long-context',
};

/**
 * Display tag for model provider capabilities
 * Automatically styles based on tag type and theme (light/dark/VSCode)
 */
export function ModelProviderTag({ tag, className = '' }: ModelProviderTagProps) {
  const tagStyle = TAG_STYLES[tag] || '';

  return (
    <span
      className={`provider-tag ${tagStyle} ${className}`}
      title={`This model ${tag.toLowerCase()}`}
    >
      {tag}
    </span>
  );
}

export default ModelProviderTag;
