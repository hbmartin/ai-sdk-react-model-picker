import {
  type StorageAdapter,
  type ModelConfig,
  type ProviderId,
  type ModelId,
  assertRecordStringString,
  isObject,
} from '../types';
import { getTelemetry } from '../telemetry';

// Storage key helper for persisted models per provider
function providerModelsKey(providerId: ProviderId): string {
  return `models:${providerId}`;
}

function providerModelVisibilityKey(providerId: ProviderId): string {
  return `model-visibility:${providerId}`;
}

interface PersistedModelsEnvelope {
  // reserved for future format/versioning changes
  version: 1;
  // compact array of models; only ModelConfig fields are persisted
  models: ModelConfig[];
}

interface PersistedVisibilityEnvelope {
  version: 1;
  hidden: ModelId[];
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

function isVisibilityEnvelope(value: unknown): value is PersistedVisibilityEnvelope {
  if (!isObject(value)) {
    return false;
  }
  if (!('version' in value) || typeof value['version'] !== 'number') {
    return false;
  }
  if (!('hidden' in value) || !Array.isArray(value['hidden'])) {
    return false;
  }
  return value['hidden'].every((entry) => typeof entry === 'string');
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
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition, sonarjs/different-types-comparison
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
    getTelemetry()?.onStorageError?.('read', providerId, error as Error);
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
    getTelemetry()?.onStorageError?.('write', providerId, error as Error);
    // Swallow to avoid crashing UI paths; telemetry reports the problem
  }
}

export async function getHiddenModelIds(
  modelStorage: StorageAdapter,
  providerId: ProviderId
): Promise<ModelId[]> {
  try {
    const raw = await modelStorage.get(providerModelVisibilityKey(providerId));
    if (!raw) {
      return [];
    }

    if (raw['__json'] !== undefined) {
      try {
        const env = JSON.parse(raw['__json']) as PersistedVisibilityEnvelope;
        if (isVisibilityEnvelope(env)) {
          return env.hidden;
        }
      } catch {
        // fall through to legacy decoding
      }
    }

    assertRecordStringString(raw);
    const values = Object.values(raw);
    if (values.length === 0) {
      return [];
    }

    try {
      const env = JSON.parse(values[0]) as PersistedVisibilityEnvelope;
      if (isVisibilityEnvelope(env)) {
        return env.hidden;
      }
    } catch {
      // ignore malformed legacy values
    }
  } catch (error) {
    getTelemetry()?.onStorageError?.(
      'read',
      providerModelVisibilityKey(providerId),
      error as Error
    );
  }
  return [];
}

export async function setHiddenModelIds(
  modelStorage: StorageAdapter,
  providerId: ProviderId,
  hidden: ModelId[]
): Promise<void> {
  try {
    const env: PersistedVisibilityEnvelope = { version: 1, hidden };
    await modelStorage.set(providerModelVisibilityKey(providerId), {
      __json: JSON.stringify(env),
    });
  } catch (error) {
    getTelemetry()?.onStorageError?.(
      'write',
      providerModelVisibilityKey(providerId),
      error as Error
    );
  }
}
