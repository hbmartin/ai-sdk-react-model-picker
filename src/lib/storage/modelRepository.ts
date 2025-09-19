import { type StorageAdapter, type ModelConfig, type ProviderId, assertRecordStringString } from '../types';

// Storage key helper for persisted models per provider
function providerModelsKey(providerId: ProviderId): string {
  return `models:${providerId}`;
}

interface PersistedModelsEnvelope {
  // reserved for future format/versioning changes
  v: 1;
  // compact array of models; only ModelConfig fields are persisted
  models: ModelConfig[];
}

function isPersistedEnvelope(value: unknown): value is PersistedModelsEnvelope {
  if (typeof value !== 'object' || value === null) return false;
  const anyVal = value as any;
  return anyVal && anyVal['v'] === 1 && Array.isArray(anyVal['models']);
}

// Load all persisted models for a provider; returns an empty array on any error
export async function getPersistedModels(
  modelStorage: StorageAdapter,
  providerId: ProviderId
): Promise<ModelConfig[]> {
  try {
    const raw = await modelStorage.get(providerModelsKey(providerId));
    if (!raw) return [];
    // StorageAdapter returns a record; we store envelope fields in this record
    if ((raw as Record<string, string>)['__json'] !== undefined) {
      try {
        const env = JSON.parse((raw as Record<string, string>)['__json']) as PersistedModelsEnvelope;
        if (isPersistedEnvelope(env)) return env.models as ModelConfig[];
      } catch {
        // fall through
      }
    }
    // Fallback: legacy layout where each key is an index
    assertRecordStringString(raw);
    const values = Object.values(raw);
    if (values.length === 0) return [];
    try {
      const env = JSON.parse(values[0]!) as PersistedModelsEnvelope;
      if (isPersistedEnvelope(env)) return env.models as ModelConfig[];
    } catch {
      // ignore
    }
  } catch {
    // ignore read errors; caller may surface via telemetry
  }
  return [];
}

// Persist models for a provider, overwriting prior value
export async function setPersistedModels(
  modelStorage: StorageAdapter,
  providerId: ProviderId,
  models: ModelConfig[]
): Promise<void> {
  const env: PersistedModelsEnvelope = { v: 1, models };
  const key = providerModelsKey(providerId);
  // Use a single string field to store the JSON to keep adapter compat
  await modelStorage.set(key, { __json: JSON.stringify(env) });
}
