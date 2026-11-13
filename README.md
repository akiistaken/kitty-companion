# Kitten Desktop Companion — Windows Installer Distribution

**Kitten** is an interactive, transparent, always-on-top pixel-art desktop cat companion for Windows.

This repository hosts the public Windows installer releases and the verified PowerShell bootstrap script.

## Quick Install (Windows 10 / 11 x64)

Run in Windows PowerShell 5.1 or PowerShell 7 (no Administrator privileges required; installs per-user into `%LOCALAPPDATA%\Kitten`):

### Pinned release (recommended)

```powershell
irm https://raw.githubusercontent.com/akiistaken/kitty-companion/v0.1.1/install.ps1 | iex
```

### Latest `main` release

```powershell
irm https://raw.githubusercontent.com/akiistaken/kitty-companion/main/install.ps1 | iex
```

> **Note:** The `v0.1.1` command pins a specific immutable release tag and checksum. The `main` command tracks the latest published release.

## System Requirements

- **OS:** Windows 10 or Windows 11 (64-bit / x64)
- **Architecture:** x64 (`AMD64`)
- **Runtime:** Microsoft Edge WebView2 Runtime (already included on Windows 11 and most Windows 10 systems; the installer automatically downloads and installs the official WebView2 bootstrapper if missing)
- **Elevation:** Not required (per-user installation in `%LOCALAPPDATA%\Kitten`)

## Manual Installation & Checksum Verification

1. Download `Kitten_0.1.1_x64-setup.exe` and `SHA256SUMS.txt` from the [v0.1.1 release](https://github.com/akiistaken/kitty-companion/releases/tag/v0.1.1).
2. Verify the SHA-256 digest:

   ```powershell
   Get-FileHash -LiteralPath .\Kitten_0.1.1_x64-setup.exe -Algorithm SHA256
   ```

   Expected SHA-256 (`0.1.1`):

   ```text
   A9C15282CA6F57093D1E20BA3F3C674BFD550C17F4C4CC7C50993D28A136303C
   ```

3. Run the installer interactively, or silently with:

   ```powershell
   .\Kitten_0.1.1_x64-setup.exe /S
   ```

> **Code signing notice:** `Kitten_0.1.1_x64-setup.exe` is currently **unsigned** (no Authenticode certificate). Windows SmartScreen may show a warning on manual execution; always verify the SHA-256 checksum above before running.

## What the Installer Does

- Installs `kitten.exe` and `WebView2Loader.dll` into `%LOCALAPPDATA%\Kitten`
- Registers **Kitten** (`0.1.1`, publisher `Aki`) in Windows Installed Apps (`HKCU\Software\Microsoft\Windows\CurrentVersion\Uninstall\Kitten`)
- Creates Start Menu and Desktop shortcuts (and does **not** auto-launch the app during silent `/S` install)
- Preserves saved companion progress (`%APPDATA%\com.aki.kitten\kitten_state.json`) across upgrades

## Updating

Run the new version's `irm ... | iex` command or run the newer `Kitten_<version>_x64-setup.exe`. If Kitten is running, the NSIS installer automatically closes it before updating and preserves your saved state in `%APPDATA%\com.aki.kitten`.

## Uninstalling

- **Settings / Installed Apps:** Open **Settings -> Apps -> Installed apps**, select **Kitten**, and choose **Uninstall**.
- **Command line (silent):**

  ```powershell
  & "$env:LOCALAPPDATA\Kitten\uninstall.exe" /S
  ```

  *(In interactive mode, the uninstaller offers an optional checkbox to also remove saved app data in `%APPDATA%\com.aki.kitten`.)*
