#!/bin/bash

# Version Controller Script for AxioDB
# Fetches remote version, compares with local, prompts for new version if needed,
# and syncs version across selected files/directories (default: all)

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
CYAN='\033[0;36m'
BLUE='\033[0;34m'
NC='\033[0m'

LOCAL_PACKAGE_JSON="package.json"
REMOTE_URL="https://raw.githubusercontent.com/nexoral/AxioDB/main/package.json"

ver_gt() {
  local IFS=.
  local raw1 raw2 i ver1 ver2
  raw1="${1%%-*}"
  raw2="${2%%-*}"
  read -ra ver1 <<<"$raw1"
  read -ra ver2 <<<"$raw2"
  for ((i = ${#ver1[@]}; i < ${#ver2[@]}; i++)); do ver1[i]=0; done
  for ((i = ${#ver2[@]}; i < ${#ver1[@]}; i++)); do ver2[i]=0; done
  for ((i = 0; i < ${#ver1[@]}; i++)); do
    if ((10#${ver1[i]} > 10#${ver2[i]})); then return 0; fi
    if ((10#${ver1[i]} < 10#${ver2[i]})); then return 1; fi
  done
  return 1
}

# ---------------------------------------------------------------------------
# Per-target sync functions.  Each one updates ONLY its own files.
# A target is included only if explicitly selected by the user.
# ---------------------------------------------------------------------------

sync_root() {
  local NEW_VERSION="$1"
  sed -i "s/\"version\": \"[^\"]*\"/\"version\": \"$NEW_VERSION\"/" package.json
  echo -e "  ${GREEN}Updated${NC} package.json (root)"
}

sync_cli() {
  local NEW_VERSION="$1"
  echo -n "$NEW_VERSION" > cli/VERSION
  sed -i "s/var cliVersion = \".*\"/var cliVersion = \"$NEW_VERSION\"/" cli/cmd/version.go
  echo -e "  ${GREEN}Updated${NC} cli/VERSION + cli/cmd/version.go"
}

sync_electron() {
  local NEW_VERSION="$1"
  sed -i "s/\"version\": \"[^\"]*\"/\"version\": \"$NEW_VERSION\"/" electron/package.json
  echo -e "  ${GREEN}Updated${NC} electron/package.json"
}

sync_gui() {
  local NEW_VERSION="$1"
  sed -i "s/\"version\": \"[^\"]*\"/\"version\": \"$NEW_VERSION\"/" GUI/package.json
  echo -e "  ${GREEN}Updated${NC} GUI/package.json"
}

sync_document() {
  local NEW_VERSION="$1"
  if [ -f "Document/package.json" ]; then
    sed -i "s/\"version\": \"[^\"]*\"/\"version\": \"$NEW_VERSION\"/" Document/package.json
    echo -e "  ${GREEN}Updated${NC} Document/package.json"
  fi
  if [ -f "Document/public/llms.txt" ]; then
    sed -i "s/Current version: [0-9]\+\.[0-9]\+\.[0-9]\+/Current version: $NEW_VERSION/" Document/public/llms.txt
    echo -e "  ${GREEN}Updated${NC} Document/public/llms.txt"
  fi
  if [ -f "Document/public/llms-full.txt" ]; then
    sed -i "s/Version: [0-9]\+\.[0-9]\+\.[0-9]\+/Version: $NEW_VERSION/" Document/public/llms-full.txt
    echo -e "  ${GREEN}Updated${NC} Document/public/llms-full.txt"
  fi
  if [ -f "Document/index.html" ]; then
    sed -i "s/\"softwareVersion\": \"[^\"]*\"/\"softwareVersion\": \"$NEW_VERSION\"/" Document/index.html
    echo -e "  ${GREEN}Updated${NC} Document/index.html"
  fi
}

# ---------------------------------------------------------------------------
# Master dispatcher — runs the requested targets in order.
# Globals:  SELECTED_TARGETS (array of target names)
#           NEW_VERSION      (string)
# ---------------------------------------------------------------------------

sync_version() {
  local NEW_VERSION="$1"

  if ! echo "$NEW_VERSION" | grep -qE '^[0-9]+\.[0-9]+\.[0-9]+$'; then
    echo -e "${RED}Error: Invalid version format. Use semver (e.g., $(echo "$REMOTE_VERSION" | awk -F. '{print $1+1".0.0"}'))${NC}"
    exit 1
  fi

  echo ""
  echo -e "${CYAN}Updating version to $NEW_VERSION...${NC}"
  echo ""

  # Build the final list of targets to sync
  local targets=()
  if [ ${#SELECTED_TARGETS[@]} -eq 0 ]; then
    targets=(root cli electron gui document)
  else
    targets=("${SELECTED_TARGETS[@]}")
  fi

  # Map each target to its sync function
  local ran_any=false
  for target in "${targets[@]}"; do
    case "$target" in
      root)    sync_root "$NEW_VERSION";     ran_any=true ;;
      cli)     sync_cli "$NEW_VERSION";      ran_any=true ;;
      electron) sync_electron "$NEW_VERSION"; ran_any=true ;;
      gui)     sync_gui "$NEW_VERSION";     ran_any=true ;;
      document) sync_document "$NEW_VERSION"; ran_any=true ;;
      *)       echo -e "  ${YELLOW}Unknown target: $target (skipped)${NC}" ;;
    esac
  done

  # Fallback: if only invalid targets were passed, run everything
  if [ "$ran_any" = false ]; then
    echo -e "  ${YELLOW}No valid targets selected — syncing ALL.${NC}"
    sync_root "$NEW_VERSION"
    sync_cli "$NEW_VERSION"
    sync_electron "$NEW_VERSION"
    sync_gui "$NEW_VERSION"
    sync_document "$NEW_VERSION"
  fi

  echo ""
  echo -e "${GREEN}Version sync complete: $NEW_VERSION${NC}"
}

# ---------------------------------------------------------------------------
# Interactive target selection (checkbox-style menu)
# ---------------------------------------------------------------------------

select_targets() {
  echo ""
  echo -e "${CYAN}Select which targets to update (press ENTER to select all):${NC}"
  echo ""

  # Target registry — add new targets here
  local labels=(
    "1) Root package.json (package.json)"
    "2) CLI (cli/VERSION + cli/cmd/version.go)"
    "3) Electron GUI (electron/package.json)"
    "4) Web GUI (GUI/package.json)"
    "5) Document site (Document/package.json + llms.txt + llms-full.txt + index.html)"
  )

  printf '  %s\n' "${labels[@]}"
  echo ""
  echo "  a) Select All (then submit)"
  echo "  q) Submit selection"
  echo ""
  echo "  Separate multiple choices with spaces, e.g.  '2 5'  for CLI + Document only."
  echo "  Start typing your selection, then press ENTER."

  # Track which are toggled
  local -A toggles
  local i
  for ((i = 1; i <= ${#labels[@]}; i++)); do
    toggles[$i]=true   # all selected by default
  done

  local all_selected=true

  # Read user input non-interactively if piped, otherwise interactively
  local input
  read -r -p "> " input

  if [ -z "$input" ]; then
    # Empty input = select all → return empty SELECTED_TARGETS
    return
  fi

  input=$(echo "$input" | tr '[:upper:]' '[:lower:]')

  if [ "$input" = "a" ] || [ "$input" = "all" ] || [ "$input" = "select all" ]; then
    return
  fi

  SELECTED_TARGETS=()
  local parts
  read -ra parts <<<"$input"
  for part in "${parts[@]}"; do
    case "$part" in
      1) SELECTED_TARGETS+=("root") ;;
      2) SELECTED_TARGETS+=("cli") ;;
      3) SELECTED_TARGETS+=("electron") ;;
      4) SELECTED_TARGETS+=("gui") ;;
      5) SELECTED_TARGETS+=("document") ;;
      *) echo -e "  ${YELLOW}Unknown option: $part (ignored)${NC}" ;;
    esac
  done

  if [ ${#SELECTED_TARGETS[@]} -eq 0 ]; then
    echo -e "  ${YELLOW}No valid targets selected — syncing ALL${NC}"
  fi
}

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

echo "AxioDB Version Controller"
echo "========================="

# If version argument provided, just sync and exit (non-interactive)
if [ -n "$1" ]; then
  sync_version "$1"
  exit 0
fi

# Check if local package.json exists
if [ ! -f "$LOCAL_PACKAGE_JSON" ]; then
  echo -e "${RED}Error: Local package.json not found${NC}"
  exit 1
fi

# Get local version
LOCAL_VERSION=$(grep -o '"version": "[^"]*' "$LOCAL_PACKAGE_JSON" | cut -d'"' -f4)
if [ -z "$LOCAL_VERSION" ]; then
  echo -e "${RED}Error: Could not determine local version${NC}"
  exit 1
fi

echo -e "Local version: ${GREEN}$LOCAL_VERSION${NC}"

# Fetch remote version
TEMP_FILE=$(mktemp)
echo "Fetching remote version..."
if ! curl -s "$REMOTE_URL" -o "$TEMP_FILE"; then
  echo -e "${RED}Error: Failed to fetch remote package.json${NC}"
  rm "$TEMP_FILE"
  exit 1
fi

REMOTE_VERSION=$(grep -o '"version": "[^"]*' "$TEMP_FILE" | cut -d'"' -f4)
rm "$TEMP_FILE"

if [ -z "$REMOTE_VERSION" ]; then
  echo -e "${RED}Error: Could not determine remote version${NC}"
  exit 1
fi

echo -e "Remote version: ${YELLOW}$REMOTE_VERSION${NC}"

# If local is already ahead, nothing to do
if ver_gt "$LOCAL_VERSION" "$REMOTE_VERSION"; then
  echo -e "${GREEN}Local version ($LOCAL_VERSION) is already ahead of remote ($REMOTE_VERSION). No update needed.${NC}"
  exit 0
fi

# Local is same or behind — prompt for new version
if [ "$LOCAL_VERSION" == "$REMOTE_VERSION" ]; then
  echo -e "${YELLOW}Local version matches remote. You must bump the version.${NC}"
else
  echo -e "${RED}Local version ($LOCAL_VERSION) is behind remote ($REMOTE_VERSION).${NC}"
fi

echo ""
echo "Suggested next version: $(echo "$REMOTE_VERSION" | awk -F. '{print $1"."$2+1".0"}')"
read -p "Enter new version: " NEW_VERSION

if [ -z "$NEW_VERSION" ]; then
  echo -e "${RED}No version entered. Aborting.${NC}"
  exit 1
fi

# Validate the new version is higher than remote
if ! ver_gt "$NEW_VERSION" "$REMOTE_VERSION"; then
  echo -e "${RED}Error: New version ($NEW_VERSION) must be higher than remote ($REMOTE_VERSION)${NC}"
  exit 1
fi

# Prompt for target selection
select_targets

sync_version "$NEW_VERSION"
