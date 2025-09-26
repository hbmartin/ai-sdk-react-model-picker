import {
  type StorageAdapter,
  type ModelConfig,
  type ProviderId,
  assertRecordStringString,
  isObject,
} from '../types';
import { getTelemetry } from '../telemetry';

// Storage key helper for persisted models per provider
function providerModelsKey(providerId: ProviderId): string {
  return `models:${providerId}`;
}

interface PersistedModelsEnvelope {
  // reserved for future format/versioning changes
  version: 1;
  // compact array of models; only ModelConfig fields are persisted
  models: ModelConfig[];
}

function isPersistedEnvelope(value: unknown): value is PersistedModelsEnvelope {
  if (!isObject(value)) {
    return false;
  }
  return (
    'version' in value &&
    typeof value['version'] === 'number' &&
    'models' in value &&
    Array.isArray(value['models'])
  );
}

// Load all persisted models for a provider; returns an empty array on any error
export async function getPersistedModels(
  modelStorage: StorageAdapter,
  providerId: ProviderId
): Promise<ModelConfig[]> {
  try {
    const raw = await modelStorage.get(providerModelsKey(providerId));
    if (!raw) {
      return [];
    }
    // StorageAdapter returns a record; we store envelope fields in this record
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (raw['__json'] !== undefined) {
      try {
        const env = JSON.parse(raw['__json']) as PersistedModelsEnvelope;
        if (isPersistedEnvelope(env)) {
          return env.models;
        }
      } catch {
        // fall through
      }
    }
    // Fallback: legacy layout where each key is an index
    assertRecordStringString(raw);
    const values = Object.values(raw);
    if (values.length === 0) {
      return [];
    }
    try {
      const env = JSON.parse(values[0]) as PersistedModelsEnvelope;
      if (isPersistedEnvelope(env)) {
        return env.models;
      }
    } catch {
      // ignore
    }
  } catch (error) {
    getTelemetry()?.onStorageError?.('read', error as Error);
  }
  return [];
}

// Persist models for a provider, overwriting prior value
export async function setPersistedModels(
  modelStorage: StorageAdapter,
  providerId: ProviderId,
  models: ModelConfig[]
): Promise<void> {
  try {
    const env: PersistedModelsEnvelope = { version: 1, models };
    const key = providerModelsKey(providerId);
    // Use a single string field to store the JSON to keep adapter compat
    await modelStorage.set(key, { __json: JSON.stringify(env) });
  } catch (error) {
    getTelemetry()?.onStorageError?.('write', error as Error);
    // Swallow to avoid crashing UI paths; telemetry reports the problem
  }
}
