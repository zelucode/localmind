# AI Nexus — Free-Tier AI Developer Catalog & Command Center

AI Nexus is a professional developer hub designed to aggregate, organize, and navigate the modern ecosystem of **free-tier AI platforms**, **local coding agents**, **open-source LLM runtimes**, and **unified API routers (like OmniRoute)**.

---

## 🎯 Motivation & Design Philosophy

The modern AI landscape moves rapidly, but developers often face three recurring hurdles:

1. **Information Fragmentation**: Hundreds of AI models, web interfaces, local agents, and developer APIs exist, but finding platforms that offer genuinely useful, renewal-based free tiers without aggressive paywalls or mandatory credit cards is difficult.
2. **Architectural Confusion (Web vs. Local)**: Beginners and seasoned developers alike often confuse **Web LLMs** (browser-only sandboxes that cannot read or edit local project files) with **Local Desktop Agents** (like Aider or Cline, which can execute file edits and terminal commands directly in repositories).
3. **API Key & Rate-Limit Fatigue**: Managing individual developer keys across Google Gemini, Groq, Mistral, and GitHub Models can be tedious. Without a unified proxy or local daemon like OmniRoute, developers frequently encounter strict rate-limit timeouts when working in IDEs.

### Core Design Principles

- **Zero "AI Slop" Aesthetics**: Avoids tacky neon glows, heavy purple gradients, and generic marketing copy. Embraces authentic, ergonomic software design inspired by architectural drafting and physical stationery.
- **Architectural Scope Clarity**: Explicitly badges and filters every tool by its real capability scope (`web-only`, `local-agent`, `ide-plugin`, `local-runner`, `uniform-proxy`, `cloud-builder`).
- **Privacy-First Key Vault**: Developer API keys are stored solely in the user's browser sandbox (`localStorage`). Keys are never sent to external servers unless the user tests their connection directly.
- **Dynamic CSS Variable Theming**: Complete tokenized design system featuring curated palettes including **Soft Paper** (warm eggshell paper with pastel vermillion), **Blueprint** (technical drafting ink on crisp white), and **Pastel Dusk** (low-contrast twilight dark mode).

---

## ✨ Features Implemented

### 1. Curated Free-Tier Platform Catalog
- **18+ Deeply Curated AI Tools**: Covers leading free web LLMs, reasoning models, coding agents, local runtimes, and routers (e.g., Google AI Studio, Groq Playground, Perplexity, Phind, DeepSeek, Mistral Le Chat, Aider, Cline, Continue.dev, Ollama, LM Studio, OmniRoute, OpenRouter Free Tier, and v0).
- **Free Quota Breakdown**: Each card specifies renewal intervals (e.g. daily quotas, RPM/TPM limits, token allowances).
- **Capability Scope Filters**: One-click filtering between:
  - *Web Only* (Browser conversation; no local filesystem access)
  - *Local Desktop Agents* (CLI/IDE tools that write directly to local repositories)
  - *IDE Plugins* (In-editor assistants for VS Code, JetBrains)
  - *Local Offline Runners* (Ollama, LM Studio)
  - *Uniform Proxies* (OmniRoute, OpenRouter)
  - *Full-Stack Cloud Builders* (Google AI Studio Build, v0.dev)
- **Feature Filter Pills**: Filter by *Live Web Search*, *No Credit Card Required*, *Free API Key Available*, or *Generous Quota*.
- **Quick-Launch Prompt Modal**: Enter your prompt once and launch directly into the target platform with query pre-filled.

### 2. OmniRoute & Local Daemon Monitor
- **Local Service Probing**: Actively monitors local ports for AI runtimes running on your machine:
  - OmniRoute (Port `8000`)
  - Ollama (Port `11434`)
  - LM Studio (Port `1234`)
  - LocalAI (Port `8080`)
- **One-Click Terminal Instructions**: Copyable shell commands to install, run, and configure OmniRoute, Ollama, and CLI tools.
- **Unified Configuration Generator**: Guides developers on load-balancing free Google Gemini, Groq, and Mistral keys behind an OpenAI-compatible endpoint (`http://localhost:8000/v1`) for use in Cursor, VS Code, or Aider.

### 3. API Key Vault & Allowance Tracker
- **Local Browser Key Storage**: Save and categorize developer keys for Gemini, Groq, Mistral, HuggingFace, OpenRouter, and GitHub Models.
- **Instant Console Links**: Direct links to provider consoles to generate keys without credit card requirements.
- **Live Connection Test**: Verify key validity and response latency directly from the vault.
- **Mask / Reveal & Copy**: Secure toggle to view or copy keys with a single click.

### 4. AI Architecture Advisor
- **Interactive Free-Tier Assistant**: Powered by Google Gemini (`@google/genai`), guiding users on optimal free-tier stacks for tasks like code refactoring, citation-grounded research, document synthesis, or local model hosting.
- **Resilient Fallback Guidance**: Includes rule-based fallback advice if an external API key is unconfigured.

### 5. Custom Tool Bookmark Manager
- **Add Custom Platforms**: Bookmark any new LLM, model playground, or internal agent with custom tags, allowance notes, and website URLs.
- **Full Data Portability**: Export your entire catalog, custom tools, API keys, and theme preferences to a single JSON backup file, or restore with one click.
- **Factory Reset**: Revert back to curated defaults anytime.

### 6. Design System & Theme Presets
- **Soft Paper**: Warm eggshell canvas (`#fbf8f3`), tactile card surfaces (`#f5f0e6`), warm borders, and pastel vermillion accents (`#f7591f`).
- **Blueprint**: Technical drafting aesthetic with white canvas, high-contrast borders, and rich blueprint navy ink (`#1d4ed8`).
- **Pastel Dusk**: Muted twilight dark theme with gentle rose accents (`#e0a8c5`).
- **Additional Presets**: Clean Slate, Obsidian Neon, Cyber Teal, Warm Sepia, Nordic Frost, Emerald Terminal.
- **Custom Accent Picker**: Custom hex color picker and quick swatches.
- **Theme JSON Editor**: Export or modify theme token JSON schemas directly.

---

## 🔮 Future Ideas & Roadmap Features

These are concepts and enhancements considered during the design and architecture phases:

- [ ] **OmniRoute Direct Key Sync**: One-click sync from the local Key Vault directly into a locally detected `~/.config/omniroute/config.json` via local agent daemon.
- [ ] **Automated Quota & Rate-Limit Telemetry**: Background health check against free-tier API endpoints to display live remaining RPM/TPM percentages and reset countdowns.
- [ ] **Model Comparison Matrix (Benchmark vs. Cost)**: Integrated visual benchmark matrix (HumanEval, MATH, SWE-bench) filtered strictly by whether the model has a free API or local weight availability.
- [ ] **Prompt Library & System Prompt Presets**: Curated prompt templates optimized for specific free models (e.g. Gemini 2.5 Flash, DeepSeek R1, Llama 3.3 70B) to maximize reasoning and tool use.
- [ ] **Local Model Performance Profiler**: Measure tokens-per-second (TPS) and VRAM footprint when connected to Ollama or LM Studio on the user's hardware.
- [ ] **PWA / Desktop Menubar Utility**: Convert AI Nexus into a lightweight tray/menubar app (Tauri/Electron) for quick global shortcut access (`Cmd+Shift+Space`).

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ (Node 20+ recommended)
- npm or pnpm

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd ai-nexus

# Install dependencies
npm install
```

### Environment Variables

Create a `.env` file in the project root:

```env
# Optional: Google Gemini API Key for the AI Architecture Advisor & key verification
GEMINI_API_KEY=your_gemini_api_key_here
```

*Note: The app runs completely without an API key; the AI Advisor includes local fallback guidance, and API keys can also be stored client-side in the Key Vault.*

### Running the Application

```bash
# Start local development server (Express + Vite)
npm run dev

# Open http://localhost:3000 in your browser
```

### Production Build

```bash
# Build client and bundle backend server
npm run build

# Start production server
npm start
```

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Motion
- **Icons**: Lucide React
- **Backend**: Express (Node.js), Vite middleware
- **AI Integration**: `@google/genai` (Gemini 2.5 Flash)
- **Persistence**: Client-side `localStorage` with JSON export/import
