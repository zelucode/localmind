---
layout: home
title: LocalMind
titleTemplate: Your private AI hub, always nearby

hero:
  name: LocalMind
  text: Your private AI hub, always nearby.
  tagline: A free, open-source desktop app that catalogs free-tier AI tools, finds the AI servers running on your computer, and keeps your API keys in an encrypted local vault.
  image:
    src: /favicon.svg
    alt: LocalMind logo
  actions:
    - theme: brand
      text: Get started
      link: /guide/install
    - theme: alt
      text: What is LocalMind?
      link: /guide/
    - theme: alt
      text: View on GitHub
      link: https://github.com/zelucode/localmind

features:
  - title: Find free AI tools
    details: A catalog of 29 AI tools with their free-tier limits, whether they need a credit card, and whether they can edit your local files. Plus 270 free web tools in Bookmarks.
    link: /guide/ai-tools
    linkText: Browse the catalog
  - title: Ask any free AI
    details: Type a prompt once and open it in the AI you choose. Prefilled where the site allows it, copied to your clipboard where it does not.
    link: /guide/home
    linkText: How the Ask box works
  - title: See what runs locally
    details: Detects Ollama, LM Studio, Jan and OmniRoute on your machine, and installs Ollama, Gemini CLI and Qwen Code with one confirmed command.
    link: /guide/runtimes
    linkText: Local runtimes
  - title: Keep keys in a local vault
    details: API keys are encrypted with AES-256-GCM before they touch disk. The master key lives in your operating system's credential store. You can test a key against its provider.
    link: /guide/key-vault
    linkText: The Key Vault
  - title: Export ready-made configs
    details: Copy a working setup for Continue, Cline, Cursor, Aider, Windsurf, the Python and TypeScript SDKs, or cURL, and compare free-tier rate limits side by side.
    link: /guide/configs-and-limits
    linkText: Configs and limits
  - title: Private by design
    details: No account, no telemetry. Your data stays on this computer. The only network calls are the ones you start, such as testing a key.
    link: /guide/privacy-and-security
    linkText: Privacy and security
---
