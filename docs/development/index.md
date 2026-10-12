# Contributing and development

LocalMind is a [Tauri 2](https://tauri.app/) desktop app: a Rust shell hosting a React 19 interface. This section is for people who want to build it, change it or release it. If you only want to use the app, start with the [user guide](/guide/).

Bug reports, fixes, provider-data updates and documentation improvements are all welcome. For anything bigger than a small fix, please open an issue first so we can agree on the approach. Security problems go through private reporting, not issues; see the [security policy](https://github.com/zelucode/localmind/blob/main/SECURITY.md).

## Set up

You need:

- [Node.js](https://nodejs.org/) 20 or newer and [pnpm](https://pnpm.io/) 12.
- [Rust](https://www.rust-lang.org/tools/install) (stable).
- The [Tauri 2 prerequisites](https://tauri.app/start/prerequisites/) for your system. On Windows: the Microsoft C++ Build Tools and WebView2.

```sh
git clone https://github.com/zelucode/localmind.git
cd localmind
pnpm install
pnpm tauri dev
```

`pnpm tauri dev` starts Vite on port 1420 and then compiles and launches the Rust shell. The first Rust build takes several minutes.

## Commands

| Command | What it does |
|---|---|
| `pnpm tauri dev` | Run the desktop app with hot reload |
| `pnpm tauri build` | Build an installer for the system you are on. See [Building installers](/development/building) |
| `pnpm dev` | Run only the interface in a browser. Backend features (port scanning, key encryption and testing, setup) are unavailable and say so |
| `pnpm build` | Build the interface to `dist/` |
| `pnpm lint` | Type-check with `tsc --noEmit` |
| `pnpm test` | Frontend tests |
| `pnpm test:rust` | Rust tests |
| `pnpm test:all` | Type-check, frontend tests and Rust tests. Run this before opening a pull request |
| `pnpm feed:build` | Regenerate `feed/providers.json` after editing `src/data/providers.ts` |
| `pnpm docs:dev` | Run this documentation site locally, with live reload |
| `pnpm docs:build` | Build the documentation site and fail on a broken link |

On Windows, `pnpm` blocks dependency build scripts by default. `esbuild` is allowed through `allowBuilds` in `pnpm-workspace.yaml`.

## Project layout

```
.
├── src/                   React interface
│   ├── App.tsx            App-wide state: view, theme, tools, keys, bookmarks, modals
│   ├── components/        Pages and dialogs
│   ├── config/            Feature flags
│   ├── data/              Built-in catalogs: tools, bookmarks, providers, releases
│   ├── lib/               Backend wrappers, key encryption, logging, feed, backup
│   ├── test/setup.ts      Vitest setup
│   ├── theme.ts           Theme presets applied as CSS variables
│   └── types.ts           The data model
├── src-tauri/             Rust shell
│   ├── src/               One module per command group (see Architecture)
│   ├── capabilities/      Tauri permission sets
│   ├── icons/             App icons
│   └── tauri.conf.json    Window, bundle and build config
├── docs/                  This documentation site (VitePress)
├── feed/providers.json    The published provider-data file, generated
├── scripts/               Build scripts (feed generator)
├── public/                Favicons and web manifest
└── .github/workflows/     Build and docs deployment
```

Read [Architecture](/development/architecture) next for how the pieces fit together.

## Rules worth knowing

These are enforced by tests or review. Please keep to them.

- **Never log, display or store a secret in plain text.** See [Logging and diagnostics](/development/logging) and [Security design](/development/security-design).
- **Never fake a result.** Outside the desktop app, a backend call must fail visibly with `BackendUnavailableError`. Do not show "online" or "valid" by default.
- **Do not add a way to run a command that comes from the interface or the remote feed.** Setup commands are compiled into the app. See [Setup recipes](/development/setup-recipes).
- **External links go through `openExternal`**, not a bare `window.open`.
- **Do not delete an unfinished feature.** Hide it behind a flag in `src/config/features.ts` and keep its tests.
- **Style with theme variables** (`var(--theme-*)`), never fixed colors, so every theme works.
- **Keep the copy honest.** A test scans the components for banned marketing claims. Describe what ships, and state limits.

## Making a change

1. Fork the repository and create a branch.
2. Make the change, with a test if it changes behavior. Query by role or label in tests rather than by class name.
3. Run `pnpm test:all`.
4. If you edited `src/data/providers.ts`, run `pnpm feed:build`.
5. If you changed behavior a user would notice, update the matching page in `docs/guide/` and add a line under *Unreleased* in `CHANGELOG.md`.
6. Commit with a sign-off (see below) and open a pull request.

### Sign-off and license

LocalMind is licensed under the [Apache License 2.0](https://github.com/zelucode/localmind/blob/main/LICENSE). By contributing, you agree that your contribution is licensed under the same license.

Every commit must be signed off under the [Developer Certificate of Origin](https://developercertificate.org/), which states that you wrote the change or have the right to submit it:

```sh
git commit -s
```

This adds a `Signed-off-by: Your Name <you@example.com>` line to the commit message.

LocalMind is developed as open core. This repository is the free, open-source app, and paid editions may be built on top of it. Apache 2.0 allows that, and your contribution stays available under Apache 2.0 here regardless.
