# LocalMind Product Backlog & Roadmap

This document outlines the high-value community-researched features and tasks prioritized for LocalMind.

---

## 📋 Task Backlog

### [x] Task 1: Instant IDE & Agent Config Exporter (Zero-to-Code Setup)
- **Problem**: Developers obtain free API keys from Google AI Studio, Groq, or OpenRouter, but struggle to configure them inside coding assistants like VS Code, Cline, Continue.dev, Cursor, or Aider CLI due to varying environment variable names, custom base URLs, and exact model ID strings.
- **Solution**: An interactive Config Exporter utility where the developer picks their target tool (Cline, Continue.dev, Cursor, Aider CLI, Windsurf, or Python/TS SDK) and provider/key to get a 1-click copyable config snippet (e.g. `config.json`, `.cursorrules` / Custom OpenAI Base URL, `.env`, or terminal command).
- **Status**: Completed (Implemented `IDEConfigExporterModal.tsx`, integrated with Sidebar, Omnibar, ApiKeyVault, and Tool Cards).

---

### [x] Task 2: Rate-Limit & Rotation Strategy Matrix
- **Problem**: Free tiers have diverse and confusing rate limits (RPM, RPD, TPM, context windows). Developers hit limits mid-coding because they don't know the exact boundary limits or how to chain models together.
- **Solution**: A dedicated Rate-Limit & Rotation Cheatsheet tab/modal comparing RPM, TPM, Daily Caps, Context Windows, and a "Zero-Cost Daily Coding Strategy" explaining how to rotate between Gemini 2.5 Flash, Groq, and OpenRouter to prevent rate-limit throttling.
- **Status**: Completed (Implemented `RateLimitMatrixModal.tsx` with Quota Matrix table, category filtering, search, and 4-tier daily rotation chain architecture).

---

### [ ] Task 3: Local Model VRAM & Hardware Feasibility Calculator
- **Problem**: Developers frequently download large 14B–70B GGUF models in Ollama or LM Studio only to discover their GPU VRAM or system RAM cannot run them without freezing or crashing.
- **Solution**: An interactive hardware calculator: select your system (Apple Silicon M-series Unified Memory vs. PC RAM + NVIDIA/AMD VRAM) and model parameters (7B, 14B, 32B, 70B with Q4_K_M quantization) to calculate whether it runs Full GPU, Partial CPU offload, or will Out-of-Memory (OOM).
- **Status**: Planned.

---

### [ ] Task 4: "No-Credit-Card Verification" Badge & Filter Precision
- **Problem**: Many services claim to be "free" but require entering credit card details for identity verification, creating risk of unexpected charges.
- **Solution**: Provide strict visual badges and dedicated filter toggles separating "100% Zero-Card Forever" platforms from "Card Verification Required" platforms, giving developers total billing peace of mind.
- **Status**: Planned.

---

### [ ] Task 5: 1-Click cURL & Python/TypeScript Code Snippets with Live Key
- **Problem**: When testing an API, developers frequently want a rapid 5-line terminal `curl` command or Node.js/Python script to verify prompt responses.
- **Solution**: A quick "Code Snippet" action on each provider card that generates an instantly executable terminal command or code block with the developer's active vault key pre-filled.
- **Status**: Planned.

---

## 🧭 Navigation & UX restructure follow-ups

Tracked here so nothing from the restructure (sidebar pages, title bar, Help menu) is silently dropped.

### [ ] Task 6: Help menu: Documentation link
- **Problem**: The Help menu has a disabled "Documentation" item; the repo has no remote or docs site URL yet.
- **Solution**: Decide the docs location (hosted site, GitHub README, or bundled docs), then open it with the Tauri opener plugin.
- **Status**: Blocked on a URL.

### [ ] Task 7: Help menu: Report a Problem
- **Problem**: Disabled "Report a Problem" item. Needs a diagnostic bundle design.
- **Solution**: Build on `src/lib/errorLog.ts`: save a `.zip` (app log, version/OS, environment) via a Rust command and a save dialog, with stored API keys redacted before writing. Nothing is sent automatically.
- **Status**: Planned.

### [ ] Task 8: About: Check for Updates
- **Problem**: About shows the version only. No updater is configured.
- **Solution**: Add `tauri-plugin-updater`, signing keys and an update endpoint, then a "Check for Updates" button.
- **Status**: Planned.

### [ ] Task 9: Audit that every UI feature actually works
- **Problem**: The UI came from AI Studio; some controls may not be wired up.
- **Solution**: Walk every page and tag each feature as working / UI-only / broken, then implement the logic with tests (Rust unit tests; Vitest + React Testing Library). Known gaps: `/api/ai/advisor`, `/api/verify-gemini-key`, `/api/local-daemons/*` (need Rust commands or direct calls). Also check: external links via `window.open` inside Tauri (may need the opener plugin), and wording that claims keys are "AES-GCM encrypted" in the global search while they are stored as plain JSON in localStorage.
- **Status**: Planned. No test setup exists in the repo yet.

### [ ] Task 10: AI Tools list view and denser cards
- **Problem**: Cards are tall (about 4 visible at once); comparing free tiers is slow.
- **Solution**: Add a list/table view with a grid toggle, a left filter rail, and one search (merge the Omnibar and the filter box behavior).
- **Status**: Planned (structure is done; density is next).

### [ ] Task 11: Bookmarks list view with favicons
- **Problem**: 270 bookmarks in tall cards, 24 per page, all with the same wrench icon.
- **Solution**: Default compact list with a category rail, optional grid, and cached favicons or letter avatars.
- **Status**: Planned.

### [ ] Task 12: Runtime status in the title bar / Home
- **Problem**: Home no longer shows live runtime status because probing needs Rust (CORS blocks webview fetch to localhost).
- **Solution**: Add a Rust command that probes the known ports, then show an online/offline dot on the Runtimes sidebar item and on Home.
- **Status**: Blocked on the Rust probe command (see Task 9).
