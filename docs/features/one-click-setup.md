# One-click setup (Developer > Setup)

Desktop app only. Installs and detects a few free tools (and detects the local runtimes shown on the Runtimes page) so people do not have to follow separate guides. Design and decisions: [ask-box-and-setup-design.md](ask-box-and-setup-design.md).

## What the user sees
The **Setup** page (sidebar, Developer group; key `6`) lists the tools. Each card shows:
- a status from really running `<tool> --version`: **Installed** (with the version line), **Not installed**, or **Needs X** when a requirement such as Node.js or winget is missing;
- the **exact command** the install will run on this system, with a Copy button (for people who prefer to run it themselves);
- **Install**, which first shows the command and asks "Continue?"; nothing runs until the user confirms. The output streams into the card, **Cancel install** stops it, and the page checks again afterwards. A new install does not always change the PATH of the running app, so a success message adds "restart LocalMind" if the tool still shows Not installed.

Outside the desktop app the page shows "Tool setup needs the LocalMind desktop app." and no statuses.

## Recipes
| Id | Tool | Windows | macOS | Linux |
|---|---|---|---|---|
| `ollama` | Ollama | `winget install --id Ollama.Ollama -e ...` | `brew install ollama` | none (website link) |
| `lm-studio` | LM Studio | `winget install --id ElementLabs.LMStudio -e ...` | `brew install --cask lm-studio` | none (website link) |
| `jan` | Jan | detect only | detect only | detect only |
| `omniroute` | OmniRoute | detect only | detect only | detect only |
| `gemini-cli` | Gemini CLI | `npm install -g @google/gemini-cli` | same | same |
| `qwen-code` | Qwen Code | `npm install -g @qwen-code/qwen-code` | same | same |

Detection (`Probe` in `setup.rs`) is either a command that must succeed (`ollama --version`) or a known file or folder (`~/.lmstudio/bin/lms.exe`, the app's install folder, `~/.omniroute`). The first match wins. Versions are pulled out of the command output (Ollama prints two warning lines before its version). Path matches show "Found at ..." because there is no version to read. Run `cargo test print_detection -- --ignored --nocapture` in `src-tauri` to see what is found on your machine.

The **Runtimes** page uses the same detection: a service that is installed but has nothing listening shows an "Installed" pill and "Set up on this computer, just not running" instead of plain Offline. If detection cannot run (no desktop app) the cards say Offline as before.

Add a recipe in `src-tauri/src/setup.rs` (`RECIPES`). The unit tests check that ids are unique, every OS appears once, each recipe has a requirement, and no command contains shell characters.

## Safety rules (kept by the code)
- Recipes are compiled into the app. `install_setup_tool` takes a recipe **id**; the frontend cannot send a command, and the remote feed cannot add one.
- Commands are fixed programs with fixed arguments. On Windows they run through `cmd /C` (npm tools are `.cmd` shims) with no console window; the arguments are never user input.
- No elevation. One install at a time. Cancel kills the process tree (`taskkill /T`). A 15 minute limit.
- Installs and failures are written to `app.log` (recipe id only).
- **PATH on macOS and Linux:** apps opened from Finder or the Dock get a bare PATH (no Homebrew, nvm or npm folders), so installed tools would look "not installed". `toolpath.rs` gives every setup command the app's PATH plus the PATH of the user's login shell (asked once with a fixed command, 4 s limit, cached, warmed up at startup) plus standard folders (`/opt/homebrew/bin`, `/usr/local/bin`, `~/.local/bin`, `~/.npm-global/bin`, ...). Windows is unchanged. If the shell does not answer in time, the standard folders still apply.

## Code
- Rust: `src-tauri/src/toolpath.rs` (the PATH setup commands run with) and `src-tauri/src/setup.rs` (`list_setup_recipes`, `detect_setup_tools`, `install_setup_tool`, `cancel_setup_install`; event `setup-output`).
- Frontend: wrappers in `src/lib/backend.ts`, page in `src/components/SetupPage.tsx`.
- Tests: Rust unit tests in `setup.rs` (no installs are run) and `toolpath.rs` (marker parsing, merging, plus a real login-shell test that runs on macOS and Linux only), `SetupPage.test.tsx`, setup wrappers in `backend.test.ts`.

## Not verified yet
The install itself has not been run on a real machine by the tests (they would install software). Try Install for one tool in `pnpm tauri dev` before relying on it, and check that the Windows `cmd /C` path finds `npm` and `winget`.

**macOS and Linux:** the PATH fix is covered by unit tests, but nobody has confirmed it end to end. On a Mac, install the `.dmg` build, open it from Finder (not from a terminal, which would hide the problem) and check that Ollama, Node and Homebrew show as installed when they are.
