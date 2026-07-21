# Node.js 22 Alpine (matches local dev environment)
FROM node:23-alpine

WORKDIR /app

# App entrypoints + MCP tool modules
COPY runner.js healthcheck.js mcpServer.js ./
COPY mcp/ ./mcp/

# Compiled lib output
COPY lib/ ./lib/

COPY package*.json ./

# Postinstall script deps
COPY Scripts/ ./Scripts/

# bash required by postinstall script
RUN apk add --no-cache bash

RUN npm install --force

# MCP SDK - image-only dep, opt-in via AXIODB_MCP=true, never in the published npm package
RUN npm install --force @modelcontextprotocol/sdk@^1.29.0 zod@^4.0.0

# Drop root after install (postinstall may need root-owned paths)
RUN addgroup -S axiodb && adduser -S axiodb -G axiodb && chown -R axiodb:axiodb /app
USER axiodb

# HTTP GUI (27018), AxioDBCloud TCP (27019), MCP server (27020)
EXPOSE 27018 27019 27020

# Defaults - override with `-e VAR=value` at `docker run` time, no rebuild required
ENV AXIODB_GUI=true
ENV AXIODB_TCP=true
ENV AXIODB_TCP_AUTH=true
ENV AXIODB_TLS=false
ENV AXIODB_ROOT_NAME=AxioDB
ENV AXIODB_MCP=false
ENV AXIODB_MCP_PORT=27020

# Probes GUI/TCP/MCP surfaces per healthcheck.js - surfaced via `docker ps` / `docker inspect`
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD ["node", "healthcheck.js"]

# Best-effort fd soft-limit bump (real fix if capped: `docker run --ulimit nofile=...`);
# exec keeps node as PID 1 so it gets SIGTERM directly for graceful shutdown
CMD ["sh", "-c", "ulimit -n 65536 2>/dev/null; exec node runner.js"]
