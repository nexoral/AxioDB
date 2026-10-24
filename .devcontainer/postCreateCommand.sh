#!/usr/bin/env bash
# ============================================================================
# AxioDB — Codespace / Dev Container bootstrap
#
# Installs the full toolchain (Node.js 24, Go, system packages, git config)
# and then installs + builds every part of the monorepo:
#   core (TS)  -> Document (Vite docs)  -> GUI (Vite web)  -> Electron  -> Go CLI
# ============================================================================
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log()  { printf "${GREEN}[postCreate]${NC} %s\n" "$*"; }
warn() { printf "${YELLOW}[postCreate][warn]${NC} %s\n" "$*"; }
die()  { printf "${RED}[postCreate][error]${NC} %s\n" "$*" >&2; exit 1; }

# sudo is a no-op when running as root (remoteUser is root)
if ! command -v sudo >/dev/null 2>&1; then
  sudo() { "$@"; }
fi

# ---------------------------------------------------------------------------
# 1. System packages
# ---------------------------------------------------------------------------
log "Updating system packages"
sudo apt-get update -y
sudo apt-get install -y --no-install-recommends \
  ca-certificates curl wget git jq unzip build-essential python3 python3-pip \
  neofetch

# ---------------------------------------------------------------------------
# 2. Node.js 24 (nvm on the universal image, Nodesource as fallback)
# ---------------------------------------------------------------------------
export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
NVM_SH=""
for candidate in "$NVM_DIR/nvm.sh" /usr/local/share/nvm/nvm.sh "$HOME/.nvm/nvm.sh"; do
  if [ -s "$candidate" ]; then NVM_SH="$candidate"; break; fi
done

if [ -n "$NVM_SH" ]; then
  log "Using nvm at $NVM_SH"
  # shellcheck disable=SC1090
  . "$NVM_SH"
  nvm install 24 >/dev/null
  nvm alias default 24 >/dev/null
  nvm use 24 >/dev/null
elif command -v node >/dev/null 2>&1 && [ "$(node -p 'process.versions.node.split(".")[0]')" -ge 24 ]; then
  log "Node.js $(node -v) already satisfies the >=20 requirement"
else
  warn "nvm not found — installing Node.js 24 via Nodesource"
  curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi

log "Using Node $(node -v) + npm $(npm -v)"

# ---------------------------------------------------------------------------
# 3. Go toolchain (used by the cli/ module)
# ---------------------------------------------------------------------------
if command -v go >/dev/null 2>&1; then
  log "Using Go $(go version | awk '{print $3}')"
else
  warn "Go not found — installing latest via go.dev"
  GO_TMP="$(mktemp -d)"
  curl -fsSL https://go.dev/dl/$(curl -fsSL https://go.dev/VERSION?m=text).linux-amd64.tar.gz \
    -o "$GO_TMP/go.tar.gz"
  sudo rm -rf /usr/local/go
  sudo tar -C /usr/local -xzf "$GO_TMP/go.tar.gz"
  rm -rf "$GO_TMP"
  export PATH="/usr/local/go/bin:$PATH"
  log "Using Go $(go version | awk '{print $3}')"
fi

# ---------------------------------------------------------------------------
# 4. Git defaults
# ---------------------------------------------------------------------------
git config --global core.autocrlf input
git config --global init.defaultBranch main

# ---------------------------------------------------------------------------
# 5. AxioDB core (TypeScript engine)
# ---------------------------------------------------------------------------
log "Installing AxioDB core dependencies"
cd "$REPO_ROOT"
npm install --force
npm run build
npm run lint || warn "Core lint reported issues — fix before committing"

# ---------------------------------------------------------------------------
# 6. AxioDB CLI (Go)
# ---------------------------------------------------------------------------
log "Building the AxioDB Go CLI"
cd "$REPO_ROOT/cli"
export PATH="/usr/local/go/bin:$PATH"
go mod download
go build -o /usr/local/bin/axiodb .
axiodb version || warn "CLI build succeeded but 'axiodb version' failed to run"

# ---------------------------------------------------------------------------
# 7. Documentation site (Vite + React, port 5173)
# ---------------------------------------------------------------------------
log "Installing + building the AxioDB Documentation site"
cd "$REPO_ROOT/Document"
npm install --force
npm run build

# ---------------------------------------------------------------------------
# 8. Web GUI (Vite + React, port 5173)
# ---------------------------------------------------------------------------
log "Installing the AxioDB Web GUI"
cd "$REPO_ROOT/GUI"
npm install --force || warn "GUI install incomplete — run 'cd GUI && npm install --force'"

# ---------------------------------------------------------------------------
# 9. Electron desktop GUI (downloads the Electron binary)
# ---------------------------------------------------------------------------
log "Installing the AxioDB Electron GUI"
cd "$REPO_ROOT/electron"
npm install --force || warn "Electron install incomplete — run 'cd electron && npm install --force'"

# ---------------------------------------------------------------------------
# Done
# ---------------------------------------------------------------------------
log "AxioDB workspace is ready!"
log "  Server : node -e \"const {AxioDB}=require('./lib/config/DB.js'); new AxioDB({GUI:true})\""
log "           -> Dashboard + HTTP API on port 27018, TCP on port 27019"
log "  Docs   : cd Document && npm run dev               -> port 5173"
log "  GUI    : cd GUI && npm run dev                    -> port 5173"
log "  CLI    : axiodb --help"