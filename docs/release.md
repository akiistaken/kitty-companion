# Kitty Night Release & Packaging Reference

## Project & Release Metadata

| Value | Details |
| --- | --- |
| Application source directory | `c:\Users\Aki\Kitten` |
| Product name, publisher, executable | `Kitty Night`, publisher `Aki`, executable `kitten.exe` (`com.aki.kitten`) |
| Version | `1.0.1` (`v1.0.1`) |
| Target architecture & supported Windows | Windows x64 (`x86_64`), Windows 10 / 11 (WebView2 Runtime) |
| Build command | `npm run tauri build` |
| Runtime requirements | Microsoft Edge WebView2 Runtime (auto-bootstrapped by NSIS installer if missing) |
| Installer technology | Tauri v2 NSIS (`src-tauri/tauri.conf.json` -> `bundle.targets: ["nsis"]`) |
| Installation scope | Per-user (`currentUser`, installs to `%LOCALAPPDATA%\Kitty Night`, no elevation required) |
| GitHub owner & repo | `akiistaken/kitty-companion` (public repository hosting full source and Windows installer releases) |
| Signing configuration | Unsigned (`NotSigned`; verified via SHA-256 checksum) |
| User data location | `%APPDATA%\com.aki.kitten\kitten_state.json` (preserved across upgrades) |

## Reproducible Build

1. Run checks & tests:

   ```powershell
   npx tsc --noEmit
   npm test
   ```

2. Build the frontend, Rust binary, and NSIS EXE installer:

   ```powershell
   npm run tauri build
   ```

3. Build outputs (gitignored under `src-tauri/target/`):
   - Application binary: `src-tauri\target\release\kitten.exe`
   - NSIS installer: `src-tauri\target\release\bundle\nsis\Kitty Night_1.0.1_x64-setup.exe` (published on GitHub Releases as `Kitty.Night_1.0.1_x64-setup.exe`)

4. Compute the installer SHA-256 checksum:

   ```powershell
   Get-FileHash -LiteralPath 'src-tauri\target\release\bundle\nsis\Kitty Night_1.0.1_x64-setup.exe' -Algorithm SHA256
   ```

## Distribution Artifacts (`distribution/` & Root Synced Copies)

- `install.ps1` (root & `distribution/install.ps1`): PowerShell 5.1 & 7 `irm ... | iex` installer script with SHA-256 verification and cleanup.
- `SHA256SUMS.txt` (root & `distribution/SHA256SUMS.txt`): Checksum manifest for `v1.0.1`.
- `README.md` (root & `distribution/README.md`): Repository and installer documentation for `akiistaken/kitty-companion`.

## Release Checklist (Future Versions)

1. Bump `version` in `package.json`, `src-tauri/tauri.conf.json`, `src-tauri/Cargo.toml`, and `src/components/HudDrawer.tsx`.
2. Run `npx tsc --noEmit`, `npm test`, and `npm run tauri build`.
3. Compute the new SHA-256 digest for `Kitty Night_<version>_x64-setup.exe`.
4. Update `distribution/install.ps1`, `distribution/SHA256SUMS.txt`, and `distribution/README.md` (and copy them to repo root `install.ps1`, `SHA256SUMS.txt`, `README.md`).
5. Commit, tag `v<version>`, push `main` and `v<version>`, and create the GitHub Release with `Kitty.Night_<version>_x64-setup.exe` and `SHA256SUMS.txt`.
6. Verify the raw `install.ps1` URL, release download asset SHA-256, and end-to-end `irm ... | iex` flow.
