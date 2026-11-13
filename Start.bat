@echo off
cd /d "%~dp0"
if not exist "%~dp0src-tauri\target\release\kitten.exe" (
  call npm run tauri build -- --no-bundle
  if errorlevel 1 exit /b 1
)
start "" "%~dp0src-tauri\target\release\kitten.exe"
exit /b 0
