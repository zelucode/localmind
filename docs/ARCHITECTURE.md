# Architecture

## Overview

LocalMind is a Tauri 2 app: a Rust shell hosting a webview that renders a React 19 SPA. There is no backend server. User data lives in the webview's `localStorage` (API keys are encrypted before they get there), and a small set of Rust commands does the things a webview can't or shouldn't: probing localhost ports, verifying keys with providers, encrypting secrets, and downloading the optional live provider-data feed.

```
┌──────────────── Tauri window (1280×800, min 900×600) ────────────────┐
│  React SPA (src/)  ── localStorage (tools, keys*, bookmarks, theme)  │
│        │ invoke() via src/lib/backend.ts / opener plugin             │
│  Rust (src-tauri/src): probe, keys, secrets, advisor                 │
│        └─ OS credential store (master key for *encrypted keys)       │
└──────────────────────────────────────────────────────────────────────┘
```

## Frontend

- **Entry:** `src/main.tsx` mounts `App.tsx`.
- **State:** `App.tsx` holds app-wide state as `useState` and passes props down: active view, theme, tools, favorites, API keys, bookmarks and modal flags. Page-local state (filters, sort, list/grid) lives in the page component. There is no router or state library.
- **Navigation:** `ActiveView` is `home | tools | bookmarks | runtimes | configs | vault | settings`. A fixed title bar (`Header.tsx`) and a labeled, collapsible `Sidebar.tsx` frame a content area that is the only scrolling region. See [features/navigation-and-layout.md](features/navigation-and-layout.md).
- **Backend access:** components never call `invoke` directly. They use `src/lib/backend.ts` (typed wrappers) over `src/lib/tauri.ts` (`callBackend`, `isTauri`, `openExternal`). Outside Tauri the wrappers throw `BackendUnavailableError`.
- **Feature flags:** `src/config/features.ts` hides unfinished features (currently the Advisor) without deleting them.
- **Components** (`src/components/`) are mostly self-contained modals and pages driven by `isOpen`-style props.
- **Alias:** `@` resolves to the repo root (not `src/`) in `vite.config.ts` and `tsconfig.json`.

### Data model (`src/types.ts`)
- `AITool`: catalog entry with `ToolCategory`, `CapabilityScope`, and `FreeTierDetails` (summary, limits, reset cycle, web search, credit card, custom key).
- `ToolBookmark` / `BookmarkCategory`: the bookmarks library.
- `StoredApiKey`: vault entries (with in-memory-only `blob` / `undecryptable` fields used by `lib/secureKeys.ts`).
- `LocalServiceStatus`: result of daemon probing.

Seed data: `src/data/defaultTools.ts`, `src/data/defaultBookmarks.ts`. User-added tools and favorites are merged over these on load.

### Capability scopes
`web-only`, `local-agent`, `ide-plugin`, `local-runner`, `uniform-proxy`, `cloud-builder`. Defined in `types.ts` and explained in-app by `ScopeExplainer.tsx`.

### Persistence
`localStorage` keys (constants at the top of `App.tsx`):

| Key | Content |
|---|---|
| `ai_nexus_custom_tools_v1` | User-added tools |
| `ai_nexus_api_keys_v1` | Vault keys, each stored as an `enc:v1:` token (encrypted) |
| `ai_nexus_favorites_v1` | Favorite tool IDs |
| `ai_nexus_bookmarks_v3` | Bookmarks |
| `ai_nexus_theme_id_v1` | Active theme (default `pastel-dusk`) |
| `ai_nexus_custom_accent_v1` | Custom accent color |
| `ai_nexus_custom_themes_json_v1` | Custom theme JSON |
| `ai_nexus_default_launch_search_v1` | Launch preference |
| `ai_nexus_show_scope_explainer_v1`, `ai_nexus_show_startup_v1`, `ai_nexus_show_loading_v1` | UI preferences |
| `localmind_sidebar_collapsed_v1` | Sidebar collapsed |
| `localmind_tools_view_v1`, `localmind_tools_sort_v1` | AI Tools list/grid and sort |
| `localmind_bookmarks_view_v1`, `localmind_bookmarks_sort_v1` | Bookmarks list/grid and sort |
| `localmind_boot_theme_v1` | Colors for the boot splash, written by `applyThemeToDocument` |

The `ai_nexus_` prefix predates the LocalMind rename; keep it to avoid orphaning existing data.

API keys are encrypted at rest: AES-256-GCM in Rust, master key in the OS credential store. Plaintext exists only in memory. See [features/key-vault.md](features/key-vault.md).

### Theming
`src/theme.ts` defines `ThemePreset`s (mode, primary, canvas, card, border, text, plus optional raised/strong-border/secondary/muted/foreground tokens). The active preset is written to CSS variables (`--theme-primary`, `--theme-bg`, `--theme-card`, `--theme-raised`, `--theme-border`, `--theme-text`, ...) declared in `src/index.css`. Components use `var(--theme-*)` in inline styles instead of fixed Tailwind colors. `html.light-mode` toggles `color-scheme`.

## Rust

`src-tauri/src/lib.rs` registers the opener plugin and five commands from four modules. Each module keeps pure logic separate from I/O and has unit tests.

| Command | Module | Purpose |
|---|---|---|
| `probe_ports` | `probe.rs` | TCP-connect to `127.0.0.1:<port>` for up to 32 ports (the webview can't do this because of CORS) |
| `verify_api_key` | `keys.rs` | Ask a provider whether a key is accepted (key sent in a header over HTTPS) |
| `log_event`, `log_info`, `preview_diagnostics`, `save_diagnostics` | `applog.rs` | One `app.log` shared by Rust and the frontend (rotated, keys redacted) and the Report a Problem diagnostics file |
| `encrypt_backup`, `decrypt_backup` | `backupcrypto.rs` | Passphrase-protected backup files (Argon2id + AES-256-GCM) |
| `fetch_feed` | `feed.rs` | HTTPS-only, size-limited download of the remote provider-data JSON; the frontend validates, merges and caches it (`src/lib/feed.ts`) |
| `encrypt_secrets`, `decrypt_secrets` | `secrets.rs` | AES-256-GCM with the master key held in the OS credential store |
| `ask_advisor` | `advisor.rs` | Gemini-backed "free tier" advice using the user's own key (feature currently hidden) |

Capabilities (`src-tauri/capabilities/default.json`) grant `core:default`, `opener:default` and the window permissions the custom title bar needs (minimize, maximize, close, drag). The window is frameless (`decorations: false`). CSP is currently `null`.

HTTP is done with `reqwest` (rustls). Dependencies for crypto are `aes-gcm`, `base64` and `keyring`.

## Build and tooling

- Vite uses Tauri's required settings: fixed port 1420 with `strictPort`, `clearScreen: false`, ignores `src-tauri/**` in watch, honors `TAURI_DEV_HOST`.
- pnpm blocks dependency build scripts by default; `esbuild` is allowed via `allowBuilds` in `pnpm-workspace.yaml`.
- `pnpm lint` (`tsc --noEmit`) is clean. Vite itself does not type-check, so run it before committing.
- `pnpm test:all` runs the type check, the Vitest suite and the Rust tests. See [features/testing.md](features/testing.md).
- A Rust debug build is several GB; if the repo's drive is short on space, set `CARGO_TARGET_DIR` to another drive.
- Windows/PowerShell 5.1: `Set-Content -Encoding utf8` writes a BOM that breaks `tauri.conf.json`. Edit JSON configs with an editor.
