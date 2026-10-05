# Architecture

## Overview

LocalMind is a Tauri 2 app: a Rust shell hosting a webview that renders a React 19 SPA. There is no backend server. All user data lives in the webview's `localStorage`.

```
┌──────────────── Tauri window (1280×800, min 900×600) ────────────────┐
│  React SPA (src/)  ── localStorage (tools, keys, bookmarks, theme)   │
│        │ invoke() / opener plugin                                    │
│  Rust shell (src-tauri/src/lib.rs)                                   │
└──────────────────────────────────────────────────────────────────────┘
```

## Frontend

- **Entry:** `src/main.tsx` mounts `App.tsx`.
- **State:** `App.tsx` (~1100 lines) holds everything as `useState` and passes props down: active view (`dashboard` / `bookmarks` / `settings`), theme, tools, favorites, API keys, bookmarks, modal open flags and filters. There is no router or state library.
- **Components** (`src/components/`) are mostly self-contained modals and pages driven by `isOpen`-style props.
- **Alias:** `@` resolves to the repo root (not `src/`) in `vite.config.ts` and `tsconfig.json`.

### Data model (`src/types.ts`)
- `AITool`: catalog entry with `ToolCategory`, `CapabilityScope`, and `FreeTierDetails` (summary, limits, reset cycle, web search, credit card, custom key).
- `ToolBookmark` / `BookmarkCategory`: the bookmarks library.
- `StoredApiKey`: vault entries.
- `LocalServiceStatus`: result of daemon probing.

Seed data: `src/data/defaultTools.ts`, `src/data/defaultBookmarks.ts`. User-added tools and favorites are merged over these on load.

### Capability scopes
`web-only`, `local-agent`, `ide-plugin`, `local-runner`, `uniform-proxy`, `cloud-builder`. Defined in `types.ts` and explained in-app by `ScopeExplainer.tsx`.

### Persistence
`localStorage` keys (constants at the top of `App.tsx`):

| Key | Content |
|---|---|
| `ai_nexus_custom_tools_v1` | User-added tools |
| `ai_nexus_api_keys_v1` | Vault keys |
| `ai_nexus_favorites_v1` | Favorite tool IDs |
| `ai_nexus_bookmarks_v3` | Bookmarks |
| `ai_nexus_theme_id_v1` | Active theme (default `pastel-dusk`) |
| `ai_nexus_custom_accent_v1` | Custom accent color |
| `ai_nexus_custom_themes_json_v1` | Custom theme JSON |
| `ai_nexus_default_launch_search_v1` | Launch preference |
| `ai_nexus_show_scope_explainer_v1`, `ai_nexus_show_startup_v1`, `ai_nexus_show_loading_v1` | UI preferences |

The `ai_nexus_` prefix predates the LocalMind rename; keep it to avoid orphaning existing data.

Keys are stored unencrypted in `localStorage`. A Rust-side secure store (OS keychain) would be a future hardening step.

### Theming
`src/theme.ts` defines `ThemePreset`s (mode, primary, canvas, card, border, text, plus optional raised/strong-border/secondary/muted/foreground tokens). The active preset is written to CSS variables (`--theme-primary`, `--theme-bg`, `--theme-card`, `--theme-raised`, `--theme-border`, `--theme-text`, ...) declared in `src/index.css`. Components use `var(--theme-*)` in inline styles instead of fixed Tailwind colors. `html.light-mode` toggles `color-scheme`.

## Rust shell

`src-tauri/src/lib.rs` is the Tauri scaffold: the opener plugin and a sample `greet` command. Capabilities (`src-tauri/capabilities/default.json`) grant `core:default` and `opener:default` to the `main` window. CSP is currently `null`.

## Endpoints the frontend still expects

These came from the removed Express server and currently hit their fallback/catch paths:

| Endpoint | Caller | Purpose |
|---|---|---|
| `POST /api/ai/advisor` | `AIAdvisorModal` | Gemini-backed stack recommendation |
| `POST /api/verify-gemini-key` | `ApiKeyVaultModal` | Validate a Gemini key and measure latency |
| `GET /api/local-daemons/check` | `OmniRouteWidget` | Probe OmniRoute 8000, Ollama 11434, LM Studio 1234, Jan 1337 |
| `GET /api/local-daemons/probe?port=` | `OmniRouteWidget` | Probe a custom port |

Recommended replacement: Rust commands called via `invoke`, using an HTTP client such as `reqwest`. This avoids webview CORS limits on `127.0.0.1` and keeps keys out of frontend network code.

## Build and tooling

- Vite uses Tauri's required settings: fixed port 1420 with `strictPort`, `clearScreen: false`, ignores `src-tauri/**` in watch, honors `TAURI_DEV_HOST`.
- pnpm blocks dependency build scripts by default; `esbuild` is allowed via `allowBuilds` in `pnpm-workspace.yaml`.
- `pnpm lint` (`tsc --noEmit`) reports pre-existing type errors (e.g. `GlobalSearchModal`, `OmniRouteWidget`, `ToolCard` with the `'code-agent'` category). Vite does not type-check, so they don't block running.
- Windows/PowerShell 5.1: `Set-Content -Encoding utf8` writes a BOM that breaks `tauri.conf.json`. Edit JSON configs with an editor.
