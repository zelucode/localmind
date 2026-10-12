# Setup recipes

The Setup page (desktop app only) installs and detects free tools. It runs commands on the user's machine, so it follows strict rules. For what users see, read the [Setup guide](/guide/setup).

## Rules the code keeps

These are not negotiable, because the feature runs commands.

- **Recipes are compiled into the app** (`RECIPES` in `src-tauri/src/setup.rs`). `install_setup_tool` takes a recipe **id**, so the interface cannot send a command, and the remote feed cannot add one.
- **Commands are fixed programs with fixed arguments.** On Windows they run through `cmd /C` (npm tools are `.cmd` shims) with no console window. The arguments are never user input.
- **No elevation.** One install at a time. Cancel kills the process tree (`taskkill /T`). A 15 minute limit applies.
- **The user confirms the exact command** before each run, and can copy it to run it themselves.
- **Installs and failures are written to `app.log`**, with the recipe id only.
- **Outside the desktop app,** the wrappers throw `BackendUnavailableError` and the page shows no statuses.

## The recipes

| Id | Tool | Windows | macOS | Linux |
|---|---|---|---|---|
| `ollama` | Ollama | `winget install --id Ollama.Ollama -e ...` | `brew install ollama` | none (website link) |
| `lm-studio` | LM Studio | `winget install --id ElementLabs.LMStudio -e ...` | `brew install --cask lm-studio` | none (website link) |
| `jan` | Jan | detect only | detect only | detect only |
| `omniroute` | OmniRoute | detect only | detect only | detect only |
| `gemini-cli` | Gemini CLI | `npm install -g @google/gemini-cli` | same | same |
| `qwen-code` | Qwen Code | `npm install -g @qwen-code/qwen-code` | same | same |

## Detection

Each recipe has a `Probe`: either a command that must succeed (`ollama --version`) or a known file or folder (`~/.lmstudio/bin/lms.exe`, an app's install folder, `~/.omniroute`). The first match wins. Versions are extracted from the command output (Ollama prints two warning lines before its version). A path match shows "Found at ..." because there is no version to read.

To see what is found on your machine, run this in `src-tauri`:

```sh
cargo test print_detection -- --ignored --nocapture
```

The Runtimes page uses the same detection. A service that is installed but has nothing listening shows an "Installed" pill instead of plain Offline.

## Adding a recipe

1. Add an entry to `RECIPES` in `src-tauri/src/setup.rs`, with a requirement, a probe, and a command per operating system.
2. Run `cargo test`. The unit tests check that ids are unique, every operating system appears once, each recipe has a requirement, and no command contains shell characters.
3. Add the tool's name to the user-facing [Setup guide](/guide/setup).

Use only well-known package managers (`winget`, `brew`, `npm`) and fixed arguments. Do not add a recipe that takes input from the user.

## The program search path on macOS and Linux

Apps opened from the Dock or Finder inherit a bare `PATH` without Homebrew, nvm or npm folders, so installed tools would look missing. `src-tauri/src/toolpath.rs` gives every setup command the app's `PATH`, plus the `PATH` of the user's login shell (asked once with a fixed command, with a 4 second limit, cached and warmed up at startup), plus the standard folders (`/opt/homebrew/bin`, `/usr/local/bin`, `~/.local/bin`, `~/.npm-global/bin` and others). Windows is unchanged. If the shell does not answer in time, the standard folders still apply.

## Code

- Rust: `src-tauri/src/setup.rs` (`list_setup_recipes`, `detect_setup_tools`, `install_setup_tool`, `cancel_setup_install`, and the `setup-output` event) and `src-tauri/src/toolpath.rs`.
- Frontend: the wrappers in `src/lib/backend.ts` and the page in `src/components/SetupPage.tsx`.
- Tests: unit tests in `setup.rs` (no installs run) and `toolpath.rs` (marker parsing, merging, and a real login-shell test that runs on macOS and Linux only), plus `SetupPage.test.tsx`.

## Not verified yet

Automated tests do not run real installs, because that would install software. Setup has been run by hand on Windows and macOS. It has not been run on Linux, so a Linux contributor checking detection and a real install would help.

When you test the macOS path yourself, install the `.dmg` build and open it from Finder (not from a terminal, which would hide the `PATH` problem), then check that Ollama, Node and Homebrew show as installed when they are.
