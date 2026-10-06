# LocalMind Product Backlog & Roadmap

This document outlines the high-value community-researched features and tasks prioritized for LocalMind.

---

## 📋 Task Backlog

### [x] Task 1: Instant IDE & Agent Config Exporter (Zero-to-Code Setup)
- **Problem**: Developers obtain free API keys from Google AI Studio, Groq, or OpenRouter, but struggle to configure them inside coding assistants like VS Code, Cline, Continue.dev, Cursor, or Aider CLI due to varying environment variable names, custom base URLs, and exact model ID strings.
- **Solution**: An interactive Config Exporter utility where the developer picks their target tool (Cline, Continue.dev, Cursor, Aider CLI, Windsurf, or Python/TS SDK) and provider/key to get a 1-click copyable config snippet (e.g. `config.json`, `.cursorrules` / Custom OpenAI Base URL, `.env`, or terminal command).
- **Status**: Completed (Implemented `IDEConfigExporterModal.tsx`, integrated with Sidebar, Omnibar, ApiKeyVault, and Tool Cards).

---

### [x] Task 2: Rate-Limit & Rotation Strategy Matrix
- **Problem**: Free tiers have diverse and confusing rate limits (RPM, RPD, TPM, context windows). Developers hit limits mid-coding because they don't know the exact boundary limits or how to chain models together.
- **Solution**: A dedicated Rate-Limit & Rotation Cheatsheet tab/modal comparing RPM, TPM, Daily Caps, Context Windows, and a "Zero-Cost Daily Coding Strategy" explaining how to rotate between Gemini 2.5 Flash, Groq, and OpenRouter to prevent rate-limit throttling.
- **Status**: Completed (Implemented `RateLimitMatrixModal.tsx` with Quota Matrix table, category filtering, search, and 4-tier daily rotation chain architecture).

---

### [ ] Task 3: Local Model VRAM & Hardware Feasibility Calculator
- **Problem**: Developers frequently download large 14B–70B GGUF models in Ollama or LM Studio only to discover their GPU VRAM or system RAM cannot run them without freezing or crashing.
- **Solution**: An interactive hardware calculator: select your system (Apple Silicon M-series Unified Memory vs. PC RAM + NVIDIA/AMD VRAM) and model parameters (7B, 14B, 32B, 70B with Q4_K_M quantization) to calculate whether it runs Full GPU, Partial CPU offload, or will Out-of-Memory (OOM).
- **Status**: Planned.

---

### [ ] Task 4: "No-Credit-Card Verification" Badge & Filter Precision
- **Problem**: Many services claim to be "free" but require entering credit card details for identity verification, creating risk of unexpected charges.
- **Solution**: Provide strict visual badges and dedicated filter toggles separating "100% Zero-Card Forever" platforms from "Card Verification Required" platforms, giving developers total billing peace of mind.
- **Status**: Planned.

---

### [ ] Task 5: 1-Click cURL & Python/TypeScript Code Snippets with Live Key
- **Problem**: When testing an API, developers frequently want a rapid 5-line terminal `curl` command or Node.js/Python script to verify prompt responses.
- **Solution**: A quick "Code Snippet" action on each provider card that generates an instantly executable terminal command or code block with the developer's active vault key pre-filled.
- **Status**: Planned.

---

## 🧭 Navigation & UX restructure follow-ups

Tracked here so nothing from the restructure (sidebar pages, title bar, Help menu) is silently dropped.

### [ ] Task 6: Help menu: Documentation link
- **Problem**: The Help menu has a disabled "Documentation" item; the repo has no remote or docs site URL yet.
- **Solution**: Decide the docs location (hosted site, GitHub README, or bundled docs), then open it with the Tauri opener plugin.
- **Status**: Blocked on a URL.

### [x] Task 7: Help menu: Report a Problem
- **Problem**: Disabled "Report a Problem" item. Needs a diagnostic bundle design.
- **Solution**: Build on `src/lib/errorLog.ts`: save a `.zip` (app log, version/OS, environment) via a Rust command and a save dialog, with stored API keys redacted before writing. Nothing is sent automatically.
- **Done**: `app.log` shared by Rust and the frontend, key redaction, rotation, global error and rejection logging, and the Report a Problem dialog (preview, save to Downloads, copy, open log folder). The bundle is one `.txt`, not a `.zip`. See [features/logging-and-diagnostics.md](features/logging-and-diagnostics.md). Still to check in the real window: log location, Downloads, Show in folder (Task 19).
- **Status**: Completed.

### [ ] Task 8: About: Check for Updates
- **Problem**: About shows the version only. No updater is configured.
- **Solution**: Add `tauri-plugin-updater`, signing keys and an update endpoint, then a "Check for Updates" button.
- **Status**: Planned.

### [x] Task 9: Audit that every UI feature actually works
- **Problem**: The UI came from AI Studio; some controls may not be wired up.
- **Done so far**: Rust commands + unit tests for local port probing, API key verification (Gemini, OpenRouter, Groq, OpenAI, DeepSeek, Mistral, Anthropic) and the Advisor. Removed the fake "OmniRoute online (3 ms)" fallback and the length-based "valid key" check. External links use the opener plugin. Vitest + RTL set up with tests for the shell, Tools, Bookmarks, Home, Runtimes, Vault, Advisor, Ctrl+K and `lib/`.
- **Audited**: Config Exporter (fixed 6 bugs, see `docs/features/config-exporter.md`; preset model IDs and endpoints still need a manual check against provider docs).
- **Audited**: Rate-Limit Matrix (wrong quota numbers and a false "verified" claim fixed, see `docs/features/rate-limit-matrix.md`; the data now has one source of truth, `src/data/providers.ts`, with review dates; only Gemini, Groq and DeepSeek have actually been re-checked).
- **Audited**: Bookmark Export/Import center and Export Markdown (merge duplication, data loss, unsafe links and false copy fixed, CSV import added, see `docs/features/bookmark-export-import.md`; downloads and the file picker still need a check in the real Tauri window).
- **Audited**: Add Tool and Add Bookmark forms, Quick Query templates, the Welcome screen and the search/tooltip wording, custom-tool deletion and all copy buttons (see `docs/features/add-tools-and-quick-query.md`).
- **Audited**: Settings (backup omitted bookmarks and themes, restore silently replaced keys and falsely reported success, reset deleted keys without saying so, theme editor accepted invalid presets; see `docs/features/settings-and-backup.md`).
- **Result**: every feature in the list was walked, tagged, fixed with tests and written up in its feature doc. The bugs fixed include several silent data-loss ones (bookmark merge duplicates, restore replacing saved keys, the browser import overwriting descriptions, a backup that left bookmarks out).
- **Not verifiable without the real app** (see Task 19): file downloads, the file picker, and `window.confirm` in the remaining places.
- **Status**: Completed (2026-10-06).

### [x] Task 13: Encrypt stored API keys
- **Problem**: Keys sat in localStorage as plain JSON; any code in the webview could read them.
- **Solution**: AES-256-GCM in Rust (`src-tauri/src/secrets.rs`), master key generated once and kept in the OS credential store (Windows Credential Manager / macOS Keychain / Linux keyutils). Keys are encrypted before they reach localStorage and decrypted into memory at startup. Existing plaintext keys migrate automatically on first launch. If encryption fails, keys are never written in plaintext and the Vault shows a warning. Keys that can't be decrypted (other device) are kept, flagged, and never silently dropped.
- **Status**: Completed (see `docs/features/key-vault.md`). Known limits: see Task 17 (backups) and the note that `pnpm dev` in a plain browser stores plaintext (development only).

### [ ] Task 14: Advisor: re-enable and choose providers
- **Problem**: The Free Tier Advisor is built (Rust `ask_advisor`, `AIAdvisorModal`, tests) but only supports Gemini with the user's vault key, so it is hidden.
- **Hidden by**: `FEATURES.advisor = false` in `src/config/features.ts`. This hides the floating button, the `A` shortcut, the Ctrl+K action, the Omnibar "Which Tool?" button and its shortcut-sheet entry. Set it to `true` to bring everything back (`App.advisor.test.tsx` covers the enabled state).
- **To decide**: which providers the Advisor should run on (Gemini, Groq, OpenRouter, local Ollama?), whether the user picks the key, and whether to ship an offline fallback (keyword-matched suggestions from the catalog, like the old Express server had).
- **Status**: Parked until the provider decision.

### [ ] Task 15: Verify keys for more providers
- **Problem**: Providers marked "other" cannot be verified (the UI says so, honestly).
- **Solution**: Add per-provider verification as providers are added to the vault list.
- **Status**: Planned.

### [x] Task 10: AI Tools list view and denser cards
- **Problem**: Cards were tall (about 4 visible at once); comparing free tiers was slow.
- **Solution**: Left filter rail with counts, one search, sort (recommended / name / most starred), and a list/grid toggle (list by default, remembered).
- **Status**: Completed (`ToolsPage.tsx`). Also fixed the `'code-agent'` category typo so coding agents get the Config button. Follow-up: the Omnibar on Home and Ctrl+K still overlap this search; revisit when the command palette is reworked.

### [x] Task 11: Bookmarks list view
- **Problem**: 270 bookmarks in tall cards, 24 per page, all with the same wrench icon.
- **Solution**: Category rail with counts, compact list by default with a grid option, "show more" instead of paging, letter avatars with a stable color per domain. Page-level actions moved into a Manage menu (Export & Import, Markdown, JSON, Restore defaults).
- **Status**: Completed (`BookmarksPage.tsx`).

### [ ] Task 11b: Real bookmark favicons
- **Problem**: Letter avatars are less recognizable than favicons.
- **Solution**: Fetch and cache favicons locally through a Rust command. Do not call a third-party favicon service from the UI, since that would leak the user's bookmark domains.
- **Status**: Planned (needs the Rust side).

### [ ] Task 12: Runtime status in the title bar / Home
- **Problem**: Home no longer shows live runtime status because probing needs Rust (CORS blocks webview fetch to localhost).
- **Solution**: Add a Rust command that probes the known ports, then show an online/offline dot on the Runtimes sidebar item and on Home.
- **Status**: Blocked on the Rust probe command (see Task 9).

### [x] Task 16: Startup resilience (crash screen and hung startup)
- **Problem**: In a frameless window, a startup hang or a React crash could leave no way to close or move the window.
- **Solution**: (1) the loading screen and boot splash start below the title bar, so the window controls stay usable; (2) `ErrorBoundary` (wraps `App` in `main.tsx`) shows a recovery screen with its own title bar and window controls, the error message, *Try again*, *Reload app*, *Copy details* and *Close app*; (3) a watchdog in `index.html` adds *Reload* and *Close* buttons to the splash if the app hasn't replaced it after 10 s (covers a bundle that fails to load), and the splash has a drag strip from the start; (4) the loading screen has a visible **Skip (Space)** button in addition to Space / Enter / Esc / click.
- **Status**: Completed (see `docs/features/startup-and-window.md`). Not covered: errors thrown outside React rendering (event handlers, async code) are only logged to the console.

### [x] Task 17: Backups and exported keys
- **Problem**: "Export backup" writes API keys to a JSON file in plaintext (needed because the encryption key is per device, so an encrypted blob would be useless elsewhere). Anyone with the file has the keys.
- **Solution options**: exclude keys from backups by default with an opt-in checkbox, or encrypt the backup with a user-chosen passphrase (Argon2 + AES-GCM) so it can be restored on another machine. Add a clear warning in the export UI either way.
- **Done so far**: the first option. Keys are left out of the workspace backup unless the user ticks "Include my API keys", which shows a plain-text warning (2026-10-06).
- **Done (2026-10-07)**: the passphrase-protected backup (Argon2id + AES-256-GCM in Rust, passphrase entry with confirmation and an eye toggle, restore asks for the passphrase, no recovery warning). Including keys switches the protection on; switching it off shows the plain-text warning. See [features/settings-and-backup.md](features/settings-and-backup.md).
- **Status**: Completed. Not yet checked in the real window (Task 19).

### [ ] Task 18: Tests that drive the real desktop app
- **Problem**: Frontend tests mock the Rust backend, and Rust tests don't touch the UI. Nothing covers the real IPC boundary (command names, argument shapes, permissions) end to end.
- **Solution**: add a small WebDriver (`tauri-driver`) or Playwright-against-`tauri dev` smoke suite: launch the app, scan ports against a local listener, add a key, restart, confirm it persists encrypted.
- **Status**: Planned.

### [ ] Task 19: Check in the real desktop window what tests cannot
- **Problem**: jsdom tests cannot show how the Tauri webview behaves. Found during Task 9 and still unchecked: (1) file downloads via a blob link (bookmark export, workspace backup) and the file picker; if downloads fail or are silent, switch to the Tauri dialog + fs plugins (needs Rust capabilities); (2) the remaining `window.confirm` calls (delete a bookmark, Restore defaults on the Bookmarks page); (3) Quick Query links for Perplexity and ChatGPT still prefilling the prompt; (4) the preset model IDs and endpoints in `src/data/providers.ts` (only Gemini, Groq and DeepSeek were re-checked).
- **Solution**: one manual pass with `pnpm tauri dev`, ticking each item off here; fix what fails. Part of this can become Task 18 smoke tests.
- **Status**: Planned.

### [ ] Task 20: Small gaps found in the audit
- Custom tools cannot be edited, and the Add Tool form has no Quick Query template field.
- The Add Tool and Add Bookmark forms have labels that are not linked to their inputs (screen readers do not announce the field names).
- Browser bookmark folders are not turned into categories on import.
- **Status**: Planned.

### [~] Task 21: Remote catalog data (pull, cache, refresh)
- **Problem**: Free-tier facts (quotas, credits, which providers are still free) change weekly. Shipping them inside the app means they are stale until the next release. Example: GitHub Models was retired on 2026-07-30 and the app still listed it as free until 2026-10-06.
- **Solution (design, not urgent)**: keep the built-in data in `src/data/` as the offline fallback, and add an optional remote feed: versioned JSON files in a public GitHub repo (providers, tools, bookmarks), fetched through a Rust command (the webview hits CORS) with a size limit and a schema check, cached on disk with a fetched-at time. The UI shows "Data from <date>", has a Refresh button, and refreshes on its own at most once a day. Rules: validate every field (reuse `safeHttpUrl`, enum checks); never let a failed or invalid pull replace good data; show the real error; the feed is opt-out and its URL is visible in Settings.
- **Groundwork**: `src/data/providers.ts` is already the single source for the matrix, exporter and vault, so it is the first thing to load from a feed. Keep `reviewed` per row and add a `status` (`active` / `retired`) so a retired provider can be shown as such instead of removed.
- **Done (provider data)**: Rust `fetch_feed`, validation, merge, cache, hourly stale check, Refresh button, Settings panel, `status: retired`, `feed/providers.json` + `pnpm feed:build`. See [features/remote-data-feed.md](features/remote-data-feed.md).
- **Still open**: publish the feed in a public repo and set `DEFAULT_FEED_URL` (empty now); the same pattern for tools and bookmarks; check a real download in the packaged window (Task 19).
- **Status**: Provider data done; rest planned.

### [ ] Task 22: New sections suggested by the gap-finder
Everything useful from the four LLM replies is kept in [research/gap-finder-findings.md](research/gap-finder-findings.md): section ideas with entries, proposed categories, offline-data ideas and free-tier change leads. The raw reply files are no longer needed. The prompt itself listed most of the ideas, so treat that page as a to-do list of areas, not as verified data.
- **Cheapest first step**: most sections are bookmark categories, not pages. Add the categories (compute, datasets, benchmarks, MCP, prompts and rules, learning, backend tiers, voice) and fill them with prompt B runs.
- **Needs a decision**: whether a separate "free dev services" page (hosting, DB, auth, CI, vector DB) with quota fields is worth building, given Task 21 (these quotas change often).
- **Check first** (provider data the app shows today): Groq retiring `llama-3.3-70b-versatile`, Cerebras and OpenRouter free limits, Hugging Face Inference credit, Cloudflare Workers AI model changes. See section 4 of the findings page.
- **Not done**: prompts A, B and C have not been run yet.
- **Status**: Planned.
