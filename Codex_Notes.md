Codex Work Log and Improvement Notes

Session: Addressing issues from Bugs.md

Issue 1: Provider/model key delimiter is unsafe
- Problem: `ProviderAndModelKey` used `/` delimiter, while some model IDs also contain `/` (e.g. OpenRouter models). The previous `idsFromKey` implementation split on all `/` and enforced exactly 2 segments, causing errors and breaking recents/selection.
- Change: Updated `idsFromKey` to split only at the first delimiter and treat the remainder as `modelId`.
- Files changed:
  - `src/lib/types/index.ts`: Rewrote `idsFromKey` to use `indexOf(KEY_DELIMITER)` and slice.
- Validation: Ran `npm run lint:fix` successfully. This change is backward compatible because existing keys (with a single `/`) still parse identically; it now additionally supports model IDs containing `/`.
- Future improvements:
  - Avoid concatenated composite keys entirely; persist `{providerId, modelId}` as structured data to remove parsing concerns.
  - Add unit tests for key creation/parsing and for known model IDs containing `/`.
  - Consider URL-safe encoding or a different delimiter if string keys must remain.

Issue 2: Toggle double-trigger on keyboard
- Problem: `Toggle` fired `onClick` on both `onKeyDown` and `onKeyUp`, so Enter/Space toggled twice.
- Change: Removed `onKeyUp` handler and constrained `onKeyDown` to only trigger on Enter/Space with `preventDefault()`.
- Files changed:
  - `src/lib/components/Toggle.tsx`
- Validation: Ran `npm run lint:fix`. Adjusted variable name per ESLint rule (no 1-letter identifiers).
- Future improvements:
  - Consider ARIA `role="switch"` and `aria-checked` if appropriate for semantics.
  - Add keyboard tests with Testing Library for Enter/Space behavior.

Issue 3: README and stories used unsupported controlled props
- Problem: `ModelSelect` examples used `selectedModelId`, `onConfigureProvider`, `onMissingConfiguration`, and `theme` props that the component does not accept. Stories also passed `selectedModelId`.
- Change: Updated README to reflect storage-driven selection and removed unsupported props. Replaced quick start example to suggest `getSdkLanguageModel(storage)` for AI SDK wiring. Adjusted Storybook stories to drop unsupported props and controlled `selectedModelId`.
- Files changed:
  - `README.md`
  - `stories/ModelSelect.stories.tsx`
- Validation: Ran `npm run lint:fix` (no code issues). Stories compile will be verified by Storybook during CI.
- Future improvements:
  - Split README into a “Basics” and “With Context” guide; keep prop/API references tightly synced with TypeScript types.
  - Add a minimal live example showcasing storage-driven selection + `getSdkLanguageModel` usage.

Issue 4: Context exported but not integrated
- Problem: `ModelSelect` did not use `ModelPickerProvider` context when present, leading to duplicate prop pluming and inconsistent usage.
- Change: Added `useOptionalModelPicker()` and updated `ModelSelect` to read `storage`, `providerRegistry`, `roles`, `selectedRole`, and role change handler from context when available. Also dispatches context `selectModel` on selection.
- Files changed:
  - `src/lib/context/index.ts` (new `useOptionalModelPicker`)
  - `src/lib/components/ModelSelect.tsx`
- Validation: Ran `npm run lint:fix` with no issues.
- Future improvements:
  - Consider moving add-provider dialog actions (configure/missing config) into context to consolidate side-effects.
  - Provide a thin wrapper component that fully binds to context to simplify consumption.

Issue 5: ProviderRegistry.getAllModels() bypassed dynamic model loading
- Problem: `getAllModels()` read `provider.models` directly, encouraging synchronous access and ignoring `getModels()`.
- Change: Removed `getAllModels()` from the registry interface and implementation. Updated context to aggregate models from `getAllProviders()` using `provider.models` for now.
- Files changed:
  - `src/lib/types/index.ts` (interface)
  - `src/lib/providers/ProviderRegistry.ts`
  - `src/lib/context/index.ts` (aggregation)
- Validation: Typechecked and linted successfully.
- Future improvements:
  - Introduce an async hook/utility to aggregate `await provider.getModels()` per provider for dynamic fetching.
  - Consider caching model lists with invalidation hooks.

Issue 6: Storage robustness and versioning
- Problems:
  - Stored maps used unvalidated plain records with ad-hoc merges.
  - No versioning, making migrations harder.
- Changes:
  - Added versioned payload support for map-like records: `{ __version: 1, items: Record<string,string> }`.
  - Implemented compatible readers/writers that understand both legacy and v1 formats.
  - Validated records on load using `assertRecordStringString` across reads (recents, providers with credentials, provider configuration).
- Files changed:
  - `src/lib/storage/repository.ts`
- Validation: Typechecked and linted successfully. Behavior remains backward-compatible.
- Future improvements:
  - Consider namespacing storage keys and adding a migration utility for future versions.
  - Encrypt sensitive values in storage where possible (left to consumer adapter).

Issue 7: Listbox positioning/behavior
- Problems:
  - Dropdown didn’t reposition on scroll/resize; width didn’t match trigger; no clamping to viewport edges; minimal keyboard focus behavior.
- Changes:
  - Added scroll/resize listeners and recalculation logic.
  - Matched dropdown width to trigger and clamped horizontal position within viewport with padding.
  - Focus first option on open if focus is outside; added ArrowUp/ArrowDown roving focus between options.
- Files changed:
  - `src/lib/components/ui/Listbox.tsx`
- Validation: Linted and typechecked. UX is improved while keeping implementation lightweight.
- Future improvements:
  - Consider using Floating UI/Popper for robust positioning if footprint allows.
  - Add type-ahead support and aria-activedescendant pattern for richer a11y.

Issue 8: Theming & CSS cleanup
- Problems:
  - Some components used hardcoded colors (e.g., `text-white`) instead of semantic theme classes.
  - Docs didn’t clearly explain compiled CSS vs Tailwind preset paths.
- Changes:
  - Replaced hardcoded `text-white` with `text-primary-foreground` / `text-destructive-foreground` where appropriate.
  - Expanded README with explicit guidance for non-Tailwind users (import CSS only) and Tailwind users (preset usage).
- Files changed:
  - `src/lib/components/Toggle.tsx`
  - `src/lib/components/ui/Listbox.tsx`
  - `src/lib/components/AddModelForm.tsx`
  - `README.md`
- Validation: Linted successfully.
- Future improvements:
  - Audit remaining components for any direct color usage and replace with semantic tokens.
  - Provide an optional CSS-only bundle with precompiled semantic classes for consumers not using Tailwind.
