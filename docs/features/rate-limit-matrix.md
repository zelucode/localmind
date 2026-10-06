# Rate-Limit Matrix

**Audit status: working, data is a snapshot** (audited 2026-10-06, Task 9).

## Why it exists (what it does for the user)
Free AI tiers are only free up to a quota, and the quotas differ per provider (requests per minute, requests per day, context size, whether a card is needed). When a quota runs out, the coding assistant just starts failing. This page answers two questions:
1. **Which provider fits this job?** The table compares providers side by side (searchable, filterable by Cloud / Router / Local). A **Config** button on each row jumps to the Config Exporter with that provider preselected, and a link opens the provider's key page.
2. **What do I do when one runs out?** Under it, *Suggested fallback order* suggests a fallback order (big-context cloud model, fast cloud model, burst buffer, offline local model) and three tips to hit limits less often.

It is reference and planning material. It does not measure the user's real usage and does not call any provider.

## How it works
- Data comes from `src/data/providers.ts` (`deriveRateLimits(PROVIDERS)`), or from the live feed when one is set up (`useProviderData().rateLimits`, see [remote-data-feed.md](remote-data-feed.md)). A provider the feed marks retired stays in the table with a **Retired** badge and no Config button. The footer says where the data is from and has a Refresh button. `src/components/RateLimitMatrixModal.tsx` renders it as a table, with "Checked <month>" or "Not re-checked" under each row, plus the rotation text. Rendered as the "Rate Limits" tab of the Configs & Limits page (`inline`).
- "Config" calls `onOpenExporterWithProvider(id)`; `App.tsx` switches to the exporter tab with that provider.

## Bugs found and fixed in the audit
- **Wrong numbers.** Groq Llama 3.3 70B was listed at 14,400 RPD / 30,000 TPM; the free plan is about 1,000 RPD / 12,000 TPM (14,400 is the 8B model's figure). Gemini 2.5 Flash was listed at 1,500 RPD, but Google has cut free quotas and reports range from about 20 to 250 per day, so it now says "Varies". DeepSeek was shown as free with "5M tokens on signup"; it is pay-as-you-go, so it is now labeled that way.
- **Dishonest footer.** "All cataloged tiers are verified active without mandatory credit card verification" was never true. It now says the quotas were reviewed in Oct 2026 and not checked live, and the page explains RPM/RPD and that providers change limits.
- **Overclaims removed:** "unlimited zero-cost development", "code 8+ hours a day without hitting throttling", "Zero Pause", "Never hit rate limits".
- The **DeepSeek "Config" button opened Gemini** because the exporter had no DeepSeek preset. The exporter now has one (`deepseek-chat`, `deepseek-reasoner`), and a test fails if any matrix row lacks an exporter preset.
- The tip named `.aiderrules`, which isn't an Aider file; it is `.aiderignore`.
- The key link was a bare `target="_blank"`; it now goes through `openExternal`.
- No empty state when a search matched nothing.

## Tests
`RateLimitMatrixModal.test.tsx`: row/preset consistency, all providers listed, no "verified" claim, category filter, search and empty state, Config callback, Key saved badge, key link via `openExternal`, table and fallback order shown together (no inner tabs), and a feed-retired provider shown as Retired with the live-data footer.

## Limits and ideas
- **The data is typed in by hand and will go stale.** It now lives in one file (`src/data/providers.ts`) with a `reviewed` month per provider; only Gemini, Groq and DeepSeek were actually re-checked (2026-10). Edit quotas there and nowhere else.
- The `tpm`, `creditCardRequired` and `role` fields are partly unused or editorial; the table doesn't show the credit-card column.
- Rows show a **Key saved** badge for providers that already have a vault key. It does not track usage, so it can't tell which providers are exhausted.
- The "OmniRoute retries on 429" claim comes from the project's own description of the tool and is not verified.
