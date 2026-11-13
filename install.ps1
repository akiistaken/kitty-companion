& {
    $prevErrorActionPreference = $ErrorActionPreference
    $prevProgressPreference = $ProgressPreference
    $isDesktopPs = ($PSVersionTable.PSVersion.Major -lt 6)
    if ($isDesktopPs) {
        $prevSecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol
    }

    $ErrorActionPreference = 'Stop'

    $appName = 'Kitten'
    $expectedVersion = '0.1.0'
    $installerFileName = 'Kitten_0.1.0_x64-setup.exe'
    $installerUrl = 'https://github.com/akiistaken/kitty-companion/releases/download/v0.1.0/Kitten_0.1.0_x64-setup.exe'
    $expectedSha256 = 'B6CCCF3D2373E1D6027104E3BEBA5578E6213BFE0950259FE9199BFA0C8A71A7'
    $silentArgs = @('/S')
    $successExitCodes = @(0)

    $tempRoot = $null
    $expectedTempDir = $null
    $tempDir = $null

    try {
        if ($isDesktopPs) {
            [System.Net.ServicePointManager]::SecurityProtocol = (
                [System.Net.ServicePointManager]::SecurityProtocol -bor
                [System.Net.SecurityProtocolType]::Tls12
            )
        }

        $onWindows = ($env:OS -eq 'Windows_NT') -or (-not $isDesktopPs -and $IsWindows)
        if (-not $onWindows) {
            throw "$appName is only supported on Windows (x64)."
        }

        $nativeArch = if ($env:PROCESSOR_ARCHITEW6432) {
            $env:PROCESSOR_ARCHITEW6432
        } else {
            $env:PROCESSOR_ARCHITECTURE
        }
        if (-not [System.Environment]::Is64BitOperatingSystem -or $nativeArch -ne 'AMD64') {
            throw "Unsupported architecture '$nativeArch'. $appName requires 64-bit Windows (x64)."
        }

        $tempRoot = [System.IO.Path]::GetFullPath([System.IO.Path]::GetTempPath())
        $normalizedRoot = $tempRoot.TrimEnd(
            [System.IO.Path]::DirectorySeparatorChar,
            [System.IO.Path]::AltDirectorySeparatorChar
        ) + [System.IO.Path]::DirectorySeparatorChar

        $tempDirName = 'kitten-install-' + [System.Guid]::NewGuid().ToString('N')
        $expectedTempDir = [System.IO.Path]::GetFullPath((Join-Path -Path $tempRoot -ChildPath $tempDirName))
        if (-not $expectedTempDir.StartsWith($normalizedRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
            throw "Refusing to create temporary directory outside '$normalizedRoot'."
        }

        $null = New-Item -ItemType Directory -Path $expectedTempDir -Force
        $tempDir = $expectedTempDir
        $installerPath = Join-Path -Path $tempDir -ChildPath $installerFileName

        Write-Host "Downloading $appName $expectedVersion installer..."
        $ProgressPreference = 'SilentlyContinue'
        $iwrParams = @{
            Uri     = $installerUrl
            OutFile = $installerPath
        }
        if ($isDesktopPs) {
            $iwrParams['UseBasicParsing'] = $true
        }
        Invoke-WebRequest @iwrParams

        if (-not (Test-Path -LiteralPath $installerPath -PathType Leaf)) {
            throw "Downloaded installer was not found at '$installerPath'."
        }

        $downloadedFile = Get-Item -LiteralPath $installerPath
        if ($downloadedFile.Length -le 0) {
            throw "Downloaded installer '$installerPath' is empty (0 bytes)."
        }

        Write-Host "Verifying SHA-256 checksum..."
        $actualSha256 = (Get-FileHash -LiteralPath $installerPath -Algorithm SHA256).Hash.ToUpperInvariant()
        if ($actualSha256 -ne $expectedSha256.ToUpperInvariant()) {
            throw "SHA-256 checksum mismatch for '$installerFileName'. Expected: $expectedSha256, Actual: $actualSha256. Installation aborted."
        }

        Write-Host "Installing $appName $expectedVersion silently (per-user)..."
        $proc = Start-Process -FilePath $installerPath -ArgumentList $silentArgs -Wait -PassThru
        if ($null -eq $proc) {
            throw "Failed to launch installer process '$installerPath'."
        }

        $exitCode = [int]$proc.ExitCode
        if ($successExitCodes -notcontains $exitCode) {
            $detail = switch ($exitCode) {
                1 { 'Installation was aborted by the user.' }
                2 { 'Installer script aborted (possible running instance lock or WebView2 setup error).' }
                default { 'Unexpected NSIS installer exit code.' }
            }
            throw "$appName installer failed with exit code $exitCode. $detail"
        }

        $uninstallRegPath = 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall\Kitten'
        if (-not (Test-Path -LiteralPath $uninstallRegPath)) {
            throw "Installer completed with exit code 0, but uninstall registration was not found at '$uninstallRegPath'."
        }

        $regProps = Get-ItemProperty -LiteralPath $uninstallRegPath
        $installedVersion = [string]$regProps.DisplayVersion
        if ($installedVersion -ne $expectedVersion) {
            throw "Expected installed version '$expectedVersion', but registry reports '$installedVersion'."
        }

        $installLocation = ([string]$regProps.InstallLocation).Trim('"')
        if ([string]::IsNullOrWhiteSpace($installLocation)) {
            $installLocation = Join-Path -Path $env:LOCALAPPDATA -ChildPath 'Kitten'
        }

        $installedExe = Join-Path -Path $installLocation -ChildPath 'kitten.exe'
        if (-not (Test-Path -LiteralPath $installedExe -PathType Leaf)) {
            throw "Installed executable was not found at '$installedExe'."
        }

        Write-Host "$appName $installedVersion installed successfully to '$installLocation'."
        Write-Host "Launch it from the Start Menu or run: `"$installedExe`""
    } finally {
        if ($null -ne $tempDir -and -not [string]::IsNullOrWhiteSpace($tempDir) -and $null -ne $tempRoot -and $null -ne $expectedTempDir) {
            try {
                $resolvedTarget = [System.IO.Path]::GetFullPath($tempDir)
                $resolvedRoot = [System.IO.Path]::GetFullPath($tempRoot).TrimEnd(
                    [System.IO.Path]::DirectorySeparatorChar,
                    [System.IO.Path]::AltDirectorySeparatorChar
                ) + [System.IO.Path]::DirectorySeparatorChar

                if (
                    $resolvedTarget -eq $expectedTempDir -and
                    $resolvedTarget.StartsWith($resolvedRoot, [System.StringComparison]::OrdinalIgnoreCase) -and
                    (Test-Path -LiteralPath $resolvedTarget -PathType Container)
                ) {
                    Remove-Item -LiteralPath $resolvedTarget -Recurse -Force
                }
            } catch {
                Write-Warning "Failed to clean up temporary directory '$tempDir': $($_.Exception.Message)"
            }
        }

        $ProgressPreference = $prevProgressPreference
        $ErrorActionPreference = $prevErrorActionPreference
        if ($isDesktopPs) {
            [System.Net.ServicePointManager]::SecurityProtocol = $prevSecurityProtocol
        }
    }
}
