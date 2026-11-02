#!/usr/bin/env bash
set -euo pipefail

# AxioDB Installation Helper Script
# Usage:
#   ./install_axiodb.sh --npm       # Installs axiodb npm package into current project
#   ./install_axiodb.sh --cli       # Installs AxioDB CLI binary
#   ./install_axiodb.sh --gui       # Installs AxioDB Desktop GUI
#   ./install_axiodb.sh --all       # Installs CLI and Desktop GUI

CYAN='\033[0;36m'
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

TARGET="${1:---all}"

echo -e "${CYAN}==> AxioDB Installation Utility${NC}"

case "$TARGET" in
  --npm)
    echo -e "${CYAN}Installing latest axiodb npm package...${NC}"
    npm install axiodb@latest
    echo -e "${GREEN}✔ axiodb npm package installed successfully.${NC}"
    ;;
  --cli)
    echo -e "${CYAN}Installing AxioDB CLI...${NC}"
    curl -fsSL https://raw.githubusercontent.com/nexoral/AxioDB/main/cli/Scripts/install.sh | CHOICE=1 bash
    echo -e "${GREEN}✔ AxioDB CLI installation completed.${NC}"
    ;;
  --gui)
    echo -e "${CYAN}Installing AxioDB Desktop GUI...${NC}"
    curl -fsSL https://raw.githubusercontent.com/nexoral/AxioDB/main/cli/Scripts/install.sh | CHOICE=2 bash
    echo -e "${GREEN}✔ AxioDB Desktop GUI installation completed.${NC}"
    ;;
  --all)
    echo -e "${CYAN}Installing both AxioDB CLI and Desktop GUI...${NC}"
    curl -fsSL https://raw.githubusercontent.com/nexoral/AxioDB/main/cli/Scripts/install.sh | CHOICE=3 bash
    echo -e "${GREEN}✔ AxioDB CLI & GUI installation completed.${NC}"
    ;;
  *)
    echo -e "${RED}Unknown option: $TARGET${NC}"
    echo "Usage: $0 [--npm | --cli | --gui | --all]"
    exit 1
    ;;
esac
