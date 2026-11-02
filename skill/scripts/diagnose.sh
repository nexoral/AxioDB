#!/usr/bin/env bash
set -uo pipefail

# AxioDB Diagnostic Script
# Inspects Docker containers, host processes, port conflicts, and HTTP health.

CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${CYAN}==============================================${NC}"
echo -e "${CYAN}         AxioDB System Diagnostics           ${NC}"
echo -e "${CYAN}==============================================${NC}"
echo ""

# 1. Port Status Check
echo -e "${CYAN}1. Checking Port Availability:${NC}"
for PORT in 27018 27019 27020; do
  SERVICE=""
  case "$PORT" in
    27018) SERVICE="HTTP REST API & Web GUI" ;;
    27019) SERVICE="TCP Remote Server (AxioDBCloud)" ;;
    27020) SERVICE="MCP Server (AI Agent HTTP)" ;;
  esac

  PID=$(lsof -ti :"$PORT" 2>/dev/null || ss -tulpn "sport = :$PORT" 2>/dev/null | grep -o "pid=[0-9]*" | cut -d= -f2 || true)
  if [ -n "$PID" ]; then
    echo -e "  - Port ${YELLOW}${PORT}${NC} (${SERVICE}): ${RED}IN USE${NC} (PID: ${PID})"
  else
    echo -e "  - Port ${GREEN}${PORT}${NC} (${SERVICE}): ${GREEN}FREE${NC}"
  fi
done
echo ""

# 2. Host AxioDB Processes
echo -e "${CYAN}2. Checking Host AxioDB Processes:${NC}"
HOST_PROCS=$(pgrep -af "axiodb|AxioDB" 2>/dev/null || true)
if [ -n "$HOST_PROCS" ]; then
  echo -e "${YELLOW}Active host processes found:${NC}"
  echo "$HOST_PROCS" | sed 's/^/    /'
else
  echo -e "  ${GREEN}No rogue or active AxioDB host processes running.${NC}"
fi
echo ""

# 3. Docker Container Inspection
echo -e "${CYAN}3. Checking Docker Containers:${NC}"
if command -v docker >/dev/null 2>&1; then
  if docker info >/dev/null 2>&1; then
    CONTAINERS=$(docker ps -a --filter "ancestor=theankansaha/axiodb" --filter "name=axiodb" --format "table {{.ID}}\t{{.Names}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null || true)
    if [ -n "$CONTAINERS" ] && [ "$(echo "$CONTAINERS" | wc -l)" -gt 1 ]; then
      echo -e "${GREEN}AxioDB containers found:${NC}"
      echo "$CONTAINERS" | sed 's/^/    /'
    else
      echo -e "  ${YELLOW}No AxioDB Docker containers currently active or stopped.${NC}"
    fi
  else
    echo -e "  ${YELLOW}Docker daemon is not running or accessible without sudo.${NC}"
  fi
else
  echo -e "  ${YELLOW}Docker command not found in PATH.${NC}"
fi
echo ""

# 4. HTTP Health Probe (Port 27018)
echo -e "${CYAN}4. Probing HTTP Health (http://localhost:27018/api/health):${NC}"
HEALTH_RESP=$(curl -s -m 2 http://localhost:27018/api/health 2>/dev/null || true)
if [ -n "$HEALTH_RESP" ]; then
  echo -e "  ${GREEN}HTTP API is responding:${NC} $HEALTH_RESP"
else
  echo -e "  ${YELLOW}No response from http://localhost:27018/api/health (Server offline or not running).${NC}"
fi

echo ""
echo -e "${CYAN}==============================================${NC}"
echo -e "${CYAN}           Diagnostics Completed              ${NC}"
echo -e "${CYAN}==============================================${NC}"
