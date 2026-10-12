# Key Vault

The Key Vault stores your API keys for free providers such as Gemini, Groq, OpenRouter, DeepSeek, OpenAI, Anthropic and Mistral, each with a label and the provider's free-tier notes. It is under **Secure** in the sidebar.

## Adding a key

Use the form at the top of the page: choose the provider, give the key a label (for example "My Free Gemini Dev Key"), paste the key, and press **Save to Local Vault**. The provider's free-allowance notes and a link to its key console appear in the form, so you can create a key and come straight back.

Only providers that LocalMind knows how to check can be saved in the vault. Retired providers are not offered.

## What you can do with a key

| Action | Notes |
|---|---|
| Reveal / hide | Keys are hidden by default |
| Copy | Copies the real key. A red cross appears if the clipboard refused |
| **Test** | Asks the provider whether the key is accepted |
| Config | Opens the [Config Exporter](/guide/configs-and-limits#config-exporter) for that provider |
| Delete | Removes the key |

## Testing a key

**Test** sends one small request to the provider's own website to see whether the key is accepted. The key goes only to that provider, over HTTPS, and only in a request header, never in the web address. It is the one thing in LocalMind that contacts a provider on your behalf, and only when you press the button.

The result is one of:

| Result | Meaning |
|---|---|
| **Valid** (green) | The provider accepted the key |
| **Rejected** (red) | The provider said the key is wrong |
| **Couldn't check** (amber) | A network error, a rate limit, a provider outage, or a provider LocalMind cannot check yet. The key's stored status is not changed |

The Home page shows how many of your keys are still unverified.

## How keys are stored

LocalMind encrypts each key before it is written to disk, using AES-256-GCM. On disk a key looks like `enc:v1:` followed by random-looking text. The key that unlocks them is generated the first time you need it and is kept in your operating system's credential store (Windows Credential Manager, macOS Keychain, or the Linux keyutils store), not in LocalMind's own files. Readable keys exist only in the app's memory while it is running.

For the full details, see [Privacy and security](/guide/privacy-and-security).

### Things that can go wrong

- **Keys from an older version** that were stored as plain text are encrypted automatically the first time you start a newer version.
- **Encryption fails** (for example the credential store is locked). The key stays in memory only and is *not* written to disk as plain text. A red warning tells you it will be gone when you close the app. Fix the credential store and add the key again.
- **A key "couldn't be decrypted on this device".** This happens if you copied LocalMind's data from another computer, or the credential store was wiped. The key is kept untouched, shown with an amber note, and Test is disabled. Delete it and add it again, or [restore a passphrase-protected backup](/guide/settings-and-backups#restore).

## Running in a plain browser

If you run the source code in a browser with `pnpm dev`, there is no desktop backend, so keys cannot be encrypted or tested, and keys are stored as plain text. That mode is for developing LocalMind only. Use the installed app for real keys.
