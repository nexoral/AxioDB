#Requires -Version 3.0
<#
.SYNOPSIS
    AxioDB Installer for Windows
.DESCRIPTION
    Installs AxioDB CLI and/or GUI on Windows.
.EXAMPLE
    irm https://raw.githubusercontent.com/nexoral/AxioDB/main/cli/Scripts/install.ps1 | iex
#>

$REPO = "nexoral/AxioDB"
$CLI_INSTALL_DIR = "$env:LOCALAPPDATA\AxioDB"
$CLI_BINARY_NAME = "axiodb.exe"
$ErrorActionPreference = "Stop"

[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

# Ensure UTF-8 output encoding for modern box-drawing characters
try { [Console]::OutputEncoding = [System.Text.Encoding]::UTF8 } catch {}

function Write-Step {
    param([string]$Message, [string]$Glyph = "◇", [string]$GlyphColor = "Cyan", [string]$Color = "White")
    Write-Host "  │  " -NoNewline -ForegroundColor DarkGray
    Write-Host "$Glyph " -NoNewline -ForegroundColor $GlyphColor
    Write-Host $Message -ForegroundColor $Color
}

function Write-StepSuccess {
    param([string]$Message)
    Write-Step $Message -Glyph "✔" -GlyphColor "Green" -Color "White"
}

function Write-StepError {
    param([string]$Message)
    Write-Step $Message -Glyph "✖" -GlyphColor "Red" -Color "Red"
}

function Get-SystemArchitecture {
    if ($env:PROCESSOR_ARCHITECTURE -eq "ARM64") { return "arm64" }
    if ([Environment]::Is64BitOperatingSystem) { return "amd64" }
    return "386"
}

$ARCH = Get-SystemArchitecture

try {
    $release = Invoke-RestMethod -Uri "https://api.github.com/repos/$REPO/releases/latest"
    $VERSION = ($release.tag_name -replace '^cli-v', '')
} catch {
    Write-Host "  ✖ Failed to resolve latest version from GitHub" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "  ✦ AxioDB " -NoNewline -ForegroundColor Cyan
Write-Host "— Next-Gen Embedded NoSQL Database" -ForegroundColor DarkGray
Write-Host "  ─────────────────────────────────────────────" -ForegroundColor DarkGray
Write-Host "  ● " -NoNewline -ForegroundColor DarkGray
Write-Host "System:  " -NoNewline -ForegroundColor Gray
Write-Host "windows-$ARCH" -ForegroundColor White
Write-Host "  ● " -NoNewline -ForegroundColor DarkGray
Write-Host "Release: " -NoNewline -ForegroundColor Gray
Write-Host "v$VERSION" -ForegroundColor Cyan
Write-Host ""

if ($env:CHOICE) {
    Write-Host "  Using choice from environment: " -NoNewline -ForegroundColor DarkGray
    Write-Host $env:CHOICE -ForegroundColor White
    $CHOICE = $env:CHOICE
} else {
    Write-Host "  Select installation target:" -ForegroundColor White
    Write-Host ""
    Write-Host "  [1] " -NoNewline -ForegroundColor Cyan
    Write-Host "CLI only      " -NoNewline -ForegroundColor White
    Write-Host "Command-line engine & tools (~5MB)" -ForegroundColor DarkGray

    Write-Host "  [2] " -NoNewline -ForegroundColor Cyan
    Write-Host "GUI only      " -NoNewline -ForegroundColor White
    Write-Host "Desktop management control app (~80MB)" -ForegroundColor DarkGray

    Write-Host "  [3] " -NoNewline -ForegroundColor Cyan
    Write-Host "Full Suite    " -NoNewline -ForegroundColor White
    Write-Host "CLI + GUI complete installation" -ForegroundColor DarkGray
    Write-Host ""

    $userInput = Read-Host "  Enter selection [1-3] (default: 1)"
    if (-not $userInput) { $CHOICE = "1" } else { $CHOICE = $userInput.Trim() }
}

function Install-CLI {
    Write-Host ""
    Write-Host "  ┌  Installing AxioDB CLI (v$VERSION)" -ForegroundColor White
    Write-Host "  │" -ForegroundColor DarkGray

    # Check if CLI is already installed and up to date
    if (Get-Command "axiodb" -ErrorAction SilentlyContinue) {
        try {
            $installedVer = (& axiodb version --short 2>$null).Trim().TrimStart('v')
            if (-not $installedVer) {
                $raw = (& axiodb version 2>$null)
                if ($raw -match '([0-9]+\.[0-9]+\.[0-9]+)') {
                    $installedVer = $matches[1]
                }
            }
            if ($installedVer -eq $VERSION) {
                Write-StepSuccess "Already installed and up to date (v$VERSION)"
                Write-Host "  └" -ForegroundColor DarkGray
                return
            }
        } catch {}
    }

    $DOWNLOAD_FILE = "axiodb_windows_${ARCH}.exe"
    $DOWNLOAD_URL = "https://github.com/$REPO/releases/download/cli-v${VERSION}/${DOWNLOAD_FILE}"
    $CHECKSUM_URL = "https://github.com/$REPO/releases/download/cli-v${VERSION}/checksums.txt"

    Write-Step "Fetching binary ($DOWNLOAD_FILE)..."

    try {
        if (-not (Test-Path $CLI_INSTALL_DIR)) {
            New-Item -ItemType Directory -Force -Path $CLI_INSTALL_DIR | Out-Null
        }
    } catch {
        Write-StepError "Failed to create install directory: $CLI_INSTALL_DIR"
        Write-Host "  └" -ForegroundColor DarkGray
        exit 1
    }

    $TMP_FILE = Join-Path $env:TEMP $DOWNLOAD_FILE

    try {
        Invoke-WebRequest -Uri $DOWNLOAD_URL -OutFile $TMP_FILE -UseBasicParsing
    } catch {
        Write-StepError "Download failed: $_"
        Write-Host "  └" -ForegroundColor DarkGray
        exit 1
    }

    Write-StepSuccess "Download complete"

    Write-Step "Verifying SHA-256 cryptographic checksum..."
    try {
        $CHECKSUM_FILE = Join-Path $env:TEMP "checksums.txt"
        Invoke-WebRequest -Uri $CHECKSUM_URL -OutFile $CHECKSUM_FILE -UseBasicParsing
        $checksumContent = Get-Content $CHECKSUM_FILE
        $expectedChecksum = ($checksumContent | Select-String -Pattern "$DOWNLOAD_FILE").Line -split '\s+' | Select-Object -First 1
        if ($expectedChecksum) {
            $actualChecksum = (Get-FileHash -Path $TMP_FILE -Algorithm SHA256).Hash.ToLower()
            if ($actualChecksum -ne $expectedChecksum.ToLower()) {
                Write-StepError "Checksum verification failed!"
                Write-Host "  └" -ForegroundColor DarkGray
                Remove-Item $TMP_FILE, $CHECKSUM_FILE -Force -ErrorAction SilentlyContinue
                exit 1
            }
            Write-StepSuccess "Checksum verified (SHA-256)"
        }
        Remove-Item $CHECKSUM_FILE -Force -ErrorAction SilentlyContinue
    } catch {
        Write-Step "Checksum verification skipped" -Glyph "!" -GlyphColor "Yellow" -Color "DarkGray"
    }

    Write-Step "Installing binary to $CLI_INSTALL_DIR..."
    $destPath = Join-Path $CLI_INSTALL_DIR $CLI_BINARY_NAME
    Move-Item -Path $TMP_FILE -Destination $destPath -Force

    $currentPath = [Environment]::GetEnvironmentVariable("Path", "User")
    if ($currentPath -notlike "*$CLI_INSTALL_DIR*") {
        [Environment]::SetEnvironmentVariable("Path", "$currentPath;$CLI_INSTALL_DIR", "User")
        $env:Path = "$env:Path;$CLI_INSTALL_DIR"
    }

    Write-StepSuccess "AxioDB CLI deployed successfully"
    Write-Host "  └" -ForegroundColor DarkGray
}

function Install-GUI {
    Write-Host ""
    Write-Host "  ┌  Installing AxioDB GUI (v$VERSION)" -ForegroundColor White
    Write-Host "  │" -ForegroundColor DarkGray

    # Check if GUI is already installed and up to date
    try {
        $installedGuiVer = $null
        $uninstallKeys = @(
            "HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall\*",
            "HKLM:\Software\Microsoft\Windows\CurrentVersion\Uninstall\*"
        )
        $app = Get-ItemProperty -Path $uninstallKeys -ErrorAction SilentlyContinue | Where-Object { $_.DisplayName -eq "AxioDB Control" } | Select-Object -First 1
        if ($app -and $app.DisplayVersion) {
            $installedGuiVer = $app.DisplayVersion.Trim().TrimStart('v')
        }
        if (-not $installedGuiVer) {
            $defaultExe = "$env:LOCALAPPDATA\Programs\axiodb-control\AxioDB Control.exe"
            if (Test-Path $defaultExe) {
                $installedGuiVer = (Get-Item $defaultExe).VersionInfo.ProductVersion.Trim().TrimStart('v')
            }
        }
        if ($installedGuiVer -eq $VERSION) {
            Write-StepSuccess "Already installed and up to date (v$VERSION)"
            Write-Host "  └" -ForegroundColor DarkGray
            return
        }
    } catch {}

    Write-Step "Resolving release package..."
    try {
        $release = Invoke-RestMethod -Uri "https://api.github.com/repos/$REPO/releases/latest" -UseBasicParsing
        $assets = $release.assets
        
        # Find .exe file for Windows
        $guiAsset = $assets | Where-Object { $_.name -match "\.exe$" } | Select-Object -First 1
        
        if ($guiAsset) {
            $GUI_INSTALLER = $guiAsset.name
            $GUI_URL = $guiAsset.browser_download_url
        } else {
            Write-StepError "No Windows GUI installer found in release"
            Write-Host "  └" -ForegroundColor DarkGray
            exit 1
        }
    } catch {
        Write-StepError "Failed to fetch release info: $_"
        Write-Host "  └" -ForegroundColor DarkGray
        exit 1
    }

    Write-Step "Fetching package ($GUI_INSTALLER)..."

    $TMP_FILE = Join-Path $env:TEMP $GUI_INSTALLER

    try {
        Invoke-WebRequest -Uri $GUI_URL -OutFile $TMP_FILE -UseBasicParsing
    } catch {
        Write-StepError "Failed to download GUI installer: $_"
        Write-Host "  └" -ForegroundColor DarkGray
        exit 1
    }

    Write-StepSuccess "Download complete"

    Write-Step "Verifying SHA-256 cryptographic checksum..."
    try {
        $GUI_CHECKSUM_URL = "https://github.com/$REPO/releases/download/cli-v${VERSION}/gui_checksums.txt"
        $CHECKSUM_FILE = Join-Path $env:TEMP "gui_checksums.txt"
        Invoke-WebRequest -Uri $GUI_CHECKSUM_URL -OutFile $CHECKSUM_FILE -UseBasicParsing
        $checksumContent = Get-Content $CHECKSUM_FILE
        $matchedLine = $checksumContent | Where-Object { $_.Replace(' ', '.') -like "*$GUI_INSTALLER*" } | Select-Object -First 1
        if ($matchedLine) {
            $expectedChecksum = ($matchedLine.Trim() -split '\s+')[0]
            if ($expectedChecksum) {
                $actualChecksum = (Get-FileHash -Path $TMP_FILE -Algorithm SHA256).Hash.ToLower()
                if ($actualChecksum -ne $expectedChecksum.ToLower()) {
                    Write-StepError "Checksum verification failed!"
                    Write-Host "  └" -ForegroundColor DarkGray
                    Remove-Item $TMP_FILE, $CHECKSUM_FILE -Force -ErrorAction SilentlyContinue
                    exit 1
                }
                Write-StepSuccess "Checksum verified (SHA-256)"
            }
        }
        Remove-Item $CHECKSUM_FILE -Force -ErrorAction SilentlyContinue
    } catch {
        Write-Step "Checksum verification skipped" -Glyph "!" -GlyphColor "Yellow" -Color "DarkGray"
    }

    Write-Step "Launching installer wizard..."
    Write-Host "  │  " -NoNewline -ForegroundColor DarkGray
    Write-Host "Please follow the on-screen installer prompts." -ForegroundColor Yellow

    # Launch the NSIS installer
    Start-Process -FilePath $TMP_FILE -Wait

    # Clean up temp installer file
    Remove-Item $TMP_FILE -Force -ErrorAction SilentlyContinue

    Write-StepSuccess "Installed (AxioDB Control)"
    Write-Host "  └" -ForegroundColor DarkGray
}

switch ($CHOICE) {
    "1" {
        Install-CLI
    }
    "2" {
        Install-GUI
    }
    "3" {
        Install-CLI
        Install-GUI
    }
    default {
        Write-Host "  ✖ Invalid choice. Please run the installer again and select 1-3." -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "  ╭──────────────────────────────────────────────────────────╮" -ForegroundColor Cyan
Write-Host "  │  " -NoNewline -ForegroundColor Cyan
Write-Host "✦ AxioDB is ready!                                    " -NoNewline -ForegroundColor Green
Write-Host "│" -ForegroundColor Cyan
Write-Host "  │                                                          │" -ForegroundColor Cyan
Write-Host "  │  " -NoNewline -ForegroundColor Cyan
Write-Host "Quick Start:                                           " -NoNewline -ForegroundColor White
Write-Host "│" -ForegroundColor Cyan
Write-Host "  │    " -NoNewline -ForegroundColor Cyan
Write-Host "$ " -NoNewline -ForegroundColor Cyan
Write-Host "axiodb --help       " -NoNewline -ForegroundColor White
Write-Host "Explore CLI commands             " -NoNewline -ForegroundColor DarkGray
Write-Host "│" -ForegroundColor Cyan
Write-Host "  │    " -NoNewline -ForegroundColor Cyan
Write-Host "$ " -NoNewline -ForegroundColor Cyan
Write-Host "axiodb connect      " -NoNewline -ForegroundColor White
Write-Host "Open interactive database shell  " -NoNewline -ForegroundColor DarkGray
Write-Host "│" -ForegroundColor Cyan
Write-Host "  │    " -NoNewline -ForegroundColor Cyan
Write-Host "AxioDB Control      " -NoNewline -ForegroundColor White
Write-Host "Launch desktop control app       " -NoNewline -ForegroundColor DarkGray
Write-Host "│" -ForegroundColor Cyan
Write-Host "  ╰──────────────────────────────────────────────────────────╯" -ForegroundColor Cyan
Write-Host ""
