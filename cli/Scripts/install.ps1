#Requires -Version 3.0
<#
.SYNOPSIS
    AxioDB Installer for Windows
.DESCRIPTION
    Installs AxioDB CLI and/or GUI (Electron) on Windows.
.EXAMPLE
    irm https://raw.githubusercontent.com/nexoral/AxioDB/main/cli/Scripts/install.ps1 | iex
#>

$REPO = "nexoral/AxioDB"
$CLI_INSTALL_DIR = "$env:LOCALAPPDATA\AxioDB"
$CLI_BINARY_NAME = "axiodb.exe"
$ErrorActionPreference = "Stop"

[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

function Write-ColorOutput {
    param([string]$Message, [string]$Color = "White")
    try { Write-Host $Message -ForegroundColor $Color } catch { Write-Host $Message }
}

function Get-SystemArchitecture {
    if ($env:PROCESSOR_ARCHITECTURE -eq "ARM64") { return "arm64" }
    if ([Environment]::Is64BitOperatingSystem) { return "amd64" }
    return "386"
}

Write-ColorOutput "AxioDB Installer for Windows" "Blue"
Write-ColorOutput "============================" "DarkGray"
Write-Host ""

$ARCH = Get-SystemArchitecture
Write-ColorOutput "[+] Detected: windows-$ARCH" "Green"

Write-ColorOutput "[*] Fetching latest version..." "White"
try {
    $release = Invoke-RestMethod -Uri "https://api.github.com/repos/$REPO/releases/latest"
    $VERSION = ($release.tag_name -replace '^cli-v', '')
} catch {
    Write-ColorOutput "[X] Failed to get latest version" "Red"
    exit 1
}
Write-ColorOutput "[+] Latest version: v$VERSION" "Green"
Write-Host ""

if ($env:CHOICE) {
    Write-ColorOutput "[+] Using install choice: $env:CHOICE (from env)" "Green"
    $CHOICE = $env:CHOICE
} else {
    Write-ColorOutput "What would you like to install?" "Cyan"
    Write-Host ""
    Write-ColorOutput "  1) CLI only      — command-line tool (~5MB)" "Yellow"
    Write-ColorOutput "  2) GUI only      — desktop Electron app (~80MB)" "Yellow"
    Write-ColorOutput "  3) Both          — CLI + GUI" "Yellow"
    Write-Host ""
    $CHOICE = Read-Host "Enter choice [1-3]"
}

function Install-CLI {
    Write-Host ""
    Write-ColorOutput "Installing CLI..." "Blue"
    Write-ColorOutput "========================" "DarkGray"

    $DOWNLOAD_FILE = "axiodb_windows_${ARCH}.exe"
    $DOWNLOAD_URL = "https://github.com/$REPO/releases/download/cli-v${VERSION}/${DOWNLOAD_FILE}"
    $CHECKSUM_URL = "https://github.com/$REPO/releases/download/cli-v${VERSION}/checksums.txt"

    Write-ColorOutput "[*] Downloading $DOWNLOAD_FILE..." "White"

    try {
        if (-not (Test-Path $CLI_INSTALL_DIR)) {
            New-Item -ItemType Directory -Force -Path $CLI_INSTALL_DIR | Out-Null
        }
    } catch {
        Write-ColorOutput "[X] Failed to create install directory" "Red"
        exit 1
    }

    $TMP_FILE = Join-Path $env:TEMP $DOWNLOAD_FILE

    try {
        Invoke-WebRequest -Uri $DOWNLOAD_URL -OutFile $TMP_FILE -UseBasicParsing
    } catch {
        Write-ColorOutput "[X] Download failed" "Red"
        exit 1
    }

    Write-ColorOutput "[+] Download complete" "Green"

    Write-ColorOutput "[*] Verifying checksum..." "White"
    try {
        $CHECKSUM_FILE = Join-Path $env:TEMP "checksums.txt"
        Invoke-WebRequest -Uri $CHECKSUM_URL -OutFile $CHECKSUM_FILE -UseBasicParsing
        $checksumContent = Get-Content $CHECKSUM_FILE
        $expectedChecksum = ($checksumContent | Select-String -Pattern "$DOWNLOAD_FILE").Line -split '\s+' | Select-Object -First 1
        if ($expectedChecksum) {
            $actualChecksum = (Get-FileHash -Path $TMP_FILE -Algorithm SHA256).Hash.ToLower()
            if ($actualChecksum -ne $expectedChecksum.ToLower()) {
                Write-ColorOutput "[X] Checksum verification failed!" "Red"
                Remove-Item $TMP_FILE, $CHECKSUM_FILE -Force -ErrorAction SilentlyContinue
                exit 1
            }
            Write-ColorOutput "[+] Checksum verified" "Green"
        }
        Remove-Item $CHECKSUM_FILE -Force -ErrorAction SilentlyContinue
    } catch {
        Write-ColorOutput "[!] Checksum verification skipped" "Yellow"
    }

    Write-ColorOutput "[*] Installing CLI..." "White"
    $destPath = Join-Path $CLI_INSTALL_DIR $CLI_BINARY_NAME
    Move-Item -Path $TMP_FILE -Destination $destPath -Force

    $currentPath = [Environment]::GetEnvironmentVariable("Path", "User")
    if ($currentPath -notlike "*$CLI_INSTALL_DIR*") {
        [Environment]::SetEnvironmentVariable("Path", "$currentPath;$CLI_INSTALL_DIR", "User")
        $env:Path = "$env:Path;$CLI_INSTALL_DIR"
        Write-ColorOutput "[+] Added to PATH" "Green"
    }

    Write-Host ""
    Write-ColorOutput "AxioDB CLI installed successfully!" "Green"
    Write-Host ""
    Write-ColorOutput "Run 'axiodb --help' to get started" "White"
    Write-ColorOutput "Run 'axiodb connect' to open interactive shell" "White"
    Write-Host ""
    Write-ColorOutput "IMPORTANT: Restart your terminal to use 'axiodb'" "Yellow"
    Write-Host ""
}

function Install-GUI {
    Write-Host ""
    Write-ColorOutput "Installing GUI (Electron)..." "Blue"
    Write-ColorOutput "========================" "DarkGray"

    $GUI_INSTALLER = "AxioDB_Control_${VERSION}.exe"
    $GUI_URL = "https://github.com/$REPO/releases/download/cli-v${VERSION}/AxioDB_Control_${VERSION}.exe"

    Write-ColorOutput "[*] Downloading $GUI_INSTALLER..." "White"

    $TMP_FILE = Join-Path $env:TEMP $GUI_INSTALLER

    try {
        Invoke-WebRequest -Uri $GUI_URL -OutFile $TMP_FILE -UseBasicParsing
    } catch {
        Write-ColorOutput "[X] Failed to download GUI installer" "Red"
        exit 1
    }

    Write-ColorOutput "[+] Download complete" "Green"
    Write-ColorOutput "[*] Launching installer..." "White"
    Write-Host ""
    Write-ColorOutput "Please follow the installation wizard." "Yellow"
    Write-Host ""

    # Launch the NSIS installer
    Start-Process -FilePath $TMP_FILE -Wait

    Write-Host ""
    Write-ColorOutput "AxioDB GUI installation complete!" "Green"
    Write-ColorOutput "Find 'AxioDB Control' in your Start Menu or Desktop" "White"
    Write-Host ""
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
        Write-ColorOutput "[X] Invalid choice. Please run the installer again and select 1-3." "Red"
        exit 1
    }
}

Write-Host ""
Write-ColorOutput "Installation complete!" "Green"
