# Security design

How LocalMind protects API keys and backups. For the user-facing summary, see [Privacy and security](/guide/privacy-and-security). To report a vulnerability, follow the [security policy](https://github.com/zelucode/localmind/blob/main/SECURITY.md).

## Keys at rest

Keys are encrypted by Rust (`src-tauri/src/secrets.rs`) before they are written to `localStorage`. On disk a key looks like `enc:v1:<base64>`.

- **Cipher:** AES-256-GCM. Each encryption uses a fresh random nonce, so the same key encrypts differently every time. The token format version is bound into the cipher as associated data (`localmind/secret/v1`), and any tampering is detected on decrypt.
- **Master key:** a random 256-bit key, generated on first use and kept in the operating system's credential store: Windows Credential Manager, macOS Keychain, or Linux keyutils (service `LocalMind`, entry `master-key-v1`). It never reaches the webview.
- **In memory:** React state holds keys as plaintext so the rest of the interface works unchanged. They are never written back to disk in plaintext.
- **Frontend side:** `src/lib/secureKeys.ts` provides `parseStoredKeys` (a synchronous read; encrypted entries load *locked*), `unlockKeys` (decrypt on startup and migrate old plaintext) and `serializeKeys` (encrypt on save).

### Edge cases

- **Existing plaintext keys** from older versions are encrypted automatically on first launch.
- **Encryption failure** (for example a locked credential store): the key stays in memory only and is **not** written in plaintext. The Vault shows a red warning that it will not survive closing the app. There is no plaintext fallback inside Tauri.
- **Undecryptable keys** (data copied from another device, or a wiped credential store): kept in storage untouched, shown with an amber note, with Test disabled. Other saves never overwrite them.
- **Writes are queued**, so rapid changes always end with the latest state on disk.
- **Plain browser (`pnpm dev`)** has no backend, so keys are stored as plaintext. This path exists for development only.

## Verifying a key

`verify_api_key` (`src-tauri/src/keys.rs`) calls a lightweight, authenticated endpoint per provider over HTTPS with a 10 second timeout.

| Provider | Endpoint | Key sent as |
|---|---|---|
| Gemini | `generativelanguage.googleapis.com/v1beta/models` | `x-goog-api-key` header |
| OpenRouter | `openrouter.ai/api/v1/auth/key` | Bearer |
| Groq | `api.groq.com/openai/v1/models` | Bearer |
| OpenAI | `api.openai.com/v1/models` | Bearer |
| DeepSeek | `api.deepseek.com/models` | Bearer |
| Mistral | `api.mistral.ai/v1/models` | Bearer |
| Anthropic | `api.anthropic.com/v1/models` | `x-api-key` plus a version header |

The key goes only to its own provider, and only in a header, never in the URL. HTTP 200 to 299 is valid. 401 or 403 (and 400 for Gemini) is rejected. 429 and 5xx are "couldn't check". Providers marked "other" return *unsupported* with an honest message. A key that is empty, contains whitespace or control characters, or is over 512 characters is rejected before any request.

**The vault provider list** comes from `useProviderData().vaultProviders`. Only providers the Rust side can verify (`VAULT_PROVIDER_IDS`) can be in the vault, whatever a feed says.

## Backups

`src-tauri/src/backupcrypto.rs` (`encrypt_backup`, `decrypt_backup`) protects a backup with a passphrase.

- The file is a JSON envelope: `format`, `version`, `kdf` (Argon2id settings and salt), `nonce` and `data`.
- Key derivation is **Argon2id**. New files use 64 MiB of memory, 3 passes and 1 lane. The settings are read back from the file but range-checked, so a crafted file cannot demand huge memory or time.
- The cipher is AES-256-GCM. Salt and nonce are random per file.
- A wrong passphrase and a changed file are indistinguishable and give one message. Nothing about the passphrase is logged.
- Backups are version 2. Version 1 files still import.
- Because the file does not depend on the device's credential store, a protected backup with keys can be restored on another computer. Restored keys are re-encrypted with that device's own master key, and per-device encryption data in a file is discarded.

The frontend side is `src/lib/backup.ts` (`buildBackup`, `parseBackup`, `describeRestore`, `isEncryptedBackup`, `passphraseProblem`). Keys are included only when the user opts in, and a backup made without keys never touches the saved keys on restore.

## Things that must stay true

- **No plaintext secrets on disk, in logs or in diagnostics.** See [Logging and diagnostics](/development/logging).
- **No command from the interface or the feed.** See [Setup recipes](/development/setup-recipes).
- **Strict validation of anything that reaches a copy-paste command.** Model IDs, URLs and environment variable names from the feed are checked because they end up in the Config Exporter's snippets.
- **Only `http` and `https` links** are accepted for tools and bookmarks (`src/lib/url.ts`, `safeHttpUrl`).
- **Spreadsheet exports neutralize formulas.** CSV cells starting with `=`, `+`, `-` or `@` are prefixed, and the prefix is removed on import.

## Known gaps

- The content security policy in `tauri.conf.json` is `null`.
- The live provider-data file is not signed. Anyone who controls the published file controls what the app shows, which is why validation is strict and the address is visible and changeable in Settings.
- The clipboard keeps a real key after the user copies it. This is the point of the copy button, and it is not cleared automatically.
