# Logging and diagnostics

LocalMind writes one log file, `app.log`, with events from both the interface (React) and the background service (Rust). **Help, then Report a Problem** shows exactly what a diagnostics file would contain, lets the user save or copy it, and opens the log folder. Nothing is ever sent anywhere. The user attaches the file themselves. For the user-facing steps, see [Troubleshooting](/guide/troubleshooting#report-a-problem).

## Where it is

The log directory comes from Tauri's `app_log_dir()`. On Windows that is `%LOCALAPPDATA%\com.zelucode.localmind\logs`. One line per event:

```
2026-10-07T09:30:00Z WARN  [feed] message
```

Frontend lines have a `ui:` source, for example `[ui:window]`.

## What is logged

- **Backend** (`src-tauri/src/applog.rs`): startup (version and OS), key-check outcomes (provider and result only, never the key), feed downloads and failures, Advisor failures, credential-store failures, port-probe input errors and Rust panics.
- **Frontend** (`src/lib/errorLog.ts`): everything sent through `logInfo`, `logWarn` and `logError` (render crashes from the error boundary, dropped themes, failed feed updates, a failed diagnostics save), plus `window` errors and unhandled promise rejections, which `main.tsx` installs handlers for. In a plain browser the same calls write only to the console.
- Frontend events reach Rust through the `log_event` command, so both sides share one file and one format.

## Keeping secrets out

- **Every line passes `redact()` before it is written.** Words after `Bearer`, `key=`, `token=`, `x-api-key:` and `enc:v1:` are blanked, as are words with a known key prefix (`sk-`, `gsk_`, `AIza`, `ghp_`, `hf_` and others) and any word of 24 or more characters that mixes letters and digits. The diagnostics text is scrubbed again when it is built.
- **Callers also avoid passing secrets in the first place.** Add `logInfo` calls where a failure would otherwise be silent, never where a value could be a secret.
- **The diagnostics file** holds the app version, the OS and the last 400 log lines. It contains no file paths, keys, tools, bookmarks or settings.

## Bounds

- **Size.** `app.log` rotates to `app.log.1` at 5 MB, and the five newest old files are kept (`app.log.1` to `app.log.5`, about 30 MB at most). A message is cut at 2,000 characters and flattened to one line.
- **Noise.** The frontend drops a repeat of an identical message within 5 seconds and forwards at most 300 events per session, so an error loop cannot fill the log.
- **Failure.** A failed log write is ignored. Logging must never break the app.

## Commands

`log_event(level, source, message)`, `log_info()` (the log folder and file path), `preview_diagnostics()` (the text) and `save_diagnostics()`, which writes `localmind-diagnostics-YYYYMMDD-HHMMSS.txt` to Downloads (or to the log folder when there is no Downloads folder) and returns the path. The frontend wrappers are in `src/lib/backend.ts`. Showing a file in the file manager uses `revealInFolder` in `src/lib/tauri.ts`, which the opener plugin permits.

## Tests

- **Rust** (`applog::tests`): UTC formatting including a leap day, the one-line format, length and source cleaning, redaction of keys, headers and `enc:v1:` tokens while normal text is left alone, append and read back, rotation, diagnostics content with no keys or paths, and tagging of frontend sources.
- **Frontend:** `errorLog.test.ts` (console output, nothing forwarded in a browser, duplicates held back, the session cap, a backend failure never throws, the global handlers), `ReportProblemModal.test.tsx`, and the Help menu tests in `Header.test.tsx` and `App.test.tsx`.

## Limits

- The diagnostics file is plain `.txt`, not a `.zip`: it holds only text, and a readable file lets the user check what they share.
- Not yet checked in a packaged window on every system: where the log folder is, that Downloads is found, and that "Show in folder" opens the file manager.
