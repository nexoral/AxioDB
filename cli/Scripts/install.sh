#!/bin/bash
set -e

REPO="nexoral/AxioDB"
INSTALL_DIR="/usr/local/bin"
BINARY_NAME="axiodb"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}AxioDB CLI Installer${NC}"
echo "========================"

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

VERSION=$(curl -fsSL "https://api.github.com/repos/$REPO/releases/latest" | grep '"tag_name"' | sed -E 's/.*"cli-v([^"]+)".*/\1/')
if [ -z "$VERSION" ]; then
    echo -e "${RED}Failed to get latest version${NC}"
    exit 1
fi
echo -e "${GREEN}Latest version: v${VERSION}${NC}"

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

echo -e "${YELLOW}Installing...${NC}"
sudo mv "$DOWNLOAD_FILE" "$INSTALL_DIR/$BINARY_NAME"
sudo chmod +x "$INSTALL_DIR/$BINARY_NAME"

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
    echo -e "${RED}Installation verification failed${NC}"
    exit 1
fi
