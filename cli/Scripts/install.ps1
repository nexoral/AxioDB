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

$termWidth = 100
try {
    $termWidth = $Host.UI.RawUI.WindowSize.Width
} catch {}
if (-not $termWidth -or $termWidth -lt 80) { $termWidth = 80 }
if ($termWidth -gt 130) { $termWidth = 130 }

$wLeft = [math]::Floor(($termWidth - 7) / 2)
$wRight = $termWidth - 7 - $wLeft

$SPINNER_FRAMES = @("⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏")

function Make-Bar([int]$len) {
    if ($len -le 0) { $len = 1 }
    return [string]::new([char]0x2500, $len)
}

function Pad-Cell([string]$text, [int]$targetWidth) {
    $len = $text.Length
    $pad = $targetWidth - $len
    if ($pad -lt 0) { $pad = 0 }
    return $text + (" " * $pad)
}

function Print-PanelTop([string]$tl, [string]$tr) {
    $remL = $wLeft - $tl.Length - 1
    $remR = $wRight - $tr.Length - 1
    Write-Host "  " -NoNewline
    Write-Host "╭─ " -NoNewline -ForegroundColor Cyan
    Write-Host "$tl " -NoNewline -ForegroundColor White
    Write-Host (Make-Bar $remL) -NoNewline -ForegroundColor Cyan
    Write-Host "┬─ " -NoNewline -ForegroundColor Cyan
    Write-Host "$tr " -NoNewline -ForegroundColor White
    Write-Host (Make-Bar $remR) -NoNewline -ForegroundColor Cyan
    Write-Host "╮" -ForegroundColor Cyan
}

function Print-PanelRow([string]$l, [string]$r) {
    $pl = Pad-Cell $l $wLeft
    $pr = Pad-Cell $r $wRight
    Write-Host "  " -NoNewline
    Write-Host "│ " -NoNewline -ForegroundColor Cyan
    Write-Host "$pl " -NoNewline -ForegroundColor White
    Write-Host "│ " -NoNewline -ForegroundColor Cyan
    Write-Host "$pr " -NoNewline -ForegroundColor DarkGray
    Write-Host "│" -ForegroundColor Cyan
}

function Print-PanelBottom {
    Write-Host "  " -NoNewline
    Write-Host ("╰" + (Make-Bar ($wLeft + 2)) + "┴" + (Make-Bar ($wRight + 2)) + "╯") -ForegroundColor Cyan
}

function Invoke-SpinnerAnimation([string]$msg, [scriptblock]$action) {
    if (-not [Environment]::UserInteractive) {
        & $action
        return
    }
    try { [Console]::CursorVisible = $false } catch {}
    $asyncResult = $action.BeginInvoke($null, $null)
    $i = 0
    while (-not $asyncResult.IsCompleted) {
        $frame = $SPINNER_FRAMES[$i % $SPINNER_FRAMES.Length]
        Write-Host ("`r  │ " + $frame + " " + $msg) -NoNewline -ForegroundColor Cyan
        Start-Sleep -Milliseconds 80
        $i++
    }
    $action.EndInvoke($asyncResult) | Out-Null
    Write-Host "`r  │                                                                `r" -NoNewline
    try { [Console]::CursorVisible = $true } catch {}
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
Write-Host "— Next-Gen Embedded NoSQL Database for TypeScript & AI Agents" -ForegroundColor DarkGray
Write-Host ("  " + (Make-Bar ($termWidth - 2))) -ForegroundColor Cyan
Write-Host "  ● " -NoNewline -ForegroundColor DarkGray
Write-Host "System:  " -NoNewline -ForegroundColor Gray
Write-Host "windows-$ARCH   " -NoNewline -ForegroundColor White
Write-Host "● " -NoNewline -ForegroundColor DarkGray
Write-Host "Release: " -NoNewline -ForegroundColor Gray
Write-Host "v$VERSION   " -NoNewline -ForegroundColor Cyan
Write-Host "● " -NoNewline -ForegroundColor DarkGray
Write-Host "Engine:  " -NoNewline -ForegroundColor Gray
Write-Host "Zero Native Deps" -ForegroundColor White
Write-Host ""

if ($env:CHOICE) {
    Write-Host "  Using choice from environment: " -NoNewline -ForegroundColor DarkGray
    Write-Host $env:CHOICE -ForegroundColor White
    $CHOICE = $env:CHOICE
} else {
    Print-PanelTop "Target Selection" "Suggestions & AI Highlights"
    Print-PanelRow "[1] CLI only   - Command-line tool (~5MB)" "> Interactive REPL: axiodb connect"
    Print-PanelRow "[2] GUI only   - Desktop control app (~80MB)" "> AI Context Server: axiodb serve mcp"
    Print-PanelRow "[3] Full Suite - CLI + GUI complete suite" "> Dual-Write Cache & Zero Native Deps"
    Print-PanelRow "" "> Ports: GUI 27018 | TCP 27019 | MCP 27020"
    Print-PanelBottom
    Write-Host ""

    $userInput = Read-Host "  Enter selection [1-3] (default: 1)"
    if (-not $userInput) { $CHOICE = "1" } else { $CHOICE = $userInput.Trim() }
}

function Install-CLI {
    Write-Host ""
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
                Print-PanelTop "AxioDB CLI (v$VERSION)" "Status & Suggestions"
                Print-PanelRow "✔ Already installed and up to date!" "> Quick check:  axiodb version"
                Print-PanelRow "" "> REPL shell:   axiodb connect"
                Print-PanelBottom
                return
            }
        } catch {}
    }

    Print-PanelTop "Installing AxioDB CLI (v$VERSION)" "Suggestions for CLI"

    $DOWNLOAD_FILE = "axiodb_windows_${ARCH}.exe"
    $DOWNLOAD_URL = "https://github.com/$REPO/releases/download/cli-v${VERSION}/${DOWNLOAD_FILE}"
    $CHECKSUM_URL = "https://github.com/$REPO/releases/download/cli-v${VERSION}/checksums.txt"

    try {
        if (-not (Test-Path $CLI_INSTALL_DIR)) {
            New-Item -ItemType Directory -Force -Path $CLI_INSTALL_DIR | Out-Null
        }
    } catch {
        Print-PanelRow "✖ Failed to create install directory" ""
        Print-PanelBottom
        exit 1
    }

    $TMP_FILE = Join-Path $env:TEMP $DOWNLOAD_FILE

    Invoke-SpinnerAnimation "Downloading $DOWNLOAD_FILE..." {
        Invoke-WebRequest -Uri $DOWNLOAD_URL -OutFile $TMP_FILE -UseBasicParsing
    }

    Print-PanelRow "✔ Download complete ($DOWNLOAD_FILE)" "> AI context:      axiodb serve mcp"

    Invoke-SpinnerAnimation "Verifying SHA-256 cryptographic checksum..." {
        try {
            $CHECKSUM_FILE = Join-Path $env:TEMP "checksums.txt"
            Invoke-WebRequest -Uri $CHECKSUM_URL -OutFile $CHECKSUM_FILE -UseBasicParsing
            $checksumContent = Get-Content $CHECKSUM_FILE
            $expectedChecksum = ($checksumContent | Select-String -Pattern "$DOWNLOAD_FILE").Line -split '\s+' | Select-Object -First 1
            if ($expectedChecksum) {
                $actualChecksum = (Get-FileHash -Path $TMP_FILE -Algorithm SHA256).Hash.ToLower()
                if ($actualChecksum -ne $expectedChecksum.ToLower()) {
                    Print-PanelRow "✖ Checksum verification failed!" ""
                    Print-PanelBottom
                    Remove-Item $TMP_FILE, $CHECKSUM_FILE -Force -ErrorAction SilentlyContinue
                    exit 1
                }
                Print-PanelRow "✔ Checksum verified (SHA-256)" "> Direct TCP:      port 27019"
            }
            Remove-Item $CHECKSUM_FILE -Force -ErrorAction SilentlyContinue
        } catch {
            Print-PanelRow "! Checksum verification skipped" ""
        }
    }

    $destPath = Join-Path $CLI_INSTALL_DIR $CLI_BINARY_NAME
    Move-Item -Path $TMP_FILE -Destination $destPath -Force

    $currentPath = [Environment]::GetEnvironmentVariable("Path", "User")
    if ($currentPath -notlike "*$CLI_INSTALL_DIR*") {
        [Environment]::SetEnvironmentVariable("Path", "$currentPath;$CLI_INSTALL_DIR", "User")
        $env:Path = "$env:Path;$CLI_INSTALL_DIR"
    }

    Print-PanelRow "✔ Deployed to $CLI_INSTALL_DIR" "> Ready to use:    axiodb --help"
    Print-PanelBottom
}

function Install-GUI {
    Write-Host ""
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
        $defaultExe = "$env:LOCALAPPDATA\Programs\axiodb-control\AxioDB Control.exe"
        if (-not $installedGuiVer -and (Test-Path $defaultExe)) {
            $installedGuiVer = (Get-Item $defaultExe).VersionInfo.ProductVersion.Trim().TrimStart('v')
        }
        # Ensure executable actually exists on disk
        $exeExists = (Test-Path $defaultExe) -or (Test-Path "$env:ProgramFiles\AxioDB Control\AxioDB Control.exe")
        if (-not $exeExists) {
            $installedGuiVer = $null
        }
        if ($installedGuiVer -eq $VERSION) {
            Print-PanelTop "AxioDB GUI (v$VERSION)" "Status & Suggestions"
            Print-PanelRow "✔ Already installed and up to date!" "> Launch desktop: AxioDB Control"
            Print-PanelRow "" "> Web Dashboard:  http://localhost:27018"
            Print-PanelBottom
            return
        }
    } catch {}

    Print-PanelTop "Installing AxioDB GUI (v$VERSION)" "Suggestions for Desktop GUI"

    $release = $null
    Invoke-SpinnerAnimation "Resolving release package..." {
        $release = Invoke-RestMethod -Uri "https://api.github.com/repos/$REPO/releases/latest" -UseBasicParsing
    }
    
    $assets = $release.assets
    $guiAsset = $assets | Where-Object { $_.name -match "\.exe$" } | Select-Object -First 1
    
    if (-not $guiAsset) {
        Print-PanelRow "✖ No Windows GUI installer found" ""
        Print-PanelBottom
        exit 1
    }

    $GUI_INSTALLER = $guiAsset.name
    $GUI_URL = $guiAsset.browser_download_url
    $TMP_FILE = Join-Path $env:TEMP $GUI_INSTALLER

    Invoke-SpinnerAnimation "Downloading package ($GUI_INSTALLER)..." {
        Invoke-WebRequest -Uri $GUI_URL -OutFile $TMP_FILE -UseBasicParsing
    }

    Print-PanelRow "✔ Download complete ($GUI_INSTALLER)" "> Visualizer:     Documents & indexes"

    Invoke-SpinnerAnimation "Verifying SHA-256 cryptographic checksum..." {
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
                        Print-PanelRow "✖ Checksum verification failed!" ""
                        Print-PanelBottom
                        Remove-Item $TMP_FILE, $CHECKSUM_FILE -Force -ErrorAction SilentlyContinue
                        exit 1
                    }
                    Print-PanelRow "✔ Checksum verified (SHA-256)" "> Security:       Audit logs & RBAC"
                }
            }
            Remove-Item $CHECKSUM_FILE -Force -ErrorAction SilentlyContinue
        } catch {
            Print-PanelRow "! Checksum verification skipped" ""
        }
    }

    Print-PanelRow "◇ Launching installer wizard..." "> Complete setup: In wizard window"
    Print-PanelBottom

    Write-Host ""
    Write-Host "  Please follow the on-screen installer prompts." -ForegroundColor Yellow
    Write-Host ""

    # Launch the NSIS installer
    Start-Process -FilePath $TMP_FILE -Wait

    # Clean up temp installer file
    Remove-Item $TMP_FILE -Force -ErrorAction SilentlyContinue
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
Print-PanelTop "✦ AxioDB is Ready!" "Quick Start & AI Shortcuts"
Print-PanelRow "$ axiodb --help      Explore CLI commands" "> TCP Server:    axiodb://127.0.0.1:27019"
Print-PanelRow "$ axiodb connect     Interactive REPL"     "> Desktop GUI:   AxioDB Control"
Print-PanelRow "$ axiodb serve mcp   AI Agent context"     "> Documentation: https://axiodb.in"
Print-PanelBottom
Write-Host ""
