# Building LocalMind

LocalMind is built with the Tauri CLI. `pnpm tauri build` runs `pnpm build` (Vite, output in `dist/`), compiles the Rust shell in release mode, and packages the installers for the OS you are building on.

## Prerequisites

- Node.js 20+ and pnpm
- Rust (stable) via [rustup](https://rustup.rs/)
- Platform dependencies from the [Tauri 2 prerequisites](https://tauri.app/start/prerequisites/):
  - **Windows:** Microsoft C++ Build Tools ("Desktop development with C++") and WebView2 (preinstalled on Windows 11)
  - **macOS:** Xcode Command Line Tools (`xcode-select --install`)
  - **Linux:** `webkit2gtk-4.1`, `libappindicator`, `librsvg`, `patchelf` and build essentials (see the Tauri docs for your distro)

## Build

```bash
pnpm install
pnpm tauri build
```

The first build compiles all Rust dependencies and takes several minutes; later builds are incremental. The release profile in `src-tauri/Cargo.toml` uses LTO, `opt-level = 3`, `panic = "abort"` and stripped symbols, which makes release builds slower but smaller.

Useful variants:

| Command | Result |
|---|---|
| `pnpm tauri build --debug` | Faster build with debug symbols, not optimized |
| `pnpm tauri build --bundles nsis` | Only the listed bundle type(s). **Use this on Windows while the version has a pre-release suffix** (see "Pre-release versions") |
| `pnpm tauri build --no-bundle` | Compile the executable only, no installer |

## Output

Artifacts land in `src-tauri/target/release/`:

| Path | Content |
|---|---|
| `localmind.exe` (`localmind` on macOS/Linux) | Raw executable |
| `bundle/nsis/` | Windows `.exe` setup installer |
| `bundle/msi/` | Windows `.msi` installer |
| `bundle/dmg/`, `bundle/macos/` | macOS disk image and `.app` |
| `bundle/deb/`, `bundle/rpm/`, `bundle/appimage/` | Linux packages |

`bundle.targets` is `"all"` in [tauri.conf.json](../src-tauri/tauri.conf.json), so every format valid for the host OS is produced. Narrow it there (for example `["nsis"]`) to speed up builds.

## Building for other platforms (GitHub Actions)

Tauri does not cross-compile desktop bundles reliably, so each OS is built on its own runner. [`.github/workflows/build.yml`](../.github/workflows/build.yml) does this for all three, and it only runs when you start it by hand:

1. GitHub → **Actions** → **Build installers** → **Run workflow**, pick the branch or tag.
2. Options:
   - `run_tests` (default on): lint, Vitest and Rust tests on Linux must pass before any build starts.
   - `draft_release` (default off): also create a **draft** GitHub Release named `v<version>` with the installers attached. Nothing is published until you press Publish.
   - `prerelease` (default on): marks that draft as a pre-release.
3. When it finishes, the installers are in the run's **Artifacts** (kept 14 days): `localmind-windows`, `localmind-macos`, `localmind-linux`.

| Runner | Output | Bundles |
|---|---|---|
| `windows-latest` | NSIS `.exe` setup | `--bundles nsis` |
| `macos-latest` | universal (Apple Silicon + Intel) `.dmg` | `--target universal-apple-darwin --bundles dmg` |
| `ubuntu-22.04` | `.deb`, `.rpm`, `.AppImage` | `--bundles deb,rpm,appimage` |

Ubuntu 22.04 is used on purpose: Linux builds depend on the glibc and WebKitGTK of the build machine, so building on an older LTS keeps them usable on more distros.

The workflow has not been run on GitHub yet. Expect to fix small things on its first run (an action version, a missing system library) and record them here.

### Pre-release versions (`1.0.0-beta.1`)

Windows `.msi` installers (WiX) only accept a numeric pre-release part (`1.0.0-1`). A name like `1.0.0-beta.1` makes the MSI step fail, after a long compile. So while the version has a suffix, build only the NSIS installer on Windows (`--bundles nsis`, which is what the workflow does). When `1.0.0` ships you can switch Windows back to `all` and get the `.msi` as well.

### Installing unsigned builds

Builds are not code-signed, so the first launch shows a warning:

- **Windows:** SmartScreen says "Windows protected your PC": click *More info*, then *Run anyway*.
- **macOS:** Gatekeeper blocks the app: right-click it, choose *Open*, then *Open* again (or run `xattr -dr com.apple.quarantine /Applications/LocalMind.app`).
- **Linux:** make the AppImage executable (`chmod +x LocalMind*.AppImage`); `.deb` and `.rpm` install normally.

## Versioning a release

The version lives in four places and must be identical (`src/data/releases.test.ts` fails if it is not):

1. `package.json` → `version`
2. `src-tauri/tauri.conf.json` → `version` (this is what installers show)
3. `src-tauri/Cargo.toml` → `[package] version`
4. `src-tauri/Cargo.lock` → the `localmind` entry (it updates by itself on the next `cargo build`; commit it)

The version follows [Semantic Versioning](https://semver.org/). Pre-releases use `-beta.N` (then `-rc.N`).

### Release checklist

1. `pnpm test:all` is green (lint, Vitest, Rust).
2. Bump the four version places above.
3. Add the release at the top of `CHANGELOG.md` (`## [x.y.z] - YYYY-MM-DD`, newest first) and the same highlights at the top of `RELEASES` in `src/data/releases.ts` (this feeds About > What's New).
4. Commit, merge to `main`, then run **Build installers** with `draft_release` on.
5. Install the artifacts on a real machine of each OS you claim to support, and run the manual checks in [BACKLOG.md](BACKLOG.md) Task 19.
6. Edit the draft release notes (copy from `CHANGELOG.md`), publish, and tag `vX.Y.Z`.

## App icons

Installers use the icons listed in `bundle.icon` of `tauri.conf.json`. These are the LocalMind brand icons. To regenerate them from a 1024×1024 master PNG:

```bash
pnpm tauri icon path/to/master.png
```

This regenerates everything in `src-tauri/icons/` (PNG sizes, `icon.ico`, `icon.icns`, Windows Store logos).

## Code signing (not configured)

Builds are unsigned. Consequences and options:

- **Windows:** SmartScreen warns on unsigned installers. Sign with a code-signing certificate via `bundle.windows` settings. The workflow would then also need the certificate as a repository secret.
- **macOS:** Gatekeeper blocks unsigned/un-notarized apps. Requires an Apple Developer ID and notarization.
- **Linux:** No signing needed for local use.

See the Tauri docs on [Windows](https://tauri.app/distribute/sign/windows/) and [macOS](https://tauri.app/distribute/sign/macos/) signing when you are ready to distribute.

## Troubleshooting

- **`error: linker link.exe not found` (Windows):** Install the C++ Build Tools and restart the terminal.
- **Port 1420 in use during `pnpm tauri dev`:** Vite uses `strictPort`; stop whatever holds the port.
- **`tauri.conf.json` fails to parse on Windows:** It was probably saved with a BOM (PowerShell 5.1 `Set-Content -Encoding utf8`). Re-save it without BOM using an editor.
- **esbuild install/build errors with pnpm:** Make sure `esbuild` is allowed in `allowBuilds` in `pnpm-workspace.yaml`.
- **Blank window in a release build but dev works:** Confirm `pnpm build` produces `dist/` and `frontendDist` is `../dist`.
