# Startup and window

## What the user sees

1. A **boot splash** (static, in `index.html`) shows the moment the window opens: the LocalMind mark and wordmark, centered, in the user's last theme. No spinner.
2. React takes over and shows the **loading screen**: the same mark and wordmark in the same position, the tagline "Your private AI hub, always nearby.", a thin progress line, and a status line (Opening key vault, Loading tool catalog, Loading bookmarks, Ready). It runs about 1.2 seconds and fades out. In the wordmark, "Local" is the text color and "Mind" is the theme's primary color.
3. The loading screen can be skipped with the visible **Skip (Space)** button, or with **Space, Enter, Esc or a click**. It respects reduced-motion settings. It can be turned off in Settings, and replayed from Settings or Ctrl+K.
4. The **Welcome & Quick Start** dialog opens afterwards if enabled (also available from the Help menu).

The window has **no native frame**: our own title bar draws the minimize, maximize and close buttons, and empty space in it drags the window (double-click maximizes).

## How it works

- **No theme flash.** `applyThemeToDocument` (`src/theme.ts`) saves the active colors to `localmind_boot_theme_v1`. A small inline script in `index.html` reads them before first paint and sets `--boot-*` variables and the page background, so a light theme never flashes dark. If nothing is saved it uses the default dark palette.
- **Seamless handoff.** The splash and `LoadingScreen.tsx` use identical sizes and positions for the mark (88 px) and wordmark (176×40), so nothing moves when React mounts. The wordmark is `public/wordmark.svg` used as a CSS mask over a hard-stop gradient (text color, then primary at 50.1 %).
- **The window can always be closed.** Both the splash and the loading screen start 44 px from the top (`top-11` / `inset: 44px 0 0 0`), below the title bar, so the title bar's window controls and drag area stay usable even if startup hangs.
- **Frameless window.** `src-tauri/tauri.conf.json` sets `decorations: false` and `shadow: true`. `WindowControls.tsx` calls the Tauri window API, so `src-tauri/capabilities/default.json` explicitly allows minimize, maximize/unmaximize/toggle-maximize, is-maximized, close and start-dragging. Without those permissions the buttons silently do nothing. Outside Tauri the buttons are no-ops.

## When startup goes wrong

A frameless window must never be impossible to close, so there are three layers:

1. **Slow or hung start.** A watchdog script in `index.html` (id `boot-watchdog`, inline so it works even if the app bundle never loads) checks after 10 seconds whether the splash is still on screen. If so it adds "LocalMind is taking longer than expected to start." with **Reload** and **Close** buttons. Close calls Tauri's `plugin:window|close` for the `main` window (falling back to `window.close()` in a browser). The splash also has an invisible drag strip across the top 44 px from the first frame, so the window can be moved.
2. **Crash while rendering.** `ErrorBoundary.tsx` wraps `App` in `main.tsx`. If anything below it throws during render it shows a recovery screen with its **own** title bar and window controls (the normal title bar lives inside the app that just crashed), the error text, and four actions: **Try again** (re-renders), **Reload app**, **Copy details** (a plain-text crash report: time, error, stack, component stack) and **Close app**. A line reassures that saved tools, bookmarks and keys aren't affected. The error is also written to the console and to `app.log` through `lib/errorLog.ts` (see [logging-and-diagnostics.md](logging-and-diagnostics.md)).
3. **Loading screen.** It sits below the title bar and has a visible **Skip** button.

## Tests
`LoadingScreen.test.tsx` (stays below the title bar, tagline, Skip button, skip by Esc / Space / Enter / click, finishes once, finishes by itself), `ErrorBoundary.test.tsx` (children render normally, recovery screen, window controls and Close app work, Try again recovers or stays put, Reload, Copy details including a blocked clipboard, report contents) and `bootWatchdog.test.ts`, which extracts the real script from `index.html` and runs it with fake timers (quiet within 10 s, adds Reload/Close after, does nothing if the app already mounted, adds the message once, Close uses Tauri or falls back). Title-bar tests are in `Header.test.tsx`.

## Limits
- Errors thrown outside React rendering (event handlers, async code) are logged but don't trigger the crash screen. A global `error` / `unhandledrejection` handler is a possible follow-up.
- The recovery screen, watchdog message and Close button have unit tests but have not been exercised in the packaged desktop app.
