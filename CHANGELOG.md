# Changelog

All notable changes to LocalMind are listed here, newest first. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and versions follow [Semantic Versioning](https://semver.org/). The same highlights are shown in the app under About > What's New (`src/data/releases.ts`).

## [Unreleased]

## [1.0.0-beta.1] - 2026-10-11

First public beta. Everything below is new compared with the internal 0.1.0 build.

### Added
- **AI Tools:** catalog of free-tier AI tools with a filter rail, search, sorting, list or grid view, favorites, custom tools and Quick Query (open a tool with your prompt, prefilled where the site allows it).
- **Ask box (Home):** send a prompt to one default engine from the catalog, or opt in to Compare across several.
- **Setup:** detect and one-click install of Ollama, Gemini CLI and Qwen Code. Recipes are compiled into the app and you confirm the exact command before it runs. On macOS and Linux, tools installed with Homebrew, nvm or npm are found even when the app is opened from Finder or the Dock.
- **Runtimes:** detect local AI servers (Ollama, OmniRoute, LM Studio, Jan) by probing localhost ports from the Rust side.
- **Key Vault:** API keys encrypted with AES-256-GCM before they reach disk, master key in the OS credential store; test a key with Gemini, OpenRouter, Groq, OpenAI, DeepSeek, Mistral or Anthropic.
- **Config Exporter:** config snippets for 8 targets (editors, agents, SDKs, cURL), with keys masked on screen.
- **Rate-Limit Matrix:** free-tier quota comparison with review dates per provider and a fallback (rotation) order.
- **Bookmarks:** curated library of free web tools with a category rail, list or grid view, and import and export in JSON, browser HTML, CSV and Markdown.
- **Backups:** workspace backup and restore; API keys are left out unless you include them, and a passphrase (Argon2id + AES-256-GCM) protects backups that carry keys.
- **Live provider data (optional):** validated, cached provider data feed with a Refresh button, so retired providers and changed quotas can be corrected without a new release.
- **Themes:** 10 presets plus custom themes and accent color.
- **Report a Problem:** one `app.log` for Rust and frontend, key redaction, and a diagnostics file you save yourself.
- **Startup resilience:** crash screen and boot watchdog that always leave the window closable.
- **Documentation:** a user guide and contributor docs at https://zelucode.github.io/localmind/, opened from Help > Documentation.
- **Open source:** Apache-2.0 license, trademark policy, security policy and contributing guide.
- **App identifier:** `com.zelucode.localmind`. Data saved by a build that used `com.localmind.app` is not picked up automatically; use Settings > Data & Backups to carry it over.

### Known limits
- Run on Windows and macOS, including Setup, though not every feature has been checked on each. Linux bundles are built by the release workflow but have not been run on a real machine.
- Installers are not code-signed, so Windows SmartScreen and macOS Gatekeeper will warn.
- No in-app update check yet; install new versions by hand.
- The Advisor is built but hidden until its provider choice is made.

[1.0.0-beta.1]: https://github.com/zelucode/localmind/releases/tag/v1.0.0-beta.1
