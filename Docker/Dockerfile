# Node.js 22 Alpine (matches local dev environment)
FROM node:23-alpine

WORKDIR /app

# App entrypoints
COPY runner.js healthcheck.js ./

# Compiled lib output
COPY lib/ ./lib/

COPY package*.json ./

# Postinstall script deps
COPY Scripts/ ./Scripts/

# bash required by postinstall script
RUN apk add --no-cache bash

RUN npm install --force

# Drop root after install (postinstall may need root-owned paths)
RUN addgroup -S axiodb && adduser -S axiodb -G axiodb && chown -R axiodb:axiodb /app
USER axiodb

# HTTP API (27018), AxioDBCloud TCP (27019), MCP server (27020)
EXPOSE 27018 27019 27020

# Defaults - override with `-e VAR=value` at `docker run` time, no rebuild required
ENV AXIODB_HTTP=true
ENV AXIODB_TCP=true
ENV AXIODB_TCP_AUTH_ENABLED=true
ENV AXIODB_TLS=false
ENV AXIODB_ROOT_NAME=AxioDB
# AXIODB_ADMIN_PASSWORD is deliberately left unset - supply it at `docker run` time
# with `-e AXIODB_ADMIN_PASSWORD=...` to seed the admin account with a known password.
ENV AXIODB_MCP=false
ENV AXIODB_MCP_PORT=27020

# Probes HTTP/TCP/MCP surfaces per healthcheck.js - surfaced via `docker ps` / `docker inspect`
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD ["node", "healthcheck.js"]

# Best-effort fd soft-limit bump (real fix if capped: `docker run --ulimit nofile=...`);
# Sets V8 heap limit to ~75% container memory before startup if not explicitly passed;
# exec keeps node as PID 1 so it gets SIGTERM directly for graceful shutdown
CMD ["sh", "-c", "ulimit -n 65536 2>/dev/null; if [ -z \"$NODE_OPTIONS\" ] || ! echo \"$NODE_OPTIONS\" | grep -q 'max-old-space-size'; then MEM_MB=$(node -e \"const fs=require('fs'),os=require('os');let m;try{const v=fs.readFileSync('/sys/fs/cgroup/memory.max','utf8').trim();if(v!=='max')m=Math.floor(Number(v)/(1024*1024));}catch{}if(!m){try{const v=Number(fs.readFileSync('/sys/fs/cgroup/memory/memory.limit_in_bytes','utf8').trim());if(v>0&&v<9e18)m=Math.floor(v/(1024*1024));}catch{}}if(!m)m=Math.floor(os.totalmem()/(1024*1024));console.log(Math.max(512,Math.floor(m*0.75)));\"); export NODE_OPTIONS=\"${NODE_OPTIONS:+${NODE_OPTIONS} }--max-old-space-size=${MEM_MB}\"; fi; exec node runner.js"]
