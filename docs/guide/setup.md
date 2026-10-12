# Setup

The Setup page installs and detects a few free tools, so you do not have to follow a separate guide for each. It needs the desktop app, and it is under **Developer** in the sidebar. Outside the desktop app it says "Tool setup needs the LocalMind desktop app." and shows no statuses.

## What is on the page

| Tool | Install from LocalMind | Notes |
|---|---|---|
| Ollama | Windows (`winget`) and macOS (`brew`) | On Linux, use the link to Ollama's website |
| LM Studio | Windows (`winget`) and macOS (`brew`) | On Linux, use the link to LM Studio's website |
| Gemini CLI | All systems (`npm`) | Needs Node.js |
| Qwen Code | All systems (`npm`) | Needs Node.js |
| Jan | Detect only | Install it from its website |
| OmniRoute | Detect only | Install it from its website |

Each card shows a real status, found by actually running `<tool> --version` or looking for the tool's install folder:

- **Installed**, with the version.
- **Not installed**.
- **Needs X**, when something it depends on (Node.js, or winget) is missing.

## Installing a tool

1. Press **Install** on a card.
2. LocalMind shows the **exact command** it will run and asks "Continue?". Nothing runs until you confirm.
3. The command's output streams into the card as it runs. **Cancel install** stops it.
4. When it finishes, the page checks again.

If the status still says Not installed after a successful install, restart LocalMind: a running app does not always see changes to the system's program search path right away.

If you would rather run the command yourself, use the **Copy** button next to it and paste it into your own terminal.

## What the installer will and will not do

- The commands are **built into the app**. LocalMind never runs a command typed into the interface, and the live provider-data feed cannot add one.
- It runs without administrator rights, one install at a time, and gives up after 15 minutes.
- It logs the tool name and the outcome to the [log file](/guide/troubleshooting#where-the-log-is), never your output.
- On macOS and Linux, apps opened from the Dock or Finder see a very short program search path. LocalMind looks up the one your login shell uses, so tools installed with Homebrew, nvm or npm are found.

::: warning Beta
Automated tests cover the recipes and the detection, but they do not run real installs, so the install step is the least proven part of the app. On macOS and Linux the program-search-path handling has not been confirmed end to end either. If an install or detection fails, please [report it](/guide/troubleshooting#report-a-problem).
:::
