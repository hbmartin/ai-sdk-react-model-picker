import type { ProviderMetadata } from '../types';
import { CheckIcon, ChevronDownIcon, ClickIcon } from '../icons';
import { Listbox, ListboxButton, ListboxOption, ListboxOptions, Transition } from './ui/Listbox';

export interface ProviderSelectionListboxProps {
  readonly selectedItem: ProviderMetadata | undefined;
  readonly onSelectionChange: (item: ProviderMetadata) => void;
  readonly topOptions: ProviderMetadata[];
  readonly otherOptions?: ProviderMetadata[];
  readonly className?: string;
  readonly placeholder?: string;
  readonly isLoading?: boolean;
  readonly disabled?: boolean;
}

/**
 * Dropdown listbox for selecting models or providers
 * Migrated from Continue's ModelSelectionListbox with enhanced features
 */
export function ProviderSelectionListbox({
  selectedItem,
  onSelectionChange,
  topOptions = [],
  otherOptions = [],
  className = '',
  placeholder = 'Select an option',
  isLoading = false,
  disabled = false,
}: ProviderSelectionListboxProps) {
  const selectedTitle = selectedItem?.name ?? placeholder;
  const SelectedIcon = selectedItem?.icon ?? ClickIcon;

  const renderOption = (item: ProviderMetadata) => {
    const title = item.name;
    const ItemIcon = item.icon;

    return (
      <ListboxOption
        key={`provider-${item.id}`}
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
    <Listbox value={selectedItem} onChange={onSelectionChange} className={className}>
      <ListboxButton
        disabled={disabled || isLoading}
        className="relative w-full text-foreground p-2 border border-border border-solid text-sm"
        aria-label={selectedTitle}
      >
        <span className="flex items-center gap-2 min-w-0 flex-1">
          <SelectedIcon className="w-4 h-4 flex-shrink-0 text-current" />
          <span className="truncate pl-2">{isLoading ? 'Loading...' : selectedTitle}</span>
        </span>
        <ChevronDownIcon className="w-4 h-4 flex-shrink-0 text-muted" aria-hidden="true" />
      </ListboxButton>

      <Transition>
        <ListboxOptions className="py-1">
          {topOptions.length > 0 && (
            <div>
              <div className="px-3 py-1 text-xs font-medium uppercase tracking-wider text-muted bg-transparent">
                Popular
              </div>
              {topOptions.map((option) => renderOption(option))}
            </div>
          )}

          {topOptions.length > 0 && otherOptions.length > 0 && (
            <div className="border-t border-border my-1" />
          )}

          {otherOptions.length > 0 && (
            <div>
              {topOptions.length > 0 && (
                <div className="px-3 py-1 text-xs font-medium uppercase tracking-wider text-muted bg-transparent">
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
  );
}

export default ProviderSelectionListbox;
