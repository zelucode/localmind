# Key Vault

## What the user sees

The **Key Vault** page stores API keys for Gemini, Groq, OpenRouter, DeepSeek, OpenAI, Anthropic, Mistral and others, each with a label and the provider's free-tier notes. Per key: reveal/hide, copy, **Test**, open the Config Exporter for that provider, delete. A link to each provider's key console helps get a new key.

**Test** asks the provider whether the key is accepted and shows one of:
- **Valid** (green): the provider accepted it.
- **Rejected** (red): the provider said the key is wrong.
- **Couldn't check** (amber): network error, rate limit, server error, or a provider we can't verify yet. The key's stored status is not changed.

The Home page shows how many keys are unverified.

## How keys are stored (encrypted at rest)

- Keys are encrypted with **AES-256-GCM** by Rust (`src-tauri/src/secrets.rs`) before they are written to `localStorage`. On disk a key looks like `enc:v1:<base64>`.
- The 256-bit **master key** is generated on first use and kept in the operating system's credential store: Windows Credential Manager, macOS Keychain, or Linux keyutils (service `LocalMind`, entry `master-key-v1`). It never reaches the webview.
- Every encryption uses a fresh random nonce, so the same key encrypts differently each time. The token format version is bound into the cipher as associated data, and any tampering is detected on decrypt.
- In memory (React state) keys are plaintext so the rest of the UI works unchanged; they are never written back to disk in plaintext.
- `src/lib/secureKeys.ts` is the frontend side: `parseStoredKeys` (sync read, encrypted entries load *locked*), `unlockKeys` (decrypt on startup and migrate old plaintext), `serializeKeys` (encrypt on save).

### Migration and edge cases
- **Existing plaintext keys** from older versions are encrypted automatically on first launch.
- **Encryption failure** (for example the credential store is locked): the key stays in memory only, is **not** written in plaintext, and the Vault shows a red warning that it won't survive closing the app.
- **Undecryptable keys** (data copied from another device, or the credential store was wiped): kept in storage untouched, shown with an amber note ("couldn't be decrypted on this device. Delete it and add it again"), with Test disabled. Other saves never overwrite them.
- **Writes are queued**, so rapid changes always end with the latest state on disk.
- **Plain browser (`pnpm dev`)**: there's no backend, so keys are stored as plaintext. This path is for development only.

## How verification works

`verify_api_key` (`src-tauri/src/keys.rs`) calls a lightweight, authenticated endpoint per provider over HTTPS with a 10 s timeout:

| Provider | Endpoint | Key sent as |
|---|---|---|
| Gemini | `generativelanguage.googleapis.com/v1beta/models` | `x-goog-api-key` header |
| OpenRouter | `openrouter.ai/api/v1/auth/key` | Bearer |
| Groq | `api.groq.com/openai/v1/models` | Bearer |
| OpenAI | `api.openai.com/v1/models` | Bearer |
| DeepSeek | `api.deepseek.com/models` | Bearer |
| Mistral | `api.mistral.ai/v1/models` | Bearer |
| Anthropic | `api.anthropic.com/v1/models` | `x-api-key` + version header |

The key goes only to its own provider, only in a header (never in the URL). HTTP 200–299 is valid; 401/403 (and 400 for Gemini) is rejected; 429 and 5xx are "couldn't check". Providers marked "other" return *unsupported* with an honest message. Keys that are empty, contain whitespace/control characters, or are over 512 characters are rejected before any request.

## Provider list
The providers offered when adding a key come from `useProviderData().vaultProviders` (built-in data, or the live feed when set up; retired providers are not offered). Only the providers the Rust side can verify (`VAULT_PROVIDER_IDS`) can be in the vault, whatever a feed says. See [remote-data-feed.md](remote-data-feed.md).

## Backups
**Export backup** (Settings) leaves keys out unless the user ticks "Include my API keys". Because the key-encryption key is tied to this device, keys in a backup are readable text unless the file is protected with a passphrase, which Settings recommends and switches on when keys are included (Argon2id + AES-256-GCM, see [settings-and-backup.md](settings-and-backup.md)). Importing re-encrypts keys with this device's key.

## Tests
- **Rust** (`secrets::tests`, `keys::tests`): round trip, empty and unicode secrets, unique nonces, wrong master key, tamper detection, malformed tokens, size limits, batch behavior with one bad token, tokens from another device, an unreachable key store, batch limits, request building for every provider (key in a header, HTTPS, never in the URL), status classification. One opt-in test (`cargo test -- --ignored`) exercises the real OS credential store.
- **Frontend**: `secureKeys.test.ts` (parse, unlock, migrate, serialize, backup, problem messages), `App.keys.test.tsx` (encrypted on save, migration, unlock on start, survives a reload, undecryptable keys preserved, no plaintext fallback, delete), `ApiKeyVaultModal.test.tsx` (valid / rejected / couldn't-check / backend unavailable).
