#!/bin/bash
set -e

REPO="nexoral/AxioDB"
CLI_INSTALL_DIR="/usr/local/bin"
BINARY_NAME="axiodb"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${BLUE}AxioDB Installer${NC}"
echo "========================"
echo ""

OS=$(uname -s | tr '[:upper:]' '[:lower:]')
ARCH=$(uname -m)

case "$ARCH" in
    x86_64|amd64) ARCH="amd64" ;;
    i386|i686) ARCH="386" ;;
    aarch64|arm64) ARCH="arm64" ;;
    armv7*|armv6*) ARCH="arm" ;;
    *) echo -e "${RED}Unsupported architecture: $ARCH${NC}"; exit 1 ;;
esac

case "$OS" in
    linux) OS="linux" ;;
    darwin) OS="darwin" ;;
    freebsd) OS="freebsd" ;;
    openbsd) OS="openbsd" ;;
    netbsd) OS="netbsd" ;;
    *) echo -e "${RED}Unsupported OS: $OS${NC}"; exit 1 ;;
esac

echo -e "${GREEN}Detected: ${OS}-${ARCH}${NC}"
echo ""

VERSION=$(curl -fsSL "https://api.github.com/repos/$REPO/releases/latest" | grep '"tag_name"' | sed -E 's/.*"cli-v([^"]+)".*/\1/')
if [ -z "$VERSION" ]; then
    echo -e "${RED}Failed to get latest version${NC}"
    exit 1
fi
echo -e "${GREEN}Latest version: v${VERSION}${NC}"
echo ""

# Detect interactive mode — when piped (curl ... | bash), stdin is not a TTY
if [ -n "$CHOICE" ]; then
    echo -e "${GREEN}Using install choice: $CHOICE (from env)${NC}"
elif [ -t 0 ]; then
    echo -e "${CYAN}What would you like to install?${NC}"
    echo ""
    echo -e "  ${YELLOW}1)${NC} CLI only      — command-line tool (~5MB)"
    echo -e "  ${YELLOW}2)${NC} GUI only      — desktop Electron app (~80MB)"
    echo -e "  ${YELLOW}3)${NC} Both          — CLI + GUI"
    echo ""
    read -p "Enter choice [1-3]: " CHOICE
else
    echo -e "${YELLOW}Non-interactive mode detected (piped install).${NC}"
    echo -e "  Installing ${YELLOW}CLI only${NC} by default — to install GUI, use:"
    echo -e "  ${GREEN}curl -fsSL https://raw.githubusercontent.com/nexoral/AxioDB/main/cli/Scripts/install.sh | CHOICE=2 bash${NC}"
    echo -e "  Or download and run directly: ${GREEN}curl -fsSL https://raw.githubusercontent.com/nexoral/AxioDB/main/cli/Scripts/install.sh > install.sh && bash install.sh${NC}"
    echo ""
    CHOICE="1"
fi

install_cli() {
    echo ""
    echo -e "${BLUE}Installing CLI...${NC}"
    echo "========================"

    DOWNLOAD_FILE="${BINARY_NAME}_${OS}_${ARCH}"
    DOWNLOAD_URL="https://github.com/$REPO/releases/download/cli-v${VERSION}/${DOWNLOAD_FILE}"
    CHECKSUM_URL="https://github.com/$REPO/releases/download/cli-v${VERSION}/checksums.txt"

    echo -e "${YELLOW}Downloading ${DOWNLOAD_FILE}...${NC}"

    TMP_DIR=$(mktemp -d)
    cd "$TMP_DIR"

    if ! curl -fsSL -o "$DOWNLOAD_FILE" "$DOWNLOAD_URL"; then
        echo -e "${RED}Download failed${NC}"
        rm -rf "$TMP_DIR"
        exit 1
    fi

    echo -e "${YELLOW}Verifying checksum...${NC}"
    if curl -fsSL -o "checksums.txt" "$CHECKSUM_URL" 2>/dev/null; then
        EXPECTED_CHECKSUM=$(grep "$DOWNLOAD_FILE" checksums.txt | awk '{print $1}')
        if [ -n "$EXPECTED_CHECKSUM" ]; then
            ACTUAL_CHECKSUM=$(sha256sum "$DOWNLOAD_FILE" | awk '{print $1}')
            if [ "$EXPECTED_CHECKSUM" != "$ACTUAL_CHECKSUM" ]; then
                echo -e "${RED}Checksum verification failed!${NC}"
                rm -rf "$TMP_DIR"
                exit 1
            fi
            echo -e "${GREEN}Checksum verified${NC}"
        fi
    fi

    echo -e "${YELLOW}Installing CLI...${NC}"
    sudo mv "$DOWNLOAD_FILE" "$CLI_INSTALL_DIR/$BINARY_NAME"
    sudo chmod +x "$CLI_INSTALL_DIR/$BINARY_NAME"

    cd /
    rm -rf "$TMP_DIR"

    if command -v $BINARY_NAME &> /dev/null; then
        echo -e "${GREEN}AxioDB CLI installed successfully!${NC}"
        echo ""
        echo "Run 'axiodb --help' to get started"
        echo "Run 'axiodb connect' to open interactive shell"
        echo ""
        $BINARY_NAME version 2>/dev/null || echo "Version: v$VERSION"
    else
        echo -e "${RED}CLI installation verification failed${NC}"
        exit 1
    fi
}

install_gui() {
    echo ""
    echo -e "${BLUE}Installing GUI (Electron)...${NC}"
    echo "========================"

    TMP_DIR=$(mktemp -d)
    cd "$TMP_DIR"

    # Fetch release info from GitHub API
    echo -e "${YELLOW}Fetching release info...${NC}"
    RELEASE_JSON=$(curl -fsSL "https://api.github.com/repos/$REPO/releases/latest")
    
    if [ "$OS" = "linux" ]; then
        # Find .deb or .AppImage from release assets
        DEB_FILE=$(echo "$RELEASE_JSON" | grep -o '"name": *"[^"]*\.deb"' | head -1 | sed 's/.*"\([^"]*\.deb\)".*/\1/')
        APPIMAGE_FILE=$(echo "$RELEASE_JSON" | grep -o '"name": *"[^"]*\.AppImage"' | head -1 | sed 's/.*"\([^"]*\.AppImage\)".*/\1/')
        
        if [ -n "$DEB_FILE" ]; then
            DOWNLOAD_URL="https://github.com/$REPO/releases/download/cli-v${VERSION}/${DEB_FILE}"
            echo -e "${YELLOW}Downloading ${DEB_FILE}...${NC}"
            
            if curl -fsSL -o "$DEB_FILE" "$DOWNLOAD_URL"; then
                echo -e "${YELLOW}Installing .deb package...${NC}"
                sudo dpkg -i "$DEB_FILE" 2>/dev/null || sudo apt-get install -f -y
                echo -e "${GREEN}AxioDB GUI installed successfully!${NC}"
                echo "Run 'axiodb-control' or find it in your application menu"
            else
                echo -e "${RED}Failed to download GUI installer${NC}"
                rm -rf "$TMP_DIR"
                exit 1
            fi
        elif [ -n "$APPIMAGE_FILE" ]; then
            DOWNLOAD_URL="https://github.com/$REPO/releases/download/cli-v${VERSION}/${APPIMAGE_FILE}"
            echo -e "${YELLOW}Downloading ${APPIMAGE_FILE}...${NC}"
            
            if curl -fsSL -o "$APPIMAGE_FILE" "$DOWNLOAD_URL"; then
                chmod +x "$APPIMAGE_FILE"
                sudo mv "$APPIMAGE_FILE" /usr/local/bin/axiodb-control
                echo -e "${GREEN}AxioDB GUI installed successfully!${NC}"
                echo "Run 'axiodb-control' to start"
            else
                echo -e "${RED}Failed to download GUI installer${NC}"
                rm -rf "$TMP_DIR"
                exit 1
            fi
        else
            echo -e "${RED}No Linux GUI installer found in release${NC}"
            rm -rf "$TMP_DIR"
            exit 1
        fi
    elif [ "$OS" = "darwin" ]; then
        # Find .zip from release assets
        ZIP_FILE=$(echo "$RELEASE_JSON" | grep -o '"name": *"[^"]*\.zip"' | head -1 | sed 's/.*"\([^"]*\.zip\)".*/\1/')
        
        if [ -n "$ZIP_FILE" ]; then
            DOWNLOAD_URL="https://github.com/$REPO/releases/download/cli-v${VERSION}/${ZIP_FILE}"
            echo -e "${YELLOW}Downloading ${ZIP_FILE}...${NC}"
            
            if curl -fsSL -o "$ZIP_FILE" "$DOWNLOAD_URL"; then
                unzip -q "$ZIP_FILE"
                sudo cp -r "AxioDB Control.app" /Applications/
                echo -e "${GREEN}AxioDB GUI installed successfully!${NC}"
                echo "Find 'AxioDB Control' in your Applications folder"
            else
                echo -e "${RED}Failed to download GUI installer${NC}"
                rm -rf "$TMP_DIR"
                exit 1
            fi
        else
            echo -e "${RED}No macOS GUI installer found in release${NC}"
            rm -rf "$TMP_DIR"
            exit 1
        fi
    else
        echo -e "${RED}GUI installation not supported for ${OS}${NC}"
        rm -rf "$TMP_DIR"
        exit 1
    fi

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
        echo -e "${RED}Invalid choice. Please run the installer again and select 1-3.${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}Installation complete!${NC}"
