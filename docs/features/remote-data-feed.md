# Live provider data (remote feed)

## What it does for the user
Free-tier quotas and "is this provider still free" change every few weeks. The built-in data only changes with a new app release, so LocalMind can instead download one small public JSON file with the latest provider facts. The Rate-Limit Matrix, the Config Exporter and the Key Vault then show the newer data. The matrix footer and Settings > Data & Backups say where the data comes from ("Live data from 2026-10-07, downloaded ...") and have a **Refresh data** button.

It is useful as soon as someone publishes the file: until then the app behaves exactly as before. **No feed address is set by default** (`DEFAULT_FEED_URL` in `src/lib/feed.ts` is empty because the public repo does not exist yet). Put the raw URL of `feed/providers.json` there once it is published, or paste it in Settings.

## How it works
1. **Rust** (`src-tauri/src/feed.rs`, command `fetch_feed`): downloads the URL. HTTPS only (plain HTTP only to localhost for trying a feed), no credentials in the URL, redirects never leave HTTPS, 15 s timeout, 1 MB limit. Returns text; errors are readable messages.
2. **Validation** (`src/lib/feed.ts`, `parseProvidersFeed`): every field is checked. Bad rows are skipped and counted ("N feed rows ignored"); a file with no usable row is rejected. Model ids, URLs and env var names are checked strictly because they end up in copy-paste shell commands in the Config Exporter. The feed cannot add a Key Vault provider the app has no verification for.
3. **Merge** (`mergeProviders`): built-in rows are the base; a feed row with the same `id` replaces it; new ids are appended. A feed row with `"status": "retired"` shows in the matrix as **Retired** and disappears from the exporter and the vault.
4. **Cache**: the last accepted download is kept in localStorage (`localmind_feed_cache_v1`) with its time and address, and re-validated on every read. A failed or invalid download keeps the last good data and shows the error. A cache from a different address is never used.
5. **Refresh**: on open and then hourly while the app stays open, the app downloads only if the cache is missing or at least 24 hours old. The Refresh button always downloads.
6. **UI plumbing**: `ProviderDataProvider` (`src/lib/ProviderDataContext.tsx`, wrapped around `App` in `main.tsx`) exposes `useProviderData()` with the three derived views. Without the provider (tests, crash screen) the hook returns the built-in data and fetches nothing.

## Feed format
```json
{ "schema": 1, "updated": "2026-10-07", "providers": [ { ...one ProviderInfo per entry... } ] }
```
Each provider has the shape of `ProviderInfo` in `src/data/providers.ts` (`id`, `name`, `getKeyUrl`, `docsUrl`, `isFree`, `freeQuota`, `setupGuide`, `inVault`, optional `reviewed` `YYYY-MM`, `status` `active|retired`, `limits`, `api`).

`feed/providers.json` is that file generated from the built-in data. After editing `src/data/providers.ts`, run `pnpm feed:build` and publish the result; a test fails if the two drift apart. To correct data without a release, edit the published copy (for example change `freeQuota`, or set `"status": "retired"`), bump `updated`, and every app picks it up within a day.

## Privacy
Only the feed URL is requested (with a generic `LocalMind` user agent). No keys, tool lists or other data are sent. The feed is on by default but does nothing until an address is set, and it can be switched off in Settings.

## Tests
`src/lib/feed.test.ts` (validation, injection rejection, merge, staleness, cache, the published file), `src/lib/ProviderDataContext.test.tsx` (auto refresh, Refresh button, failures keep old data, retired, Settings panel), `RateLimitMatrixModal.test.tsx` (retired row), and 3 Rust tests for URL and size rules.

## Limits and open points
- Only provider data is fed. Tools, bookmarks and other catalogs are planned to follow the same pattern (`parse...Feed` + merge + the same cache and refresh).
- The matrix's "suggested fallback order" cards are static text and do not follow the feed.
- The feed is not signed. Anyone who controls the published file controls what the app shows, which is why the validation is strict and the address is visible and changeable in Settings.
- Not yet checked in the real desktop window (downloading over the real network): see Task 19.
