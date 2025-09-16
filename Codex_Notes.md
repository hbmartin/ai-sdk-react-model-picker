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

