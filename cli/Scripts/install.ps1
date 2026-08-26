#Requires -Version 3.0
<#
.SYNOPSIS
    AxioDB CLI Installer for Windows
.EXAMPLE
    irm https://raw.githubusercontent.com/nexoral/AxioDB/main/cli/Scripts/install.ps1 | iex
#>

$REPO = "nexoral/AxioDB"
$INSTALL_DIR = "$env:LOCALAPPDATA\AxioDB"
$BINARY_NAME = "axiodb.exe"
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

Write-ColorOutput "AxioDB CLI Installer for Windows" "Blue"
Write-ColorOutput "================================" "DarkGray"

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

$DOWNLOAD_FILE = "axiodb_windows_${ARCH}.exe"
$DOWNLOAD_URL = "https://github.com/$REPO/releases/download/cli-v${VERSION}/${DOWNLOAD_FILE}"
$CHECKSUM_URL = "https://github.com/$REPO/releases/download/cli-v${VERSION}/checksums.txt"

Write-ColorOutput "[*] Downloading $DOWNLOAD_FILE..." "White"

try {
    if (-not (Test-Path $INSTALL_DIR)) {
        New-Item -ItemType Directory -Force -Path $INSTALL_DIR | Out-Null
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

Write-ColorOutput "[*] Installing..." "White"
$destPath = Join-Path $INSTALL_DIR $BINARY_NAME
Move-Item -Path $TMP_FILE -Destination $destPath -Force

$currentPath = [Environment]::GetEnvironmentVariable("Path", "User")
if ($currentPath -notlike "*$INSTALL_DIR*") {
    [Environment]::SetEnvironmentVariable("Path", "$currentPath;$INSTALL_DIR", "User")
    $env:Path = "$env:Path;$INSTALL_DIR"
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
