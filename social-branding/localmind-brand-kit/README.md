# LocalMind brand kit (direction A, Orbit)

Tagline: Your private AI hub, always nearby.  Handle: /localmind

## Install in the app
1. Copy everything in `tauri-icons/` into `src-tauri/icons/` (replaces the Tauri placeholders).
   Or regenerate it yourself: `pnpm tauri icon app-icon/icon-master-1024.png`.
   Note: the .icns here uses the padded macOS version (`icon-macos-1024.png`); the generator would use the full-bleed master.
2. Copy `favicon/*` into `public/`, replace the icon link in `index.html` with `favicon/head-snippet.html`, delete `public/tauri.svg` and `public/vite.svg` if unused.
3. Sidebar / welcome / loading screens: `logo/mark-currentColor.svg`, `logo/wordmark-currentColor.svg`, `logo/mark.svg`.
4. Tray: `tray/trayTemplate.png` and `trayTemplate@2x.png` (macOS template), `tray-white-*` / `tray-black-*` for Windows.

## Size tiers
full above 96 px, small 25-96 px, tiny 24 px and below (see `app-icon/`).

## Colors
Primary #e0a8c5, Canvas #1e1e2e, Card #282838, Icon tile #232336, Text #d8dbe8, Muted #8e92a8,
Primary on light #a8497f, Paper #f6f4ee. See `tokens/`.

## Folders
app-icon, tauri-icons, favicon, tray, logo, social (avatar, X/LinkedIn/YouTube covers, OG, GitHub preview, 5 posts, story), tokens, brand-guide.html
Post copy other than the tagline is placeholder.
