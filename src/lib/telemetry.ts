import type { ModelId, ProviderId } from './types';

export interface ModelPickerTelemetry {
  onFetchStart?: (providerId: ProviderId) => void;
  onFetchSuccess?: (providerId: ProviderId, modelCount: number) => void;
  onFetchError?: (providerId: ProviderId, error: Error) => void;
  onStorageError?: (operation: 'read' | 'write', error: Error) => void;
  onUserModelAdded?: (providerId: ProviderId, modelId: ModelId) => void;
  onProviderInitError?: (provider: string, error: Error) => void;
}

let globalTelemetry: ModelPickerTelemetry | undefined;

export function setGlobalTelemetry(modelPickerTelemetry?: ModelPickerTelemetry) {
  globalTelemetry = modelPickerTelemetry;
}

export function getTelemetry(): ModelPickerTelemetry | undefined {
  return globalTelemetry;
}
