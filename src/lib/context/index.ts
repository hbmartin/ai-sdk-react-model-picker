import type { ReactNode } from 'react';
import React, { createContext, useContext, useReducer, useMemo, useCallback } from 'react';
import type {
  ModelConfigWithProvider,
  IProviderRegistry,
  StorageAdapter,
  ModelId,
  Role,
  ThemeConfig,
  ProviderId,
} from '../types';

// State interface
interface ModelPickerState {
  selectedModelId: ModelId | null;
  selectedRole?: string;
  isLoading: boolean;
  error: string | null;
}

// Actions
type ModelPickerAction =
  | { type: 'SET_MODEL'; payload: ModelId | null }
  | { type: 'SET_ROLE'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null };

// Context interface
interface ModelPickerContextValue {
  state: ModelPickerState;
  selectedModel: ModelConfigWithProvider | null;
  allModels: ModelConfigWithProvider[];
  providers: IProviderRegistry;
  storage: StorageAdapter;
  roles?: Role[];
  theme?: ThemeConfig;

  // Actions
  selectModel: (model: ModelConfigWithProvider) => void;
  selectRole: (roleId: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Callbacks
  onConfigureProvider?: (providerId: ProviderId) => void;
  onMissingConfiguration?: (keys: string[]) => void;
}

const ModelPickerContext = createContext<ModelPickerContextValue | null>(null);

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
      return { ...state, error: action.payload };
    }
    default: {
      return state;
    }
  }
}

// Provider props
export interface ModelPickerProviderProps {
  children: ReactNode;
  providers: IProviderRegistry;
  storage: StorageAdapter;
  initialModelId?: ModelId;
  initialRole?: string;
  roles?: Role[];
  theme?: ThemeConfig;
  onConfigureProvider?: (providerId: ProviderId) => void;
  onMissingConfiguration?: (keys: string[]) => void;
}

/**
 * Optional context provider for model picker state management
 * Provides a convenience wrapper around the controlled components
 */
export function ModelPickerProvider({
  children,
  providers,
  storage,
  initialModelId = null,
  initialRole,
  roles,
  theme,
  onConfigureProvider,
  onMissingConfiguration,
}: ModelPickerProviderProps) {
  const [state, dispatch] = useReducer(modelPickerReducer, {
    selectedModelId: initialModelId,
    selectedRole: initialRole,
    isLoading: false,
    error: null,
  });

  // Get all models from providers
  const allModels = useMemo(() => {
    return providers.getAllModels();
  }, [providers]);

  // Find selected model
  const selectedModel = useMemo(() => {
    if (!state.selectedModelId) return null;
    return allModels.find((m) => m.model.id === state.selectedModelId) || null;
  }, [state.selectedModelId, allModels]);

  // Action creators
  const selectModel = useCallback((model: ModelConfigWithProvider) => {
    dispatch({ type: 'SET_MODEL', payload: model.model.id });
  }, []);

  const selectRole = useCallback((roleId: string) => {
    dispatch({ type: 'SET_ROLE', payload: roleId });
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: loading });
  }, []);

  const setError = useCallback((error: string | null) => {
    dispatch({ type: 'SET_ERROR', payload: error });
  }, []);

  // Context value
  const contextValue: ModelPickerContextValue = {
    state,
    selectedModel,
    allModels,
    providers,
    storage,
    roles,
    theme,
    selectModel,
    selectRole,
    setLoading,
    setError,
    onConfigureProvider,
    onMissingConfiguration,
  };

  return React.createElement(ModelPickerContext.Provider, { value: contextValue }, children);
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
 * Hook to get the currently selected model
 */
export function useSelectedModel(): ModelConfigWithProvider | null {
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
  const { providers, storage, onConfigureProvider, onMissingConfiguration } = useModelPicker();

  const configureProvider = useCallback(
    (providerId: ProviderId) => {
      onConfigureProvider?.(providerId);
    },
    [onConfigureProvider]
  );

  const handleMissingConfiguration = useCallback(
    (keys: string[]) => {
      onMissingConfiguration?.(keys);
    },
    [onMissingConfiguration]
  );

  return {
    providers,
    storage,
    configureProvider,
    handleMissingConfiguration,
  };
}

export default ModelPickerProvider;
