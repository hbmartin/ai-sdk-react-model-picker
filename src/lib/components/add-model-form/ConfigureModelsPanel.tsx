import { useEffect } from 'react';
import type { ChangeEvent, KeyboardEvent } from 'react';
import type { AIProvider, CatalogEntry, ModelId, ProviderModelsStatus } from '../../types';

export interface ConfigureModelsPanelProps {
  readonly selectedProvider: AIProvider | undefined;
  readonly providerModels: CatalogEntry[];
  readonly providerModelsStatus: ProviderModelsStatus | undefined;
  readonly newModelId: string;
  readonly onNewModelIdChange: (value: string) => void;
  readonly onAddModel: () => Promise<void> | void;
  readonly isAddingModel: boolean;
  readonly modelPanelError: string | undefined;
  readonly pendingVisibilityUpdate: ModelId | undefined;
  readonly onToggleModelVisibility: (entry: CatalogEntry) => Promise<void> | void;
  readonly highlightedModelId: ModelId | undefined;
  readonly onHighlightTimeout: () => void;
  readonly selectedCatalogModel: CatalogEntry | undefined;
}

export function ConfigureModelsPanel({
  selectedProvider,
  providerModels,
  providerModelsStatus,
  newModelId,
  onNewModelIdChange,
  onAddModel,
  isAddingModel,
  modelPanelError,
  pendingVisibilityUpdate,
  onToggleModelVisibility,
  highlightedModelId,
  onHighlightTimeout,
  selectedCatalogModel,
}: ConfigureModelsPanelProps) {
  useEffect(() => {
    if (highlightedModelId === undefined) {
      return;
    }
    const timeout = globalThis.setTimeout(() => {
      onHighlightTimeout();
    }, 1600);
    return () => globalThis.clearTimeout(timeout);
  }, [highlightedModelId, onHighlightTimeout]);

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    onNewModelIdChange(event.target.value);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      void onAddModel();
    }
  };

  return (
    <div className="flex h-full flex-col">
      <p className="text-xs text-muted">
        Manage model visibility for {selectedProvider?.metadata.name ?? 'your provider'}.
      </p>

      <div className="mt-4 flex gap-2">
        <input
          type="text"
          value={newModelId}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          disabled={isAddingModel || !selectedProvider}
          placeholder="Add model..."
          className="flex-1 rounded border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
        />
        <button
          type="button"
          onClick={() => void onAddModel()}
          disabled={isAddingModel || !selectedProvider || newModelId.trim().length === 0}
          className="rounded border border-border bg-primary px-3 py-2 text-xs font-semibold uppercase tracking-wide text-primary-foreground transition-opacity duration-150 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isAddingModel ? 'Adding...' : 'Add'}
        </button>
      </div>
      {modelPanelError !== undefined && (
        <p className="mt-2 text-xs text-destructive">{modelPanelError}</p>
      )}

      <div className="mt-4 flex-1 overflow-y-auto rounded border border-border bg-background p-3">
        {selectedProvider === undefined ? (
          <p className="text-xs text-muted">Select a provider to manage models.</p>
        ) : providerModelsStatus?.status === 'hydrating' ||
          providerModelsStatus?.status === 'refreshing' ? (
          <p className="text-xs text-muted">Loading models...</p>
        ) : providerModelsStatus?.status === 'missing-config' ? (
          <p className="text-xs text-warning">
            Connect this provider to fetch its available models before configuring visibility.
          </p>
        ) : providerModels.length === 0 ? (
          <p className="text-xs text-muted">No models found for this provider.</p>
        ) : (
          <ul className="space-y-2">
            {providerModels.map((entry) => {
              const isHighlighted = highlightedModelId === entry.model.id;
              const isSelected = selectedCatalogModel?.model.id === entry.model.id;
              const checkboxChecked = entry.model.visible !== false;
              const isDisabled = pendingVisibilityUpdate === entry.model.id;
              return (
                <li
                  key={entry.key}
                  className={`flex items-center justify-between gap-2 rounded border px-3 py-2 text-sm transition-colors ${
                    isHighlighted
                      ? 'border-primary/60 bg-primary/10'
                      : 'border-transparent hover:bg-accent'
                  }`}
                >
                  <label className="flex flex-1 cursor-pointer items-center gap-3">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                      checked={checkboxChecked}
                      disabled={isDisabled}
                      aria-busy={isDisabled}
                      onChange={() => void onToggleModelVisibility(entry)}
                    />
                    <span className="flex flex-col">
                      <span className="font-medium text-foreground">
                        {entry.model.displayName ?? entry.model.id}
                      </span>
                      {entry.model.displayName !== entry.model.id && (
                        <span className="text-[11px] text-muted">{entry.model.id}</span>
                      )}
                    </span>
                  </label>
                  {isSelected && (
                    <span className="text-[10px] font-semibold uppercase text-primary">
                      Selected
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        )}
        {providerModelsStatus?.error && (
          <p className="mt-3 text-xs text-destructive">{providerModelsStatus.error}</p>
        )}
      </div>
    </div>
  );
}

export default ConfigureModelsPanel;
