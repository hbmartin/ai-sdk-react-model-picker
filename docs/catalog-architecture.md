# Model Picker Architecture

This document explains how the model picker keeps provider catalogs, storage, and React state in sync. It starts with a high-level tour and then dives into the key building blocks: hooks, the catalog, the provider registry, and supporting utilities.

## High-Level Overview

At runtime the picker orchestrates three primary concerns:

- **Provider definitions** live in the `ProviderRegistry`, which exposes metadata and provider APIs.
- **Model availability** is normalized by the `ModelCatalog`, which hydrates from storage, fetches remote models, and emits snapshots.
- **UI state** is derived in React hooks (notably `useModelsWithConfiguredProvider`) that bind storage, catalog snapshots, and user selections together.

```mermaid
flowchart LR
  subgraph Registry
    PR[ProviderRegistry]
  end
  subgraph Storage
    OS[(StorageAdapter)]
    MS[(ModelStorageAdapter)]
  end
  subgraph Catalog
    MC[ModelCatalog]
  end
  subgraph Hooks
    UMWCP[useModelsWithConfiguredProvider]
    UMBP[useModelsByProvider]
    UPM[useProviderModels]
  end

  PR --> MC
  OS --> MC
  MS --> MC
  MC --> UMWCP
  MC --> UMBP
  MC --> UPM
  OS --> UMWCP
  UMWCP --> OS
  UMWCP --> UMBP
  UMWCP --> UPM
```

The diagram highlights the circular relationship: hooks consume catalog snapshots, feed user actions back into storage, and trigger catalog refreshes when needed.

## Hook Architecture

### `useModelsWithConfiguredProvider`

`src/lib/hooks/useModelsWithConfiguredProvider.ts`

Responsibilities:

- Instantiate or reuse a `ModelCatalog` (through the internal `useCatalogLifecycle` helper) when the hook owns the lifecycle.
- Hydrate recently used models and providers with credentials from storage.
- Derive available models using `deriveAvailableModels`, ensuring consistent filtering/sorting across the hook.
- Persist selection updates (`addRecentlyUsedModel`, `addProviderWithCredentials`) and handle deletions.
- Subscribe to catalog snapshots via `useCatalogSnapshot` and memoize lists for rendering.

```mermaid
sequenceDiagram
  participant Hook as useModelsWithConfiguredProvider
  participant Lifecycle as useCatalogLifecycle
  participant Catalog as ModelCatalog
  participant Storage as StorageAdapter
  participant ModelStorage as ModelStorage

  Hook->>Lifecycle: request catalog (storage, registry, telemetry)
  Lifecycle-->>Hook: { catalog, consumePendingInitialization }
  Hook->>Storage: read recent models & provider creds
  alt first run or deps change
    Hook->>Catalog: initialize(prefetch?)
  end
  Hook->>Catalog: subscribe via useSyncExternalStore
  Catalog-->>Hook: snapshot per provider
  Hook->>Storage: persist selection & deletions
  Hook->>Catalog: refresh(providerId) when requested
```

Key internal helpers:

- `useCatalogLifecycle` keeps `createdInternal`-style state in refs, simplified to avoid extra renders. It tracks whether a fresh catalog instance needs initialization.
- `useCatalogSnapshot` unwraps the `useSyncExternalStore` subscription for consistent usage across hooks.
- `deriveAvailableModels` (in `catalogUtils`) performs flattening, filtering, and key generation so deletion, initialization, and memoized outputs always agree.

### `useModelsByProvider`

`src/lib/hooks/useModelsByProvider.ts`

This hook provides a map-like view of every provider, principally for dashboards that need to render multiple provider sections at once.

- Subscribes to the catalog with `useSyncExternalStore` and projects each entry into an object that also exposes a `refresh()` helper.
- Accepts a `prefetch` flag that triggers `catalog.refreshAll()` on mount, useful for “load everything now” UIs.

```mermaid
flowchart TD
  Catalog -->|subscribe| Hook
  Hook -->|map entries| View[Provider list UI]
  Hook -->|refreshAll on mount| Catalog
  View -->|refresh(pid)| Catalog
```

### `useProviderModels`

`src/lib/hooks/useProviderModels.ts`

Focused on a single provider:

- Shares the same subscription pattern as `useModelsByProvider` but memoizes a specific provider entry.
- Issues a `catalog.refresh(providerId)` when `prefetch` is true.
- Returns both the `ProviderModelsStatus` and a `refresh()` callback, making it easy for call sites to add “retry” buttons.

```mermaid
stateDiagram-v2
  [*] --> Idle
  Idle --> Prefetching: prefetch flag true
  Prefetching --> WaitingSnapshot
  WaitingSnapshot --> Ready
  Ready --> Idle: dependency change (providerId/catalog)
  Ready --> Refreshing: refresh() called
  Refreshing --> Ready
```

## Model Catalog

`src/lib/catalog/ModelCatalog.ts`

The catalog is the single source of truth for model availability. It keeps normalized model maps per provider and exposes reactive snapshots.

### Lifecycle

- **Construction** seeds built-in provider models (`seedBuiltin`) so UI has data immediately.
- **Initialization (`initialize`)** hydrates persisted models and optionally prefetches remote data for providers that have stored credentials.
- **Refresh** evaluates provider configuration, marks status, fetches models, merges API results, and persists non-builtin entries.
- **Listeners**: `subscribe` returns an unsubscribe closure while `getSnapshot` reuses a cached snapshot, recomputing when provider membership changes.

```mermaid
flowchart LR
  subgraph Seeds
    A[seedBuiltin]
  end
  subgraph Hydration
    B[ensureProviderState]
    C[ensurePersistedLoaded]
  end
  subgraph Network
    D[refresh(providerId)]
    E[mergeApi]
  end
  subgraph Persistence
    F[persistNonBuiltin]
  end
  subgraph Emission
    G[recomputeSnapshot]
    H[emit]
  end

  A --> B
  B --> C
  C --> G
  D --> E --> F
  D --> G
  G --> H
```

### Snapshot Structure

Each snapshot entry is a `ProviderModelsStatus` containing:

- `models`: Array of `ModelConfigWithProvider` values (built-in, API, or user-added).
- `status`: `'idle' | 'loading' | 'ready' | 'missing-config' | 'error'`.
- Optional `error` message when in error state.

The catalog keeps additional internal sets:

- `hydratedProviders` to avoid rehydrating persisted data repeatedly.
- `inFlight` to guard against overlapping refreshes.
- `pendingHydrations` to dedupe concurrent initialization work per provider.

## Provider Registry

`src/lib/providers/ProviderRegistry.ts`

The registry is the catalog’s view of the provider universe. It is intentionally thin, delegating almost everything to provider instances.

```mermaid
classDiagram
  class ProviderRegistry {
    +ProviderRegistry(defaultProvider)
    +register(provider) ProviderId
    +getProvider(id) AIProvider
    +getAllProviders() AIProvider[]
    +getProviderMetadata(id) ProviderMetadata
    +hasProvider(id) boolean
    +unregister(id) boolean
    +getProvidersByCapability(capability)
    -providers: Map<ProviderId, AIProvider>
    +defaultProvider: ProviderId
    +topProviders: ProviderId[]
  }

  class AIProvider {
    +metadata: ProviderMetadata
    +models: ModelConfig[]
    +getModels(): Promise<ModelConfig[]>
    +getDefaultModel(): ModelConfig
    +configuration: ProviderConfiguration
  }

  ProviderRegistry --> AIProvider
```

Key points:

- `topProviders` is a curated ordering used by UI components for prominence.
- `register` guards against duplicate IDs; `getProvider` throws when a provider is missing, surfacing misconfiguration early.
- Capability lookups (`getProvidersByCapability`) are convenience APIs for UI filters.

## Supporting Utilities & Topics of Interest

### Storage Repositories

`src/lib/storage/repository.ts` and `src/lib/storage/modelRepository.ts` abstract persistence. Hooks call these helpers rather than dealing with keys directly, which keeps storage swappable. Telemetry hooks can observe read/write errors.

```mermaid
flowchart LR
  subgraph StorageAdapter
    SA[get]
    SB[set]
    SC[remove]
  end
  subgraph Repository
    RP[getRecentlyUsedModels]
    RP2[addRecentlyUsedModel]
    RP3[removeRecentlyUsedModels]
    RP4[getProvidersWithCredentials]
  end
  subgraph Hooks
    Hook[useModelsWithConfiguredProvider]
  end

  Hook --> RP
  Hook --> RP2
  Hook --> RP3
  Hook --> RP4
  RP --> SA
  RP2 --> SB
  RP3 --> SC
  RP4 --> SA
```

### Catalog Utilities

`src/lib/hooks/catalogUtils.ts` now centralizes list derivation logic:

- `flattenAndSortAvailableModels` normalizes per-provider snapshots into a sorted list honoring visibility, discovery timestamps, and stable alphabetical ordering.
- `deriveAvailableModels` wraps the flattening step with deduplication (`providerAndModelKey`), ensuring the deletion flow, initialization, and memoized list share identical filtering rules.

### Telemetry Touchpoints

Telemetry callbacks from `ModelPickerTelemetry` are invoked during catalog operations:

- `onFetchStart`, `onFetchSuccess`, `onFetchError` during refresh cycles.
- `onUserModelAdded` when the user creates local entries.
- Storage operations can surface errors through `onStorageError`.

These hooks make it easy to surface progress indicators, analytics events, or logging without coupling the catalog to any specific telemetry client.

### React Integration Patterns

The hooks follow a consistent pattern:

1. **Reference stability first**: internal state like catalog ownership is tracked in refs, avoiding dependency churn.
2. **useSyncExternalStore**: ensures React’s concurrent rendering semantics are respected for catalog subscriptions.
3. **Pure derivation helpers** (`deriveAvailableModels`) keep memoized selectors deterministic and easy to test (see `tests/hooks.catalogUtils.test.ts`).

Together these patterns make the model picker resilient to provider churn, network variability, and UI-driven storage operations.
