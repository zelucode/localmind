# Handoff: where we stopped (2026-10-05)

Read this first in a new session, then [BACKLOG.md](BACKLOG.md) and `git log --oneline -15`. Everything below was true at the end of the last session, with everything committed on `main` (last commit `0ef66c0`).

## What LocalMind is
A Tauri 2 desktop app (Rust + React 19 / Vite 6 / Tailwind 4) that catalogs free-tier AI tools, tracks local AI servers, and stores API keys. Started in Google AI Studio, then wrapped in Tauri. See [../CLAUDE.md](../CLAUDE.md) for commands and architecture, and [features/README.md](features/README.md) for one doc per feature.

## State right now
`pnpm test:all` is green: type check clean, **180 frontend tests (18 files)**, **31 Rust tests** (+1 opt-in that touches the real OS credential store). Nothing is half-done or uncommitted.

### Done in the last session
| Area | What changed |
|---|---|
| Startup | Splash and loading screen follow the saved theme, "Mind" colored in the wordmark, loading screen sits below the title bar, visible Skip button, crash screen (`ErrorBoundary`), 10 s boot watchdog |
| Window | Frameless; custom title bar with page title, search, contextual add button, theme toggle, Help menu, window controls; only the content area scrolls |
| Navigation | Labeled, grouped, collapsible sidebar with 7 pages: Home, AI Tools, Bookmarks, Runtimes, Configs & Limits, Key Vault, Settings |
| Pages | Home; AI Tools (filter rail, list/grid, sort); Bookmarks (category rail, list/grid, show-more, Manage menu); Config Exporter, Rate-Limit Matrix and Key Vault now render as pages via an `inline` prop |
| Rust | `probe_ports`, `verify_api_key` (7 providers), `ask_advisor`, `encrypt_secrets` / `decrypt_secrets` |
| Security | API keys encrypted at rest (AES-256-GCM, master key in the OS credential store), auto-migration of old plaintext keys, never a plaintext fallback inside Tauri |
| Honesty fixes | Removed the fake "OmniRoute online 3 ms" and the length-based "key valid" check |
| Bugs fixed | Custom-port field, Ctrl+K bookmark titles empty, coding agents had no Config button, two `<h1>` on Settings |
| Advisor | Built and tested but **hidden** by `FEATURES.advisor = false` (`src/config/features.ts`) |
| Docs | `docs/features/*`, ARCHITECTURE, README, CLAUDE.md all current |

## What to do next (suggested order)

1. **Task 9: audit the remaining features**, one page at a time: tag each as working / UI-only / broken, fix with tests, and write the result in the relevant feature doc. Not audited yet: Config Exporter output correctness, Rate-Limit Matrix data, bookmark Export/Import center (JSON/HTML/CSV), Export Markdown, Settings (theme editor, backup/restore, factory reset), AddTool and AddBookmark modals, Quick Query URL templates, Welcome screen copy. Several of these use `window.confirm`/`alert`, which should be checked inside the real Tauri webview.
2. **Decide Task 17** (backups contain API keys in plaintext). My recommendation: encrypt the backup with a user-chosen passphrase (Argon2 + AES-GCM) and warn clearly; alternative is leaving keys out by default.
3. **Decide Task 14** (Advisor): which providers (Gemini / Groq / OpenRouter / local Ollama), does the user pick the key, and whether to ship an offline fallback. Then flip the flag.
4. **Task 18**: a smoke suite against the *real* app (`tauri-driver` or Playwright against `tauri dev`). Today the IPC boundary (command names, argument shapes, permissions) is only covered by mocks, and none of the Tauri-only paths (credential store, window controls, opener plugin, crash screen, watchdog) have been run in the packaged app by a test.
5. Smaller items: Task 11b (real favicons, cached in Rust), Task 12 (runtime online/offline dot in the sidebar and on Home), Tasks 6/7/8 (Help menu Documentation, Report a Problem, Check for Updates), and the older planned tasks 3, 4 and 5 at the top of the backlog.

## Things only a person has checked or can check
- Nobody has launched the real desktop app against a **live API key** or a **running Ollama/OmniRoute**. Do that early in the next session (`pnpm tauri dev`): add a key, Test it, restart and confirm it persists; start Ollama and scan.
- Windows 11 edge-resize and snap behavior on the frameless window.
- macOS and Linux are not handled (no traffic-light inset, untested credential-store backends).

## Environment gotchas
- **The repo's drive (D:) is nearly full** (about 0.4 GB free at last check; `src-tauri/target` is about 5 GB). Run Rust builds and tests with `CARGO_TARGET_DIR=E:/cargo-targets/localmind` (about 10 GB free on E:). Do not delete `src-tauri/target` without asking; the user may have `pnpm tauri dev` running against it.
- The user usually has the dev server on **port 1420** already running. For browser checks, open `http://localhost:1420`; the Welcome dialog may need a click on "Get Started".
- PowerShell 5.1: never write JSON configs with `Set-Content -Encoding utf8` (adds a BOM and breaks `tauri.conf.json`). Use the editor tools.
- Tooling tip for AI sessions: very large shell heredocs containing many quotes sometimes break the Bash tool. Write the file with the editor tool (or save a script to the scratchpad and run it) instead.

## Working agreements with the user
- **Commit only when asked.** Never add a `Co-Authored-By` or other Claude line to commit messages.
- When something is unclear, **ask**; when it can't be decided now, **put it in `docs/BACKLOG.md`** instead of skipping it.
- **Never delete a feature that isn't ready.** Hide it behind `FEATURES.*` and keep its tests.
- **Never fake a result** in the UI (no "online" or "valid" unless it was actually checked).
- A frameless window must always be closable and movable, in every state (loading, crashed, hung).
- Every change gets tests (frontend and, for backend work, Rust), and feature docs under `docs/features/` stay in step with the code.
- Style through `var(--theme-*)` variables, never fixed colors. Match the surrounding code's comment density and naming.

## Quick commands
```bash
pnpm tauri dev          # run the desktop app
pnpm test:all           # lint + frontend tests + Rust tests
pnpm test               # frontend only
pnpm test:rust          # Rust only (set CARGO_TARGET_DIR if D: is low on space)
```
