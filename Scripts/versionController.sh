#!/bin/bash

# Version Controller Script for AxioDB
# Fetches remote version, compares with local, prompts for new version if needed,
# and syncs version only in folders that have git changes

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
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

detect_changed_areas() {
  CHANGED_CLI=false
  CHANGED_DOCUMENT=false
  CHANGED_GUI=false

  if ! git rev-parse --is-inside-work-tree &>/dev/null; then
    echo -e "${YELLOW}Not a git repo — updating all version files${NC}"
    CHANGED_CLI=true
    CHANGED_DOCUMENT=true
    CHANGED_GUI=true
    return
  fi

  local changed_files
  changed_files=$(git diff --name-only HEAD 2>/dev/null)
  if [ -z "$changed_files" ]; then
    changed_files=$(git diff --name-only --cached 2>/dev/null)
  fi
  if [ -z "$changed_files" ]; then
    changed_files=$(git status --porcelain 2>/dev/null | awk '{print $2}')
  fi

  echo "$changed_files" | grep -q '^cli/' && CHANGED_CLI=true
  echo "$changed_files" | grep -q '^Document/' && CHANGED_DOCUMENT=true
  echo "$changed_files" | grep -q '^GUI/' && CHANGED_GUI=true
}

sync_version() {
  local NEW_VERSION="$1"

  if ! echo "$NEW_VERSION" | grep -qE '^[0-9]+\.[0-9]+\.[0-9]+$'; then
    echo -e "${RED}Error: Invalid version format. Use semver (e.g., $(echo "$REMOTE_VERSION" | awk -F. '{print $1+1".0.0"}'))${NC}"
    exit 1
  fi

  detect_changed_areas

  echo "Updating version to $NEW_VERSION..."

  sed -i "s/\"version\": \"[^\"]*\"/\"version\": \"$NEW_VERSION\"/" package.json
  echo -e "  ${GREEN}Updated${NC} package.json (always)"

  if [ "$CHANGED_CLI" = true ] && [ -d "cli" ]; then
    echo -n "$NEW_VERSION" > cli/VERSION
    sed -i "s/var cliVersion = \".*\"/var cliVersion = \"$NEW_VERSION\"/" cli/cmd/version.go
    echo -e "  ${GREEN}Updated${NC} cli/VERSION + cli/cmd/version.go (cli/ has changes)"
  fi

  if [ "$CHANGED_DOCUMENT" = true ] && [ -f "Document/package.json" ]; then
    sed -i "s/\"version\": \"[^\"]*\"/\"version\": \"$NEW_VERSION\"/" Document/package.json
    echo -e "  ${GREEN}Updated${NC} Document/package.json (Document/ has changes)"
  fi

  if [ "$CHANGED_GUI" = true ] && [ -f "GUI/package.json" ]; then
    sed -i "s/\"version\": \"[^\"]*\"/\"version\": \"$NEW_VERSION\"/" GUI/package.json
    echo -e "  ${GREEN}Updated${NC} GUI/package.json (GUI/ has changes)"
  fi

  echo -e "${GREEN}Version synced to $NEW_VERSION${NC}"
}

echo "AxioDB Version Controller"
echo "========================="

# If version argument provided, just sync and exit
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
read -p "Enter new version (e.g., $(echo "$REMOTE_VERSION" | awk -F. '{print $1+1".0.0"}')): " NEW_VERSION

if [ -z "$NEW_VERSION" ]; then
  echo -e "${RED}No version entered. Aborting.${NC}"
  exit 1
fi

# Validate the new version is higher than remote
if ! ver_gt "$NEW_VERSION" "$REMOTE_VERSION"; then
  echo -e "${RED}Error: New version ($NEW_VERSION) must be higher than remote ($REMOTE_VERSION)${NC}"
  exit 1
fi

sync_version "$NEW_VERSION"
