# Agent handoff: Build and publish a Windows EXE installer

## Objective

Take the application from its existing source code to a working Windows `.exe` installer, publish the installer and a PowerShell bootstrap script, and deliver a verified command of the form:

```powershell
irm https://raw.githubusercontent.com/OWNER/DISTRIBUTION_REPO/VERSION/install.ps1 | iex
```

Replace every placeholder with a real value before delivery. This document is a handoff plan; it does not indicate that a build or deployment has already happened.

## Instructions for the receiving agent

Execute this plan through completion using the available workspace, build tools, and authorized GitHub access. Inspect and follow the application's `AGENTS.md` and existing build/release documentation. Resolve routine implementation choices yourself. Preserve unrelated work and existing repository visibility.

Discover information from the project before asking the user. Ask only for essential information that cannot be established, such as the source location, missing credentials, or an ambiguous publication destination. Continue independent preparation while waiting. Never invent URLs, checksums, successful tests, or publication results.

Publishing the bootstrap script and the intended application installer is the requested outcome. Keep private application source private; use a separate public distribution repository if needed. Do not include credentials, signing keys, `.env` files, private configuration, or unrelated files in release artifacts.

## Inputs to establish

The current workspace is `C:\Users\Aki`. The application directory and technology stack have not yet been identified. Start with likely project locations and existing context; do not assume the entire home directory is an application repository.

Record these values in the project release documentation:

| Value | How to establish it |
| --- | --- |
| Application source directory | Locate the intended project; ask if multiple candidates remain ambiguous. |
| Application name, publisher, executable name | Read project/package metadata. |
| Version | Follow the project's existing versioning convention. |
| Target architecture and supported Windows versions | Read project requirements; use Windows x64 only if appropriate. |
| Build command and runtime requirements | Read existing scripts, lockfiles, and build documentation. |
| Installer technology | Prefer existing packaging; otherwise choose a suitable Windows installer builder. |
| Installation scope | Preserve existing per-user or system-wide behavior; choose per-user when supported and no requirement dictates otherwise. |
| GitHub owner and distribution repository | Inspect configured remotes and authenticated GitHub identity; resolve ambiguity before publication. |
| Signing configuration | Use existing authorized signing setup if present; never fabricate a signature. |

## Phase 1: Inspect and build the application

1. Inspect repository status, instructions, package manifests, build scripts, and existing installer configuration.
2. Identify the application stack and use its established production build process. Respect lockfiles and avoid unnecessary dependency upgrades.
3. Confirm whether the build already produces an installer. A portable application EXE is not automatically an installer.
4. If packaging is missing, produce the application payload using the appropriate framework tools. Examples include a .NET publish output, a Python bundle, or an Electron packaged application. Include all required assets, libraries, and runtime dependencies.
5. Build for the supported Windows architecture. Verify that the packaged application starts and that a representative core function works.
6. Record the exact build command and output paths. Keep generated output out of source control unless the project's conventions require it.

## Phase 2: Produce a real EXE installer

1. Reuse the project's installer framework when available. If none exists and the application is a conventional Windows desktop app, use Inno Setup unless its requirements suggest another tool.
2. Add reproducible installer configuration to the project. Configure:
   - A stable application ID that remains unchanged across upgrades.
   - Application name, publisher, version, executable, and architecture.
   - A complete payload and the correct installation directory.
   - Required privilege level, installed-apps registration, and an uninstaller.
   - Appropriate Start menu shortcuts; make desktop shortcuts optional where practical.
   - Upgrade behavior that preserves user data.
3. Avoid launching the application automatically during silent installation. Suppress optional shortcut or startup actions according to the chosen installer framework.
4. Produce a clearly named artifact, such as `MyCustomAppSetup-1.0.0-x64.exe`.
5. Sign the installer using existing authorized signing configuration if available. If signing is unavailable, report the artifact as unsigned.
6. Verify that the output exists, is nonempty, and is actually an installer. Compute its SHA-256 digest:

```powershell
Get-FileHash -LiteralPath 'C:\actual\output\MyCustomAppSetup-1.0.0-x64.exe' -Algorithm SHA256
```

## Phase 3: Implement `install.ps1`

Create a Windows PowerShell 5.1-compatible script that also works in PowerShell 7. It must work when its contents are passed directly to `Invoke-Expression`; do not rely on `$PSScriptRoot`, adjacent files, or script parameters supplied by the pipeline command.

Implement the following behavior:

1. Use a script block or equivalent scoping to avoid leaving helper variables and functions in the caller's session. Restore any process-wide settings that you modify.
2. Stop on unexpected errors. Enable TLS 1.2 alongside existing protocols when required by Windows PowerShell 5.1.
3. Define the application name, expected version, immutable HTTPS installer URL, expected SHA-256 digest, silent arguments, and documented successful exit codes.
4. Detect unsupported architecture or missing elevation before downloading when the installer requires those checks. If elevation is required, explain that the user must run PowerShell as Administrator. Do not automatically change execution policies or suppress elevation prompts.
5. Download into a unique temporary directory created for this invocation. Use `Invoke-WebRequest -OutFile` with PowerShell 5.1-compatible options.
6. Confirm that the downloaded file exists and is nonempty. Verify its SHA-256 digest against the expected value before executing it. A mismatch must stop installation.
7. Run the downloaded EXE directly with `Start-Process -Wait -PassThru` and correctly quoted arguments. Do not invoke it through `msiexec.exe`.
8. Use silent arguments supported by the actual installer:

| Installer | Common arguments |
| --- | --- |
| Inno Setup | `/SP- /VERYSILENT /SUPPRESSMSGBOXES /NORESTART` |
| NSIS | `/S` with uppercase S |
| Other | Use the vendor's documented arguments. |

9. Interpret exit codes according to the selected installer. Do not assume MSI exit codes apply to every EXE. Report restart requirements where documented and avoid forcing a restart.
10. Print concise download, installation, success, and failure messages. Report success only after the install process returns a documented success code and the installed application/version is verified by an appropriate method.
11. Clean up downloaded temporary files in `finally`, including on failure. Before recursive deletion, verify the absolute target is the exact temporary directory created by this invocation and remains under the resolved temporary root. Use `Remove-Item -LiteralPath` without wildcards.
12. If installer logs are supported, save them outside the directory being cleaned up and print their location on failure.

The command will wait until installation completes. Silent installation suppresses the installer wizard; it does not make the command return immediately or bypass administrator requirements.

Checksum verification detects unexpected installer bytes. The published script must itself come from the trusted distribution repository; a checksum embedded in a modified script does not independently authenticate that script.

## Phase 4: Validate locally

Use the project's existing checks and a disposable Windows VM or suitable Windows Sandbox environment with the required networking and installer support. Do not install or uninstall the application on the user's everyday host merely to perform a test without authorization.

1. Parse `install.ps1` and check compatibility with Windows PowerShell 5.1 and PowerShell 7 where available. Use existing lint configuration if present.
2. Test the actual installer with its chosen silent arguments. Verify no setup wizard or final launch dialog appears.
3. Confirm installed-apps registration, expected files, installed version, application launch, and a representative application function. `Get-AppxPackage` is not a general verification method for a conventional EXE installer.
4. Test repeat installation and, where supported, upgrade from an earlier version. Verify user data is preserved.
5. Test documented uninstall behavior in the disposable environment.
6. Exercise meaningful failure cases: invalid download URL, checksum mismatch, and missing elevation when applicable. Confirm the script does not execute an unverified download, report false success, or leave temporary installer files behind.
7. Confirm that success and failure paths preserve the caller's settings and do not close its PowerShell session.

If a test environment is unavailable, complete the build and other validation, but clearly mark installation behavior as unverified. Do not describe unavailable checks as passed.

## Phase 5: Publish the installer and script

1. Check GitHub CLI/API availability, authenticated identity, and access to the intended repository. Missing access is a blocker for publication, not a reason to fabricate a public URL.
2. Use a public distribution repository that is authorized for the script and binary. If the source repository is private, keep it private and publish only distribution material in the public repository.
3. Prepare `install.ps1`, a concise README, the installer, and a checksum file. Review the exact files and release assets before upload.
4. Choose a version tag, such as `v1.0.0`, that does not overwrite an existing release. The script must point to that specific versioned installer asset:

```text
https://github.com/OWNER/DISTRIBUTION_REPO/releases/download/v1.0.0/MyCustomAppSetup-1.0.0-x64.exe
```

5. Commit the script and README, tag the distribution commit, and upload the EXE and checksum file to a release for that tag. Build the installer before committing its digest into the script, and confirm the uploaded asset has the same digest.
6. Keep versioned releases immutable. For future updates, create a new version and update the script's URL and checksum together.
7. Serve `install.ps1` as raw text. The recommended final command uses the version tag:

```powershell
irm https://raw.githubusercontent.com/OWNER/DISTRIBUTION_REPO/v1.0.0/install.ps1 | iex
```

8. Optionally maintain a `main` branch command for the current release. Explain in the README that the branch command follows updates, while the tagged command selects a specific release.

## Phase 6: Verify the public workflow

1. Fetch both the raw script and installer URL without relying on the publisher's logged-in session. Confirm the script response is PowerShell text and the installer response is the expected binary.
2. Compute the downloaded release asset's SHA-256 digest and compare it with the published script and checksum file.
3. Run the exact public `irm ... | iex` command in a fresh disposable Windows environment.
4. Confirm silent installation, exit-code handling, installed version, application launch, and temporary-file cleanup.
5. Use an elevated shell only if the chosen installer requires it, and document that requirement next to the command.

## Deliverables

- A reproducible production build and committed installer configuration.
- The compiled EXE installer and its SHA-256 checksum.
- A complete `install.ps1` containing real values and supported installer arguments.
- A public GitHub release with the installer and checksum file.
- A working raw script URL and the exact copy-and-paste installation command.
- A README covering supported Windows versions/architectures, elevation requirements, installation, uninstall, and update procedure.
- A brief completion report linking to the release, script, relevant local files, and validation evidence; include any unsigned status or unverified checks.

## Completion criteria

The job is complete when the actual public command installs the intended version without a setup wizard in a supported clean Windows environment, the application runs, the payload checksum matches, and temporary installer files are removed. If missing source, GitHub access, or a test environment prevents part of the work, state exactly what is complete and what remains blocked.
