# Troubleshooting

## The app shows a warning when I open the installer

Unsigned installers trigger a one-time warning from Windows or macOS. See [Install](/guide/install#the-first-launch-warning) for the steps.

## The window is blank or stuck on the loading screen

- After 10 seconds without starting, LocalMind shows "LocalMind is taking longer than expected to start" with **Reload** and **Close** buttons. Try Reload first.
- You can always move and close the window: the title bar stays available even while loading.
- On Windows, make sure WebView2 is installed. It comes with Windows 11, and Windows 10 may need it from Microsoft.

## The app crashed and shows a recovery screen

The recovery screen has its own window controls and four buttons: **Try again**, **Reload app**, **Copy details** (a plain-text crash report) and **Close app**. Your saved tools, bookmarks and keys are not affected. If it keeps happening, copy the details and [report it](#report-a-problem).

## Port scanning or the Setup page says it needs the desktop app

These features need the installed desktop app. They do not work if you open the source in a browser with `pnpm dev`. Install the app, or run `pnpm tauri dev`.

## A key shows "Couldn't check"

That is not a verdict on your key. It means the provider could not be reached or answered with an error, such as a rate limit. Check your internet connection and try again in a minute. If the provider is one LocalMind cannot check yet, **Test** says so.

## A key shows "couldn't be decrypted on this device"

The key was encrypted on a different computer, or the credential store was reset. Delete the key and add it again. See the [Key Vault](/guide/key-vault#things-that-can-go-wrong).

## My data disappeared after reinstalling or changing computers

LocalMind keeps its data in the app's data folder, not in the installer. A normal update keeps it. A new computer starts empty, so use [backup and restore](/guide/settings-and-backups#backup) to move your data, and protect the backup with a passphrase if it includes keys.

## Setup says a tool is not installed right after I installed it

A running app does not always see changes to the system's program search path. Restart LocalMind. On macOS and Linux, LocalMind asks your login shell for its search path, so tools installed with Homebrew, nvm or npm should be found. If one is not, please report it.

## Copy buttons do nothing

If the clipboard refuses a copy, the button shows a red cross and the title "Copy failed" instead of pretending it worked. Try again with the window focused.

## Where the log is

LocalMind writes one log file, `app.log`, with events from both the interface and the background service. Open **Help, then Report a Problem, then Open log folder** to show it in your file manager. On Windows it is in `%LOCALAPPDATA%\com.zelucode.localmind\logs`.

Each line looks like `2026-10-07T09:30:00Z WARN  [feed] message`. The file rotates at 5 MB and the five newest old files are kept, so it uses about 30 MB at most.

## Report a problem

**Help, then Report a Problem** shows you exactly what a diagnostics file would contain before you save anything:

- the app version and your operating system, and
- the last 400 lines of the log, with keys scrubbed.

It contains no file paths, keys, tools, bookmarks or settings. Choose **Save** (to your Downloads folder) or **Copy**, and attach it to a [GitHub issue](https://github.com/zelucode/localmind/issues). LocalMind never sends it anywhere itself, so you can read it first.

If you can, also tell us:

1. Your operating system and its version.
2. The LocalMind version, from **Help, then About LocalMind**.
3. What you did, what you expected, and what happened.
