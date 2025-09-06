#!/bin/bash

# Version Controller Script for AxioDB
# This script compares the local package.json version with the remote version
# Used as a pre-commit hook to ensure version is updated

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Local package.json path (assuming the script is in the Scripts directory)
LOCAL_PACKAGE_JSON="package.json"

# Remote package.json URL
REMOTE_URL="https://raw.githubusercontent.com/Nexoral/AxioDB/main/package.json"

echo "AxioDB Version Controller"
echo "========================="

# Check if local package.json exists
if [ ! -f "$LOCAL_PACKAGE_JSON" ]; then
  echo -e "${RED}Error: Local package.json not found at $LOCAL_PACKAGE_JSON${NC}"
  exit 1
fi

# Get local version
LOCAL_VERSION=$(grep -o '"version": "[^"]*' "$LOCAL_PACKAGE_JSON" | cut -d'"' -f4)
if [ -z "$LOCAL_VERSION" ]; then
  echo -e "${RED}Error: Could not determine local version${NC}"
  exit 1
fi

echo -e "Local version: ${GREEN}$LOCAL_VERSION${NC}"

# Create temporary file for remote package.json
TEMP_FILE=$(mktemp)

# Fetch remote package.json
echo "Fetching remote version..."
if ! curl -s "$REMOTE_URL" -o "$TEMP_FILE"; then
  echo -e "${RED}Error: Failed to fetch remote package.json${NC}"
  rm "$TEMP_FILE"
  exit 1
fi

# Get remote version
REMOTE_VERSION=$(grep -o '"version": "[^"]*' "$TEMP_FILE" | cut -d'"' -f4)
if [ -z "$REMOTE_VERSION" ]; then
  echo -e "${RED}Error: Could not determine remote version${NC}"
  rm "$TEMP_FILE"
  exit 1
fi

echo -e "Remote version: ${YELLOW}$REMOTE_VERSION${NC}"

# Clean up temp file
rm "$TEMP_FILE"

# Compare versions using sort (this handles semantic versioning correctly)
if [ "$(printf '%s\n' "$LOCAL_VERSION" "$REMOTE_VERSION" | sort -V | head -n1)" == "$REMOTE_VERSION" ]; then
  # Local version is higher than remote (remote is listed first in the sort)
  if [ "$LOCAL_VERSION" == "$REMOTE_VERSION" ]; then
    echo -e "${RED}ERROR: Your version ($LOCAL_VERSION) is the same as the remote version.${NC}"
    echo -e "${YELLOW}You must update the package version before committing.${NC}"
    exit 1
  else
    echo -e "${GREEN}SUCCESS: Your version ($LOCAL_VERSION) is ahead of the remote version ($REMOTE_VERSION).${NC}"
    exit 0
  fi
else
  # Local version is lower than remote
  echo -e "${RED}ERROR: Your version ($LOCAL_VERSION) is behind the remote version ($REMOTE_VERSION).${NC}"
  echo -e "${YELLOW}Please update to the latest version.${NC}"
  
  # Ask if user wants to open the GitHub repository
  read -p "Would you like to open the GitHub repository? (y/n): " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    "$BROWSER" "https://github.com/Nexoral/AxioDB"
  fi
  exit 1
fi

# If script reaches here, it should still exit with an error
echo -e "${RED}ERROR: Version check failed.${NC}"
exit 1