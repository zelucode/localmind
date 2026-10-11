# Contributing to LocalMind

Thanks for helping. Bug reports, fixes, provider data updates, and docs improvements are all welcome.

## Before you start

- For anything bigger than a small fix, open an issue first so we can agree on the approach.
- Security problems go through private reporting, not issues. See [SECURITY.md](SECURITY.md).

## Development

Setup, commands, and project structure are in the [README](README.md#getting-started) and [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md). Before opening a pull request, run:

```sh
pnpm test:all   # tsc, Vitest, and Rust unit tests
```

If you edited `src/data/providers.ts`, also run `pnpm feed:build`.

## Rules worth knowing

- Never log, display, or store a secret in plain text (see `docs/features/logging-and-diagnostics.md`).
- Outside Tauri, backend calls must fail visibly; never fake a result.
- Don't add a way to run a command that comes from the frontend or the remote feed.
- External links go through `openExternal`.

## License and sign-off

LocalMind is licensed under the [Apache License 2.0](LICENSE). By contributing, you agree that your contribution is licensed under the same license.

Every commit must be signed off under the [Developer Certificate of Origin](https://developercertificate.org/) (DCO), which states that you wrote the change or have the right to submit it. Add the sign-off with:

```sh
git commit -s
```

This adds a line like `Signed-off-by: Your Name <you@example.com>` to the commit message.

LocalMind is developed as open core: this repository is the free, open-source app, and paid editions may be built on top of it. Apache 2.0 allows that, so your contribution stays available under Apache 2.0 in this repository no matter what.
