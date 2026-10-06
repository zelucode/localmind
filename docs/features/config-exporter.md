# Config Exporter

**Audit status: working** (audited 2026-10-06, Task 9).

## What the user sees

**Configs & Limits → Config Exporter** generates a ready-to-paste setup for one of 8 targets (Continue, Cline, Cursor, Aider, Windsurf, Python SDK, TypeScript SDK, cURL) with one of 7 providers (Gemini, Groq, OpenRouter, DeepSeek, Mistral, OmniRoute, Ollama) and one of that provider's free models. The key comes from the Key Vault entry for that provider, or from a key pasted in the page (which can be saved to the vault). A toggle switches to a `YOUR_<ENV_VAR>` placeholder. **Secrets are masked.** The paste-a-key field is a password field with an eye button, and the code block shows `••••` instead of a real key (vault or pasted) until the eye next to **Copy Config** is clicked. **Copy Config** always copies the real key, so the snippet works when pasted. Placeholders and the dummy local key are not secret and are never masked. Changing provider re-hides everything. **Copy Config** copies the snippet; it says "Copy failed" if the clipboard write is refused. **Get Key** opens the provider's key page in the system browser. Opening the page from the Rate-Limit Matrix preselects that provider *and its default model*.

## How it works
- `src/data/providers.ts`: the provider presets (`PROVIDER_PRESETS`, shared with the matrix and the vault list).
- `src/lib/configSnippet.ts`: `buildConfigSnippet()`, a pure function (no React) so every target and provider combination is testable. `joinUrl()` joins a base URL and a path with exactly one slash.
- `src/components/IDEConfigExporterModal.tsx`: selection state, key resolution (typed key > vault key > `dummy-key` for the local OmniRoute/Ollama > placeholder), clipboard, link handling.

## Bugs found and fixed in the audit
- cURL: base URLs without a trailing slash produced `.../v1chat/completions` for every provider except Gemini.
- Continue: the `tabAutocompleteModel` block always pointed at Groq and embedded the vault's Groq key, even when another provider was selected. It is now added only for Groq, with the same key. The output is built with `JSON.stringify`, so it is valid JSON and a quote in a pasted key can't break it. Ollama gets no `apiKey`.
- Aider: Groq mixed `--openai-api-base` with a `groq/` model, and every provider exported an env var the command did not use. Natively supported providers (Gemini, Groq, OpenRouter, Mistral) now use `<prefix>/<model>` with their own env var; the others use the OpenAI-compatible flags only.
- Opening the exporter for a provider other than Gemini kept Gemini's model selected.
- Copy always showed "Copied" even if the clipboard write failed.
- "Get Key" was a bare `target="_blank"` link; it now goes through `openExternal`.
- Removed an unused `import os` and a misleading comment from the Gemini Python snippet.

## Tests
- `configSnippet.test.ts`: every tool x provider contains the key and model, cURL URLs, Continue JSON validity / no cross-provider key / Groq autocomplete / Ollama no key / quote escaping, Aider variants, SDK choice, preset integrity.
- `IDEConfigExporterModal.test.tsx`: initial provider and model, vault key, placeholder toggle, Get Key via `openExternal`, copy success and failure, masking of vault and pasted keys, eye toggles, copy of the real key while masked.

## Limits and open questions
- **Preset data is not verified against the providers.** Model IDs and endpoints were never checked and may be stale. Suspects: Groq `qwen-2.5-coder-32b`, OpenRouter `stepfun/step-3.5-flash:free`, and Mistral's free Codestral key using a separate `codestral.mistral.ai` endpoint. Needs a manual check against each provider's docs; rate numbers in the model notes likewise.
- The clipboard holds the real key after a copy (the feature's purpose); it is not cleared automatically.
- Keys saved from this page for GitHub / OmniRoute / Ollama are stored with a provider id outside the vault's `StoredApiKey['provider']` union (cast with `as any`).
- The Cline, Cursor and Windsurf outputs are step-by-step instructions, not files, and menu names in those apps can change.
