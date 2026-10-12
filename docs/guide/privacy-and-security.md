# Privacy and security

LocalMind is built so that your data stays on your computer. This page lists exactly what it stores, what it can send over the network, and what protects your API keys. The code is open source, so you can check any of it.

## What leaves your computer

There is no account, no analytics and no telemetry. LocalMind makes a network request only in these cases:

| When | What is sent | To whom |
|---|---|---|
| You press **Test** on a key | That key, in a request header over HTTPS | The key's own provider, and no one else |
| You open a tool, bookmark or link | Nothing from LocalMind. Your browser opens the page | The site you chose |
| You press **Ask** with a prefilled-prompt engine | Your prompt, as part of the link your browser opens | The chatbot's website |
| **Live provider data** is switched on and has an address | A plain request for that one file, with a generic `LocalMind` user agent. No keys, tools or settings | The address you set |
| You press **Install** on the Setup page | Nothing from LocalMind. The system's own package manager (`winget`, `brew` or `npm`) downloads the tool | That package manager's servers |

The app does not load fonts, scripts or images from other websites. The live-data feed does nothing until you set an address, and no address is set by default.

Your bookmarks, favorites, custom tools, notes and settings are never sent anywhere.

## Where your data is stored

All of it is on this computer, in the app's own data folder (see [Install](/guide/install#where-your-data-lives)). Nothing is synced to a server. If you want the same data on another computer, make a [backup](/guide/settings-and-backups#backup) and restore it there.

## How API keys are protected

- Keys are encrypted with **AES-256-GCM** before they are written to disk. A tampered value is detected and rejected.
- The key that unlocks them is generated on your computer the first time it is needed and stored in your **operating system's credential store**. It is never kept in LocalMind's own files and never shown to the interface.
- Each encryption uses a fresh random value, so the same key looks different every time it is saved.
- Readable keys exist only in memory while the app runs.
- If encryption is not possible, LocalMind refuses to save the key and warns you. It never falls back to saving plain text. The one exception is running the source code in a browser for development, which is not the desktop app.

### Backups and your keys

A normal backup leaves your keys out. If you include them, protect the file with a passphrase. It is then encrypted with a key derived from your passphrase using **Argon2id**, so it is safe to store and restorable on another computer. A backup with keys and no passphrase contains the keys as readable text, so treat that file as a secret. See [Settings, themes and backups](/guide/settings-and-backups#backup).

### Logs never contain keys

LocalMind writes a log file to help with problems. Every line is scrubbed before it is written, so anything that looks like a key, a token or a bearer header is blanked. The log records which provider was checked and whether it worked, never the key. The file never leaves your computer unless you attach it to a bug report yourself.

## Safety rules the app follows

- **No command comes from the interface or the internet.** The Setup page can run only the install commands built into the app, and you confirm each one first.
- **Links are checked.** Only `http` and `https` links are accepted for tools and bookmarks, so a `javascript:` or `file:` link cannot be saved.
- **Bookmark exports are safe to open in a spreadsheet.** Cells that could run as a formula are neutralized.
- **Live provider data is validated.** Every field is checked, and values that end up in copy-paste commands (model names, URLs, variable names) are checked strictly, so a bad file cannot sneak in a harmful command.

## Limits you should know about

- LocalMind is a beta, and the installers are not code-signed yet. Download only from the [official Releases page](https://github.com/zelucode/localmind/releases).
- If someone controls your computer while you are logged in, they can use the app as you can. Encryption protects keys at rest, not from software running as you.
- The live-data file is not signed. The address is visible and changeable in Settings, and the feed is off unless you set one.
- The window currently has no content security policy configured. This is a known hardening gap.

## Reporting a security problem

Please report vulnerabilities privately, not in a public issue. See the [security policy](https://github.com/zelucode/localmind/blob/main/SECURITY.md).
