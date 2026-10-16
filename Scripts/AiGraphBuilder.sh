#!/usr/bin/env bash
#
# AiGraphBuilder.sh - install graphify if needed, then optionally build the code
# knowledge graph. Mirrors the canonical rebuild in AGENTS.md ("Graphify (optional)").

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT_DIR="graphify-out"
GRAPH_JSON="$OUT_DIR/graph.json"
PKG="graphifyy"   # PyPI package name; the CLI and import name are "graphify"

if [ -t 1 ]; then
  C_RESET=$'\033[0m'; C_GREEN=$'\033[32m'; C_YELLOW=$'\033[33m'; C_RED=$'\033[31m'
else
  C_RESET=""; C_GREEN=""; C_YELLOW=""; C_RED=""
fi

info() { printf '%s\n' "$*"; }
ok()   { printf '%s%s%s\n' "$C_GREEN" "$*" "$C_RESET"; }
warn() { printf '%s%s%s\n' "$C_YELLOW" "$*" "$C_RESET"; }
err()  { printf '%s%s%s\n' "$C_RED" "$*" "$C_RESET" >&2; }

confirm() {
  local reply=""
  read -r -p "$1 [y/N] " reply || reply=""
  case "$reply" in [yY] | [yY][eE][sS]) return 0 ;; *) return 1 ;; esac
}

show_machine() {
  info "Machine"
  info "  OS:     $(uname -s) $(uname -r)"
  info "  Arch:   $(uname -m)"
  if [ -r /etc/os-release ]; then
    info "  Distro: $(sed -n 's/^PRETTY_NAME="\(.*\)"/\1/p' /etc/os-release)"
  elif [ "$(uname -s)" = "Darwin" ]; then
    info "  Distro: macOS $(sw_vers -productVersion 2>/dev/null || echo '?')"
  fi
  info "  Shell:  ${SHELL:-unknown}"
}

is_py3() {
  command -v "$1" >/dev/null 2>&1 &&
    "$1" -c 'import sys; raise SystemExit(0 if sys.version_info[0] == 3 else 1)' >/dev/null 2>&1
}

shebang_python() {
  local bin="${1:-}" py
  [ -n "$bin" ] && [ -x "$bin" ] || return 1
  py="$(head -n1 "$bin" | sed -n 's/^#!//p')"
  py="${py%% *}"
  case "$py" in */python* | */pypy*) [ -x "$py" ] && { printf '%s' "$py"; return 0; } ;; esac
  return 1
}

# Prefer the interpreter behind an existing `graphify` (handles pipx/venv installs),
# then fall back to python3, then python.
resolve_python() {
  local py
  py="$(shebang_python "$(command -v graphify 2>/dev/null || true)" || true)"
  [ -n "$py" ] && { printf '%s' "$py"; return 0; }
  for py in python3 python; do
    is_py3 "$py" && { command -v "$py"; return 0; }
  done
  return 1
}

pipx_python() {
  local venvs
  venvs="$(pipx environment --value PIPX_LOCAL_VENVS 2>/dev/null || true)"
  [ -n "$venvs" ] || venvs="${PIPX_HOME:-$HOME/.local/share/pipx}/venvs"
  [ -x "$venvs/$PKG/bin/python" ] && printf '%s' "$venvs/$PKG/bin/python"
}

graphify_ok() {
  [ -n "${1:-}" ] && "$1" -c 'import graphify' >/dev/null 2>&1
}

install_pipx() {
  local py="$1"
  if command -v apt-get >/dev/null 2>&1; then
    if sudo apt-get update -qq && sudo apt-get install -y pipx; then return 0; fi
  fi
  if command -v brew >/dev/null 2>&1; then
    if brew install pipx; then return 0; fi
  fi
  "$py" -m pip install --user pipx 2>/dev/null ||
    "$py" -m pip install --user --break-system-packages pipx
}

install_graphify() {
  local py="$1"
  if ! command -v pipx >/dev/null 2>&1; then
    warn "pipx not found."
    confirm "Install pipx now?" || return 1
    install_pipx "$py" || return 1
  fi
  info "Installing $PKG via pipx..."
  if ! pipx install "$PKG" 2>/dev/null; then
    pipx upgrade "$PKG" || return 1
  fi
  pipx ensurepath >/dev/null 2>&1 || true
  export PATH="$HOME/.local/bin:$PATH"
  return 0
}

build_graph() {
  local py="$1"
  info "Building code knowledge graph (AST only, no LLM)..."
  "$py" - <<'PY'
import sys
from pathlib import Path
from graphify.watch import _rebuild_code
sys.exit(0 if _rebuild_code(Path('.')) else 1)
PY
}

main() {
  cd "$REPO_ROOT"
  show_machine
  echo

  local py
  py="$(resolve_python || true)"
  if [ -z "$py" ]; then
    err "Python 3 not found. Install it and re-run:"
    err "  Debian/Ubuntu: sudo apt install python3 python3-pip"
    err "  macOS:         brew install python"
    exit 1
  fi
  ok "Python: $py ($("$py" -V 2>&1))"
  echo

  if graphify_ok "$py"; then
    ok "graphify is already installed."
  else
    warn "graphify is not installed."
    confirm "Install graphify now (pipx: $PKG)?" || { warn "Skipped. Nothing to build."; exit 0; }
    install_graphify "$py" || { err "Install failed. Manual: pipx install $PKG"; exit 1; }
    py="$(resolve_python || true)"
    graphify_ok "$py" || py="$(pipx_python || true)"
    graphify_ok "$py" || { err "graphify still not importable. Open a new shell and re-run."; exit 1; }
    ok "graphify installed."
  fi
  echo

  if [ -f "$GRAPH_JSON" ]; then
    ok "A graph already exists at $GRAPH_JSON."
    confirm "Rebuild it now?" || { info "Left the existing graph untouched."; exit 0; }
  else
    confirm "Build the knowledge graph now?" || { info "Nothing built."; exit 0; }
  fi

  echo
  if build_graph "$py"; then
    ok "Done. See $OUT_DIR/graph.json and $OUT_DIR/GRAPH_REPORT.md."
  else
    err "Graph build failed. Ensure the repo root is readable and graphify is up to date."
    exit 1
  fi
}

main "$@"
