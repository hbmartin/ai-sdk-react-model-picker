# ModelCatalog Plan

### Requirements:

* This is strictly a React library so make good use of hooks for reactivity
* The API can be changed as much as necessary to suit these goals.
* Only providers with valid configs are eligible for model fetching.
* models may be loaded async (e.g. from a list returned by an API call or model names manually added by a user to storage).
* New models should be stored in memory and persisted to storage, and made reactively visible to the UI.
* Users cannot modify properties, they can only add model names (although properties may be mapped from API calls).
  2. There should be no dependencies between providers.
  3. The app should work fully offline (i.e. don't throw errors on fetch failure, don't retry fetch)
  7. Minimize storing large objects, prefer to synthesize smaller objects.
  7. The UI list should Keep the existing recently used.
  7. Other available models (not used) should sort by recency of discovery (for those without a discovery date sort first alphabetically by provider then alphabetically by model name)
  7. Only API-origin entries get auto-hidden when absent in the latest fetch. Builtins/user stay visible unless explicitly removed by user.
  7. User should not be able to add a model name that already exists.
  7. Ignore backwards compatability, hide or remove sync methods as needed.
  7. Remove model related calls from ProviderRegistry such that the ModelCatalog is the main interaction point



This document proposes a central, dependency‑free ModelCatalog that enables fast, synchronous model lists with background refresh, per‑provider status, and durable persistence — aligned to your constraints and UX goals.

## Summary
- Keep UI snappy: serve cached/builtin models synchronously; refresh in background.
- Provide a simple React‑first API with fine‑grained per‑provider status.
- Persist discovered models indefinitely via a dedicated `modelStorage`.
- Only fetch for providers with valid configuration (or no required keys).
- Track model origin and discovery timestamps; support “refresh Models” when available.
- Avoid external dependencies and keep implementation small and maintainable.

## Strucutre

  - ModelRepository (storage)
      - Persists per-provider model records; minimal shape; no sorting or business logic.
      - API: load/save per provider; add/remove user models; mark visibility.
  - ModelFetcher (network)
      - Calls AIProvider.getModels() gated by provider config; no provider coupling.
      - Dedupes concurrent fetches per provider; optional basic caching.
  - ModelMerger (conflicts)
      - Deterministic merge of builtin + persisted + fetched.
      - Sets origin, preserves discoveredAt, updates updatedAt, toggles visible.
  - ModelCatalog (orchestration)
      - Holds in‑memory state; exposes subscribe/snapshot; delegates to above.
      - Exposes refresh, addUserModel, removeUserModel, per‑provider status.
      - Hooks via useSyncExternalStore; returns status and refresh handler.

## Decisions (from constraints)
- React‑only; no external state/query dependencies.
- API surface can change (yolo).
- Persist fetched models (and user‑added models) indefinitely; no TTL.
- Distinct `modelStorage` (same API as existing `StorageAdapter`), defaulting to `storage` if not provided.
- Fetch only if provider configuration validates. allow fetch only when provider.configuration.validateConfig(config).ok === true.
- Track origin: `builtin | api | user` and hide stale models in UI while keeping them in storage with `visible: false`.
- Show cached/hardcoded models immediately; background prefetch default `true`.
- Sorting: keep “Recently Used” section unchanged. For “Available Models”, first sort by `discoveredAt` desc (without any grouping). Following that, models that do not have discoveredAt should sort by provider name asc, then model name asc (i.e. grouped by provider).
- Unique model IDs per provider; “last write wins” on merge.
- refreshability signaled by `ProviderMetadata.fetchModelListUrl?: string` (presence ⇒ show “refresh Models”).
- Hooks return models and status per provider (downstream can flatten).

## Current Pattern (brief)
- Provider classes expose static `models: ModelConfig[]`; `ProviderRegistry` reads these synchronously to produce lists.
- UI builds model options from those synchronous lists and storage (recently used, credentials).
- `AIProvider.getModels()` exists but is currently unused.

## Proposed Architecture
Introduce a central ModelCatalog responsible for:
- Keeping an in‑memory per‑provider cache of models merged from three sources: builtin (static), persisted (api/user), and live fetch (api).
- Save to storage on any updates.
- Emitting updates to React subscribers when content changes.
- Persisting fetched/user models in `modelStorage` (indefinite cache; stale (invisible) entries retained but hidden).
- Gating network fetches based on provider configuration validity.
- Exposing a small imperative API plus idiomatic React hooks.

## Data Model
- ModelOrigin: `"builtin" | "api" | "user"`.
- Add these fields to ModelConfig (persisted shape per provider):
  - `origin: ModelOrigin`
  - `discoveredAt?: number` (first time we saw this model from API or when user added)
  - `updatedAt?: number` (last time it was written)
  - `visible: boolean` (true by default. False if removed from the latest API snapshot or marked hidden by the user in the UI)

Notes:
- Builtin static models are treated as origin `builtin`. They may not have `discoveredAt`.
- For API/user models, set `discoveredAt` when first seen. Subsequent writes update fields and `updatedAt` but preserve `discoveredAt`.
- Single unique entry per `(providerId, modelId)`. On merge, last write wins for fields and `origin`.

## Provider Integration
- `AIProvider.getModels()` becomes the canonical remote loader (override where supported). It should fetch from the provider’s API and return `ModelConfig[]` (ids/displayNames/flags). Providers without discovery keep only their builtin list.
- `ProviderMetadata` gains `fetchModelListUrl?: string`. Presence indicates refreshability and provides a reference URL for UI “Learn more”.
- Configuration gating:
  - Obtain provider config from storage.
  - Use `provider.configuration.validateConfig(config).ok` to decide if fetch is permitted. If no required keys or at‑least‑one‑of keys are defined and validation passes (even with empty config), fetch is allowed.

## Persistence (modelStorage)
- New storage namespace for models list per provider: `${providerId}:models`.
- New storage namespace for individual model: `${providerId}:${modelId}`.
  - This stores serialized ModelConfig

- Value: `Record<ModelId, ModelConfig>` (string keys for JSON; cast to/from branded types at boundaries).
- Provide helpers:
  - `getPersistedModels(storage, providerId)` / `setPersistedModels(storage, providerId, record)`
  - `mergePersistedModels(storage, providerId, updates)` (internal)
- Default to `modelStorage ?? storage` so consumers can separate credentials and model caches.

## Catalog API (imperative)
- `getSnapshot(providerId?)` →
  - Returns `Record<ProviderId, ModelConfig[]>` if omitted, otherwise `ModelConfig[]` for a single provider.
  - Snapshot excludes `visible: false` entries.
  - Snapshot merges builtin + persisted + user with last‑write‑wins and unique IDs.
- `subscribe(listener: () => void)` / `unsubscribe(listener)` → used by hooks via `useSyncExternalStore`.
- `refresh(providerId?, opts?: { force?: boolean })` → Promise<void>
  - For each targeted provider, if configuration validates (or no required keys), call `provider.getModels()`.
  - Merge results into persisted record, marking missing previously‑API models as `visible: false`.
  - Update in‑memory cache and notify subscribers.
  - Persist to storage.
- `addUserModel(providerId, model: ModelConfig)` / `removeUserModel(providerId, modelId)` → void
  - Writes to persisted record with `origin: 'user'`, sets `discoveredAt = now` when adding.
  - Removing sets entry to `visible: false` if origin was `api` or `user`; or fully deletes if you prefer hard delete for user origin (implementation choice; UI hides `stale`).
- `setModelStorage(storage: StorageAdapter)` → switch persistence target.

## React Hooks
- `useModelsByProvider(options?: { prefetch?: boolean })`
  - Returns: `Record<ProviderId, { models: ModelConfigWithProvider[]; status: 'idle' | 'loading' | 'ready' | 'missing-config' | 'error'; error?: string; refresh: () => void }>`
  - `prefetch` default `true`: triggers `refresh()` in background for each provider whose config validates (or has no required keys).
  - Models exclude `stale` {visible:false} entries; each is wrapped with provider metadata.
- `useProviderModels(providerId, options?: { prefetch?: boolean })`
  - Returns the same struct but scoped to one provider.
- Compatibility helpers:
  - `useAllModels()` can be reimplemented to flatten `useModelsByProvider()` for existing consumers.
  - `flattenAndSortAvailableModels(map)` helper to build the “Available Models” section.

## Sorting and UI Behavior
- Recently Used: unchanged (existing storage and logic).
- Available Models: flatten providers with credentials and sort:
  1) By `discoveredAt` desc when present (API or user).
  2) Otherwise by provider display name asc, then model display name asc.
- Always show cached/builtin models immediately; background refresh upgrades the list.
- Make sure the UI doesn't flicker between loading states.

## Status per Provider
- `idle`: no prefetch and no prior data loaded.
- `loading`: a refresh is in progress.
- `ready`: snapshot present (even if an additional fetch is in flight).
- `missing-config`: configuration invalid; snapshot still includes builtin + any persisted/user entries.
- `error`: last refresh failed; snapshot still served.

## Merge and Stale {visible: false} Handling
- Unique model IDs per provider; last write wins across sources (builtin < api/user by time).
- When an API fetch completes:
  - Any existing API entries not present in the new payload are marked `visible: false` and hidden from UI.
  - Entries present are upserted, updating fields and `updatedAt` (preserving `discoveredAt`).
- User entries are always respected; removal is an explicit action (`removeUserModel`).

## refresh Semantics
- If `metadata.fetchModelListUrl` is present, UI shows a “refresh Models” control for that provider.
- Clicking refresh calls `refresh(providerId, { force: true })` and may offer a link to the URL (documentation/console) if helpful.

## Backwards Compatibility and Changes
- `ProviderMetadata` gains `fetchModelListUrl?: string`.
- `AIProvider.getModels()` becomes the expected entry for remote discovery (optional to override).
- `ProviderRegistry.getAllModels()` can be reimplemented to read the catalog snapshot (or deprecated in favor of hooks where practical). Keep a synchronous snapshot for simplicity.
- `ModelPickerProvider` gains optional `modelStorage?: StorageAdapter` and `prefetch?: boolean` (default true). It wires the catalog to the chosen storages and triggers background refresh.

## Telemetry Design

The context / ModelSelect should take an optional telemetry parameter to report errors and statuses to the app, including but not limited to:

  interface ModelPickerTelemetry {
    onFetchStart?: (providerId: ProviderId) => void;
    onFetchSuccess?: (providerId: ProviderId, modelCount: number) => void;
    onFetchError?: (providerId: ProviderId, error: Error) => void;
    onStorageError?: (operation: 'read' | 'write', error: Error) => void;
    onUserModelAdded?: (providerId: ProviderId, modelId: ModelId) => void;
  }

Add any other useful methods you think of.

All existing uses of console.* should be replaced by telemetry.

## Minimal Code Changes (outline)
1) Types (`src/lib/types/index.ts`)
- Add:
  - `export type ModelOrigin = 'builtin' | 'api' | 'user';`
  - `export interface ModelConfig { id: ModelId; displayName: string; isDefault?: boolean; maxTokens?: number; supportsVision?: boolean; supportsTools?: boolean; contextLength?: number; origin: ModelOrigin; discoveredAt?: number; updatedAt?: number; visible: boolean }`
  - `export interface ProviderModelsStatus { models: ModelConfigWithProvider[]; status: 'idle' | 'loading' | 'ready' | 'missing-config' | 'error'; error?: string }`
- Extend `ProviderMetadata` with `fetchModelListUrl?: string`.

2) Storage helpers (`src/lib/storage/modelRepository.ts`)
- `getPersistedModels(storage, providerId)` / `setPersistedModels(storage, providerId, record)`
- `mergePersistedModels(storage, providerId, updates)` (internal)

3) ModelCatalog (`src/lib/catalog/ModelCatalog.ts`)
- In‑memory maps per provider; merge logic; subscribe/emit; refresh implementation; user add/remove APIs; storage integration; gating by credentials.

4) Hooks (`src/lib/hooks/useProviderModels.ts`, `src/lib/hooks/useModelsByProvider.ts`)
- Implement via `useSyncExternalStore` on the catalog; expose `refresh` functions.
- Provide a `flattenAndSortAvailableModels` helper.

5) Provider metadata updates (e.g., add `fetchModelListUrl` where appropriate).

6) Integrations
- Update `useModelsWithConfiguredProvider` to source available models from the catalog hooks instead of `provider.models` directly.
- Optional: `ProviderRegistry.getAllModels()` → read from catalog snapshot for synchronous consumers.
- Expose `refreshModels(providerId?)` via context for refresh button wiring.

## Example Hook Signatures
- `useModelsByProvider(options?: { prefetch?: boolean }): Record<ProviderId, ProviderModelsStatus & { refresh: () => void }>`
- `useProviderModels(providerId: ProviderId, options?: { prefetch?: boolean }): ProviderModelsStatus & { refresh: () => void }`

## Error Handling
- Persisted storage read/write failures should be surfaced via telemetry; surface a per‑provider `error` state without blocking snapshot delivery.
- A provider’s fetch error should not affect other providers.
- Never automatically refetch.

## Testing Strategy (high level)
- Comprehensive unit testing.
- Comprehensive hook testing.
- Unit test catalog merge behavior (last write wins, stale marking, unique IDs).
- Test gating by credentials and the “no required keys” allowance.
- Test persistence round‑trips and recovery across page reloads.
- Test hooks update flow (snapshot → refresh → update → sorting).



## Step‑By‑Step Plan

  - Types and Telemetry
    - Add to src/lib/types/index.ts:
      - export type ModelOrigin = 'builtin' | 'api' | 'user'
      - Extend ModelConfig with origin, visible, discoveredAt?, updatedAt?
      - export interface ProviderModelsStatus { models: ModelConfigWithProvider[]; status: 'idle' | 'loading' | 'ready' | 'missing-config' | 'error'; error?: string }
      - export interface ModelPickerTelemetry { onFetchStart?; onFetchSuccess?; onFetchError?; onStorageError?; onUserModelAdded?; /* etc. */ }
    - Optionally extend ProviderMetadata with fetchModelListUrl?: string (not used by UI now, safe to add).
  - Provider Defaults
    - Update each provider’s static models to include defaults for new fields:
      - origin: 'builtin', visible: true (omit timestamps).
    - No other changes to builtins.
  - Model Repository Storage
    - Add src/lib/storage/modelRepository.ts:
      - Persisted per‑provider models under key models:<providerId>.
      - API:
        - getPersistedModels(modelStorage, providerId): Promise<ModelConfig[]> (filtered to visible === true by caller)
        - setPersistedModels(modelStorage, providerId, models: ModelConfig[]): Promise<void>
        - Internal helpers for merge/upsert preserving discoveredAt, updating updatedAt, marking stale api entries invisible.
      - Only persist minimal fields present in ModelConfig; drop anything else from provider API.
  - ModelCatalog Core
    - Add src/lib/catalog/ModelCatalog.ts:
      - Holds per‑provider state maps:
        - builtin: from provider.models (normalized with origin: 'builtin', visible: true)
        - persisted: from modelStorage (api + user)
        - merged snapshot: builtin ∪ persisted ∪ fetched (API), deduped by model.id, “last write wins”
      - Status per provider: idle | loading | ready | missing-config | error
      - Subscribe/snapshot API for React: getSnapshot(), subscribe(listener)
      - Methods:
        - refresh(providerId, { force?: boolean }): gated by validateConfig(config).ok
        - refreshAll() (respects gating)
        - addUserModel(providerId, modelId):
          - Reject exact duplicates (case‑sensitive).
          - Insert origin: 'user', visible: true, set timestamps, persist and emit.
        - removeUserModel(providerId, modelId): remove only user entries.
      - Fetcher:
        - Calls AIProvider.getModels() only when config is valid.
        - Merges results: upsert api entries, hide stale prior api entries (visible: false), preserve discoveredAt, update updatedAt.
        - Telemetry around fetch start/success/error; never retries.
      - Dedupe concurrent refreshes per provider.
  - Hooks on Catalog
    - Add src/lib/hooks/useProviderModels.ts:
      - Returns { models, status, error?, refresh } for one provider via useSyncExternalStore.
    - Add src/lib/hooks/useModelsByProvider.ts:
      - Returns a map Record<ProviderId, ProviderModelsStatus & { refresh: () => void }> for all providers with credentials (from providersWithCredentials storage).
      - Accepts { prefetch?: boolean }; if true and config valid, triggers background refresh.
    - Add helper flattenAndSortAvailableModels(map):
      - Filters visible === true.
      - Sorts by discoveredAt desc; if missing, provider name asc, then model display name asc.
  - Re‑implement useModelsWithConfiguredProvider
    - Rebuild src/lib/hooks/useModelsWithConfiguredProvider.ts on top of the catalog:
      - “Recently Used” behavior and storage keys unchanged.
      - “Available Models” uses catalog snapshot for providers in providersWithCredentials, filtered/sorted by helper.
      - Return shape unchanged: recentlyUsedModels, modelsWithCredentials, selectedModel, setSelectedProviderAndModel, deleteProvider, isLoadingOrError.
      - Add internal hook logic to call catalog.refresh(providerId) after setProviderConfiguration (config save) — invoked from ModelSelect’s onProviderConfigured flow.
  - Context Integration
    - Update src/lib/context/index.ts: to interrupt)
      - ModelPickerProviderProps gains:
        - modelStorage?: StorageAdapter (defaults to storage)
        - prefetch?: boolean (default true, pending open question)
        - telemetry?: ModelPickerTelemetry
      - Expose catalog and refreshModels(providerId?) via context (no UI wire‑up).
  - ModelSelect Updates
    - Add optional telemetry?: ModelPickerTelemetry prop. When inside provider, prefer context telemetry; otherwise, use prop.
    - No visual changes.
    - Keep using useModelsWithConfiguredProvider; the reimplementation will transparently use the catalog.
    - After onProviderConfigured, trigger catalog refresh for that provider via the hook.
  - Telemetry Wiring
    - Replace console.* with telemetry in new/updated modules:
      - modelRepository, ModelCatalog, hooks we touch, ModelSelect changes, context changes.
    - Use no‑op functions when telemetry not provided; do not fall back to console.
  - Tests
    - Add unit tests for:
      - Merge logic: last‑write‑wins, preserve discoveredAt, hide stale API entries, respect user entries.
      - Gating by config: missing-config vs ready.
      - Persistence round‑trip for API/user entries.
      - Hooks update flow: snapshot → (optional prefetch) → update → sorting.
    - Keep existing useModelsWithConfiguredProvider tests; adapt expectations only if necessary (should stay green as UI contract is preserved).
  - Docs
    - Update README/docs:
      - New props on ModelPickerProvider and ModelSelect.
      - Catalog overview and new hooks APIs.
      - Telemetry API and examples.
      - Note: useAllModels() now reflects catalog snapshot.
  - Non‑Goals for This PR
    - No refresh UI.
    - No removal of model methods from ProviderRegistry yet; we just stop using them from hooks/context.
