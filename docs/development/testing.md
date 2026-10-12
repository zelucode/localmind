# Testing

```sh
pnpm test:all      # type-check, then frontend tests, then Rust tests
```

| Command | What it runs |
|---|---|
| `pnpm lint` | `tsc --noEmit`, the type check. It is clean, so keep it clean |
| `pnpm test` | Vitest and React Testing Library in jsdom |
| `pnpm test:watch` | Vitest in watch mode |
| `pnpm test:rust` | `cargo test` for `src-tauri` |
| `pnpm test:all` | All of the above, in order |
| `cd src-tauri && cargo test -- --ignored` | The opt-in test that uses the real OS credential store |

**Disk space.** A Rust debug build is several GB. If `cargo test` fails with "not enough space on the disk", point the build output at another drive: `CARGO_TARGET_DIR=E:/cargo-targets/localmind pnpm test:rust`. In PowerShell, set `$env:CARGO_TARGET_DIR` first.

## Frontend tests

- Configuration is in `vitest.config.ts`: jsdom, `src/test/setup.ts`, and the `@` alias pointing at the repository root. Tests sit next to the code as `*.test.ts(x)`.
- `src/test/setup.ts` clears `localStorage`, unmounts after every test and adds a `matchMedia` shim.
- **The Rust backend is mocked** at `src/lib/backend` (or at `@tauri-apps/api/core` for the wrapper tests). A test that needs to be "inside the desktop app" sets `window.__TAURI_INTERNALS__`. Without it, the test exercises the plain-browser path.
- **App-level tests** render `<App />` with the boot animation and welcome dialog switched off through `localStorage`, then drive the real interface: `App.test.tsx`, `App.keys.test.tsx`, `App.backup.test.tsx`, `App.shortcuts.test.tsx` and `App.advisor.test.tsx`.

Some tests guard the project's rules rather than a single feature:

- `src/copy.test.ts` reads the source of every component and fails if a banned marketing claim returns.
- `src/data/releases.test.ts` fails if the version differs between `package.json`, `tauri.conf.json`, `Cargo.toml` and `Cargo.lock`, or if the in-app release list drifts from `CHANGELOG.md`.
- `src/lib/feed.test.ts` fails if `feed/providers.json` drifts from `src/data/providers.ts`.
- `bootWatchdog.test.ts` extracts the real script from `index.html` and runs it with fake timers.

### Writing a frontend test

- Query by role or label (`getByRole('button', { name: ... })`), not by class name.
- Use the real seed data (`INITIAL_AI_TOOLS`, `DEFAULT_BOOKMARKS`) and derive expected counts from it, so a data change does not need a test change.
- If a test finds a bug, fix the bug and keep the test. Several tests here began as regressions.

## Rust tests

Unit tests live in each module under `#[cfg(test)]`. Pure logic (validation, request building, response parsing, crypto) is separated from I/O so it can be tested without a network or an OS keychain:

- The key store is a trait with an in-memory test double.
- The probe tests use real loopback sockets.
- The `feed.rs` tests run `fetch_feed` itself against a throwaway local server: success, HTTP error, oversized body, redirect off HTTPS, non-text body, unreachable server.
- The `setup.rs` tests check recipe data and detection without installing anything.

## What is not covered

- The real boundary between the webview and Rust (command names, argument shapes and permissions) is covered only by mocks. A smoke suite against the running app would close that gap.
- Anything that needs a real machine: file downloads and the file picker in the packaged window, the OS credential store on macOS and Linux, real installs in Setup, and how long the backup key derivation takes on a slow computer.
