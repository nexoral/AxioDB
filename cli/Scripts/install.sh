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

echo ""
echo -e "  ${CYAN}${BOLD}✦ AxioDB${NC} ${DIM}— Next-Gen Embedded NoSQL Database${NC}"
echo -e "  ${DIM}─────────────────────────────────────────────${NC}"
echo -e "  ${DIM}●${NC} System:  ${BOLD}${OS}-${ARCH}${NC}"
echo -e "  ${DIM}●${NC} Release: ${CYAN}v${VERSION}${NC}"
echo ""

# Detect interactive mode — when piped (curl ... | bash), stdin is not a TTY
if [ -n "$CHOICE" ]; then
    echo -e "  ${DIM}Using choice from environment:${NC} ${BOLD}$CHOICE${NC}"
elif [ -t 0 ]; then
    echo -e "  ${BOLD}Select installation target:${NC}"
    echo ""
    echo -e "  ${CYAN}[1]${NC} ${BOLD}CLI only${NC}      ${DIM}Command-line engine & tools (~5MB)${NC}"
    echo -e "  ${CYAN}[2]${NC} ${BOLD}GUI only${NC}      ${DIM}Desktop management control app (~80MB)${NC}"
    echo -e "  ${CYAN}[3]${NC} ${BOLD}Full Suite${NC}    ${DIM}CLI + GUI complete installation${NC}"
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
    echo -e "  ${BOLD}┌  Installing AxioDB CLI (v${VERSION})${NC}"
    echo -e "  ${BOLD}│${NC}"

    # Check if CLI is already installed and up to date
    if command -v "$BINARY_NAME" &>/dev/null; then
        CURRENT_CLI_VER=$("$BINARY_NAME" version --short 2>/dev/null | tr -d 'v[:space:]')
        if [ -z "$CURRENT_CLI_VER" ]; then
            CURRENT_CLI_VER=$("$BINARY_NAME" version 2>/dev/null | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1)
        fi
        if [ "$CURRENT_CLI_VER" = "$VERSION" ]; then
            echo -e "  ${BOLD}│${NC}  ${GREEN}✔${NC} Already installed and up to date ${DIM}(v${VERSION})${NC}"
            echo -e "  ${BOLD}└${NC}"
            return 0
        fi
    fi

    DOWNLOAD_FILE="${BINARY_NAME}_${OS}_${ARCH}"
    DOWNLOAD_URL="https://github.com/$REPO/releases/download/cli-v${VERSION}/${DOWNLOAD_FILE}"
    CHECKSUM_URL="https://github.com/$REPO/releases/download/cli-v${VERSION}/checksums.txt"

    echo -e "  ${BOLD}│${NC}  ${CYAN}◇${NC} Fetching binary ${DIM}(${DOWNLOAD_FILE})${NC}..."

    TMP_DIR=$(mktemp -d)
    cd "$TMP_DIR"

    if ! curl -fsSL -o "$DOWNLOAD_FILE" "$DOWNLOAD_URL"; then
        echo -e "  ${BOLD}│${NC}  ${RED}✖ Download failed${NC}"
        echo -e "  ${BOLD}└${NC}"
        rm -rf "$TMP_DIR"
        exit 1
    fi
    echo -e "  ${BOLD}│${NC}  ${GREEN}✔${NC} Download complete"

    echo -e "  ${BOLD}│${NC}  ${CYAN}◇${NC} Verifying SHA-256 cryptographic checksum..."
    if curl -fsSL -o "checksums.txt" "$CHECKSUM_URL" 2>/dev/null; then
        EXPECTED_CHECKSUM=$(grep "$DOWNLOAD_FILE" checksums.txt | awk '{print $1}')
        if [ -n "$EXPECTED_CHECKSUM" ]; then
            if command -v sha256sum &>/dev/null; then
                ACTUAL_CHECKSUM=$(sha256sum "$DOWNLOAD_FILE" | awk '{print $1}')
            elif command -v shasum &>/dev/null; then
                ACTUAL_CHECKSUM=$(shasum -a 256 "$DOWNLOAD_FILE" | awk '{print $1}')
            fi
            if [ -n "$ACTUAL_CHECKSUM" ] && [ "$EXPECTED_CHECKSUM" != "$ACTUAL_CHECKSUM" ]; then
                echo -e "  ${BOLD}│${NC}  ${RED}✖ Checksum verification failed!${NC}"
                echo -e "  ${BOLD}└${NC}"
                rm -rf "$TMP_DIR"
                exit 1
            fi
            echo -e "  ${BOLD}│${NC}  ${GREEN}✔${NC} Checksum verified ${DIM}(SHA-256)${NC}"
        fi
    fi

    echo -e "  ${BOLD}│${NC}  ${CYAN}◇${NC} Installing binary to ${DIM}${CLI_INSTALL_DIR}/${BINARY_NAME}${NC}..."
    sudo mv "$DOWNLOAD_FILE" "$CLI_INSTALL_DIR/$BINARY_NAME"
    sudo chmod +x "$CLI_INSTALL_DIR/$BINARY_NAME"

    cd /
    rm -rf "$TMP_DIR"

    if command -v $BINARY_NAME &> /dev/null; then
        echo -e "  ${BOLD}│${NC}  ${GREEN}✔${NC} AxioDB CLI deployed successfully"
        echo -e "  ${BOLD}└${NC}"
    else
        echo -e "  ${BOLD}│${NC}  ${RED}✖ CLI verification failed${NC}"
        echo -e "  ${BOLD}└${NC}"
        exit 1
    fi
}

install_gui() {
    echo ""
    echo -e "  ${BOLD}┌  Installing AxioDB GUI (v${VERSION})${NC}"
    echo -e "  ${BOLD}│${NC}"

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
        echo -e "  ${BOLD}│${NC}  ${GREEN}✔${NC} Already installed and up to date ${DIM}(v${VERSION})${NC}"
        echo -e "  ${BOLD}└${NC}"
        return 0
    fi

    TMP_DIR=$(mktemp -d)
    cd "$TMP_DIR"

    # Fetch release info from GitHub API
    echo -e "  ${BOLD}│${NC}  ${CYAN}◇${NC} Resolving release package..."
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
            echo -e "  ${BOLD}│${NC}  ${RED}✖ No Linux GUI installer found in release${NC}"
            echo -e "  ${BOLD}└${NC}"
            rm -rf "$TMP_DIR"
            exit 1
        fi
    elif [ "$OS" = "darwin" ]; then
        ZIP_FILE=$(echo "$RELEASE_JSON" | grep -o '"name": *"[^"]*\.zip"' | head -1 | sed 's/.*"\([^"]*\.zip\)".*/\1/')

        if [ -n "$ZIP_FILE" ]; then
            GUI_FILE="$ZIP_FILE"
            GUI_TYPE="zip"
        else
            echo -e "  ${BOLD}│${NC}  ${RED}✖ No macOS GUI installer found in release${NC}"
            echo -e "  ${BOLD}└${NC}"
            rm -rf "$TMP_DIR"
            exit 1
        fi
    else
        echo -e "  ${BOLD}│${NC}  ${RED}✖ GUI installation not supported for ${OS}${NC}"
        echo -e "  ${BOLD}└${NC}"
        rm -rf "$TMP_DIR"
        exit 1
    fi

    DOWNLOAD_URL="https://github.com/$REPO/releases/download/cli-v${VERSION}/${GUI_FILE}"
    echo -e "  ${BOLD}│${NC}  ${CYAN}◇${NC} Fetching package ${DIM}(${GUI_FILE})${NC}..."

    if ! curl -fsSL -o "$GUI_FILE" "$DOWNLOAD_URL"; then
        echo -e "  ${BOLD}│${NC}  ${RED}✖ Failed to download GUI package${NC}"
        echo -e "  ${BOLD}└${NC}"
        rm -rf "$TMP_DIR"
        exit 1
    fi
    echo -e "  ${BOLD}│${NC}  ${GREEN}✔${NC} Download complete"

    echo -e "  ${BOLD}│${NC}  ${CYAN}◇${NC} Verifying SHA-256 cryptographic checksum..."
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
                echo -e "  ${BOLD}│${NC}  ${RED}✖ Checksum verification failed!${NC}"
                echo -e "  ${BOLD}└${NC}"
                rm -rf "$TMP_DIR"
                exit 1
            fi
            echo -e "  ${BOLD}│${NC}  ${GREEN}✔${NC} Checksum verified ${DIM}(SHA-256)${NC}"
        fi
    fi

    case "$GUI_TYPE" in
        deb)
            echo -e "  ${BOLD}│${NC}  ${CYAN}◇${NC} Configuring system package (.deb)..."
            sudo dpkg -i "$GUI_FILE" 2>/dev/null || sudo apt-get install -f -y
            echo -e "  ${BOLD}│${NC}  ${GREEN}✔${NC} Installed (axiodb-control)"
            ;;
        appimage)
            echo -e "  ${BOLD}│${NC}  ${CYAN}◇${NC} Installing AppImage to /usr/local/bin/axiodb-control..."
            chmod +x "$GUI_FILE"
            sudo mv "$GUI_FILE" /usr/local/bin/axiodb-control
            echo "$VERSION" | sudo tee /usr/local/bin/.axiodb-control-version >/dev/null 2>&1 || true
            echo -e "  ${BOLD}│${NC}  ${GREEN}✔${NC} Installed (axiodb-control)"
            ;;
        zip)
            echo -e "  ${BOLD}│${NC}  ${CYAN}◇${NC} Deploying to /Applications..."
            unzip -q "$GUI_FILE"
            sudo cp -r "AxioDB Control.app" /Applications/
            echo -e "  ${BOLD}│${NC}  ${GREEN}✔${NC} Installed (AxioDB Control.app)"
            ;;
    esac

    echo -e "  ${BOLD}└${NC}"
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
echo -e "  ${CYAN}╭──────────────────────────────────────────────────────────╮${NC}"
echo -e "  ${CYAN}│${NC}  ${GREEN}${BOLD}✦ AxioDB is ready!${NC}                                    ${CYAN}│${NC}"
echo -e "  ${CYAN}│${NC}                                                          ${CYAN}│${NC}"
echo -e "  ${CYAN}│${NC}  ${BOLD}Quick Start:${NC}                                           ${CYAN}│${NC}"
echo -e "  ${CYAN}│${NC}    ${CYAN}\$${NC} axiodb --help       ${DIM}Explore CLI commands${NC}             ${CYAN}│${NC}"
echo -e "  ${CYAN}│${NC}    ${CYAN}\$${NC} axiodb connect      ${DIM}Open interactive database shell${NC}  ${CYAN}│${NC}"
echo -e "  ${CYAN}│${NC}    ${CYAN}\$${NC} axiodb-control      ${DIM}Launch desktop control app${NC}       ${CYAN}│${NC}"
echo -e "  ${CYAN}╰──────────────────────────────────────────────────────────╯${NC}"
echo ""
