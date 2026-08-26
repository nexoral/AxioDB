#!/bin/bash

set -e

APP_NAME="axiodb"
AVAILABLE_OPTIONS=("amd64" "arm64")
CLI_DIR="./cli"
BUILD_OUTPUT_DIR="${CLI_DIR}/bin"
VERSION_FILE="${CLI_DIR}/VERSION"
DIST_FOLDER="./dist"

if [ -f "$VERSION_FILE" ]; then
  VERSION=$(cat "$VERSION_FILE" | tr -d '[:space:]')
else
  echo "VERSION file not found"
  exit 1
fi

BINARY_PATH="${BUILD_OUTPUT_DIR}/${APP_NAME}_linux_amd64"
if [ ! -f "$BINARY_PATH" ]; then
  echo "Binary not found at $BINARY_PATH. Run BinBuilder.sh first."
  exit 1
fi

echo "Installing xpack..."
if ! command -v xpack &>/dev/null; then
  curl -fsSL https://raw.githubusercontent.com/nexoral/xpack/main/Scripts/installer.sh | sudo bash -
  echo "xpack installed successfully"
else
  echo "xpack already installed"
fi

rm -rf "$DIST_FOLDER"

for ARCH in "${AVAILABLE_OPTIONS[@]}"; do
  BINARY="${BUILD_OUTPUT_DIR}/${APP_NAME}_linux_${ARCH}"
  if [ ! -f "$BINARY" ]; then
    echo "Skipping ${ARCH} - binary not found"
    continue
  fi
  echo "Building package for architecture: ${ARCH} using xpack"
  xpack -app "$APP_NAME" -arch "$ARCH" -v "$VERSION" -i "$BINARY"
  echo "Package created: ${APP_NAME}_${VERSION}_${ARCH}"
done

echo "All packages built successfully and available in $DIST_FOLDER"
