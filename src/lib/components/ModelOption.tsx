import type { KeyedModelConfigWithProvider } from '../types';
import { CheckIcon } from '../icons';
import { ListboxOption } from './ui/Listbox';

export interface ModelOptionProps {
  readonly model: KeyedModelConfigWithProvider;
  readonly isSelected: boolean;
}

export function ModelOption({ model, isSelected }: ModelOptionProps) {
  const Icon = model.provider.icon;
  return (
    <ListboxOption key={model.key} value={model.key}>
      <div className="flex w-full items-center justify-between">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Icon className="h-3 w-3 text-current flex-shrink-0" aria-hidden="true" />
          <span className="line-clamp-1 text-xs">
            {model.model.displayName}
            <span className="text-muted ml-1.5 text-[10px] italic">{model.provider.name}</span>
          </span>
        </div>
        <CheckIcon className={`h-3 w-3 flex-shrink-0 ${isSelected ? '' : 'invisible'}`} />
      </div>
    </ListboxOption>
  );
}

export default ModelOption;
