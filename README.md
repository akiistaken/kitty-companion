# Kitty Night — Windows Desktop Companion (`v1.0.1`)

**Kitty Night** is an interactive, transparent, always-on-top lavender pixel-art desktop cat companion for Windows built with Tauri v2, React, and TypeScript.

This repository hosts the full application source code, Windows x64 installer releases, and verified PowerShell bootstrap installer.

## Quick Install (Windows 10 / 11 x64)

Run in Windows PowerShell 5.1 or PowerShell 7 (no Administrator privileges required; installs per-user into `%LOCALAPPDATA%\Kitty Night`):

### Pinned release (recommended)

```powershell
irm https://raw.githubusercontent.com/akiistaken/kitty-companion/v1.0.1/install.ps1 | iex
```

### Latest `main` release

```powershell
irm https://raw.githubusercontent.com/akiistaken/kitty-companion/main/install.ps1 | iex
```

> **Note:** The `v1.0.1` command pins a specific immutable release tag and checksum. The `main` command tracks the latest published release.

## What's New in v1.0.1

- **Big Stretch, Belly Roll, Slow Blink & Peek-a-Boo:** Multi-phase nose-to-tail stretches, belly-up bunny-kick rolls, alternating edge-tapping peek poses, and affectionate slow blinks when hovering gently nearby.
- **Today's Moments (Daily Stamps):** Collect daily milestone stamps (`Big Stretch`, `Belly Roll`, `Deep Sleeper`, `Slow Blink`, `Edge Peek`, `Morning Yawn`) tracked in the Timeline tab and reset automatically each day.
- **Expressive Audio & Muted Musical Cues:** Expanded 5-variant chiptune mews, automatic 10-second AudioContext suspend when idle, cold-start cooldown fix, and floating `♪` / `～♪` note cues when audio is muted.
- **Performance, Fullscreen Awareness & Streamlined Quick Wheel:** Added Win32 fullscreen foreground detection, dirty-rectangle partial canvas clearing, LRU sprite caching, debounced save persistence, Quick Wheel center hub geometry, and Feather Wand removal.
- **Includes everything from v1.0.0 Night Update:** Moonlight Lantern prop, Shooting Stars, Lavender Star Jar Wishes (`Wish (5 ★)`), Stargazer Kitty (`Crescent Halo`), and Moonstone Charm keepsake.

## System Requirements

- **OS:** Windows 10 or Windows 11 (64-bit / x64)
- **Architecture:** x64 (`AMD64`)
- **Runtime:** Microsoft Edge WebView2 Runtime (already included on Windows 11 and most Windows 10 systems; the installer automatically downloads and installs the official WebView2 bootstrapper if missing)
- **Elevation:** Not required (per-user installation in `%LOCALAPPDATA%\Kitty Night`)

## Manual Installation & Checksum Verification

1. Download `Kitty.Night_1.0.1_x64-setup.exe` and `SHA256SUMS.txt` from the [v1.0.1 release](https://github.com/akiistaken/kitty-companion/releases/tag/v1.0.1).
2. Verify the SHA-256 digest:

   ```powershell
   Get-FileHash -LiteralPath .\Kitty.Night_1.0.1_x64-setup.exe -Algorithm SHA256
   ```

   Expected SHA-256 (`1.0.1`):

   ```text
   8651E6C8FE4C81232B9609F08E1BC770DBDD1F0D2A7476D10E3D4897A624184D
   ```

3. Run the installer interactively, or silently with:

   ```powershell
   .\Kitty.Night_1.0.1_x64-setup.exe /S
   ```

> **Code signing notice:** `Kitty.Night_1.0.1_x64-setup.exe` is currently **unsigned** (no Authenticode certificate). Windows SmartScreen may show a warning on manual execution; always verify the SHA-256 checksum above before running.

## What the Installer Does

- Installs `kitten.exe` and `WebView2Loader.dll` into `%LOCALAPPDATA%\Kitty Night`
- Registers **Kitty Night** (`1.0.1`, publisher `Aki`) in Windows Installed Apps (`HKCU\Software\Microsoft\Windows\CurrentVersion\Uninstall\Kitty Night`)
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
