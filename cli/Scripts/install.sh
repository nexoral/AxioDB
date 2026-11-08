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

SPINNER_FRAMES=("⠋" "⠙" "⠹" "⠸" "⠼" "⠴" "⠦" "⠧" "⠇" "⠏")
spin_pid=""
SUDO_KEEP_ALIVE_PID=""

SUDO=""
if [ "$(id -u)" -ne 0 ]; then
    if command -v sudo >/dev/null 2>&1; then
        SUDO="sudo"
    fi
fi

# Cleanup handler to ensure cursor is always restored and background jobs terminated
cleanup() {
    if [ -n "$spin_pid" ]; then
        kill "$spin_pid" >/dev/null 2>&1 || true
        wait "$spin_pid" 2>/dev/null || true
    fi
    if [ -n "$SUDO_KEEP_ALIVE_PID" ]; then
        kill "$SUDO_KEEP_ALIVE_PID" >/dev/null 2>&1 || true
        wait "$SUDO_KEEP_ALIVE_PID" 2>/dev/null || true
    fi
    tput cnorm 2>/dev/null || true
}
trap cleanup EXIT INT TERM

ensure_sudo() {
    if [ "$(id -u)" -eq 0 ] || [ -z "$SUDO" ]; then
        return 0
    fi

    if ! sudo -n true 2>/dev/null; then
        if ! sudo -v; then
            echo -e "  ${RED}✖ Sudo authentication failed${NC}"
            exit 1
        fi
        if [ -t 1 ]; then
            printf "\033[1A\033[2K\r"
        elif [ -c /dev/tty ]; then
            printf "\033[1A\033[2K\r" > /dev/tty 2>/dev/null || true
        fi
    fi

    if [ -z "$SUDO_KEEP_ALIVE_PID" ]; then
        ( while true; do sudo -n true; sleep 50; kill -0 "$$" || exit; done 2>/dev/null ) &
        SUDO_KEEP_ALIVE_PID=$!
    fi
}

start_spinner() {
    local msg="$1"
    local file="$2"
    if [ ! -t 1 ]; then
        return
    fi
    tput civis 2>/dev/null || true
    (
        i=0
        while true; do
            local frame="${SPINNER_FRAMES[i]}"
            local size_str=""
            if [ -n "$file" ] && [ -f "$file" ]; then
                local b
                b=$(stat -c%s "$file" 2>/dev/null || stat -f%z "$file" 2>/dev/null || echo 0)
                if [ "$b" -gt 0 ]; then
                    local mb=$(awk -v b="$b" 'BEGIN {printf "%.1f", b/1048576}')
                    size_str=" (${mb} MB)"
                fi
            fi
            printf "\r  \033[36m│\033[0m \033[36m%s\033[0m %s%s" "$frame" "$msg" "$size_str"
            i=$(( (i + 1) % ${#SPINNER_FRAMES[@]} ))
            sleep 0.08
        done
    ) &
    spin_pid=$!
}

stop_spinner() {
    if [ -n "$spin_pid" ]; then
        kill "$spin_pid" >/dev/null 2>&1 || true
        wait "$spin_pid" 2>/dev/null || true
        spin_pid=""
    fi
    if [ -t 1 ]; then
        printf "\r\033[K"
    fi
    tput cnorm 2>/dev/null || true
}

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
    panel_row "" "> Ports: HTTP 27018 | TCP 27019 | MCP 27020"
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
    # Check if CLI is already installed and up to date
    if command -v "$BINARY_NAME" &>/dev/null; then
        CURRENT_CLI_VER=$("$BINARY_NAME" version --short 2>/dev/null | tr -d 'v[:space:]')
        if [ -z "$CURRENT_CLI_VER" ]; then
            CURRENT_CLI_VER=$("$BINARY_NAME" version 2>/dev/null | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1)
        fi
        if [ "$CURRENT_CLI_VER" = "$VERSION" ]; then
            echo ""
            panel_top "AxioDB CLI (v${VERSION})" "Status & Suggestions"
            panel_row "✔ Already installed and up to date!" "> Quick check:  axiodb version"
            panel_row "" "> REPL shell:   axiodb connect"
            panel_bottom
            return 0
        fi
    fi

    ensure_sudo

    echo ""
    panel_top "Installing AxioDB CLI (v${VERSION})" "Suggestions for CLI"

    DOWNLOAD_FILE="${BINARY_NAME}_${OS}_${ARCH}"
    DOWNLOAD_URL="https://github.com/$REPO/releases/download/cli-v${VERSION}/${DOWNLOAD_FILE}"
    CHECKSUM_URL="https://github.com/$REPO/releases/download/cli-v${VERSION}/checksums.txt"

    TMP_DIR=$(mktemp -d)
    cd "$TMP_DIR"

    start_spinner "Downloading ${DOWNLOAD_FILE}..." "${TMP_DIR}/${DOWNLOAD_FILE}"
    if ! curl -fsSL -o "$DOWNLOAD_FILE" "$DOWNLOAD_URL"; then
        stop_spinner
        panel_row "✖ Download failed" ""
        panel_bottom
        rm -rf "$TMP_DIR"
        exit 1
    fi
    stop_spinner
    panel_row "✔ Download complete (${DOWNLOAD_FILE})" "> AI context:      axiodb serve mcp"

    start_spinner "Verifying SHA-256 cryptographic checksum..."
    if curl -fsSL -o "checksums.txt" "$CHECKSUM_URL" 2>/dev/null; then
        EXPECTED_CHECKSUM=$(grep "$DOWNLOAD_FILE" checksums.txt | awk '{print $1}')
        if [ -n "$EXPECTED_CHECKSUM" ]; then
            if command -v sha256sum &>/dev/null; then
                ACTUAL_CHECKSUM=$(sha256sum "$DOWNLOAD_FILE" | awk '{print $1}')
            elif command -v shasum &>/dev/null; then
                ACTUAL_CHECKSUM=$(shasum -a 256 "$DOWNLOAD_FILE" | awk '{print $1}')
            fi
            if [ -n "$ACTUAL_CHECKSUM" ] && [ "$EXPECTED_CHECKSUM" != "$ACTUAL_CHECKSUM" ]; then
                stop_spinner
                panel_row "✖ Checksum verification failed!" ""
                panel_bottom
                rm -rf "$TMP_DIR"
                exit 1
            fi
            stop_spinner
            panel_row "✔ Checksum verified (SHA-256)" "> Direct TCP:      port 27019"
        else
            stop_spinner
        fi
    else
        stop_spinner
    fi

    start_spinner "Deploying ${BINARY_NAME} to ${CLI_INSTALL_DIR}..."
    $SUDO mv "$DOWNLOAD_FILE" "$CLI_INSTALL_DIR/$BINARY_NAME"
    $SUDO chmod +x "$CLI_INSTALL_DIR/$BINARY_NAME"
    stop_spinner

    cd /
    rm -rf "$TMP_DIR"

    if command -v $BINARY_NAME &> /dev/null; then
        panel_row "✔ Deployed to ${CLI_INSTALL_DIR}/${BINARY_NAME}" "> Instant server:  axiodb serve full"
        panel_bottom
    else
        panel_row "✖ CLI verification failed" ""
        panel_bottom
        exit 1
    fi
}

install_gui() {
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
        echo ""
        panel_top "AxioDB GUI (v${VERSION})" "Status & Suggestions"
        panel_row "✔ Already installed and up to date!" "> Launch desktop: axiodb-control"
        panel_row "" "> HTTP REST API:   http://localhost:27018"
        panel_bottom
        return 0
    fi

    ensure_sudo

    TMP_DIR=$(mktemp -d)
    cd "$TMP_DIR"

    echo ""
    panel_top "Installing AxioDB GUI (v${VERSION})" "Suggestions for Desktop GUI"

    start_spinner "Resolving release package..."
    RELEASE_JSON=$(curl -fsSL "https://api.github.com/repos/$REPO/releases/latest")
    stop_spinner
    
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
    start_spinner "Downloading package (${GUI_FILE})..." "${TMP_DIR}/${GUI_FILE}"

    if ! curl -fsSL -o "$GUI_FILE" "$DOWNLOAD_URL"; then
        stop_spinner
        panel_row "✖ Failed to download GUI package" ""
        panel_bottom
        rm -rf "$TMP_DIR"
        exit 1
    fi
    stop_spinner
    panel_row "✔ Download complete (${GUI_FILE})" "> Visualizer:     Documents & indexes"

    start_spinner "Verifying SHA-256 cryptographic checksum..."
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
                stop_spinner
                panel_row "✖ Checksum verification failed!" ""
                panel_bottom
                rm -rf "$TMP_DIR"
                exit 1
            fi
            stop_spinner
            panel_row "✔ Checksum verified (SHA-256)" "> Security:       Audit logs & RBAC"
        else
            stop_spinner
        fi
    else
        stop_spinner
    fi

    case "$GUI_TYPE" in
        deb)
            start_spinner "Configuring system package (axiodb-control)..."
            if ! $SUDO dpkg -i "$GUI_FILE" >/dev/null 2>&1; then
                DEBIAN_FRONTEND=noninteractive $SUDO apt-get install -f -y -qq >/dev/null 2>&1 || true
            fi
            stop_spinner
            if command -v axiodb-control &>/dev/null || [ -x "/opt/AxioDB Control/axiodb-control" ] || [ -x "/usr/local/bin/axiodb-control" ]; then
                panel_row "✔ System package configured (axiodb-control)" "> Menu shortcut:  AxioDB Control"
            else
                panel_row "✖ Package installation failed" ""
                panel_bottom
                rm -rf "$TMP_DIR"
                exit 1
            fi
            ;;
        appimage)
            start_spinner "Configuring AppImage..."
            chmod +x "$GUI_FILE"
            $SUDO mv "$GUI_FILE" /usr/local/bin/axiodb-control
            echo "$VERSION" | $SUDO tee /usr/local/bin/.axiodb-control-version >/dev/null 2>&1 || true
            stop_spinner
            panel_row "✔ Installed to /usr/local/bin/axiodb-control" "> Command:        axiodb-control"
            ;;
        zip)
            start_spinner "Deploying AxioDB Control.app..."
            unzip -q "$GUI_FILE" >/dev/null 2>&1
            $SUDO cp -r "AxioDB Control.app" /Applications/
            rm -rf "AxioDB Control.app"
            stop_spinner
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
