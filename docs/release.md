# Kitten Release & Packaging Reference

## Project & Release Metadata

| Value | Details |
| --- | --- |
| Application source directory | `c:\Users\Aki\Kitten` |
| Application name, publisher, executable | `Kitten`, publisher `Aki`, executable `kitten.exe` (`com.aki.kitten`) |
| Version | `0.1.2` (`v0.1.2`) |
| Target architecture & supported Windows | Windows x64 (`x86_64`), Windows 10 / 11 (WebView2 Runtime) |
| Build command | `npm run tauri build` |
| Runtime requirements | Microsoft Edge WebView2 Runtime (auto-bootstrapped by NSIS installer if missing) |
| Installer technology | Tauri v2 NSIS (`src-tauri/tauri.conf.json` -> `bundle.targets: ["nsis"]`) |
| Installation scope | Per-user (`currentUser`, installs to `%LOCALAPPDATA%\Kitten`, no elevation required) |
| GitHub owner & distribution repo | `akiistaken/kitty-companion` (public distribution repository; source remains local/private) |
| Signing configuration | Unsigned (`NotSigned`; verified via SHA-256 checksum) |
| User data location | `%APPDATA%\com.aki.kitten\kitten_state.json` (preserved across upgrades) |

## Reproducible Build

1. Run tests:

   ```powershell
   npm test
   ```

2. Build the frontend, Rust binary, and NSIS EXE installer:

   ```powershell
   npm run tauri build
   ```

3. Build outputs (gitignored under `src-tauri/target/`):
   - Application binary: `src-tauri\target\release\kitten.exe`
   - NSIS installer: `src-tauri\target\release\bundle\nsis\Kitten_0.1.2_x64-setup.exe`

4. Compute the installer SHA-256 checksum:

   ```powershell
   Get-FileHash -LiteralPath 'src-tauri\target\release\bundle\nsis\Kitten_0.1.2_x64-setup.exe' -Algorithm SHA256
   ```

## Distribution Artifacts (`distribution/`)

- [install.ps1](../distribution/install.ps1): PowerShell 5.1 & 7 `irm ... | iex` installer script with SHA-256 verification and cleanup.
- [SHA256SUMS.txt](../distribution/SHA256SUMS.txt): Checksum manifest for `v0.1.2`.
- [README.md](../distribution/README.md): Public distribution documentation for `akiistaken/kitty-companion`.

## Release Checklist (Future Versions)

1. Bump `version` in `package.json`, `src-tauri/tauri.conf.json`, and `src-tauri/Cargo.toml`.
2. Run `npm test` and `npm run tauri build`.
3. Compute the new SHA-256 digest for `Kitten_<version>_x64-setup.exe`.
4. Update `distribution/install.ps1`, `distribution/SHA256SUMS.txt`, and `distribution/README.md` with the new version tag, release asset URL, and SHA-256 digest.
5. Commit and tag `v<version>` in the `akiistaken/kitty-companion` distribution repository, push `main` and `v<version>`, and upload `Kitten_<version>_x64-setup.exe` and `SHA256SUMS.txt` as release assets.
6. Verify the raw `install.ps1` URL, release download asset SHA-256, and end-to-end `irm ... | iex` flow in a clean Windows environment.
