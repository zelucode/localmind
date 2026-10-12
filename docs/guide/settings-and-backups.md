# Settings, themes and backups

Settings has four tabs: **Themes**, **Preferences**, **Data and Backups** and **Custom JSON**.

## Themes

Choose from 10 built-in themes. Filter the list by dark or light.

| Mode | Themes |
|---|---|
| Dark | Pastel Dusk (the default), Aurora Mint, Lavender Night, Ocean Slate, Ember Clay, Pitch Black OLED |
| Light | Blueprint, Soft Paper, Lilac Mist, Rose Quartz |

Add an **accent color** from the swatches or the color picker, and reset it any time. The light/dark button in the title bar (or `t`) switches mode quickly.

## Preferences

- Whether a tool's **Launch** button opens the prompt box first (Quick Query).
- Whether the scope guide shows on the AI Tools page.
- Whether the startup welcome screen and the loading animation play. Each has a preview button so you can see it again.

## Data and Backups

### Backup

**Download Backup JSON** saves your custom tools, favorites, bookmarks, theme, accent color, custom themes and preferences.

**API keys are left out unless you tick "Include my API keys".**

#### Protect the backup with a passphrase

Tick **Protect the file with a passphrase (recommended)** to encrypt the whole file. You choose the passphrase (8 to 256 characters) and type it twice. The file is encrypted with AES-256-GCM, with the key derived from your passphrase using Argon2id, and it is saved as `...-encrypted.json`.

- Ticking **Include my API keys** switches protection on for you. If you switch it off again, a red warning reminds you the keys would be written as readable text.
- **There is no way to recover a forgotten passphrase.** LocalMind cannot help, by design.
- Because a protected backup does not depend on this computer's credential store, you can restore it on another computer.

### Restore

1. **Choose a file.** Nothing changes yet. If it is a protected backup, you are asked for the passphrase first. A wrong passphrase shows "Wrong passphrase, or the file has been changed" and you can try again.
2. **Review.** The page lists what the file contains (for example "1 custom tool, 2 API keys, 270 bookmarks"), anything it had to leave out, and exactly what a restore will replace, with your current counts.
3. **Press Restore and replace**, or Cancel to do nothing.

Only the sections that are in the file are replaced. A backup made without keys never touches your saved keys. A restore replaces whole sections; it does not merge your current tools or keys with the file's. Restored keys are encrypted again with this computer's key.

A file that is not a LocalMind backup, or has nothing to restore, shows an error instead of claiming success.

### Reset

**Reset Tools, Keys and Themes** deletes your custom tools, **saved API keys**, favorites, custom themes and preferences. It first shows what will be deleted, with counts. Bookmarks are not touched. They have their own reset in [Export and Import](/guide/bookmarks#export-and-import).

### Live provider data

Free-tier quotas change every few weeks, and built-in data only changes with a new app version. LocalMind can instead download a small public file with the latest provider facts, and then show it in the Rate-Limit Matrix, the Config Exporter and the Key Vault.

The **Live provider data** panel has an on/off switch, the address of the file, and a **Refresh data** button. When it is on, LocalMind checks when the app opens and hourly after that, but only downloads when its saved copy is at least 24 hours old. Only the file's address is requested; no keys, tools or other data are sent. If a download fails or the file is invalid, you keep the last good data.

The address is empty by default, so until one is set, the app uses its built-in data. Switching the feed off clears the saved copy.

## Custom JSON

Edit the theme presets directly as JSON. **Save and Apply** checks them first: there must be at least one preset, each with a unique `id`, a `name`, a `mode` of `dark` or `light`, and hex colors (`#rgb` or `#rrggbb`) for `primaryColor`, `primaryHover`, `bgCanvas`, `cardBg`, `borderColor` and `textColor`. Errors name the preset and the field.

If a saved theme file is ever invalid, LocalMind ignores the bad presets and falls back to the built-in themes, so a typo cannot make the app unreadable.

## What is not in a backup

The sidebar's collapsed state and your list/grid and sort choices are per-computer conveniences, and they are not included.
