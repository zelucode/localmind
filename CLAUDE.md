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
- `pnpm lint` — `tsc --noEmit` (clean; keep it that way, Vite itself doesn't type-check).
- `pnpm test` — Vitest + React Testing Library (jsdom). `pnpm test:watch` for watch mode. Tests live next to the code as `*.test.ts(x)`; shared setup is `src/test/setup.ts`.
- `cd src-tauri && cargo test` — Rust unit tests. The drive holding the repo can run out of space (a debug build of `src-tauri/target` is ~5 GB); use `CARGO_TARGET_DIR=<other drive>/cargo-targets/localmind cargo test` if it does.

Windows/PowerShell 5.1 gotcha: `Set-Content -Encoding utf8` writes a BOM, which breaks `src-tauri/tauri.conf.json` parsing. Edit JSON configs with the editor tools, not `Set-Content`.

## Architecture

- **No backend server; Rust commands instead.** The original AI Studio Express server is gone. `src-tauri/src/` has three command modules, registered in `lib.rs`: `probe.rs` (`probe_ports`: TCP probe of localhost ports, because webview `fetch` to `127.0.0.1` hits CORS), `keys.rs` (`verify_api_key`: calls each provider's list-models endpoint, key sent in a header) and `advisor.rs` (`ask_advisor`: Gemini with the user's own vault key). Each has unit tests with the network-free parts covered. The frontend reaches them only through `src/lib/backend.ts` (typed wrappers) over `src/lib/tauri.ts` (`callBackend`, `isTauri`, `openExternal`). Outside Tauri (`pnpm dev`) the wrappers throw `BackendUnavailableError`; components must show that message and never fake a result (no fake "online", no length-based "valid" keys).
- **External links** go through `openExternal` (opener plugin in Tauri, `window.open` in a browser), not bare `window.open`.
- **Navigation:** `ActiveView` (`src/types.ts`) = `home | tools | bookmarks | runtimes | configs | vault | settings`. `Sidebar` (labeled, grouped, collapsible; `SIDEBAR_WIDTH*` constants) and `Header` (fixed title bar: page title, search, contextual add button, theme toggle, Help menu, custom window controls from `WindowControls.tsx`) are fixed; only the content area in `App.tsx` scrolls. The window is frameless (`decorations: false`), so window permissions are listed explicitly in `capabilities/default.json`.
- **Pages:** `HomePage`, `ToolsPage` (filter rail, list/grid), `BookmarksPage` (rail, list/grid, show-more), `OmniRouteWidget` (Runtimes), and Configs/Vault, which reuse `IDEConfigExporterModal`, `RateLimitMatrixModal` and `ApiKeyVaultModal` with their `inline` prop (renders as a page instead of an overlay).
- **App-wide state lives in `src/App.tsx`**: view routing (`activeView`), theme, tools, favorites, API keys, bookmarks, modal open/close flags are `useState` there and passed down as props. Page-local state (filters, sort, view mode) lives in the page component, with view/sort remembered under `localmind_*` localStorage keys. Persistence is `localStorage` with `STORAGE_*_KEY` constants at the top of that file (tools, favorites, API keys, theme, accent, custom theme JSON, launch preferences).
- **Data model:** `src/types.ts` (`AITool`, `ToolCategory`, `StoredApiKey`, ...). Seed catalog in `src/data/defaultTools.ts` / `defaultBookmarks.ts`; user-added tools and favorites are merged over these from localStorage.
- **Theming:** `src/theme.ts` defines `ThemePreset`s that are applied as CSS variables (`--theme-card`, `--theme-border`, `--theme-text`, ...); components style via `var(--theme-*)` inline styles rather than fixed Tailwind colors. Custom themes/accent are user-editable JSON.
- **Components** in `src/components/` are mostly self-contained modals/pages driven by `isOpen`-style props from `App.tsx`. `src/lib/errorLog.ts` is the shared logger.
- `@` alias resolves to the repo root (not `src/`), in both `vite.config.ts` and `tsconfig.json`.

## Config notes

- `vite.config.ts` uses Tauri's required settings (fixed port 1420 with `strictPort`, `clearScreen: false`, ignores `src-tauri/**` in watch, honors `TAURI_DEV_HOST`).
- `README.md` describes product features and design principles (privacy-first key vault in `localStorage`, scope badges `web-only` / `local-agent` / `ide-plugin` / `local-runner` / `uniform-proxy` / `cloud-builder`); `docs/BACKLOG.md` tracks planned features and `docs/ARCHITECTURE.md` has deeper architecture notes.
