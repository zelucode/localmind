# Startup and window

## What the user sees

1. A **boot splash** (static, in `index.html`) shows the moment the window opens: the LocalMind mark and wordmark, centered, in the user's last theme. No spinner.
2. React takes over and shows the **loading screen**: the same mark and wordmark in the same position, the tagline "Your private AI hub, always nearby.", a thin progress line, and a status line (Opening key vault, Loading tool catalog, Loading bookmarks, Ready). It runs about 1.2 seconds and fades out. In the wordmark, "Local" is the text color and "Mind" is the theme's primary color.
3. The loading screen can be skipped with **Space, Enter, Esc or a click**. It respects reduced-motion settings. It can be turned off in Settings, and replayed from Settings or Ctrl+K.
4. The **Welcome & Quick Start** dialog opens afterwards if enabled (also available from the Help menu).

The window has **no native frame**: our own title bar draws the minimize, maximize and close buttons, and empty space in it drags the window (double-click maximizes).

## How it works

- **No theme flash.** `applyThemeToDocument` (`src/theme.ts`) saves the active colors to `localmind_boot_theme_v1`. A small inline script in `index.html` reads them before first paint and sets `--boot-*` variables and the page background, so a light theme never flashes dark. If nothing is saved it uses the default dark palette.
- **Seamless handoff.** The splash and `LoadingScreen.tsx` use identical sizes and positions for the mark (88 px) and wordmark (176×40), so nothing moves when React mounts. The wordmark is `public/wordmark.svg` used as a CSS mask over a hard-stop gradient (text color, then primary at 50.1 %).
- **The window can always be closed.** Both the splash and the loading screen start 44 px from the top (`top-11` / `inset: 44px 0 0 0`), below the title bar, so the title bar's window controls and drag area stay usable even if startup hangs.
- **Frameless window.** `src-tauri/tauri.conf.json` sets `decorations: false` and `shadow: true`. `WindowControls.tsx` calls the Tauri window API, so `src-tauri/capabilities/default.json` explicitly allows minimize, maximize/unmaximize/toggle-maximize, is-maximized, close and start-dragging. Without those permissions the buttons silently do nothing. Outside Tauri the buttons are no-ops.

## Tests
`LoadingScreen.test.tsx` (stays below the title bar, tagline and skip hint, skip by Esc / Space / Enter / click, finishes by itself) and the title-bar tests in `Header.test.tsx`. The splash script in `index.html` is not unit tested.

## Limits (backlog Task 16)
- There's no React error boundary yet: a render crash would leave a blank content area (the title bar usually survives, but isn't guaranteed).
- If the JS bundle fails to load, only the static splash is shown, with no close control of its own.
- Whether the loading screen needs a visible Skip button is still to be discussed.
