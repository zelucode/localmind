# Releasing

## Where the version lives

The version must be identical in four places. `src/data/releases.test.ts` fails if it is not.

1. `package.json`: `version`
2. `src-tauri/tauri.conf.json`: `version`. This is what installers show.
3. `src-tauri/Cargo.toml`: `[package] version`
4. `src-tauri/Cargo.lock`: the `localmind` entry. It updates by itself on the next `cargo build`; commit it.

Versions follow [Semantic Versioning](https://semver.org/). Pre-releases use `-beta.N`, then `-rc.N`.

## Release notes in two places

- `CHANGELOG.md` is the full history, in [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) format, newest first, with a heading `## [x.y.z] - YYYY-MM-DD`. Changes that are not released yet go under `## [Unreleased]`. It is also published on this site.
- `src/data/releases.ts` (`RELEASES`, newest first) carries the same highlights in short form for the app's **About, then What's New** list.

Both are edited by hand at release time. The tests fail if the first entry of `RELEASES` is not the running version, if a release has no matching entry in the changelog, or if releases are out of order or have a malformed date. Write highlights as what really ships, and list limits such as untested platforms and unsigned installers in the same entry. `src/copy.test.ts` rejects marketing claims.

## Checklist

1. `pnpm test:all` is green.
2. Bump the four version places above.
3. Move the *Unreleased* entries in `CHANGELOG.md` under a new heading for the version and date, and add the matching entry to `RELEASES`.
4. Commit and merge to `main`.
5. Run **Build installers** on `main` with `draft_release` on. See [Building installers](/development/building#building-for-every-platform-github-actions).
6. Install the artifacts on a real machine of each system you claim to support, and check the things automated tests cannot: file downloads and the file picker, the credential store, a real install in Setup, and Report a Problem opening the log folder.
7. Open the draft release on GitHub and edit its notes. The workflow fills in a short fixed text, not the changelog, so paste in the version's section from `CHANGELOG.md`.
8. Publish the release. Publishing creates the `vX.Y.Z` tag.

## Documentation

This site rebuilds and publishes by itself whenever a change to `docs/` or the changelog reaches `main`; it is not part of the release steps. If a release changes what users see, make sure the matching page in `docs/guide/` is updated in the same pull request. See [Writing these docs](/development/docs).
