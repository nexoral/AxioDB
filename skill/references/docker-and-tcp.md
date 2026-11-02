# AxioDB Docker and TCP Remote Access

## 1. Official Docker Container

The official Docker image (`theankansaha/axiodb`) packages the entire AxioDB stack:
- **HTTP REST API & Web GUI**: Port `27018`
- **TCP Remote Server (AxioDBCloud)**: Port `27019`
- **MCP Server (Streamable HTTP for AI Agents)**: Port `27020` (Opt-in)

---

## 2. Docker Quickstart Commands

### Standard Setup (Persistent Data + HTTP GUI + TCP)

```bash
docker run -d \
  --name axiodb-server \
  -p 27018:27018 \
  -p 27019:27019 \
  -v axiodb-data:/app \
  theankansaha/axiodb
```

> **Default Authentication**: `AXIODB_TCP_AUTH_ENABLED=true` by default. The database seeds an `admin` account with initial password `admin`. For security, first login must rotate this password via the Web GUI (`http://localhost:27018`) before TCP logins are allowed.

### Headless TCP with Seeded Admin Password

To run without HTTP/GUI while using TCP authentication, supply `AXIODB_ADMIN_PASSWORD`:

```bash
docker run -d \
  --name axiodb-server \
  -p 27019:27019 \
  -e AXIODB_GUI=false \
  -e AXIODB_TCP_AUTH_ENABLED=true \
  -e AXIODB_ADMIN_PASSWORD=SuperSecretPass123! \
  -v axiodb-data:/app \
  theankansaha/axiodb
```

### With MCP AI Agent Server Enabled (Port 27020)

```bash
docker run -d \
  --name axiodb-server \
  -p 27018:27018 \
  -p 27019:27019 \
  -p 27020:27020 \
  -e AXIODB_MCP=true \
  -v axiodb-data:/app \
  theankansaha/axiodb
```

---

## 3. Environment Variables Reference

| Variable | Default | Description |
| :--- | :--- | :--- |
| `AXIODB_GUI` | `true` | Enables the HTTP Control Server and Web GUI dashboard on port 27018. |
| `AXIODB_HTTP` | Mirrors `AXIODB_GUI` | Controls HTTP API server. Note: setting `AXIODB_GUI=true` with `AXIODB_HTTP=false` is invalid. |
| `AXIODB_TCP` | `true` | Enables AxioDBCloud TCP server on port 27019. |
| `AXIODB_TCP_AUTH_ENABLED` | `true` | Requires username/password authentication on all TCP connections. |
| `AXIODB_ADMIN_PASSWORD` | *(none)* | Initial password for `admin` user on first run. Skips forced GUI password change. |
| `AXIODB_TLS` | `false` | Enables TLS encryption on TCP connections (requires cert & key paths). |
| `AXIODB_TLS_CERT_PATH` | *(none)* | Path inside container to the PEM certificate file. |
| `AXIODB_TLS_KEY_PATH` | *(none)* | Path inside container to the matching private key file. |
| `AXIODB_ROOT_NAME` | `AxioDB` | Name of the root database folder inside `/app`. |
| `AXIODB_CUSTOM_PATH` | `/app` | Storage path inside the container. |
| `AXIODB_MCP` | `false` | Enables the MCP server for AI agent integration on port 27020 (**Docker-only**). |
| `AXIODB_MCP_PORT` | `27020` | Port for the MCP Streamable HTTP service. |

---

## 4. Connecting with the TCP Client (`AxioDBCloud`)

`AxioDBCloud` is the high-performance remote client for Node.js applications connecting to an AxioDB TCP server or Docker container.

### Connection Architecture
- **Connection Pooling**: Maintains `maxPoolSize` connections (default: 10). Commands route to the pool member with the lowest number of in-flight requests.
- **Auto-Reconnection**: Reconnects independently with exponential backoff and automatic re-authentication.
- **Heartbeat Monitoring**: Regular ping/pong health packets detect dead sockets before requests stall.

### Code Example: Connecting to Docker TCP Server

```typescript
import { AxioDBCloud } from "axiodb";

// Connection String Syntax: axiodb://[username:password@]host:port
const client = new AxioDBCloud("axiodb://admin:SuperSecretPass123!@localhost:27019", {
  timeout: 10000,           // 10s command timeout
  maxPoolSize: 10,          // Connection pool size
  reconnectAttempts: 10,    // Max reconnect retries
  reconnectDelay: 1000,     // Initial delay ms
  heartbeatInterval: 30000, // 30s heartbeat
});

async function run() {
  // Connect pool
  await client.connect();

  // Create or switch to database
  const db = await client.createDB("analytics");

  // Create or switch to collection
  const events = await db.createCollection("page_views");

  // Perform CRUD operations identically to embedded mode
  const insertResult = await events.insert({
    url: "/dashboard",
    timestamp: Date.now(),
    ip: "127.0.0.1",
  });

  console.log("Inserted:", insertResult);

  // Query documents over TCP
  const recentEvents = await events
    .query({ url: "/dashboard" })
    .Sort({ timestamp: -1 })
    .Limit(10)
    .exec();

  console.log("Recent Events:", recentEvents);

  // Close connection pool gracefully on shutdown
  await client.close();
}

run().catch(console.error);
```

---

## 5. Docker Compose Configuration

```yaml
version: "3.8"

services:
  axiodb:
    image: theankansaha/axiodb
    container_name: axiodb-server
    ports:
      - "27018:27018"   # HTTP REST API & Web GUI
      - "27019:27019"   # TCP Remote Access
      - "27020:27020"   # MCP Streamable HTTP Server
    environment:
      - AXIODB_GUI=true
      - AXIODB_TCP=true
      - AXIODB_TCP_AUTH_ENABLED=true
      - AXIODB_ADMIN_PASSWORD=ProductionPassword2026!
      - AXIODB_MCP=true
      - AXIODB_ROOT_NAME=EnterpriseDB
    volumes:
      - axiodb_data:/app
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "node", "healthcheck.js"]
      interval: 30s
      timeout: 5s
      start_period: 10s
      retries: 3

volumes:
  axiodb_data:
```
