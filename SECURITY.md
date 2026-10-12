# Security policy

LocalMind stores API keys on your machine, so security reports are taken seriously.

## Reporting a vulnerability

Please **do not** open a public issue for security problems.

Report privately through GitHub, or by email to [hello@zelucode.com](mailto:hello@zelucode.com) if you cannot use GitHub: go to the [Security tab](https://github.com/zelucode/localmind/security) of this repository and click **Report a vulnerability**. Include:

- what is affected (version, OS),
- steps to reproduce,
- what an attacker could achieve.

You should get a first reply within 7 days. Once a fix is released, the advisory is published and you are credited unless you prefer otherwise.

## Supported versions

Only the latest release receives security fixes.

## Scope

Especially relevant areas:

- the key vault: `src-tauri/src/secrets.rs`, `src/lib/secureKeys.ts` (AES-256-GCM, master key in the OS credential store),
- encrypted backups: `src-tauri/src/backupcrypto.rs` (Argon2id + AES-256-GCM),
- secrets leaking into logs or diagnostics: `src-tauri/src/applog.rs`, `src/lib/errorLog.ts`,
- the remote data feed: `src-tauri/src/feed.rs`,
- one-click setup, which runs install commands: `src-tauri/src/setup.rs`.

Out of scope: problems that require an attacker who already controls your user account or machine, and issues in third-party AI providers themselves.
