# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Git rules

- Do NOT add a `Co-Authored-By` line (or any other Claude attribution) to git commit messages.

## What this is

LocalMind: a Tauri 2 desktop app (Rust shell + React 19 / Vite 6 / Tailwind 4 frontend) that catalogs free-tier AI tools, tracks local AI daemons (Ollama, OmniRoute, ...), and stores API keys. The frontend was generated in Google AI Studio and then wrapped in Tauri; the repo root is the Tauri project (frontend at `src/`, Rust at `src-tauri/`).

## Commands

Package manager is **pnpm** (v12). pnpm blocks dependency build scripts by default; `esbuild` is allowed via `allowBuilds` in `pnpm-workspace.yaml`.

- `pnpm tauri dev` — run the desktop app (starts Vite on fixed port 1420, then compiles/launches Rust; first Rust build takes minutes)
- `pnpm dev` — Vite only, in a browser (no Tauri APIs; `/api/*` calls fail)
- `pnpm tauri build` — production bundle (`pnpm build` → `dist/`, referenced by `frontendDist`)
- `pnpm lint` — `tsc --noEmit`. Currently reports pre-existing type errors (e.g. `GlobalSearchModal`, `OmniRouteWidget`, `ToolCard` `'code-agent'` category); Vite doesn't type-check so they don't block running.

There is no test suite.

Windows/PowerShell 5.1 gotcha: `Set-Content -Encoding utf8` writes a BOM, which breaks `src-tauri/tauri.conf.json` parsing. Edit JSON configs with the editor tools, not `Set-Content`.

## Architecture

- **No backend server.** The original AI Studio app used an Express `server.ts`; it was removed. The frontend still calls `/api/ai/advisor` (AIAdvisorModal), `/api/verify-gemini-key` (ApiKeyVaultModal) and `/api/local-daemons/{check,probe}` (OmniRouteWidget). These endpoints do not exist under Tauri: the first two need to be reimplemented (Rust commands via `invoke`, or direct calls to Gemini), and the daemon-probe calls currently just hit their catch/fallback paths. Local port probing is best done in Rust (webview `fetch` to `http://127.0.0.1:*` is subject to CORS).
- **Rust side** (`src-tauri/src/lib.rs`) is still the scaffold (`greet` command + opener plugin). Capabilities live in `src-tauri/capabilities/`.
- **State lives entirely in `src/App.tsx`** (~1100 lines): view routing (`activeView`), theme, tools, favorites, API keys, modal open/close flags, and filters are `useState` there and passed down as props. Persistence is `localStorage` with `STORAGE_*_KEY` constants at the top of that file (tools, favorites, API keys, theme, accent, custom theme JSON, launch preferences).
- **Data model:** `src/types.ts` (`AITool`, `ToolCategory`, `StoredApiKey`, ...). Seed catalog in `src/data/defaultTools.ts` / `defaultBookmarks.ts`; user-added tools and favorites are merged over these from localStorage.
- **Theming:** `src/theme.ts` defines `ThemePreset`s that are applied as CSS variables (`--theme-card`, `--theme-border`, `--theme-text`, ...); components style via `var(--theme-*)` inline styles rather than fixed Tailwind colors. Custom themes/accent are user-editable JSON.
- **Components** in `src/components/` are mostly self-contained modals/pages driven by `isOpen`-style props from `App.tsx`. `src/lib/errorLog.ts` is the shared logger.
- `@` alias resolves to the repo root (not `src/`), in both `vite.config.ts` and `tsconfig.json`.

## Config notes

- `vite.config.ts` uses Tauri's required settings (fixed port 1420 with `strictPort`, `clearScreen: false`, ignores `src-tauri/**` in watch, honors `TAURI_DEV_HOST`).
- `README.md` describes product features and design principles (privacy-first key vault in `localStorage`, scope badges `web-only` / `local-agent` / `ide-plugin` / `local-runner` / `uniform-proxy` / `cloud-builder`); `docs/BACKLOG.md` tracks planned features and `docs/ARCHITECTURE.md` has deeper architecture notes.
