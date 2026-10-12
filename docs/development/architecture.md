# Architecture

LocalMind is a Tauri 2 app: a Rust shell hosting a webview that renders a React 19 single-page app. There is no backend server. User data lives in the webview's `localStorage` (API keys are encrypted before they get there), and a small set of Rust commands does the things a webview cannot or should not do: probing local ports, verifying keys with providers, encrypting secrets, running curated installs, and downloading the optional provider-data feed.

```
┌──────────────── Tauri window (1280x800, min 900x600) ─────────────────┐
│  React app (src/)  ── localStorage (tools, keys*, bookmarks, theme)   │
│        │ invoke() through src/lib/backend.ts / the opener plugin      │
│  Rust (src-tauri/src): probe, keys, secrets, backup, feed, setup, log │
│        └─ OS credential store (master key for *encrypted keys)        │
└───────────────────────────────────────────────────────────────────────┘
```

## Frontend

- **Entry:** `src/main.tsx` mounts `App.tsx` inside `ErrorBoundary` and `ProviderDataProvider`.
- **State:** `App.tsx` holds app-wide state as `useState` and passes props down: active view, theme, tools, favorites, API keys, bookmarks and modal flags. Page-local state (filters, sort, list or grid) lives in the page component. There is no router and no state library.
- **Navigation:** `ActiveView` is `home | tools | bookmarks | runtimes | configs | setup | vault | settings`. A fixed title bar (`Header.tsx`) and a labeled, collapsible `Sidebar.tsx` frame a content area, which is the only scrolling region. The sidebar groups pages as Discover, Developer and Secure; the number keys 1 to 8 follow its order.
- **Backend access:** components never call `invoke` directly. They use `src/lib/backend.ts` (typed wrappers) over `src/lib/tauri.ts` (`callBackend`, `isTauri`, `openExternal`). Outside Tauri the wrappers throw `BackendUnavailableError`.
- **Feature flags:** `src/config/features.ts` hides unfinished features without deleting them. `FEATURES.advisor` is `false`.
- **Components:** `src/components/` holds pages and dialogs. The Configs, Limits and Key Vault pages reuse `IDEConfigExporterModal`, `RateLimitMatrixModal` and `ApiKeyVaultModal` with their `inline` prop, which renders them as page sections instead of overlays.
- **Alias:** `@` resolves to the repository root (not `src/`) in `vite.config.ts` and `tsconfig.json`.

### Layout model

The shell is `h-screen overflow-hidden`. `Header.tsx` is a fixed 44 px bar, the sidebar starts below it, and the content `div` in `App.tsx` is the scroll container, which keeps the scrollbar below the title bar. The window is frameless (`decorations: false`), so `WindowControls.tsx` draws the minimize, maximize and close buttons, and the permissions they need are listed explicitly in `src-tauri/capabilities/default.json`. The sidebar and the title bar's brand column share the `SIDEBAR_WIDTH` constants so their edges line up.

### Startup

1. A static boot splash in `index.html` shows the mark and wordmark in the user's last theme. `applyThemeToDocument` saves the active colors to `localmind_boot_theme_v1`, and an inline script reads them before first paint, so a light theme never flashes dark.
2. React mounts and `LoadingScreen.tsx` takes over at the same size and position. It runs about 1.2 seconds and can be skipped.
3. The Welcome dialog opens afterwards if enabled.

A frameless window must never be impossible to close, so three layers protect it. An inline watchdog script in `index.html` checks after 10 seconds whether the splash is still showing, and adds Reload and Close buttons if so. `ErrorBoundary.tsx` shows a recovery screen with its own title bar and window controls if rendering throws. The splash and loading screen both start below the title bar, so its controls stay usable.

### Data model (`src/types.ts`)

- `AITool`: a catalog entry with `ToolCategory`, `CapabilityScope` and `FreeTierDetails` (summary, limits, reset cycle, web search, credit card, custom key).
- `ToolBookmark` and `BookmarkCategory`: the bookmark library.
- `StoredApiKey`: vault entries. `blob` and `undecryptable` are in-memory-only fields used by `lib/secureKeys.ts`.
- `LocalServiceStatus`: the result of probing a daemon.

Seed data is in `src/data/defaultTools.ts` and `src/data/defaultBookmarks.ts`. Tools you add and favorites are merged over these on load.

**Capability scopes:** `web-only`, `local-agent`, `ide-plugin`, `local-runner`, `uniform-proxy`, `cloud-builder`. They are defined in `types.ts` and explained in the app by `ScopeExplainer.tsx`.

### Persistence

`localStorage`, with key constants at the top of `App.tsx`:

| Key | Content |
|---|---|
| `ai_nexus_custom_tools_v1` | Tools the user added |
| `ai_nexus_api_keys_v1` | Vault keys, each an `enc:v1:` token (encrypted) |
| `ai_nexus_favorites_v1` | Favorite tool IDs |
| `ai_nexus_bookmarks_v3` | Bookmarks |
| `ai_nexus_theme_id_v1` | Active theme (default `pastel-dusk`) |
| `ai_nexus_custom_accent_v1` | Custom accent color |
| `ai_nexus_custom_themes_json_v1` | Custom theme JSON |
| `ai_nexus_default_launch_search_v1` | Launch preference |
| `ai_nexus_show_scope_explainer_v1`, `ai_nexus_show_startup_v1`, `ai_nexus_show_loading_v1` | Interface preferences |
| `localmind_sidebar_collapsed_v1` | Sidebar collapsed |
| `localmind_tools_view_v1`, `localmind_tools_sort_v1` | AI Tools layout and sort |
| `localmind_bookmarks_view_v1`, `localmind_bookmarks_sort_v1` | Bookmarks layout and sort |
| `localmind_boot_theme_v1` | Colors for the boot splash |
| `localmind_feed_cache_v1` | The last accepted provider-data download |

The `ai_nexus_` prefix predates the LocalMind rename. Keep it, or existing data would be orphaned.

API keys are encrypted at rest. See [Security design](/development/security-design).

### Theming

`src/theme.ts` defines `ThemePreset`s: mode, primary, canvas, card, border and text, plus optional raised, strong-border, secondary, muted and foreground tokens. The active preset is written to CSS variables (`--theme-primary`, `--theme-bg`, `--theme-card`, `--theme-raised`, `--theme-border`, `--theme-text` and others) declared in `src/index.css`. Components use `var(--theme-*)` in inline styles instead of fixed Tailwind colors. `html.light-mode` toggles `color-scheme`.

Custom theme JSON is validated before it is saved and again when it is read, so bad stored data can never reach the theme engine.

## Rust

`src-tauri/src/lib.rs` registers the opener plugin and the commands below. Each module keeps pure logic apart from I/O and has unit tests.

| Module | Commands | Purpose |
|---|---|---|
| `probe.rs` | `probe_ports` | TCP connect to `127.0.0.1:<port>` for up to 32 ports. The webview cannot do this because of CORS |
| `keys.rs` | `verify_api_key` | Asks a provider whether a key is accepted. The key is sent in a header over HTTPS |
| `secrets.rs` | `encrypt_secrets`, `decrypt_secrets` | AES-256-GCM with the master key held in the OS credential store |
| `backupcrypto.rs` | `encrypt_backup`, `decrypt_backup` | Passphrase-protected backup files (Argon2id and AES-256-GCM) |
| `feed.rs` | `fetch_feed` | HTTPS-only, size-limited download of the provider-data JSON |
| `setup.rs` | `list_setup_recipes`, `detect_setup_tools`, `install_setup_tool`, `cancel_setup_install` | One-click setup. See [Setup recipes](/development/setup-recipes) |
| `applog.rs` | `log_event`, `log_info`, `preview_diagnostics`, `save_diagnostics` | One `app.log` shared by Rust and the interface, and the diagnostics file. See [Logging](/development/logging) |
| `advisor.rs` | `ask_advisor` | Gemini-backed free-tier advice using the user's own key. Hidden behind `FEATURES.advisor` |
| `toolpath.rs` | none | A helper, not a command module: gives setup commands the login shell's `PATH` on macOS and Linux |

Capabilities (`src-tauri/capabilities/default.json`) grant `core:default`, `opener:default` and the window permissions the custom title bar needs. The content security policy is currently `null`, which is a known hardening gap. HTTP uses `reqwest` with rustls. The crypto and credential dependencies are `aes-gcm`, `argon2`, `base64` and `keyring`.

## Build tooling

- Vite uses Tauri's required settings: fixed port 1420 with `strictPort`, `clearScreen: false`, `src-tauri/**` ignored in watch, and `TAURI_DEV_HOST` honored.
- Vite itself does not type-check, so run `pnpm lint` before committing.
- A Rust debug build is several GB. If the drive is short on space, set `CARGO_TARGET_DIR` to another drive.
- Windows and PowerShell 5.1: `Set-Content -Encoding utf8` writes a byte-order mark that breaks `tauri.conf.json`. Edit JSON config files with an editor.
