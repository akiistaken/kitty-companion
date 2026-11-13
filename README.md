# Kitty Night — Windows Desktop Companion (`v1.0.0`)

**Kitty Night** is an interactive, transparent, always-on-top lavender pixel-art desktop cat companion for Windows built with Tauri v2, React, and TypeScript.

This repository hosts the full application source code, Windows x64 installer releases, and verified PowerShell bootstrap installer.

## Quick Install (Windows 10 / 11 x64)

Run in Windows PowerShell 5.1 or PowerShell 7 (no Administrator privileges required; installs per-user into `%LOCALAPPDATA%\Kitty Night`):

### Pinned release (recommended)

```powershell
irm https://raw.githubusercontent.com/akiistaken/kitty-companion/v1.0.0/install.ps1 | iex
```

### Latest `main` release

```powershell
irm https://raw.githubusercontent.com/akiistaken/kitty-companion/main/install.ps1 | iex
```

> **Note:** The `v1.0.0` command pins a specific immutable release tag and checksum. The `main` command tracks the latest published release.

## What's New in v1.0.0 (Night Update & Extra Features)

- **Moonlight Lantern (`Moon Lantern`):** Placeable, draggable desktop lantern prop whose amber-lavender glow attracts fireflies and invites your kitten to curl up for cozy lantern naps (`Lantern Keeper` badge). Click to toggle lit/dimmed, right-click to remove.
- **Shooting Stars & Star Jar Wishes:** Shooting stars streak across the upper desktop sky at night (or summon one anytime via HUD / system tray). Click a star or spend `5 ★` in the **Lavender Star Jar** (`Wish (5 ★)`) for +18 XP, +5 Bond, +15 Energy/Treats, chime audio, and cosmic sparkles.
- **Stargazer Progression & Keepsakes:** Unlock the **Crescent Halo** (`crescent_crown`) accessory via **Stargazer Kitty** (3 wishes), plus the **Moonstone Charm** memento on your first wish.
- **Zeroed First-Run Companion Start:** Fresh starts begin cleanly at `0` XP, `0%` Bond, `0%` Energy, and `0%` Treats so progression builds authentically from zero.

## System Requirements

- **OS:** Windows 10 or Windows 11 (64-bit / x64)
- **Architecture:** x64 (`AMD64`)
- **Runtime:** Microsoft Edge WebView2 Runtime (already included on Windows 11 and most Windows 10 systems; the installer automatically downloads and installs the official WebView2 bootstrapper if missing)
- **Elevation:** Not required (per-user installation in `%LOCALAPPDATA%\Kitty Night`)

## Manual Installation & Checksum Verification

1. Download `Kitty.Night_1.0.0_x64-setup.exe` and `SHA256SUMS.txt` from the [v1.0.0 release](https://github.com/akiistaken/kitty-companion/releases/tag/v1.0.0).
2. Verify the SHA-256 digest:

   ```powershell
   Get-FileHash -LiteralPath .\Kitty.Night_1.0.0_x64-setup.exe -Algorithm SHA256
   ```

   Expected SHA-256 (`1.0.0`):

   ```text
   2C5A5CA24A931184D47DDE4338A60B49A9B9382766B6D4884269472A9F38A327
   ```

3. Run the installer interactively, or silently with:

   ```powershell
   .\Kitty.Night_1.0.0_x64-setup.exe /S
   ```

> **Code signing notice:** `Kitty.Night_1.0.0_x64-setup.exe` is currently **unsigned** (no Authenticode certificate). Windows SmartScreen may show a warning on manual execution; always verify the SHA-256 checksum above before running.

## What the Installer Does

- Installs `kitten.exe` and `WebView2Loader.dll` into `%LOCALAPPDATA%\Kitty Night`
- Registers **Kitty Night** (`1.0.0`, publisher `Aki`) in Windows Installed Apps (`HKCU\Software\Microsoft\Windows\CurrentVersion\Uninstall\Kitty Night`)
- Creates Start Menu and Desktop shortcuts (and does **not** auto-launch the app during silent `/S` install)
- Preserves saved companion progress (`%APPDATA%\com.aki.kitten\kitten_state.json`) across upgrades

## Development & Building from Source

```powershell
npm install
npm test
npx tsc --noEmit
npm run tauri build
```

## Updating

Run the new version's `irm ... | iex` command or run the newer `Kitty.Night_<version>_x64-setup.exe`. If Kitty Night is running, the NSIS installer automatically closes it before updating and preserves your saved state in `%APPDATA%\com.aki.kitten`.

## Uninstalling

- **Settings / Installed Apps:** Open **Settings -> Apps -> Installed apps**, select **Kitty Night**, and choose **Uninstall**.
- **Command line (silent):**

  ```powershell
  & "$env:LOCALAPPDATA\Kitty Night\uninstall.exe" /S
  ```

  *(In interactive mode, the uninstaller offers an optional checkbox to also remove saved app data in `%APPDATA%\com.aki.kitten`.)*
