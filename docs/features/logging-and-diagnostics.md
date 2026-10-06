# Logging and Report a Problem

## What it does for the user
LocalMind writes one log file, `app.log`, with events from both the interface (React) and the background service (Rust). When something goes wrong, **Help > Report a Problem** shows exactly what a diagnostic file would contain, lets the user save it (to the Downloads folder) or copy it, and opens the log folder. Nothing is ever sent anywhere; the user attaches the file themselves when they ask for help.

There is no public issue tracker linked yet (the repo has no remote), so the dialog says "attach it when you report the problem" and does not name a place.

## Where the log is
The app's log directory, from Tauri's `app_log_dir()` (on Windows `%LOCALAPPDATA%\com.localmind.app\logs`). The dialog's **Open log folder** button shows `app.log` in the file manager.

One line per event: `2026-10-07T09:30:00Z WARN  [feed] message`. Frontend lines have a `ui:` source, for example `[ui:window]`.

## What is logged
- **Backend** (`src-tauri/src/applog.rs`): startup (version, OS), key-check outcomes (provider and result only, never the key), feed downloads and failures, Advisor failures, credential-store failures, port-probe input errors, and Rust panics.
- **Frontend** (`src/lib/errorLog.ts`): everything sent through `logInfo` / `logWarn` / `logError` (render crashes from the error boundary, dropped themes, failed feed updates, a failed diagnostics save), plus `window` errors and unhandled promise rejections (installed in `main.tsx`), which were previously invisible. In a plain browser (`pnpm dev`) the same calls only write to the console.
- Frontend events reach Rust through the `log_event` command, so both sides share one file and one format.

## Safety of the log
- **Keys are scrubbed.** Every line passes `redact()` before it is written: words after `Bearer`, `key=`, `token=`, `x-api-key:`, `enc:v1:` are blanked, as are words with a known key prefix (`sk-`, `gsk_`, `AIza`, `ghp_`, `hf_` ...) and any 24+ character word mixing letters and digits. The diagnostics text is scrubbed again when it is built. Callers also avoid passing secrets in the first place.
- **Bounded size.** `app.log` rotates to `app.log.1` at 1 MB, and only one old file is kept (about 2 MB maximum). Messages are cut at 2,000 characters and flattened to one line.
- **Bounded noise.** The frontend repeats of an identical message within 5 seconds are dropped, and at most 300 events per session are forwarded, so an error loop cannot fill the log.
- **Never breaks the app.** A failed log write is ignored.
- The diagnostics file holds the app version, OS, and the last 400 log lines. It contains no file paths, keys, tools, bookmarks or settings.

## Commands (Rust, `applog.rs`)
`log_event(level, source, message)`, `log_info()` (log folder and file path), `preview_diagnostics()` (the text), `save_diagnostics()` (writes `localmind-diagnostics-YYYYMMDD-HHMMSS.txt` to Downloads, or the log folder when there is no Downloads folder, and returns the path). The frontend wrappers are in `src/lib/backend.ts`; showing a file in the file manager uses `revealInFolder` in `src/lib/tauri.ts` (opener plugin, already permitted by `opener:default`).

## Tests
- **Rust** (`applog::tests`, 11): UTC formatting (including a leap day), one-line format, length and source cleaning, redaction of keys, headers and `enc:v1:` tokens while normal text is left alone, append and read back, rotation keeping one old file, diagnostics header and no keys or paths, diagnostics without a log, tagging of frontend sources, accepted log levels.
- **Frontend**: `errorLog.test.ts` (console output, nothing forwarded in a browser, forwarded fields, duplicate hold-back, session cap, backend failure never throws, error description, global error and rejection handlers and their removal), `ReportProblemModal.test.tsx` (preview shown, save then reveal, failed save is reported, open log folder, clipboard failure, plain-browser message, closing), `Header.test.tsx` and `App.test.tsx` (the menu item opens the dialog, Escape closes it), `tauri.test.ts` (`revealInFolder`), `backend.test.ts` wrappers.

## Limits
- The diagnostic file is a plain `.txt`, not a `.zip` as the backlog first suggested: it holds only text, and a readable file lets the user check what they share.
- Not yet checked in the real desktop window: where the log folder really is, that Downloads is found, and that "Show in folder" opens the file manager (backlog Task 19).
- Log lines about user actions are deliberately few. Add `logInfo` calls where a failure would otherwise be silent, never where a value could be a secret.
