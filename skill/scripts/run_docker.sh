#!/usr/bin/env bash
set -euo pipefail

# AxioDB Docker Runner Script
# Usage:
#   ./run_docker.sh [profile] [admin_password]
# Profiles:
#   standard    - HTTP (27018) + TCP (27019) with auth enabled (default)
#   headless    - Headless TCP (27019) with seeded admin password (no GUI/HTTP)
#   no-auth     - TCP without authentication (trusted/private networks only)
#   mcp         - Full stack + MCP Server on port 27020 for AI agents

CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m'

PROFILE="${1:-standard}"
PASSWORD="${2:-${AXIODB_ADMIN_PASSWORD:-}}"
CONTAINER_NAME="${CONTAINER_NAME:-axiodb-server}"
VOLUME_NAME="${VOLUME_NAME:-axiodb-data}"
IMAGE="${IMAGE:-theankansaha/axiodb:latest}"

if ! command -v docker >/dev/null 2>&1; then
  echo -e "${RED}Error: Docker is not installed or not in PATH.${NC}"
  exit 1
fi

if [ "$PROFILE" != "no-auth" ] && [ -z "$PASSWORD" ]; then
  echo -e "${RED}Error: Admin password required for profile '${PROFILE}'.${NC}"
  echo "Usage: $0 ${PROFILE} <admin_password>"
  echo "Or export AXIODB_ADMIN_PASSWORD=<admin_password>"
  exit 1
fi

# Stop existing container if running
if docker ps -a --format '{{.Names}}' | grep -Eq "^${CONTAINER_NAME}\$"; then
  echo -e "${YELLOW}Container '${CONTAINER_NAME}' already exists. Stopping and removing...${NC}"
  docker rm -f "${CONTAINER_NAME}" >/dev/null 2>&1 || true
fi

echo -e "${CYAN}==> Starting AxioDB Docker Container [Profile: ${PROFILE}]...${NC}"

case "$PROFILE" in
  standard)
    docker run -d \
      --name "${CONTAINER_NAME}" \
      -p 27018:27018 \
      -p 27019:27019 \
      -e AXIODB_GUI=true \
      -e AXIODB_TCP=true \
      -e AXIODB_TCP_AUTH_ENABLED=true \
      -e AXIODB_ADMIN_PASSWORD="${PASSWORD}" \
      -v "${VOLUME_NAME}:/app" \
      "${IMAGE}"
    echo -e "${GREEN}✔ AxioDB running:${NC}"
    echo "  - Web GUI & REST API: http://localhost:27018"
    echo "  - TCP Remote:         axiodb://localhost:27019"
    echo "  - Admin Account:      admin / ${PASSWORD}"
    ;;

  headless)
    docker run -d \
      --name "${CONTAINER_NAME}" \
      -p 27019:27019 \
      -e AXIODB_GUI=false \
      -e AXIODB_TCP=true \
      -e AXIODB_TCP_AUTH_ENABLED=true \
      -e AXIODB_ADMIN_PASSWORD="${PASSWORD}" \
      -v "${VOLUME_NAME}:/app" \
      "${IMAGE}"
    echo -e "${GREEN}✔ AxioDB Headless TCP running:${NC}"
    echo "  - TCP Remote:     axiodb://localhost:27019"
    echo "  - Admin Account:  admin / ${PASSWORD}"
    ;;

  no-auth)
    echo -e "${YELLOW}Warning: Running TCP with authentication disabled.${NC}"
    docker run -d \
      --name "${CONTAINER_NAME}" \
      -p 27018:27018 \
      -p 27019:27019 \
      -e AXIODB_TCP_AUTH_ENABLED=false \
      -v "${VOLUME_NAME}:/app" \
      "${IMAGE}"
    echo -e "${GREEN}✔ AxioDB (No Auth) running:${NC}"
    echo "  - Web GUI & REST API: http://localhost:27018"
    echo "  - TCP Remote:         axiodb://localhost:27019"
    ;;

  mcp)
    docker run -d \
      --name "${CONTAINER_NAME}" \
      -p 27018:27018 \
      -p 27019:27019 \
      -p 27020:27020 \
      -e AXIODB_GUI=true \
      -e AXIODB_TCP=true \
      -e AXIODB_MCP=true \
      -e AXIODB_ADMIN_PASSWORD="${PASSWORD}" \
      -v "${VOLUME_NAME}:/app" \
      "${IMAGE}"
    echo -e "${GREEN}✔ AxioDB with MCP running:${NC}"
    echo "  - Web GUI & REST API: http://localhost:27018"
    echo "  - TCP Remote:         axiodb://localhost:27019"
    echo "  - MCP AI Endpoint:    http://localhost:27020/mcp"
    echo "  - Admin Account:      admin / ${PASSWORD}"
    ;;

  *)
    echo -e "${RED}Unknown profile: $PROFILE${NC}"
    echo "Valid profiles: standard, headless, no-auth, mcp"
    exit 1
    ;;
esac
