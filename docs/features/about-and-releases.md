# About and What's New

## What it does for the user
Help > About LocalMind shows the app version (with a "beta" tag while the version has a suffix), a short privacy statement, and a **What's New** list: one row per release with its version, date and title. The version you are running is marked "This version" and starts open; older versions start collapsed. Click a row to open or close its highlights.

It is useful for two things: telling at a glance what the build you installed can do, and reading what changed after you update by hand (there is no update check yet, see backlog Task 8).

## How it works
- `src/components/AboutModal.tsx` renders the dialog. Open/closed state per row is local (a `Set` of versions), not remembered between sessions.
- The version comes from `package.json`; the rows come from `src/data/releases.ts` (`RELEASES`, newest first, each with `version`, `date`, `title` and `highlights`).
- `CHANGELOG.md` is the full, human-written history. `RELEASES` carries the same highlights in short form for the app. Both are edited by hand at release time.

## Keeping it honest and in step
`src/data/releases.test.ts` fails when:
- the version differs between `package.json`, `src-tauri/tauri.conf.json`, `src-tauri/Cargo.toml` and `src-tauri/Cargo.lock`,
- the first entry of `RELEASES` is not the running version,
- a release in `RELEASES` has no `## [version] - date` entry in `CHANGELOG.md`,
- releases are not newest first, or a date is not `YYYY-MM-DD`.

`src/copy.test.ts` also scans the component for banned marketing claims. Write highlights as what really ships; list limits (untested platforms, unsigned installers) in the same entry.

## Where the code lives
- `src/components/AboutModal.tsx`, `src/components/AboutModal.test.tsx`
- `src/data/releases.ts`, `src/data/releases.test.ts`
- `CHANGELOG.md`
- Release steps: [../BUILD.md](../BUILD.md)

## Limits
- Release notes are bundled with the app, so a running app only knows about versions up to its own. Showing newer versions needs the updater (Task 8).
- Row open/closed state is not persisted.
