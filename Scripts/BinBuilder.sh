#!/bin/bash

set -e

BINARY_NAME="axiodb"
CLI_DIR="./cli"
BUILD_OUTPUT_DIR="${CLI_DIR}/bin"
VERSION_FILE="${CLI_DIR}/VERSION"
LDFLAGS_PACKAGE="github.com/nexoral/axiodb-cli/cmd"

if [ ! -f "$VERSION_FILE" ]; then
  echo "VERSION file not found at $VERSION_FILE"
  exit 1
fi

VERSION=$(cat "$VERSION_FILE" | tr -d '[:space:]')

if ! command -v go &>/dev/null; then
  echo "Go not found. Installing Go via snap..."
  sudo snap install go --classic
else
  echo "Go is already installed."
fi

mkdir -p "$BUILD_OUTPUT_DIR"

echo "Building ${BINARY_NAME} v${VERSION}..."

LDFLAGS="-X ${LDFLAGS_PACKAGE}.cliVersion=${VERSION}"

echo "Building for Linux (AMD64)..."
cd "$CLI_DIR" && GOOS=linux GOARCH=amd64 go build -ldflags "${LDFLAGS}" -o "../${BUILD_OUTPUT_DIR}/${BINARY_NAME}_linux_amd64" . && cd ..

echo "Building for Linux (ARM64)..."
cd "$CLI_DIR" && GOOS=linux GOARCH=arm64 go build -ldflags "${LDFLAGS}" -o "../${BUILD_OUTPUT_DIR}/${BINARY_NAME}_linux_arm64" . && cd ..

echo "Building for macOS (AMD64)..."
cd "$CLI_DIR" && GOOS=darwin GOARCH=amd64 go build -ldflags "${LDFLAGS}" -o "../${BUILD_OUTPUT_DIR}/${BINARY_NAME}_darwin_amd64" . && cd ..

echo "Building for macOS (ARM64)..."
cd "$CLI_DIR" && GOOS=darwin GOARCH=arm64 go build -ldflags "${LDFLAGS}" -o "../${BUILD_OUTPUT_DIR}/${BINARY_NAME}_darwin_arm64" . && cd ..

echo "Building for Windows (AMD64)..."
cd "$CLI_DIR" && GOOS=windows GOARCH=amd64 go build -ldflags "${LDFLAGS}" -o "../${BUILD_OUTPUT_DIR}/${BINARY_NAME}_windows_amd64.exe" . && cd ..

echo "Build complete. Binaries available in $BUILD_OUTPUT_DIR"
ls -lh "$BUILD_OUTPUT_DIR"
