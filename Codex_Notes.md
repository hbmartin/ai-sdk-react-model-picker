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
