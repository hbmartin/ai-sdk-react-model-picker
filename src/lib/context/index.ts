import {
  createContext,
  useContext,
  useReducer,
  useMemo,
  useCallback,
  useEffect,
  type ReactNode,
  createElement,
} from 'react';
import type {
  ModelConfigWithProvider,
  IProviderRegistry,
  StorageAdapter,
  ModelId,
  Role,
  ThemeConfig,
  ProviderId,
} from '../types';
import { ModelCatalog } from '../catalog/ModelCatalog';
import { setGlobalTelemetry, type ModelPickerTelemetry } from '../telemetry';
import { useModelCatalog } from '../hooks/useModelCatalog';

// State interface
interface ModelPickerState {
  selectedModelId: ModelId | undefined;
  selectedRole: string | undefined;
  isLoading: boolean;
  error: string | undefined;
}

// Actions
type ModelPickerAction =
  | { type: 'SET_MODEL'; payload: ModelId | undefined }
  | { type: 'SET_ROLE'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | undefined };

// Context interface
interface ModelPickerContextValue {
  state: ModelPickerState;
  selectedModel: ModelConfigWithProvider | undefined;
  allModels: ModelConfigWithProvider[];
  providerRegistry: IProviderRegistry;
  storage: StorageAdapter;
  modelStorage: StorageAdapter;
  roles: Role[] | undefined;
  theme: ThemeConfig | undefined;
  catalog: ModelCatalog;
  telemetry?: ModelPickerTelemetry;

  // Actions
  selectModel: (model: ModelConfigWithProvider | undefined) => void;
  selectRole: (roleId: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | undefined) => void;

  // Callbacks
  onConfigureProvider: (providerId: ProviderId) => void;
  onMissingConfiguration: (keys: string[]) => void;
  refreshModels: (providerId?: ProviderId) => void;
}

const ModelPickerContext = createContext<ModelPickerContextValue | undefined>(undefined);

// Reducer
function modelPickerReducer(state: ModelPickerState, action: ModelPickerAction): ModelPickerState {
  switch (action.type) {
    case 'SET_MODEL': {
      return { ...state, selectedModelId: action.payload };
    }
    case 'SET_ROLE': {
      return { ...state, selectedRole: action.payload };
    }
    case 'SET_LOADING': {
      return { ...state, isLoading: action.payload };
    }
    case 'SET_ERROR': {
      return { ...state, error: action.payload ?? undefined };
    }
    default: {
      return state;
    }
  }
}

// Provider props
export interface ModelPickerProviderProps {
  children: ReactNode;
  providerRegistry: IProviderRegistry;
  storage: StorageAdapter;
  modelStorage?: StorageAdapter;
  telemetry?: ModelPickerTelemetry;
  prefetch?: boolean;
  initialModelId?: ModelId;
  initialRole?: string;
  roles?: Role[];
  theme?: ThemeConfig;
  onConfigureProvider: (providerId: ProviderId) => void;
  onMissingConfiguration: (keys: string[]) => void;
}

/**
 * Optional context provider for model picker state management
 * Provides a convenience wrapper around the controlled components
 */
export function ModelPickerProvider({
  children,
  providerRegistry,
  storage,
  modelStorage,
  telemetry,
  prefetch = true,
  initialModelId,
  initialRole,
  roles,
  theme,
  onConfigureProvider,
  onMissingConfiguration,
}: ModelPickerProviderProps) {
  const [state, dispatch] = useReducer(modelPickerReducer, {
    selectedModelId: initialModelId ?? undefined,
    selectedRole: initialRole,
    isLoading: false,
    error: undefined,
  });

  useEffect(() => {
    setGlobalTelemetry(telemetry);
  }, [telemetry]);

  const { catalog, snapshot, consumePendingInitialization } = useModelCatalog({
    storage,
    providerRegistry,
    telemetry,
    modelStorage: modelStorage ?? storage,
  });

  useEffect(() => {
    if (consumePendingInitialization()) {
      void catalog.initialize(prefetch);
    }
  }, [catalog, prefetch, consumePendingInitialization]);

  const allModels = useMemo(() => {
    const arr: ModelConfigWithProvider[] = [];
    for (const entry of Object.values(snapshot)) {
      for (const modelWithProvider of entry.models) {
        if (modelWithProvider.model.visible === false) {
          continue;
        }
        arr.push(modelWithProvider);
      }
    }
    return arr;
  }, [snapshot]);

  // Find selected model
  const selectedModel = useMemo(() => {
    if (state.selectedModelId === undefined) {
      return;
    }
    return allModels.find((model) => model.model.id === state.selectedModelId) ?? undefined;
  }, [state.selectedModelId, allModels]);

  // Action creators
  const selectModel = useCallback((model: ModelConfigWithProvider | undefined) => {
    dispatch({ type: 'SET_MODEL', payload: model?.model.id });
  }, []);

  const selectRole = useCallback((roleId: string) => {
    dispatch({ type: 'SET_ROLE', payload: roleId });
  }, []);

  // eslint-disable-next-line code-complete/no-boolean-params
  const setLoading = useCallback((loading: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: loading });
  }, []);

  const setError = useCallback((error: string | undefined) => {
    dispatch({ type: 'SET_ERROR', payload: error });
  }, []);

  const contextValue = useMemo<ModelPickerContextValue>(() => {
    const base = {
      state,
      selectedModel,
      allModels,
      providerRegistry,
      storage,
      modelStorage: modelStorage ?? storage,
      roles,
      theme,
      catalog,
      selectModel,
      selectRole,
      setLoading,
      setError,
      onConfigureProvider,
      onMissingConfiguration,
      refreshModels: (providerId?: ProviderId) => {
        if (providerId) {
          void catalog.refresh(providerId);
        } else {
          void catalog.refreshAll();
        }
      },
    } satisfies Omit<ModelPickerContextValue, 'telemetry'>;
    if (telemetry !== undefined) {
      (base as ModelPickerContextValue).telemetry = telemetry;
    }
    return base as ModelPickerContextValue;
  }, [
    state,
    selectedModel,
    allModels,
    providerRegistry,
    storage,
    modelStorage,
    roles,
    theme,
    catalog,
    telemetry,
    selectModel,
    selectRole,
    setLoading,
    setError,
    onConfigureProvider,
    onMissingConfiguration,
  ]);

  return createElement(ModelPickerContext.Provider, { value: contextValue }, children);
}

/**
 * Hook to access model picker context
 */
export function useModelPicker(): ModelPickerContextValue {
  const context = useContext(ModelPickerContext);
  if (!context) {
    throw new Error('useModelPicker must be used within a ModelPickerProvider');
  }
  return context;
}

/**
 * Optional context accessor; returns undefined if not within provider
 */
export function useOptionalModelPicker(): ModelPickerContextValue | undefined {
  return useContext(ModelPickerContext);
}

/**
 * Hook to get the currently selected model
 */
export function useSelectedModel(): ModelConfigWithProvider | undefined {
  const { selectedModel } = useModelPicker();
  return selectedModel;
}

/**
 * Hook to get all available models
 */
export function useAllModels(): ModelConfigWithProvider[] {
  const { allModels } = useModelPicker();
  return allModels;
}

/**
 * Hook for model selection actions
 */
export function useModelSelection() {
  const { state, selectedModel, selectModel, selectRole, setLoading, setError } = useModelPicker();

  return {
    selectedModelId: state.selectedModelId,
    selectedRole: state.selectedRole,
    selectedModel,
    isLoading: state.isLoading,
    error: state.error,
    selectModel,
    selectRole,
    setLoading,
    setError,
  };
}

/**
 * Hook for provider management
 */
export function useProviders() {
  const { providerRegistry, storage, onConfigureProvider, onMissingConfiguration } =
    useModelPicker();

  const configureProvider = useCallback(
    (providerId: ProviderId) => {
      onConfigureProvider(providerId);
    },
    [onConfigureProvider]
  );

  const handleMissingConfiguration = useCallback(
    (keys: string[]) => {
      onMissingConfiguration(keys);
    },
    [onMissingConfiguration]
  );

  return {
    providerRegistry,
    storage,
    configureProvider,
    handleMissingConfiguration,
  };
}

export default ModelPickerProvider;
