import type { IconComponent, ModelConfigWithProvider, ProviderMetadata } from '../types';
import { CubeIcon, CheckIcon, ChevronDownIcon } from '../icons';
import { Listbox, ListboxButton, ListboxOption, ListboxOptions, Transition } from './ui/Listbox';

export interface ModelSelectionListboxProps {
  /** Currently selected model/provider */
  readonly selectedItem: ModelConfigWithProvider | ProviderMetadata | undefined;
  /** Callback when selection changes */
  readonly onSelectionChange: (item: ModelConfigWithProvider | ProviderMetadata) => void;
  /** Top/popular options to show first */
  readonly topOptions?: (ModelConfigWithProvider | ProviderMetadata)[];
  /** Other/additional options */
  readonly otherOptions?: (ModelConfigWithProvider | ProviderMetadata)[];
  /** Custom className */
  readonly className?: string;
  /** Placeholder text */
  readonly placeholder?: string;
  /** Loading state */
  readonly isLoading?: boolean;
  /** Disabled state */
  readonly disabled?: boolean;
}

function isProvider(item: object): item is ProviderMetadata {
  return 'id' in item && 'name' in item && !('model' in item);
}

function isModel(item: object): item is ModelConfigWithProvider {
  return 'model' in item && 'provider' in item;
}

function getItemTitle(item: ModelConfigWithProvider | ProviderMetadata): string {
  if (isProvider(item)) {
    return item.name;
  } else if (isModel(item)) {
    return item.model.displayName || item.model.id;
  }
  return 'Unknown';
}

function getItemIcon(
  item: ModelConfigWithProvider | ProviderMetadata | undefined
): IconComponent | undefined {
  if (item === undefined) {
    return undefined;
  }
  if (isProvider(item)) {
    return item.icon;
  }
  if (isModel(item)) {
    return item.provider.icon;
  }
  return undefined;
}

/**
 * Dropdown listbox for selecting models or providers
 * Migrated from Continue's ModelSelectionListbox with enhanced features
 */
export function ModelSelectionListbox({
  selectedItem,
  onSelectionChange,
  topOptions = [],
  otherOptions = [],
  className = '',
  placeholder = 'Select an option',
  isLoading = false,
  disabled = false,
}: ModelSelectionListboxProps) {
  const selectedTitle = selectedItem ? getItemTitle(selectedItem) : placeholder;
  const SelectedIcon = getItemIcon(selectedItem) ?? CubeIcon;

  const renderOption = (item: ModelConfigWithProvider | ProviderMetadata) => {
    const title = getItemTitle(item);
    const ItemIcon = getItemIcon(item) ?? CubeIcon;

    return (
      <ListboxOption
        key={isProvider(item) ? `provider-${item.id}` : `model-${item.model.id}`}
        value={item}
        className="flex items-center justify-between gap-2"
      >
        {({ selected }) => (
          <>
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <ItemIcon className="w-4 h-4 flex-shrink-0 text-current" />
              <span className="text-xs truncate">{title}</span>
            </div>
            {selected && <CheckIcon className="w-3 h-3 flex-shrink-0" />}
          </>
        )}
      </ListboxOption>
    );
  };

  return (
    <div className={`relative ${className}`}>
      <Listbox value={selectedItem} onChange={onSelectionChange}>
        <ListboxButton disabled={disabled || isLoading} className="relative w-full">
          <span className="flex items-center gap-2 min-w-0 flex-1">
            <SelectedIcon className="w-4 h-4 flex-shrink-0 text-current" />
            <span className="text-xs truncate">{isLoading ? 'Loading...' : selectedTitle}</span>
          </span>
          <ChevronDownIcon className="w-4 h-4 flex-shrink-0 text-muted" aria-hidden="true" />
        </ListboxButton>

        <Transition>
          <ListboxOptions className="py-1">
            {/* Popular/Top Options */}
            {topOptions.length > 0 && (
              <div>
                <div className="px-3 py-1 text-xs font-medium uppercase tracking-wider text-muted bg-accent">
                  Popular
                </div>
                {topOptions.map((option) => renderOption(option))}
              </div>
            )}

            {/* Separator */}
            {topOptions.length > 0 && otherOptions.length > 0 && (
              <div className="border-t border-border my-1" />
            )}

            {/* Other Options */}
            {otherOptions.length > 0 && (
              <div>
                {topOptions.length > 0 && (
                  <div className="px-3 py-1 text-xs font-medium uppercase tracking-wider text-muted bg-accent">
                    Additional Options
                  </div>
                )}
                {otherOptions.map((option) => renderOption(option))}
              </div>
            )}

            {/* Empty State */}
            {topOptions.length === 0 && otherOptions.length === 0 && !isLoading && (
              <div className="px-3 py-4 text-center text-sm text-muted">No options available</div>
            )}

            {/* Loading State */}
            {isLoading && (
              <div className="px-3 py-4 text-center text-sm text-muted">
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  Loading options...
                </div>
              </div>
            )}
          </ListboxOptions>
        </Transition>
      </Listbox>
    </div>
  );
}

export default ModelSelectionListbox;
