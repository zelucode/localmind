# Navigation and layout

## What the user sees

A frameless window with a **title bar** across the top and a **sidebar** down the left. Seven pages, in sidebar order:

| # | Page | Purpose |
|---|---|---|
| 1 | Home | Quick launcher (Omnibar), status cards, favorites |
| 2 | AI Tools | Compare free-tier AI tools |
| 3 | Bookmarks | Find a free web tool |
| 4 | Runtimes | See which local AI servers are running |
| 5 | Configs & Limits | IDE/agent config exporter and the rate-limit matrix (two tabs) |
| 6 | Key Vault | Store and verify API keys |
| 7 | Settings | Themes, startup options, backup/restore, reset |

The sidebar groups them as **Discover** (Home, AI Tools, Bookmarks), **Local** (Runtimes, Configs & Limits) and **Secure** (Key Vault), with Collapse and Settings at the bottom. Counts show on AI Tools, Bookmarks and Key Vault. Collapsing leaves icons only (the choice is remembered). Below the `md` breakpoint a bottom bar replaces the sidebar.

### Title bar (left to right)
Logo and "LocalMind" (click for Home) · page title · search box (opens Ctrl+K) · contextual button · theme toggle · **Help menu** · minimize / maximize / close.

- The contextual button is **Add Tool** on Home and AI Tools, **Bookmark Tool** on Bookmarks, and absent elsewhere.
- Empty title-bar space drags the window; double-click toggles maximize.

### Help menu (the `?` icon)
Keyboard Shortcuts · Welcome & Quick Start · About LocalMind · Documentation (disabled, "Soon") · Report a Problem (opens the diagnostics dialog, see [logging-and-diagnostics.md](logging-and-diagnostics.md)). Documentation is tracked in the backlog (Task 6).

### Keyboard shortcuts
`Ctrl/Cmd+K` search palette · `1`–`7` jump to a page · `?` shortcut sheet · `/` focus the page's search · `k` Key Vault · `c` Config Exporter · `l` Rate-Limit Matrix · `b` add a bookmark · `t` toggle light/dark · `Esc` close the top dialog. Single-letter shortcuts are ignored while typing in a field.

## How it works

- `ActiveView` in `src/types.ts` is `home | tools | bookmarks | runtimes | configs | vault | settings`. `App.tsx` holds it in `useState`; there is no router.
- `Sidebar.tsx` exports `SIDEBAR_WIDTH` (208 px) and `SIDEBAR_WIDTH_COLLAPSED` (64 px). The title bar's brand column uses the same widths so the vertical edge lines up. Collapsed state is saved under `localmind_sidebar_collapsed_v1`.
- `Header.tsx` is a fixed 44 px bar (`h-11`). The sidebar starts below it (`top-11`), and the content area has `mt-11`.
- **Only the content area scrolls.** The app shell is `h-screen overflow-hidden`; the content `div` in `App.tsx` is the scroll container. That keeps the scrollbar below the title bar instead of running behind it.
- The Configs & Limits and Key Vault pages reuse `IDEConfigExporterModal`, `RateLimitMatrixModal` and `ApiKeyVaultModal` with their `inline` prop, which renders them as page sections (no overlay, no close buttons).
- `WindowControls.tsx` provides the caption buttons and the drag region. The window is frameless (`decorations: false`), so the permissions it needs (minimize, maximize, close, drag) are listed in `src-tauri/capabilities/default.json`.

## Tests
`Sidebar.test.tsx`, `Header.test.tsx` (titles, contextual buttons, Help menu), `HomePage.test.tsx`, and `App.test.tsx` (navigation through every page, number-key shortcuts, collapse persistence, theme toggle, Help → Shortcuts / About), `App.shortcuts.test.tsx` (every hotkey in the cheat-sheet: 1-7, k, c, l, b, t, /, Ctrl+K, and that letter hotkeys are ignored while typing), `KeyboardShortcutsModal.test.tsx`, `AboutModal.test.tsx` (real version, privacy wording, closing) and `WindowControls.test.tsx` (minimize / maximize / restore / close, drag region, no-op outside the desktop app).

## Limits
- Documentation is a placeholder (backlog Task 6).
- The title bar has no tray or menu bar on macOS; macOS traffic-light handling is not implemented (the app targets Windows first).
