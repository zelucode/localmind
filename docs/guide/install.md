# Install

Download the installer for your system from the [Releases page](https://github.com/zelucode/localmind/releases) on GitHub.

| System | File to download | Notes |
|---|---|---|
| Windows 10 / 11 | `.exe` setup installer (NSIS) | Needs WebView2, which Windows 11 already has |
| macOS | `.dmg` (universal: Apple Silicon and Intel) | Drag LocalMind to Applications |
| Linux | `.AppImage`, `.deb` or `.rpm` | AppImage runs on most distributions without installing |

Pre-release versions (for example `1.0.0-beta.1`) are marked **Pre-release** on the Releases page.

## The first-launch warning

The installers are not code-signed yet, because a signing certificate costs money and the project is free. Your operating system will warn you the first time. This is expected for an unsigned app, and it does not mean the file is damaged.

::: details Windows: "Windows protected your PC"
Click **More info**, then **Run anyway**.
:::

::: details macOS: "LocalMind cannot be opened"
Right-click (or Control-click) the app in Applications, choose **Open**, then click **Open** again.

If that does not work, remove the quarantine flag in Terminal:

```sh
xattr -dr com.apple.quarantine /Applications/LocalMind.app
```
:::

::: details Linux
Make the AppImage executable, then run it:

```sh
chmod +x LocalMind*.AppImage
./LocalMind*.AppImage
```

`.deb` and `.rpm` packages install with your package manager as usual.
:::

If you would rather not run an unsigned installer, you can [build LocalMind from source](/development/building).

## Updating

There is no automatic update check yet. To update, download the new installer from the Releases page and run it over the old version. Your data is kept. See [Settings, themes and backups](/guide/settings-and-backups#backup) if you want a safety copy first.

## Where your data lives

LocalMind stores everything on your computer and nowhere else.

| What | Where |
|---|---|
| Tools, favorites, bookmarks, settings | The app's webview storage, inside its data folder. On Windows: `%LOCALAPPDATA%\com.zelucode.localmind\` |
| API keys | In that same storage, but only as encrypted text |
| The key that decrypts them | Your operating system's credential store: Windows Credential Manager, macOS Keychain, or the Linux keyutils store (service `LocalMind`) |
| The log file | `app.log` in the app's `logs` folder. See [Troubleshooting](/guide/troubleshooting#where-the-log-is) |

On macOS and Linux the data folder is also named after `com.zelucode.localmind`, under the usual per-user locations for app data.

## Uninstalling

Uninstall LocalMind the normal way for your system. This leaves your data folder and the encryption key behind, so a reinstall picks up where you left off. To remove everything, also delete the data folder above, and delete the `LocalMind` entry in your credential store.
