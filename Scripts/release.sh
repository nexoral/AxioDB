#!/bin/bash

set -e

APP_NAME="axiodb"
CLI_DIR="./cli"
VERSION_FILE="${CLI_DIR}/VERSION"
BUILD_OUTPUT_DIR="${CLI_DIR}/bin"
DIST_FOLDER="./dist"

if [ ! -f "$VERSION_FILE" ]; then
  echo "VERSION file not found"
  exit 1
fi

VERSION=$(cat "$VERSION_FILE" | tr -d '[:space:]')
TAG="cli-v${VERSION}"

./Scripts/BinBuilder.sh
echo "Binary building completed of ${APP_NAME} version ${VERSION}"

./Scripts/PackageBuilder.sh
echo "Package building completed of ${APP_NAME} version ${VERSION}"

ASSETS=()

for f in "${BUILD_OUTPUT_DIR}/${APP_NAME}_"*; do
  [ -f "$f" ] && ASSETS+=("$f")
done

for f in "${DIST_FOLDER}/${APP_NAME}_"*; do
  [ -f "$f" ] && ASSETS+=("$f")
done

if [ ${#ASSETS[@]} -eq 0 ]; then
  echo "No release assets found"
  exit 1
fi

COMMIT_HASH=$(git rev-parse HEAD)
COMMIT_MSG=$(git log -1 --pretty=%B)

REPO="${GIT_REPOSITORY}"
TOKEN="${GIT_TOKEN}"

if ! command -v gh &>/dev/null; then
  echo "GitHub CLI (gh) not installed"
  apt update
  apt install -y curl gnupg software-properties-common
  curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg |
    dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
  sudo chmod go+r /usr/share/keyrings/githubcli-archive-keyring.gpg
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" |
    tee /etc/apt/sources.list.d/github-cli.list >/dev/null
  apt update
  apt install -y gh
fi

echo "Authenticating GitHub CLI..."
echo "${TOKEN}" | gh auth login --with-token

echo "Creating GitHub release for tag ${TAG}..."

gh release create "$TAG" "${ASSETS[@]}" \
  --title "$TAG" \
  --notes "Commit: ${COMMIT_HASH}

${COMMIT_MSG}"

echo "GitHub release published: ${TAG}"

echo "Cleaning up old CLI releases, retaining only latest two"
release_tags=($(gh release list --limit 1000 --json tagName,createdAt \
  --jq 'sort_by(.createdAt) | reverse | .[].tagName' | grep '^cli-v' || true))

if [ ${#release_tags[@]} -gt 2 ]; then
  for ((i = 2; i < ${#release_tags[@]}; i++)); do
    old_tag=${release_tags[i]}
    echo "Deleting release ${old_tag}"
    gh release delete "$old_tag" --yes
    gh api -X DELETE "repos/${GITHUB_REPOSITORY}/git/refs/tags/${old_tag}"
  done
fi
