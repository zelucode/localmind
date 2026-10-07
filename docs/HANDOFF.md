# Handoff: where we stopped (2026-10-06)

Read this first in a new session, then [BACKLOG.md](BACKLOG.md) and `git log --oneline -15`. Everything below was true at the end of the last session. The last code commit was `dc30f5b` ("Document the add/quick-query/copy audit and close Task 9"). This file and `docs/data-collection/` were left uncommitted on purpose (see "Not committed").

## What LocalMind is
A Tauri 2 desktop app (Rust + React 19 / Vite 6 / Tailwind 4) that catalogs free-tier AI tools, tracks local AI servers, and stores API keys. Started in Google AI Studio, then wrapped in Tauri. See [../CLAUDE.md](../CLAUDE.md) for commands and architecture, [ARCHITECTURE.md](ARCHITECTURE.md) for deeper notes, and [features/README.md](features/README.md) for one doc per feature.

## State right now
`pnpm lint` is clean and `pnpm test` passes: **400 frontend tests in 41 files**. Rust is unchanged since the last handoff: **31 tests** (+1 opt-in that touches the real OS credential store). `pnpm test:rust` was not run this session because no Rust code changed. Nothing is half-done.

**Task 9 (audit that every UI feature works) is finished.** Every feature on its list was walked, tagged, fixed with tests and written up:

| Feature | Doc | What mattered most |
|---|---|---|
| Config Exporter | [features/config-exporter.md](features/config-exporter.md) | broken cURL URLs, a Groq key leaking into other providers' configs, wrong Aider flags; keys now masked on screen with an eye toggle, Copy still copies the real key |
| Rate-Limit Matrix | [features/rate-limit-matrix.md](features/rate-limit-matrix.md) | wrong quota numbers, a false "verified" footer; "Key saved" badge, one page instead of inner tabs |
| Provider data | `src/data/providers.ts` | one source of truth for the matrix, the exporter presets and the vault list, with a `reviewed` month per provider |
| Bookmark export / import | [features/bookmark-export-import.md](features/bookmark-export-import.md) | merge created duplicates, browser imports overwrote data, unsafe links accepted; CSV import, inline confirms |
| Settings, backup, reset | [features/settings-and-backup.md](features/settings-and-backup.md) | backup omitted bookmarks, restore silently replaced saved keys and said "success" for any file, reset deleted keys without saying so, theme editor accepted invalid presets |
| Add Tool / Add Bookmark, Quick Query, wording, copy buttons | [features/add-tools-and-quick-query.md](features/add-tools-and-quick-query.md) | link validation, editing dropped data, Quick Query lost the prompt for AI Studio, untrue claims in the UI, one-click delete, copy buttons claiming success |

## What to do next (suggested order)

1. **Task 19: one manual pass in the real app** (`pnpm tauri dev`). Tests cannot show these, and nobody has run them in the packaged window:
   - Do file **downloads** work (bookmark export, workspace backup, CSV)? They use a blob link. If they fail or do nothing, switch to the Tauri dialog + fs plugins (needs Rust capabilities).
   - Does the **file picker** work for bookmark import and backup restore?
   - The remaining `window.confirm` calls (delete a bookmark, Restore defaults on the Bookmarks page).
   - Do the Perplexity and ChatGPT **Quick Query** links still prefill the prompt?
   - Also from the older list: add a real key, Test it, restart and confirm it persists encrypted; start Ollama and scan. Nobody has done these against live services.
2. **Merge the collected data** in `docs/data-collection/` (untracked). `PROMPTS.md` explains the workflow: LLM replies saved as `h-prompt-*.json`, to be validated and merged into the catalog (`src/data/defaultTools.ts`, `src/data/defaultBookmarks.ts`). Things to check when doing it: field names and enums must match `src/types.ts`; replies carry `sourceUrl` and `verifiedOn`, which the types do not have yet; skip duplicates (the `existing-*-domains.txt` files, and `normalizeUrl` / `safeHttpUrl` in `src/lib/bookmarkTransfer.ts` do the same matching the app uses); only http(s) links; unknown values are `null` and must not become claims. Keep the "never fake a result" rule: do not copy unverified free-tier claims into the catalog.
3. **Decide Task 17** (backups and API keys). Done so far: keys are left out of the workspace backup unless the user ticks "Include my API keys" (plain-text warning). Open question: add a passphrase-encrypted backup (Argon2 + AES-GCM) so keys can travel safely?
4. **Decide Task 14** (Advisor): which providers (Gemini / Groq / OpenRouter / local Ollama), whether the user picks the key, whether to ship an offline fallback. Then flip `FEATURES.advisor` in `src/config/features.ts`. It is built, tested and hidden.
5. **Task 18**: a smoke suite against the real app (`tauri-driver` or Playwright against `tauri dev`). The IPC boundary and every Tauri-only path (credential store, window controls, opener plugin, crash screen, watchdog, downloads) are covered only by mocks today.
6. **Task 20** (small gaps from the audit): custom tools cannot be edited and have no Quick Query template field; the Add Tool / Add Bookmark labels are not linked to their inputs; browser bookmark folders are not turned into categories on import.
7. **Provider data check** (part of Task 19): only Gemini, Groq and DeepSeek were re-checked on 2026-10. Model IDs and endpoints for the rest are unverified; suspects are Groq `qwen-2.5-coder-32b`, OpenRouter `stepfun/step-3.5-flash:free`, the GitHub Models endpoint, and Mistral's separate Codestral endpoint. Edit them only in `src/data/providers.ts` and set `reviewed` only after really checking.
8. Smaller items: Task 11b (real favicons, cached in Rust), Task 12 (runtime online/offline dot), Tasks 6/7/8 (Help menu Documentation, Report a Problem, Check for Updates), Task 15 (verify keys for more providers), Tasks 3 and 4. **Task 5** (cURL / Python / TypeScript snippets with a live key) already looks covered by the Config Exporter's Python, TypeScript and cURL targets; confirm and close it.

## Not committed
- `docs/HANDOFF.md` (this file) and the untracked `docs/data-collection/` are the user's, left out of every commit on purpose. Commit them only when asked.
- `src-tauri/Cargo.toml` shows as modified only because of a line-ending difference; there is no content change.

## Things only a person can check
- Everything in step 1 above.
- Windows 11 edge-resize and snap behavior on the frameless window.
- macOS and Linux are not handled (no traffic-light inset, untested credential-store backends, and blob-link downloads may not work in their webviews).

## Where the new logic lives (so you do not rewrite it)
- `src/data/providers.ts`: provider facts. The matrix, exporter and vault list are derived from it.
- `src/lib/configSnippet.ts`: pure config generation for the exporter (8 targets).
- `src/lib/bookmarkTransfer.ts`: bookmark export formats, JSON / browser-HTML / CSV parsing, `applyImport` / `previewImport`, `safeHttpUrl`, `normalizeUrl` (ignores case, `www.`, trailing slash, `#fragment`).
- `src/lib/backup.ts`: workspace backup build / parse / validate (version 2; version 1 files still import).
- `src/lib/url.ts` (`toWebUrl`): the only way forms should turn typed text into a link.
- `src/lib/quickQuery.ts`: what Launch does for a tool and prompt (open, prefill, or copy and open).
- `src/lib/files.ts` (`copyText`, `downloadTextFile`) and `src/lib/useCopy.tsx` (`useCopyFeedback`, `CopyStatusIcon`): use these for any copy or download; never call `navigator.clipboard` and show success blindly.
- `src/theme.ts`: `validateThemePresets`, `themePresetProblem`; `parseCustomThemesJson` drops invalid presets so saved garbage never reaches the theme engine.
- `src/components/ConfirmDeleteButton.tsx`: two-step delete for icons. Destructive actions use inline confirmations, not `window.confirm`.
- `src/copy.test.ts` reads the component sources and fails if a banned claim returns ("270+", "frontier AI models", "v2.5", "zero-cost", "100% free forever", "100% Private", "browser sandbox", "verified active", "No Account Required"). If it fails on new copy, fix the copy.

## Environment gotchas
- The user usually has the dev server on **port 1420** already running. For browser checks, open `http://localhost:1420`; the Welcome dialog may need a click on "Get Started".
- PowerShell 5.1: never write JSON configs with `Set-Content -Encoding utf8` (adds a BOM and breaks `tauri.conf.json`). Use the editor tools.
- **Bash heredocs with many quotes break the tool.** Write files with the editor tool, or save a script to the scratchpad and run it. This happened several times last session.
- `tsconfig` is not strict, so TypeScript does not narrow `{ ok: true } | { ok: false }` results. Narrow with `'error' in result` (the pattern used across `src/lib/`).
- Do not use `git stash` or `git add docs` / `git add .`: the user's uncommitted files live in the same folders. Add explicit paths.
- Git prints "LF will be replaced by CRLF" warnings on Windows; they are harmless.
- Some page tests render hundreds of rows and one test uses real timers. `vitest.config.ts` has `testTimeout: 15000` and the LoadingScreen test waits up to 8 s; if a test times out only in the full run, rerun it alone before assuming a bug.
- The repo drive can run out of space (a debug build of `src-tauri/target` is about 5 GB). If so, use `CARGO_TARGET_DIR=<other drive>/cargo-targets/localmind`. Do not delete `src-tauri/target` without asking.

## Working agreements with the user
- **Commit only when asked**, and make separate commits for separate changes. Never add a `Co-Authored-By` or other Claude line to commit messages.
- When something is unclear, **ask**; when it cannot be decided now, **put it in `docs/BACKLOG.md`** instead of skipping it.
- **Never delete a feature that is not ready.** Hide it behind `FEATURES.*` and keep its tests.
- **Never fake a result** in the UI: no "online", "valid", "copied", "restored" or "verified" unless it really happened. Do not state marketing claims as facts.
- Treat anything secret like a password: masked by default with an eye toggle, never written to a file or shown without the user asking. Copy still copies the real value.
- A frameless window must always be closable and movable, in every state (loading, crashed, hung).
- Every change gets tests (frontend and, for backend work, Rust), and feature docs under `docs/features/` stay in step with the code.
- Style through `var(--theme-*)` variables, never fixed colors. Match the surrounding code's comment density and naming.
- When asked to explain a feature, say what it does for the user and whether it is actually useful, not just how it works.

## Quick commands
```bash
pnpm tauri dev          # run the desktop app
pnpm test:all           # lint + frontend tests + Rust tests
pnpm test               # frontend only (400 tests)
pnpm lint               # tsc --noEmit
pnpm test:rust          # Rust only (set CARGO_TARGET_DIR if the drive is low on space)
```
