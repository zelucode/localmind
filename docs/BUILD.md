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
| `pnpm tauri build --bundles nsis` | Only the listed bundle type(s) |
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

## Building for other platforms

Tauri does not cross-compile desktop bundles reliably. Build each OS on that OS, or use a CI matrix (GitHub Actions with `tauri-apps/tauri-action` on `windows-latest`, `macos-latest` and `ubuntu-22.04`).

## Versioning a release

Keep the version identical in all three places:

1. `package.json` → `version`
2. `src-tauri/tauri.conf.json` → `version` (this is what installers show)
3. `src-tauri/Cargo.toml` → `[package] version`

## App icons

Installers use the icons listed in `bundle.icon` of `tauri.conf.json`. These are the LocalMind brand icons. To regenerate them from a 1024×1024 master PNG:

```bash
pnpm tauri icon path/to/master.png
```

This regenerates everything in `src-tauri/icons/` (PNG sizes, `icon.ico`, `icon.icns`, Windows Store logos).

## Code signing (not configured)

Builds are unsigned. Consequences and options:

- **Windows:** SmartScreen warns on unsigned installers. Sign with a code-signing certificate via `bundle.windows` settings.
- **macOS:** Gatekeeper blocks unsigned/un-notarized apps. Requires an Apple Developer ID and notarization.
- **Linux:** No signing needed for local use.

See the Tauri docs on [Windows](https://tauri.app/distribute/sign/windows/) and [macOS](https://tauri.app/distribute/sign/macos/) signing when you are ready to distribute.

## Troubleshooting

- **`error: linker link.exe not found` (Windows):** Install the C++ Build Tools and restart the terminal.
- **Port 1420 in use during `pnpm tauri dev`:** Vite uses `strictPort`; stop whatever holds the port.
- **`tauri.conf.json` fails to parse on Windows:** It was probably saved with a BOM (PowerShell 5.1 `Set-Content -Encoding utf8`). Re-save it without BOM using an editor.
- **esbuild install/build errors with pnpm:** Make sure `esbuild` is allowed in `allowBuilds` in `pnpm-workspace.yaml`.
- **Blank window in a release build but dev works:** Confirm `pnpm build` produces `dist/` and `frontendDist` is `../dist`.
