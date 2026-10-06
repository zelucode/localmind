# Ask box, one-click setup and sidebar grouping (design)

**Status: design, nothing built yet.** Agreed in discussion on 2026-10-06; the Omnibar section of the dashboard was the first one reviewed.

## Purpose
LocalMind is one place to reach every free AI: web chatbots, IDE tools, CLIs and local runners. People should not have to remember URLs, dig through browser bookmarks or follow ten separate setup guides. The focus is what is free. The desktop app adds what a website cannot: installing and detecting tools on the user's machine.

Audience: anyone who wants free AI, technical or not. Developer features stay available but are grouped away from the beginner path.

## 1. Ask box (replaces the hard-coded Omnibar)
Today `Omnibar.tsx` has two fixed engines (Perplexity, ChatGPT), Enter always goes to Perplexity, example chips launch immediately, and IDE Configs / Limits sit in the launch row.

Target:
- **One engine by default.** A Send button with a default-engine picker beside it (name and logo). Enter sends to that engine only. The default is remembered; first run is Perplexity (reliable prompt link).
- **Engines come from the catalog** (web LLM tools, favorites first), not from code.
- **Reuse Quick Query.** `quickSearchUrlTemplate` + `planQuickQuery` already do the right thing: prefill when the tool has a `{query}` template, otherwise copy the prompt and open the tool with a clear note. Only 3 of 29 tools have a template, so adding templates (and a template field in Add Tool, see Task 20) is the data work.
- **Show what will happen** on each engine: "prompt prefilled" or "prompt copied, paste it".
- **Example chips fill the input**; the user presses Enter.
- **IDE Configs and Limits leave the card** (they are not ask actions; they live in Configs and can be quick links elsewhere).
- Copy: say what it does ("Ask any free AI. Your prompt opens in the engine you choose."), not "Universal Omnibar".

### Compare (multi-send), phase 2, opt-in only
- A **Compare** toggle next to the input. Off by default; engine chips appear only when it is on.
- The user ticks engines; the button reads "Send to N" with the names.
- **Saved sets** ("My compare set") so a regular user picks once.
- Cap at 5 engines per send. Engines without a prompt link: copy once, open the sites, show a short checklist.
- Check how the desktop webview handles several opens in a row (opener plugin) before building.
- Not possible: collecting the answers inside LocalMind for web chat UIs (logins, no API, no embedding). A later option is an API-based Compare view for tools whose key is in the Vault.

## 2. One-click setup (desktop only), phase: install and detect
Scope decided: **install and detect only**. Writing IDE config files is out of the first version.

- Each CLI / local tool gets a **recipe** in curated app data: requirements (Node, Python, winget...), install command, and a verify command.
- The app **detects** it (`where` / `--version`, like `probe_ports` does for ports) and shows Installed, Not installed or Running. Never a guessed status.
- An **Install** button runs the recipe, streams the output, then re-detects.

Safety rules (non-negotiable, because this runs commands on the user's machine):
- Recipes are **curated and shipped with the app**. A remote feed may add display data but never a command, so a bad feed cannot run anything.
- The user sees the **exact command** and confirms before each run.
- No elevation, an easy Cancel, and a **Copy command** option for people who prefer to run it themselves.
- Rust command takes a recipe id, not a command string.
- Outside Tauri the wrappers throw `BackendUnavailableError` as elsewhere; no fake results.

## 3. Sidebar grouping
Keep one app with progressive disclosure, not a separate developer tab.
- Beginner path: Home, AI Tools, Bookmarks, Key Vault.
- A **Developer** group: Runtimes, Configs & Limits, and the CLI setup flow once it exists.
- Non-developers can ignore the group; nothing is hidden. Revisit if the group grows large.

## Order of work
1. Ask box phase 1: catalog-driven engine picker, remembered default, chips fill, Quick Query reuse, more templates, move utilities out.
2. Sidebar Developer group (small).
3. Setup: recipe data model, detect, then install for 2-3 tools (e.g. Ollama, one npx CLI).
4. Compare toggle and saved sets.

## Open questions
- Which tools get recipes first.
- Whether Compare needs the API-based view.
- Where the quick links for IDE Configs and Limits go on Home.
