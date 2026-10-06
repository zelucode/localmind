# Rate-Limit Matrix

**Audit status: working, data is a snapshot** (audited 2026-10-06, Task 9).

## Why it exists (what it does for the user)
Free AI tiers are only free up to a quota, and the quotas differ per provider (requests per minute, requests per day, context size, whether a card is needed). When a quota runs out, the coding assistant just starts failing. This page answers two questions:
1. **Which provider fits this job?** The *Quota Matrix* tab compares providers side by side (searchable, filterable by Cloud / Router / Local). A **Config** button on each row jumps to the Config Exporter with that provider preselected, and a link opens the provider's key page.
2. **What do I do when one runs out?** The *Rotation Chain* tab suggests a fallback order (big-context cloud model, fast cloud model, burst buffer, offline local model) and three tips to hit limits less often.

It is reference and planning material. It does not measure the user's real usage and does not call any provider.

## How it works
- Data comes from `src/data/providers.ts` (`RATE_LIMIT_DATA`, derived from `PROVIDERS`). `src/components/RateLimitMatrixModal.tsx` renders it as a table, with "Checked <month>" or "Not re-checked" under each row, plus the rotation text. Rendered as the "Rate Limits" tab of the Configs & Limits page (`inline`).
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
`RateLimitMatrixModal.test.tsx`: row/preset consistency, all providers listed, no "verified" claim, category filter, search and empty state, Config callback, key link via `openExternal`, rotation tab.

## Limits and ideas
- **The data is typed in by hand and will go stale.** It now lives in one file (`src/data/providers.ts`) with a `reviewed` month per provider; only Gemini, Groq and DeepSeek were actually re-checked (2026-10). Edit quotas there and nowhere else.
- The `tpm`, `creditCardRequired` and `role` fields are partly unused or editorial; the table doesn't show the credit-card column.
- The matrix doesn't know which providers the user already has a key for. Showing a "Key saved" badge, or the user's exhausted providers, would make it actionable rather than just informational.
- The "OmniRoute retries on 429" claim comes from the project's own description of the tool and is not verified.
