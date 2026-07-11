# Use Node.js 22 Alpine (matches local development environment)
FROM node:22-alpine

# Set working directory
WORKDIR /app

# Copy the runner.js and healthcheck.js files
COPY runner.js healthcheck.js ./

# Copy lib folder with proper directory structure
COPY lib/ ./lib/

# Copy package.json and package-lock.json
COPY package*.json ./

# Copy Scripts folder for postinstall script
COPY Scripts/ ./Scripts/

# Install bash (required for postinstall script)
RUN apk add --no-cache bash

# Install dependencies
RUN npm install --force

# Run as a dedicated non-root user rather than the container default (root). Created after
# `npm install` so the install step itself (which may need to write to root-owned paths, e.g.
# via the postinstall script) is unaffected; ownership is handed over before the app runs.
RUN addgroup -S axiodb && adduser -S axiodb -G axiodb && chown -R axiodb:axiodb /app
USER axiodb

# HTTP GUI (27018) and AxioDBCloud TCP (27019)
EXPOSE 27018 27019

# Default configuration - override any of these at `docker run` time with
# `-e VAR=value` (or in docker-compose's `environment:` block); no rebuild required.
ENV AXIODB_GUI=true
ENV AXIODB_TCP=true
ENV AXIODB_TCP_AUTH=true
ENV AXIODB_TLS=false
ENV AXIODB_ROOT_NAME=AxioDB

# To enable TLS on the TCP server, set AXIODB_TLS=true and mount a cert/key pair into the
# container, then point these at the mounted paths, e.g.:
#   docker run -v /host/certs:/certs:ro -e AXIODB_TLS=true \
#     -e AXIODB_TLS_CERT_PATH=/certs/server.crt -e AXIODB_TLS_KEY_PATH=/certs/server.key ...
# ENV AXIODB_TLS_CERT_PATH=/certs/server.crt
# ENV AXIODB_TLS_KEY_PATH=/certs/server.key

# Probes whichever of the GUI (/health) and TCP (real PING/PONG heartbeat) surfaces are
# enabled - see healthcheck.js. Reported via `docker ps` / `docker inspect` and consumed by
# docker-compose's `depends_on: condition: service_healthy`.
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD ["node", "healthcheck.js"]

# Set the command to run the runner.js file
CMD ["node", "runner.js"]