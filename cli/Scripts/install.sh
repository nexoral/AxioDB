#!/bin/bash
set -e

REPO="nexoral/AxioDB"
CLI_INSTALL_DIR="/usr/local/bin"
BINARY_NAME="axiodb"

BOLD='\033[1m'
DIM='\033[2m'
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

OS=$(uname -s | tr '[:upper:]' '[:lower:]')
ARCH=$(uname -m)

case "$ARCH" in
    x86_64|amd64) ARCH="amd64" ;;
    i386|i686) ARCH="386" ;;
    aarch64|arm64) ARCH="arm64" ;;
    armv7*|armv6*) ARCH="arm" ;;
    *) echo -e "  ${RED}✖ Unsupported architecture: $ARCH${NC}"; exit 1 ;;
esac

case "$OS" in
    linux) OS="linux" ;;
    darwin) OS="darwin" ;;
    freebsd) OS="freebsd" ;;
    openbsd) OS="openbsd" ;;
    netbsd) OS="netbsd" ;;
    *) echo -e "  ${RED}✖ Unsupported OS: $OS${NC}"; exit 1 ;;
esac

VERSION=$(curl -fsSL "https://api.github.com/repos/$REPO/releases/latest" | grep '"tag_name"' | sed -E 's/.*"cli-v([^"]+)".*/\1/')
if [ -z "$VERSION" ]; then
    echo -e "  ${RED}✖ Failed to resolve latest version from GitHub${NC}"
    exit 1
fi

TERM_WIDTH=$(tput cols 2>/dev/null || echo 100)
if [ -z "$TERM_WIDTH" ] || [ "$TERM_WIDTH" -lt 80 ]; then
    TERM_WIDTH=80
elif [ "$TERM_WIDTH" -gt 130 ]; then
    TERM_WIDTH=130
fi

W_LEFT=$(( (TERM_WIDTH - 7) / 2 ))
W_RIGHT=$(( TERM_WIDTH - 7 - W_LEFT ))

make_bar() {
    local len=$1
    if [ "$len" -le 0 ]; then len=1; fi
    printf "─%.0s" $(seq 1 "$len")
}

pad_cell() {
    local text="$1"
    local target_width="$2"
    local char_len=${#text}
    local pad_len=$(( target_width - char_len ))
    if [ "$pad_len" -lt 0 ]; then pad_len=0; fi
    printf "%s%*s" "$text" "$pad_len" ""
}

panel_top() {
    local tl="$1"
    local tr="$2"
    local rem_l=$(( W_LEFT - ${#tl} - 1 ))
    local rem_r=$(( W_RIGHT - ${#tr} - 1 ))
    echo -e "  ${CYAN}╭─${NC} ${BOLD}${tl}${NC} ${CYAN}$(make_bar $rem_l)┬─${NC} ${BOLD}${tr}${NC} ${CYAN}$(make_bar $rem_r)╮${NC}"
}

panel_row() {
    local l="$1"
    local r="$2"
    local pl=$(pad_cell "$l" "$W_LEFT")
    local pr=$(pad_cell "$r" "$W_RIGHT")
    echo -e "  ${CYAN}│${NC} ${pl} ${CYAN}│${NC} ${DIM}${pr}${NC} ${CYAN}│${NC}"
}

panel_bottom() {
    echo -e "  ${CYAN}╰$(make_bar $(( W_LEFT + 2 )))┴$(make_bar $(( W_RIGHT + 2 )))╯${NC}"
}

echo ""
echo -e "  ${CYAN}${BOLD}✦ AxioDB${NC} ${DIM}— Next-Gen Embedded NoSQL Database for TypeScript & AI Agents${NC}"
echo -e "  ${CYAN}$(make_bar $(( TERM_WIDTH - 2 )))${NC}"
echo -e "  ${DIM}●${NC} System: ${BOLD}${OS}-${ARCH}${NC}   ${DIM}●${NC} Release: ${CYAN}v${VERSION}${NC}   ${DIM}●${NC} Engine: ${BOLD}Zero Native Deps${NC}"
echo ""

# Detect interactive mode — when piped (curl ... | bash), stdin is not a TTY
if [ -n "$CHOICE" ]; then
    echo -e "  ${DIM}Using choice from environment:${NC} ${BOLD}$CHOICE${NC}"
elif [ -t 0 ]; then
    panel_top "Target Selection" "Suggestions & AI Highlights"
    panel_row "[1] CLI only   - Command-line tool (~5MB)" "> Interactive REPL: axiodb connect"
    panel_row "[2] GUI only   - Desktop control app (~80MB)" "> AI Context Server: axiodb serve mcp"
    panel_row "[3] Full Suite - CLI + GUI complete suite" "> Dual-Write Cache & Zero Native Deps"
    panel_row "" "> Ports: GUI 27018 | TCP 27019 | MCP 27020"
    panel_bottom
    echo ""
    read -p "  Enter selection [1-3] (default: 1): " USER_INPUT
    CHOICE="${USER_INPUT:-1}"
else
    echo -e "  ${DIM}Non-interactive mode detected (piped install).${NC}"
    echo -e "  ${DIM}Installing${NC} ${BOLD}CLI only${NC} ${DIM}by default. To customize:${NC}"
    echo -e "    ${CYAN}curl -fsSL https://raw.githubusercontent.com/$REPO/main/cli/Scripts/install.sh | CHOICE=2 bash${NC}"
    echo ""
    CHOICE="1"
fi

install_cli() {
    echo ""
    # Check if CLI is already installed and up to date
    if command -v "$BINARY_NAME" &>/dev/null; then
        CURRENT_CLI_VER=$("$BINARY_NAME" version --short 2>/dev/null | tr -d 'v[:space:]')
        if [ -z "$CURRENT_CLI_VER" ]; then
            CURRENT_CLI_VER=$("$BINARY_NAME" version 2>/dev/null | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1)
        fi
        if [ "$CURRENT_CLI_VER" = "$VERSION" ]; then
            panel_top "AxioDB CLI (v${VERSION})" "Status & Suggestions"
            panel_row "✔ Already installed and up to date!" "> Quick check:  axiodb version"
            panel_row "" "> REPL shell:   axiodb connect"
            panel_bottom
            return 0
        fi
    fi

    panel_top "Installing AxioDB CLI (v${VERSION})" "Suggestions for CLI"
    panel_row "◇ Fetching binary (${BINARY_NAME}_${OS}_${ARCH})..." "> Instant server:  axiodb serve full"

    DOWNLOAD_FILE="${BINARY_NAME}_${OS}_${ARCH}"
    DOWNLOAD_URL="https://github.com/$REPO/releases/download/cli-v${VERSION}/${DOWNLOAD_FILE}"
    CHECKSUM_URL="https://github.com/$REPO/releases/download/cli-v${VERSION}/checksums.txt"

    TMP_DIR=$(mktemp -d)
    cd "$TMP_DIR"

    if ! curl -fsSL -o "$DOWNLOAD_FILE" "$DOWNLOAD_URL"; then
        panel_row "✖ Download failed" ""
        panel_bottom
        rm -rf "$TMP_DIR"
        exit 1
    fi
    panel_row "✔ Download complete" "> AI context:      axiodb serve mcp"

    panel_row "◇ Verifying SHA-256 checksum..." "> Direct TCP:      port 27019"
    if curl -fsSL -o "checksums.txt" "$CHECKSUM_URL" 2>/dev/null; then
        EXPECTED_CHECKSUM=$(grep "$DOWNLOAD_FILE" checksums.txt | awk '{print $1}')
        if [ -n "$EXPECTED_CHECKSUM" ]; then
            if command -v sha256sum &>/dev/null; then
                ACTUAL_CHECKSUM=$(sha256sum "$DOWNLOAD_FILE" | awk '{print $1}')
            elif command -v shasum &>/dev/null; then
                ACTUAL_CHECKSUM=$(shasum -a 256 "$DOWNLOAD_FILE" | awk '{print $1}')
            fi
            if [ -n "$ACTUAL_CHECKSUM" ] && [ "$EXPECTED_CHECKSUM" != "$ACTUAL_CHECKSUM" ]; then
                panel_row "✖ Checksum verification failed!" ""
                panel_bottom
                rm -rf "$TMP_DIR"
                exit 1
            fi
            panel_row "✔ Checksum verified (SHA-256)" "> Self-uninstaller: axiodb destroy"
        fi
    fi

    sudo mv "$DOWNLOAD_FILE" "$CLI_INSTALL_DIR/$BINARY_NAME"
    sudo chmod +x "$CLI_INSTALL_DIR/$BINARY_NAME"

    cd /
    rm -rf "$TMP_DIR"

    if command -v $BINARY_NAME &> /dev/null; then
        panel_row "✔ Deployed to ${CLI_INSTALL_DIR}/${BINARY_NAME}" "> Ready to use:    axiodb --help"
        panel_bottom
    else
        panel_row "✖ CLI verification failed" ""
        panel_bottom
        exit 1
    fi
}

install_gui() {
    echo ""
    # Check if GUI is already installed and up to date
    CURRENT_GUI_VER=""
    if [ "$OS" = "linux" ]; then
        if command -v dpkg-query &>/dev/null; then
            PKG_STATUS=$(dpkg-query -W -f='${db:Status-Status}' axiodb-control 2>/dev/null || true)
            if [ "$PKG_STATUS" = "installed" ]; then
                CURRENT_GUI_VER=$(dpkg-query -W -f='${Version}' axiodb-control 2>/dev/null | tr -d 'v[:space:]')
            fi
        fi
        if [ -z "$CURRENT_GUI_VER" ] && [ -x "/usr/local/bin/axiodb-control" ] && [ -f "/usr/local/bin/.axiodb-control-version" ]; then
            CURRENT_GUI_VER=$(cat "/usr/local/bin/.axiodb-control-version" 2>/dev/null | tr -d 'v[:space:]')
        fi
        # Ensure the executable actually exists on disk
        if ! command -v axiodb-control &>/dev/null && [ ! -x "/opt/AxioDB Control/axiodb-control" ] && [ ! -x "/usr/local/bin/axiodb-control" ]; then
            CURRENT_GUI_VER=""
        fi
    elif [ "$OS" = "darwin" ]; then
        if [ -d "/Applications/AxioDB Control.app" ]; then
            CURRENT_GUI_VER=$(defaults read "/Applications/AxioDB Control.app/Contents/Info.plist" CFBundleShortVersionString 2>/dev/null | tr -d 'v[:space:]')
            if [ -z "$CURRENT_GUI_VER" ] && [ -f "/Applications/AxioDB Control.app/Contents/Info.plist" ]; then
                CURRENT_GUI_VER=$(grep -A1 'CFBundleShortVersionString' "/Applications/AxioDB Control.app/Contents/Info.plist" 2>/dev/null | tail -1 | sed -E 's/.*<string>([^<]+)<\/string>.*/\1/' | tr -d 'v[:space:]')
            fi
        fi
    fi

    if [ -n "$CURRENT_GUI_VER" ] && [ "$CURRENT_GUI_VER" = "$VERSION" ]; then
        panel_top "AxioDB GUI (v${VERSION})" "Status & Suggestions"
        panel_row "✔ Already installed and up to date!" "> Launch desktop: axiodb-control"
        panel_row "" "> Web Dashboard:  http://localhost:27018"
        panel_bottom
        return 0
    fi

    TMP_DIR=$(mktemp -d)
    cd "$TMP_DIR"

    panel_top "Installing AxioDB GUI (v${VERSION})" "Suggestions for Desktop GUI"
    panel_row "◇ Resolving release package..." "> Desktop control: axiodb-control"

    RELEASE_JSON=$(curl -fsSL "https://api.github.com/repos/$REPO/releases/latest")
    
    GUI_FILE=""
    GUI_TYPE=""

    if [ "$OS" = "linux" ]; then
        DEB_FILE=$(echo "$RELEASE_JSON" | grep -o '"name": *"[^"]*\.deb"' | head -1 | sed 's/.*"\([^"]*\.deb\)".*/\1/')
        APPIMAGE_FILE=$(echo "$RELEASE_JSON" | grep -o '"name": *"[^"]*\.AppImage"' | head -1 | sed 's/.*"\([^"]*\.AppImage\)".*/\1/')

        if [ -n "$DEB_FILE" ]; then
            GUI_FILE="$DEB_FILE"
            GUI_TYPE="deb"
        elif [ -n "$APPIMAGE_FILE" ]; then
            GUI_FILE="$APPIMAGE_FILE"
            GUI_TYPE="appimage"
        else
            panel_row "✖ No Linux GUI installer found" ""
            panel_bottom
            rm -rf "$TMP_DIR"
            exit 1
        fi
    elif [ "$OS" = "darwin" ]; then
        ZIP_FILE=$(echo "$RELEASE_JSON" | grep -o '"name": *"[^"]*\.zip"' | head -1 | sed 's/.*"\([^"]*\.zip\)".*/\1/')

        if [ -n "$ZIP_FILE" ]; then
            GUI_FILE="$ZIP_FILE"
            GUI_TYPE="zip"
        else
            panel_row "✖ No macOS GUI installer found" ""
            panel_bottom
            rm -rf "$TMP_DIR"
            exit 1
        fi
    else
        panel_row "✖ GUI installation not supported for ${OS}" ""
        panel_bottom
        rm -rf "$TMP_DIR"
        exit 1
    fi

    DOWNLOAD_URL="https://github.com/$REPO/releases/download/cli-v${VERSION}/${GUI_FILE}"
    panel_row "◇ Fetching package (${GUI_FILE})..." "> Visualizer:     Documents & indexes"

    if ! curl -fsSL -o "$GUI_FILE" "$DOWNLOAD_URL"; then
        panel_row "✖ Failed to download GUI package" ""
        panel_bottom
        rm -rf "$TMP_DIR"
        exit 1
    fi
    panel_row "✔ Download complete" "> Real-time:      Database metrics"

    panel_row "◇ Verifying SHA-256 checksum..." "> Dual-write:     Fast index cache"
    GUI_CHECKSUM_URL="https://github.com/$REPO/releases/download/cli-v${VERSION}/gui_checksums.txt"
    if curl -fsSL -o "gui_checksums.txt" "$GUI_CHECKSUM_URL" 2>/dev/null; then
        EXPECTED_CHECKSUM=$(tr ' ' '.' < gui_checksums.txt | grep "$GUI_FILE" | cut -c1-64)
        if [ -n "$EXPECTED_CHECKSUM" ]; then
            if command -v sha256sum &>/dev/null; then
                ACTUAL_CHECKSUM=$(sha256sum "$GUI_FILE" | awk '{print $1}')
            elif command -v shasum &>/dev/null; then
                ACTUAL_CHECKSUM=$(shasum -a 256 "$GUI_FILE" | awk '{print $1}')
            fi
            if [ -n "$ACTUAL_CHECKSUM" ] && [ "$EXPECTED_CHECKSUM" != "$ACTUAL_CHECKSUM" ]; then
                panel_row "✖ Checksum verification failed!" ""
                panel_bottom
                rm -rf "$TMP_DIR"
                exit 1
            fi
            panel_row "✔ Checksum verified (SHA-256)" "> Security:       Audit logs & RBAC"
        fi
    fi

    case "$GUI_TYPE" in
        deb)
            sudo dpkg -i "$GUI_FILE" 2>/dev/null || sudo apt-get install -f -y
            panel_row "✔ System package configured (axiodb-control)" "> Menu shortcut:  AxioDB Control"
            ;;
        appimage)
            chmod +x "$GUI_FILE"
            sudo mv "$GUI_FILE" /usr/local/bin/axiodb-control
            echo "$VERSION" | sudo tee /usr/local/bin/.axiodb-control-version >/dev/null 2>&1 || true
            panel_row "✔ Installed to /usr/local/bin/axiodb-control" "> Command:        axiodb-control"
            ;;
        zip)
            unzip -q "$GUI_FILE"
            sudo cp -r "AxioDB Control.app" /Applications/
            panel_row "✔ Deployed to /Applications/AxioDB Control.app" "> Finder:         Applications folder"
            ;;
    esac

    panel_bottom
    cd /
    rm -rf "$TMP_DIR"
}

case "$CHOICE" in
    1)
        install_cli
        ;;
    2)
        install_gui
        ;;
    3)
        install_cli
        install_gui
        ;;
    *)
        echo -e "  ${RED}✖ Invalid choice. Please run the installer again and select 1-3.${NC}"
        exit 1
        ;;
esac

echo ""
panel_top "✦ AxioDB is Ready!" "Quick Start & AI Shortcuts"
panel_row "$ axiodb --help      Explore CLI commands" "> TCP Server:    axiodb://127.0.0.1:27019"
panel_row "$ axiodb connect     Interactive REPL"     "> Desktop GUI:   Run 'axiodb-control'"
panel_row "$ axiodb serve mcp   AI Agent context"     "> Documentation: https://axiodb.in"
panel_bottom
echo ""
