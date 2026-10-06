# Testing

## Run everything

```bash
pnpm test:all      # type-check, then frontend tests, then Rust tests
```

| Command | What it runs |
|---|---|
| `pnpm lint` | `tsc --noEmit`: the type check (clean; keep it clean) |
| `pnpm test` | Vitest + React Testing Library in jsdom (41 files, 400 tests) |
| `pnpm test:watch` | Vitest in watch mode |
| `pnpm test:rust` | `cargo test` for `src-tauri` (31 tests, 1 opt-in) |
| `pnpm test:all` | all of the above, in order |
| `cd src-tauri && cargo test -- --ignored` | the opt-in test that uses the real OS credential store |

**Disk space:** a Rust debug build is several GB. If `cargo test` fails with "not enough space on the disk", point the build output at another drive: `CARGO_TARGET_DIR=E:/cargo-targets/localmind pnpm test:rust` (PowerShell: `$env:CARGO_TARGET_DIR='E:/cargo-targets/localmind'`).

## Frontend tests

- Config: `vitest.config.ts` (jsdom, `src/test/setup.ts`, alias `@` → repo root). Tests sit next to the code as `*.test.ts(x)`.
- `src/test/setup.ts` clears `localStorage` and unmounts after every test and adds a `matchMedia` shim.
- **The Rust backend is mocked** at `src/lib/backend` (or at `@tauri-apps/api/core` for the wrapper tests). Tests that need "inside the desktop app" set `window.__TAURI_INTERNALS__`; tests without it exercise the plain-browser path.
- **App-level tests** render `<App />` with the boot animation and welcome dialog switched off through localStorage, then drive the real UI (`App.test.tsx`, `App.keys.test.tsx`, `App.advisor.test.tsx`).

| Area | Files |
|---|---|
| Shell | `Sidebar`, `Header`, `HomePage`, `LoadingScreen`, `ErrorBoundary`, `bootWatchdog` (runs the real script from `index.html`), `App` |
| Pages | `ToolsPage`, `BookmarksPage`, `OmniRouteWidget`, `ApiKeyVaultModal` |
| Search and Advisor | `GlobalSearchModal`, `AIAdvisorModal`, `App.advisor` |
| Libraries | `lib/tauri`, `lib/backend`, `lib/secureKeys` |
| Keys end to end | `App.keys` (encrypted save, migration, reload, undecryptable keys, no plaintext fallback) |

### Writing a frontend test
- Query by role or label (`getByRole('button', { name: ... })`), not by class names.
- Use real seed data (`INITIAL_AI_TOOLS`, `DEFAULT_BOOKMARKS`) and derive expected counts from it, so a data change doesn't need a test change.
- If a test finds a bug, fix the bug and keep the test. Several tests here are regressions (custom port field, Ctrl+K bookmark titles, coding-agent config button).

## Rust tests

Unit tests live in each module (`probe.rs`, `keys.rs`, `advisor.rs`, `secrets.rs`) under `#[cfg(test)]`. Pure logic (validation, request building, response parsing, crypto) is separated from I/O so it can be tested without a network or an OS keychain: the key store is a trait with an in-memory test double, and the probe tests use real loopback sockets.

## What is not covered yet
The real IPC boundary (command names, argument shapes and permissions between the webview and Rust) is only covered by mocks. A smoke suite against the real app is backlog Task 18. Features still to be audited are listed in backlog Task 9.
