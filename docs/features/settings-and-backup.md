# Settings, backup and reset

**Audit status: working after fixes** (audited 2026-10-06, Task 9). Not yet checked inside the packaged desktop app: the backup download and the file picker (see Limits).

## What the user sees
**Settings** has four tabs.
- **Themes:** choose a built-in theme (filter by dark or light) and optionally an accent color (swatches or a color picker, with a reset).
- **Preferences:** whether a tool card opens the prompt box first, the scope explainer, the startup screen and loading animation (each with a preview/replay button).
- **Data & Backups:** the workspace backup, restore and reset (below), and a shortcut to the bookmarks export/import center.
- **Custom JSON:** edit the theme presets as JSON.

### Backup
**Download Backup JSON** saves custom tools, favorites, **bookmarks**, theme, accent color, custom themes and preferences. **API keys are not included unless the user ticks "Include my API keys"**, which shows a red warning that the keys are written as plain text.

### Restore
1. Choose a file. Nothing changes yet.
2. The page shows what the file contains ("1 custom tool • 2 API keys • 270 bookmarks"), any entries it had to leave out, and exactly what a restore will replace, with the current counts ("Restoring replaces your current custom tools (3), API keys (2), bookmarks (270)... Anything not listed stays as it is").
3. **Restore and replace** applies it; **Cancel** does nothing. The result line says what was restored.
Only the sections that are in the file are replaced. A backup made without keys never touches the saved keys.
A file that is not a backup, or has nothing LocalMind can restore, shows an error. It no longer reports "Backup restored successfully!".

### Reset
**Reset Tools, Keys & Themes** shows a confirmation that names what is deleted, with counts: custom tools, **saved API keys**, favorites, custom themes and preferences. Bookmarks are not touched (they have their own reset in the bookmarks exporter).

### Custom theme JSON
**Save & Apply** checks the presets before saving: a non-empty array, every preset with a unique `id`, a `name`, a `mode` of `dark` or `light`, and hex colors (`#rgb` or `#rrggbb`) for `primaryColor`, `primaryHover`, `bgCanvas`, `cardBg`, `borderColor`, `textColor` (and for the optional color fields if present). A failure names the preset and the field. Errors show in red and syntax errors show the parser's message.

The Data & Backups tab also holds the **Live provider data** panel (on/off, feed address, Refresh); see [remote-data-feed.md](remote-data-feed.md).

## How it works
- `src/lib/backup.ts` (pure, tested): `buildBackup`, `parseBackup` (validation and a summary), `describeRestore`, `backupFilename`. Backups are version 2; version 1 files still import.
- `App.tsx`: `handleExportBackup` writes the file through `downloadTextFile`; `handleImportBackup` applies only the sections present (restored keys are re-encrypted by the normal `persistKeys` path, and per-device encryption data in a file is discarded); `handleResetFactoryDefaults` clears the stored sections.
- `src/theme.ts`: `validateThemePresets`, `themePresetProblem`, `isHexColor`. `parseCustomThemesJson` now drops invalid presets from storage and falls back to the built-ins if none are usable, so bad saved JSON can never reach the theme engine.
- The restore and reset confirmations are inline panels, not `window.confirm`.

## Bugs found and fixed in the audit
- **The backup left out all bookmarks**, although the page said it restored them.
- **Restore ignored the saved custom themes**, so a restored theme id could point at a theme that no longer existed.
- **Restore said "Backup restored successfully!" for any file**, including `{}` or a file with the wrong content, and the return value of the import was ignored.
- **Restore silently replaced the saved API keys and custom tools** with the file's contents. An old backup could erase newer keys. It now previews and asks, and leaves absent sections alone.
- **The reset deleted all saved API keys** while its confirmation only mentioned "custom tools and theme settings". It now says so, with counts.
- **The export wrote API keys in plain text with no choice.** Keys are now opt-in with a warning. (This is the "exclude by default" option of backlog Task 17; the passphrase option is still open.)
- **The theme JSON editor accepted any array.** A preset like `{"id":"x"}` was saved and produced an unreadable theme on every launch. Presets are now validated, and stale invalid ones in storage are ignored.
- **Editor errors were shown in green**, like successes, and the editor text went stale after a reset.
- Restored accent colors, themes and bookmarks are validated (hex only, http/https links only) before they are applied.
- The data tab claimed a "browser's local sandbox" and "270+ bookmarks"; the copy now describes this device and the real behavior. The backup file is named `localmind-backup-<date>.json`.

## Tests
- `backup.test.ts`: keys opt-in, bookmarks and preferences included, round trip, absent sections, version 1 files, non-backup files, unsafe and incomplete entries, themes as array or string.
- `theme.test.ts`: hex colors, every preset problem, unique ids, stored garbage dropped.
- `SettingsPage.test.tsx`: theme selection by mouse and keyboard, mode filter, accent, preference toggles, theme editor errors and success styles, follow/never-clobber behavior, keys opt-in and warning, restore preview, confirm and cancel, non-backup and non-JSON files, warnings, reset confirmation with counts.
- `ProviderDataContext.test.tsx` covers the live-data panel (https-only address check, save, download, switch off clears the cache).
- `App.backup.test.tsx`: end to end in the app: export without and with keys, restoring bookmarks leaves keys, nothing changes for a useless file, restored keys are re-encrypted, reset only after confirmation.

## Limits and open items
- **The backup download and the file picker have not been run in the real Tauri window** (same blob-link caveat as bookmark export; see [bookmark-export-import.md](bookmark-export-import.md)).
- **Backups with keys are plain text.** Opt-in and warned, but an encrypted, passphrase-protected backup (Argon2 + AES-GCM) is still the better answer (backlog Task 17).
- A restore replaces whole sections; it does not merge custom tools or keys.
- Sidebar collapsed state and view/sort choices are per-device conveniences and are not part of the backup.
- The Themes and Preferences tabs already worked; the audit added tests (selecting a theme, mode filter, accent set and reset, all four preference toggles, the startup preview and animation replay) and fixed their accessibility: theme cards were clickable `div`s with no keyboard access and the toggles had no accessible name.
