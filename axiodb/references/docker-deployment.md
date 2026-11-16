# AxioDB Docker Container Deployment

<docker_profiles>
## 1. Container Profiles

Image: `theankansaha/axiodb:latest` (or pinned version `theankansaha/axiodb:28.52.11`)

### Profile A: Standard (HTTP 27018 + TCP 27019 with Auth)
```bash
docker run -d \
  --name axiodb \
  -p 27018:27018 \
  -p 27019:27019 \
  -v axiodb-data:/app/AxioDB \
  -e AXIODB_ADMIN_PASSWORD="<ADMIN_PASSWORD>" \
  theankansaha/axiodb:latest
```

### Profile B: AI Agent MCP (HTTP 27018 + TCP 27019 + MCP 27020)
```bash
docker run -d \
  --name axiodb \
  -p 27018:27018 \
  -p 27019:27019 \
  -p 27020:27020 \
  -v axiodb-data:/app/AxioDB \
  -e AXIODB_ADMIN_PASSWORD="<ADMIN_PASSWORD>" \
  -e AXIODB_MCP=true \
  theankansaha/axiodb:latest
```

### Profile C: Headless TCP (TCP 27019 only, no HTTP)
```bash
docker run -d \
  --name axiodb \
  -p 27019:27019 \
  -v axiodb-data:/app/AxioDB \
  -e AXIODB_HTTP=false \
  -e AXIODB_ADMIN_PASSWORD="<ADMIN_PASSWORD>" \
  theankansaha/axiodb:latest
```

### Profile D: Unauthenticated (Private / Testing Network Only)
```bash
docker run -d \
  --name axiodb-dev \
  -p 27019:27019 \
  -v axiodb-data:/app/AxioDB \
  -e AXIODB_TCP_AUTH_ENABLED=false \
  theankansaha/axiodb:latest
```
</docker_profiles>

<docker_compose>
## 2. Docker Compose Production Template

Save as `docker-compose.yml`:

```yaml
services:
  axiodb:
    image: theankansaha/axiodb:latest
    container_name: axiodb
    restart: unless-stopped
    ports:
      - "27018:27018"   # Fastify HTTP Control Server
      - "27019:27019"   # Binary TCP Remote Access
      - "27020:27020"   # MCP Streamable HTTP AI Server
    environment:
      AXIODB_ADMIN_PASSWORD: "${AXIODB_ADMIN_PASSWORD:?AXIODB_ADMIN_PASSWORD is required}"
      AXIODB_MCP: "true"
      AXIODB_TCP_AUTH_ENABLED: "true"
      AXIODB_CACHE: "true"
    volumes:
      - axiodb_storage:/app/AxioDB
    healthcheck:
      test: ["CMD", "node", "healthcheck.js"]
      interval: 30s
      timeout: 5s
      retries: 3

volumes:
  axiodb_storage:
    driver: local
```
</docker_compose>

<env_variables>
## 3. Environment Variables Reference

| Variable | Default | Purpose |
| :--- | :--- | :--- |
| `AXIODB_ADMIN_PASSWORD` | unset | Seeds admin password on initial database boot and clears forced password change. |
| `AXIODB_MCP` | `false` | Enables MCP Server on port 27020 exposing 46 tools for AI agents. |
| `AXIODB_TCP_AUTH_ENABLED` | `true` | Enforces RBAC authentication on port 27019. Set `false` for open dev TCP. |
| `AXIODB_HTTP` | `true` | Starts Fastify HTTP REST API server on port 27018. Set `false` for headless TCP. |
| `AXIODB_CACHE` | `true` | Activates built-in memory cache layer with 5–15m jitter. |
</env_variables>

<lifecycle>
## 4. Container Maintenance & Logs

```bash
# View live streaming container logs
docker logs -f axiodb

# Inspect persistent volume data
docker volume inspect axiodb_storage

# Graceful stop and removal
docker stop axiodb && docker rm axiodb
```
</lifecycle>
