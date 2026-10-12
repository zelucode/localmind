# Building installers

LocalMind is built with the Tauri CLI. `pnpm tauri build` runs `pnpm build` (Vite, output in `dist/`), compiles the Rust shell in release mode, and packages the installers for the system you are building on.

## Prerequisites

- Node.js 20 or newer and pnpm
- Rust (stable) through [rustup](https://rustup.rs/)
- The platform dependencies from the [Tauri 2 prerequisites](https://tauri.app/start/prerequisites/):
  - **Windows:** Microsoft C++ Build Tools ("Desktop development with C++") and WebView2 (preinstalled on Windows 11)
  - **macOS:** Xcode Command Line Tools (`xcode-select --install`)
  - **Linux:** `webkit2gtk-4.1`, `libappindicator`, `librsvg`, `patchelf` and build essentials. See the Tauri docs for your distribution

## Build

```sh
pnpm install
pnpm tauri build
```

The first build compiles all Rust dependencies and takes several minutes. Later builds are incremental. The release profile in `src-tauri/Cargo.toml` uses LTO, `opt-level = 3`, `panic = "abort"` and stripped symbols, which makes release builds slower but smaller.

| Command | Result |
|---|---|
| `pnpm tauri build --debug` | A faster build with debug symbols, not optimized |
| `pnpm tauri build --bundles nsis` | Only the listed bundle types. **Use this on Windows while the version has a pre-release suffix** (see below) |
| `pnpm tauri build --no-bundle` | Compile the executable only, with no installer |

## Output

Artifacts land in `src-tauri/target/release/`:

| Path | Content |
|---|---|
| `localmind.exe` (`localmind` on macOS and Linux) | The raw executable |
| `bundle/nsis/` | Windows `.exe` setup installer |
| `bundle/msi/` | Windows `.msi` installer |
| `bundle/dmg/`, `bundle/macos/` | macOS disk image and `.app` |
| `bundle/deb/`, `bundle/rpm/`, `bundle/appimage/` | Linux packages |

`bundle.targets` is `"all"` in `tauri.conf.json`, so every format valid for the host system is produced. Narrow it there, for example to `["nsis"]`, to speed up builds.

## Building for every platform (GitHub Actions)

Tauri does not cross-compile desktop bundles reliably, so each system is built on its own runner. The workflow `.github/workflows/build.yml` does this for all three, and it runs only when started by hand:

1. In GitHub, open **Actions**, then **Build installers**, then **Run workflow**, and pick a branch or tag.
2. Choose options:
   - `run_tests` (default on): lint, Vitest and Rust tests on Linux must pass before any build starts.
   - `draft_release` (default off): also create a **draft** GitHub Release named `v<version>` with the installers attached. Nothing is published until someone presses Publish.
   - `prerelease` (default on): marks that draft as a pre-release.
3. When it finishes, the installers are in the run's **Artifacts**, kept for 14 days: `localmind-windows`, `localmind-macos` and `localmind-linux`.

| Runner | Output | Bundles |
|---|---|---|
| `windows-latest` | NSIS `.exe` setup | `--bundles nsis` |
| `macos-latest` | Universal (Apple Silicon and Intel) `.dmg` | `--target universal-apple-darwin --bundles dmg` |
| `ubuntu-22.04` | `.deb`, `.rpm`, `.AppImage` | `--bundles deb,rpm,appimage` |

Ubuntu 22.04 is used on purpose. Linux builds depend on the glibc and WebKitGTK of the build machine, so building on an older LTS keeps them usable on more distributions.

### Pre-release versions

Windows `.msi` installers (WiX) accept only a numeric pre-release part such as `1.0.0-1`. A name like `1.0.0-beta.1` makes the MSI step fail after a long compile. While the version has a suffix, build only the NSIS installer on Windows, which is what the workflow does. When `1.0.0` ships, Windows can go back to `all` and produce the `.msi` too.

## App icons

Installers use the icons listed in `bundle.icon` in `tauri.conf.json`. To regenerate them from a 1024 by 1024 master PNG:

```sh
pnpm tauri icon path/to/master.png
```

This rewrites everything in `src-tauri/icons/`: PNG sizes, `icon.ico`, `icon.icns` and the Windows Store logos.

## Code signing

Builds are not signed, so users see a warning on first launch (see the [install guide](/guide/install#the-first-launch-warning)).

- **Windows:** SmartScreen warns on unsigned installers. Sign with a code-signing certificate through the `bundle.windows` settings, and add the certificate to the workflow as a repository secret.
- **macOS:** Gatekeeper blocks unsigned and un-notarized apps. This needs an Apple Developer ID and notarization.
- **Linux:** No signing is needed for local use.

See the Tauri documentation on signing for [Windows](https://tauri.app/distribute/sign/windows/) and [macOS](https://tauri.app/distribute/sign/macos/).

## Troubleshooting

- **`linker link.exe not found` on Windows:** install the C++ Build Tools and restart the terminal.
- **Port 1420 in use during `pnpm tauri dev`:** Vite uses `strictPort`. Stop whatever holds the port.
- **`tauri.conf.json` fails to parse on Windows:** it was probably saved with a byte-order mark by PowerShell 5.1's `Set-Content -Encoding utf8`. Save it again without one, using an editor.
- **esbuild errors with pnpm:** make sure `esbuild` is allowed in `allowBuilds` in `pnpm-workspace.yaml`.
- **A blank window in a release build while dev works:** confirm `pnpm build` produces `dist/` and that `frontendDist` is `../dist`.
