import type { ModelPickerTelemetry } from './types';

let globalTelemetry: ModelPickerTelemetry | undefined;

export function setGlobalTelemetry(t?: ModelPickerTelemetry) {
  globalTelemetry = t;
}

export function getTelemetry(): ModelPickerTelemetry | undefined {
  return globalTelemetry;
}

