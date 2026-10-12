# Configs and limits

This page has two tabs: the **Config Exporter** and the **Rate Limits** table. It is under **Developer** in the sidebar.

## Config Exporter

Generates a ready-to-paste setup so your editor or SDK talks to a free provider.

Choose:

- **A target**: Continue, Cline, Cursor, Aider, Windsurf, the Python SDK, the TypeScript SDK, or cURL.
- **A provider**: Gemini, Groq, OpenRouter, DeepSeek, Mistral, OmniRoute or Ollama.
- **A model** from that provider's free models.

The page fills in the right base URL, environment variable names and model ID, and shows the result in a code block.

### Where the key comes from

The key comes from your [Key Vault](/guide/key-vault) entry for that provider, or from a key you paste into the page, which you can save to the vault. A toggle switches to a `YOUR_<ENV_VAR>` placeholder instead, which is handy for sharing a snippet. Ollama and OmniRoute running locally use a dummy key.

### Keys are masked on screen

The paste-a-key field is a password field with an eye button, and the code block shows `••••` instead of a real key until you click the eye. **Copy Config** always copies the real key, so the snippet works when you paste it. Placeholders and the dummy local key are not secrets and are never masked. Changing provider hides everything again.

::: warning
After you copy, the real key is on your clipboard. LocalMind does not clear it for you.
:::

### Buttons

- **Copy Config** copies the snippet. It says "Copy failed" if the clipboard refuses.
- **Get Key** opens the provider's page for creating a key, in your browser.

For Cline, Cursor and Windsurf the output is step-by-step instructions rather than a file, because those apps are configured through their settings screens. Menu names in those apps can change.

::: tip
Open the exporter from a tool on the **AI Tools** page (the `</>` button) or from a row in the rate-limit table to start with that provider and its default model already selected.
:::

## Rate-Limit Matrix

Free tiers are free only up to a quota, and quotas differ: requests per minute, requests per day, context size, whether a card is required. When a quota runs out, your coding assistant just starts failing. This table helps you choose and plan.

- **Compare providers** side by side. Search the table, or filter by Cloud, Router or Local. Each row has a **Config** button that jumps to the exporter with that provider selected, and a link to the provider's key page.
- Each row shows when it was last checked ("Checked Oct 2026") or that it was not re-checked. A provider that has been retired shows a **Retired** badge.
- A **Key saved** badge marks providers that already have a key in your vault.
- **Suggested fallback order** under the table proposes a way to chain providers: a large-context cloud model first, a fast cloud model next, a burst buffer, and an offline local model last. Three tips explain how to hit limits less often.

### How reliable are the numbers?

This is reference material, not a live meter. The numbers are entered by hand, providers change them every few weeks, and some are reported as "Varies" because the provider's own pages disagree. LocalMind does not measure your real usage and does not call any provider to fill in the table. The footer says where the data came from and has a **Refresh data** button; see [Live provider data](/guide/settings-and-backups#live-provider-data).

Always confirm a limit on the provider's site before building on it.
