# Provider data and the live feed

Free-tier quotas and "is this provider still free" change every few weeks. Provider facts therefore live in one place and can be updated without releasing a new app version.

## The data

`src/data/providers.ts` holds a `ProviderInfo` per provider: `id`, `name`, `getKeyUrl`, `docsUrl`, `isFree`, `freeQuota`, `setupGuide`, `inVault`, an optional `reviewed` month (`YYYY-MM`), `status` (`active` or `retired`), `limits` and `api` (base URL, environment variable and models). Three views are derived from it and shared across the app:

- the Rate-Limit Matrix (`deriveRateLimits`),
- the Config Exporter presets (`derivePresets`),
- the Key Vault provider list.

Components read them through `useProviderData()` (`src/lib/ProviderDataContext.tsx`). Without the provider (tests, the crash screen) the hook returns the built-in data and fetches nothing.

::: warning Verify before you commit a number
The data is typed in by hand and goes stale. When you change a quota, check the provider's own documentation and set `reviewed` to the current month. Model IDs and endpoints in the presets have not all been checked against live providers and may be out of date; fixes are welcome.
:::

## Updating the built-in data

1. Edit `src/data/providers.ts`. Edit quotas there and nowhere else.
2. Run `pnpm feed:build`. This regenerates `feed/providers.json`.
3. Run `pnpm test`. A test fails if the two files drift apart.
4. Open a pull request.

## The live feed

The app can download `feed/providers.json` (or any file in the same format) and show it instead of the built-in data.

```json
{ "schema": 1, "updated": "2026-10-07", "providers": [ { "...": "one ProviderInfo per entry" } ] }
```

To correct data without a release, edit the published copy (change `freeQuota`, or set `"status": "retired"`), bump `updated`, and every app that has the feed on picks it up within a day.

### How it works

1. **Download.** `src-tauri/src/feed.rs` (`fetch_feed`) downloads the URL. It is HTTPS only (plain HTTP only to localhost, for trying a feed), allows no credentials in the URL, never follows a redirect off HTTPS, times out after 15 seconds and caps the size at 1 MB. It returns text, and errors are readable messages.
2. **Validate.** `src/lib/feed.ts` (`parseProvidersFeed`) checks every field. A bad row is skipped and counted ("N feed rows ignored"). A file with no usable row is rejected. Model IDs, URLs and environment variable names are checked strictly, because they end up in copy-paste shell commands. The feed cannot add a Key Vault provider that the app has no verification for.
3. **Merge.** `mergeProviders` takes the built-in rows as the base. A feed row with the same `id` replaces it, and new ids are appended. A row with `"status": "retired"` shows in the matrix as **Retired** and disappears from the exporter and the vault.
4. **Cache.** The last accepted download is kept in `localStorage` (`localmind_feed_cache_v1`) with its time and address, and is validated again on every read. A failed or invalid download keeps the last good data and shows the error. A cache from a different address is never used.
5. **Refresh.** On open, and then hourly while the app stays open, the app downloads only if the cache is missing or at least 24 hours old. The **Refresh data** button always downloads.

### Privacy

Only the feed URL is requested, with a generic `LocalMind` user agent. No keys, tool lists or other data are sent. No address is set by default (`DEFAULT_FEED_URL` in `src/lib/feed.ts` is empty), so nothing is downloaded until an address is set in the code or in Settings. A user can switch the feed off, which also clears the cache.

### Limits

- Only provider data is fed. Tools, bookmarks and other catalogs could follow the same pattern: a `parse...Feed` function, a merge, and the same cache and refresh.
- The matrix's "suggested fallback order" cards are static text and do not follow the feed.
- The feed is not signed.

## Tests

`src/lib/feed.test.ts` covers validation, injection rejection, merge, staleness, the cache and the published file. `ProviderDataContext.test.tsx` covers the refresh button, failures keeping old data, retired providers and the Settings panel. The Rust tests cover the URL and size rules, and run `fetch_feed` against a local server.
