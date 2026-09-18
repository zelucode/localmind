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
