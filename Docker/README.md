# AxioDB Docker Image

[![Docker](https://img.shields.io/badge/docker-%230db7ed.svg?style=for-the-badge&logo=docker&logoColor=white)](https://docker.com/)
[![AxioDB](https://img.shields.io/badge/AxioDB-2.29.82-blue?style=for-the-badge)](https://www.npmjs.com/package/axiodb)

This Docker image provides both a REST API server and TCP remote access for AxioDB, allowing you to interact with the AxioDB database management system through HTTP requests or TCP connections. The container includes a web-based GUI dashboard for visual database management, comprehensive API endpoints for programmatic access, and AxioDBCloud TCP connector for remote client connections.

## =� What's Included

- **REST API Server**: Full HTTP API for database operations (Port 27018)
- **TCP Remote Access**: AxioDBCloud connector for remote client connections (Port 27019)
- **MCP Server**: Opt-in AI agent integration (Claude, or any MCP-compatible client) over Streamable HTTP (Port 27020)
- **Web GUI Dashboard**: Browser-based interface at `http://localhost:27018`
- **API Documentation**: Interactive API reference at `http://localhost:27018/api`
- **AxioDB Core**: Complete database management system
- **Auto-start Configuration**: Ready-to-use setup with minimal configuration

## =� Quick Start

### Running the Container

```bash
# Pull and run the AxioDB Docker container
docker run -d \
  --name axiodb-server \
  -p 27018:27018 \
  -p 27019:27019 \
  -v axiodb-data:/app \
  theankansaha/axiodb
```

> **Authentication is on by default** (`AXIODB_TCP_AUTH=true`) - both the GUI (`http://localhost:27018`) and TCP (`axiodb://localhost:27019`) share the same seeded `admin` / `admin` account, which must have its password changed on first login via the GUI before it (or any account) can be used over TCP. See [Environment Variables](#environment-variables) to turn this off or change the root database name.

### Custom Port Mapping

```bash
# Run on different host ports (e.g., 8080 for HTTP, 8081 for TCP)
docker run -d \
  --name axiodb-server \
  -p 8080:27018 \
  -p 8081:27019 \
  -v axiodb-data:/app \
  theankansaha/axiodb

# Access HTTP GUI via http://localhost:8080
# Connect AxioDBCloud via axiodb://localhost:8081
```

### With Data Persistence

```bash
# Mount a volume to persist data
docker run -d \
  --name axiodb-server \
  -p 27018:27018 \
  -p 27019:27019 \
  -v axiodb-data:/app \
  theankansaha/axiodb
```

### Disabling TCP Authentication

```bash
# Only do this on a trusted private network or behind your own VPN/TLS termination -
# the TCP protocol itself is unencrypted, and with auth off any client on the network
# that can reach port 27019 has full database access.
docker run -d \
  --name axiodb-server \
  -p 27018:27018 \
  -p 27019:27019 \
  -e AXIODB_TCP_AUTH=false \
  -v axiodb-data:/app \
  theankansaha/axiodb
```

## =� Accessing the Services

Once the container is running:

### TCP Remote Access (AxioDBCloud)

- **Connection String**: `axiodb://localhost:27019`
- **Description**: Direct TCP connection for remote client access using AxioDBCloud
- **Features**:
  - Full database API with same interface as embedded mode
  - Auto-reconnection with exponential backoff
  - Connection pooling for high concurrency (default pool of 10 connections, configurable via `maxPoolSize`)
  - Heartbeat monitoring for connection health
  - Perfect for Node.js applications connecting remotely

```javascript
const { AxioDBCloud } = require('axiodb');

const db = new AxioDBCloud('axiodb://localhost:27019');
await db.connect();

const database = await db.createDB('myDatabase');
const collection = await database.createCollection('users');
const result = await collection.insert({ name: 'John', age: 30 });
```

### Web GUI Dashboard

- **URL**: `http://localhost:27018`
- **Description**: Interactive web interface for managing databases, collections, and documents
- **Features**:
  - Database creation and management
  - Collection operations with schema validation
  - Document CRUD operations
  - Real-time statistics and monitoring

### API Documentation

- **URL**: `http://localhost:27018/api`
- **Description**: Complete REST API reference with examples
- **Features**:
  - Interactive API explorer
  - Request/response examples
  - Authentication details
  - Endpoint documentation

### REST API Endpoints

- **Base URL**: `http://localhost:27018/api`
- **Content-Type**: `application/json`
- **Available Operations**:
  - Database management (`/api/database/*`)
  - Collection operations (`/api/collection/*`)
  - Document CRUD (`/api/operation/*`)
  - Statistics and monitoring (`/api/stats/*`)

## =� For Node.js Developers

### Recommended: Use AxioDB NPM Package

If you're building a **Node.js application**, we highly recommend using the official **AxioDB NPM package** instead of the Docker REST API for better performance and direct integration:

```bash
npm install axiodb@latest --save
```

**Benefits of the NPM package over Docker API:**

- **Better Performance**: Direct in-process database operations
- **No Network Overhead**: Eliminate HTTP request latency
- **Type Safety**: Full TypeScript support with IntelliSense
- **Advanced Features**: Access to all AxioDB features including encryption, caching, and aggregation
- **Easier Development**: No need to manage Docker containers during development

#### NPM Package Usage Example

```javascript
const { AxioDB } = require("axiodb");

// Create a single AxioDB instance
const db = new AxioDB();

const main = async () => {
  // Create database and an encrypted collection (auto-generated key)
  const database = await db.createDB("myApp");
  const collection = await database.createCollection("users", true);

  // Insert document
  const result = await collection.insert({
    name: "John Doe",
    email: "john@example.com",
    age: 30,
  });

  console.log(result);
};

main();
```

### When to Use: Docker (REST API) vs Docker (TCP) vs NPM Package

| Use Case                       | Docker (REST API)  | Docker (AxioDBCloud TCP) | NPM Package (Embedded)    |
| ------------------------------ | ------------------ | ------------------------ | ------------------------- |
| **Local Node.js Apps**         | Not recommended    | Not recommended          | **Recommended**           |
| **Remote Node.js Apps**        | Good choice        | **Better performance**   | Not applicable            |
| **Microservices Architecture** | Good choice        | **Recommended**          | Consider boundaries       |
| **Non-Node.js Applications**   | **Recommended**    | Not available            | Not available             |
| **Development/Prototyping**    | Quick setup        | Quick setup              | **Best performance**      |
| **Cloud Deployment**           | Network overhead   | **Optimized for cloud**  | Not applicable            |

## =' Configuration

### Environment Variables

| Variable | Default | Description |
| --- | --- | --- |
| `AXIODB_GUI` | `true` | Enable the HTTP Control Server / web GUI on port 27018 |
| `AXIODB_TCP` | `true` | Enable the AxioDBCloud TCP server on port 27019 |
| `AXIODB_TCP_AUTH` | `true` | Require username/password authentication on TCP connections (same RBAC accounts as the GUI) |
| `AXIODB_ROOT_NAME` | `AxioDB` | Name of the root database folder created under the data volume |
| `AXIODB_CUSTOM_PATH` | *(container's working directory)* | Custom path for database storage inside the container |
| `AXIODB_MCP` | `false` | Enable the MCP server (AI agent integration) on port 27020 |
| `AXIODB_MCP_PORT` | `27020` | Port the MCP server listens on inside the container |

```bash
docker run -d \
  --name axiodb-server \
  -p 27018:27018 \
  -p 27019:27019 \
  -e AXIODB_TCP_AUTH=false \
  -e AXIODB_ROOT_NAME=MyProductionDB \
  -v axiodb-data:/app \
  theankansaha/axiodb
```

> Ports themselves (27018/27019) aren't currently configurable via environment variable - remap them at the Docker layer instead with `-p <host-port>:27018` / `-p <host-port>:27019`, as shown under [Custom Port Mapping](#custom-port-mapping).

### Docker Compose

Save the block below as `docker-compose.yml`. It includes a `healthcheck` wired to the same
script the image's own `HEALTHCHECK` instruction uses (probes `/health` for the GUI and a real
`PING`/`PONG` round-trip for TCP):

```yaml
version: "3.8"

services:
  axiodb:
    image: theankansaha/axiodb
    container_name: axiodb-server
    ports:
      - "27018:27018"  # HTTP API & GUI
      - "27019:27019"  # TCP Remote Access
    environment:
      - AXIODB_GUI=true
      - AXIODB_TCP=true
      - AXIODB_TCP_AUTH=true
      - AXIODB_ROOT_NAME=AxioDB
    volumes:
      - axiodb-data:/app
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "node", "healthcheck.js"]
      interval: 30s
      timeout: 5s
      start_period: 10s
      retries: 3

volumes:
  axiodb-data:
```

```bash
docker compose up -d
```

## > MCP Server (AI Agent Integration)

Set `AXIODB_MCP=true` on this same container to let Claude (or any MCP-compatible AI agent)
talk to your AxioDB instance directly, over Streamable HTTP on port 27020. It runs in the same
process as the GUI/TCP server already in this image - no separate install, no second database
instance.

```bash
docker run -d \
  --name axiodb-server \
  -e AXIODB_GUI=true \
  -e AXIODB_MCP=true \
  -p 27018:27018 \
  -p 27019:27019 \
  -p 27020:27020 \
  -v axiodb-data:/app \
  theankansaha/axiodb
```

Register the endpoint (`http://localhost:27020/mcp`) with whichever AI tool you use:

| Tool | How |
| --- | --- |
| **Claude Code** | `claude mcp add --transport http axiodb http://localhost:27020/mcp` |
| **OpenAI Codex CLI** | `codex mcp add axiodb --url http://localhost:27020/mcp` (or `[mcp_servers.axiodb]` + `url = "..."` in `~/.codex/config.toml`) |
| **opencode** | `opencode mcp add` (interactive → type "remote") or add `"axiodb": { "type": "remote", "url": "...", "enabled": true }` under `mcp` in `opencode.json` |
| **GitHub Copilot CLI** | `/mcp add` inside the `copilot` REPL, or add to `~/.copilot/mcp-config.json`: `{ "mcpServers": { "axiodb": { "type": "http", "url": "..." } } }` |
| **Cursor** | Add to `.cursor/mcp.json` (or `~/.cursor/mcp.json`): `{ "mcpServers": { "axiodb": { "url": "..." } } }` |
| **Windsurf** | Add to `~/.codeium/windsurf/mcp_config.json`: `{ "mcpServers": { "axiodb": { "serverUrl": "..." } } }` |
| **Google Antigravity** (IDE & CLI) | Add to `~/.gemini/config/mcp_config.json`: `{ "mcpServers": { "axiodb": { "serverUrl": "..." } } }` — note `serverUrl`, not `url` |

**32 tools**, covering:

- **Session**: `axiodb_login`, `axiodb_logout`, `axiodb_whoami`, `axiodb_change_own_password`
- **Database**: create/delete/exists/instance-info
- **Collection**: create (plain or AES-256 encrypted)/delete/exists/info
- **Documents & Aggregation**: insert/insert-many/query/update/delete/count/aggregate
- **Index**: create/drop/list
- **Dashboard**: stats
- **User & Role Management**: full CRUD on users and roles, Super Admin only

Every tool except `axiodb_login` requires a `sessionId` from a successful login - every
subsequent call is checked against that logged-in user's actual RBAC role, exactly like the
HTTP API. Nothing is gated by a static container environment variable. `AXIODB_MCP=true` only
has RBAC to serve once it's actually seeded, i.e. `AXIODB_GUI=true` (default) or
`AXIODB_TCP=true` + `AXIODB_TCP_AUTH=true`.

Transactions and database export/import are intentionally not exposed as MCP tools.

Full tool catalogue, request/response examples, and security notes:
**[https://axiodb.in/mcp-server](https://axiodb.in/mcp-server)**.

## =� API Examples

### Create Database

```bash
curl -X POST http://localhost:27018/api/database/create \
  -H "Content-Type: application/json" \
  -d '{"name": "myDatabase"}'
```

### Create Collection

```bash
curl -X POST http://localhost:27018/api/collection/create \
  -H "Content-Type: application/json" \
  -d '{
    "database": "myDatabase",
    "name": "users",
    "schema": {
      "name": {"type": "string", "required": true},
      "email": {"type": "string", "required": true}
    }
  }'
```

### Insert Document

```bash
curl -X POST http://localhost:27018/api/operation/insert \
  -H "Content-Type: application/json" \
  -d '{
    "database": "myDatabase",
    "collection": "users",
    "data": {
      "name": "John Doe",
      "email": "john@example.com"
    }
  }'
```

### Query Documents

```bash
curl -X POST http://localhost:27018/api/operation/query \
  -H "Content-Type: application/json" \
  -d '{
    "database": "myDatabase",
    "collection": "users",
    "query": {"name": "John Doe"},
    "limit": 10
  }'
```

## =3 Building from Source

If you want to build the Docker image yourself:

```bash
# Clone the repository
git clone https://github.com/nexoral/AxioDB.git
cd AxioDB/Docker

# Build the Docker image
docker build -t axiodb:latest .

# Run the container
docker run -d \
  --name axiodb-server \
  -p 27018:27018 \
  -p 27019:27019 \
  -e AXIODB_TCP_AUTH=true \
  -v axiodb-data:/app \
  axiodb:latest
```

## =

Troubleshooting

### Container Won't Start

```bash
# Check container logs
docker logs axiodb-server

# Check if port is already in use
netstat -tulpn | grep :27018
```

### Port Already in Use

```bash
# Use a different port
docker run -d --name axiodb-server -p 8080:27018 -p 8081:27019 theankansaha/axiodb
```

### Data Persistence Issues

```bash
# Ensure proper volume mounting
docker run -d \
  --name axiodb-server \
  -p 27018:27018 \
  -p 27019:27019 \
  -e AXIODB_ROOT_NAME=AxioDB \
  -v "$(pwd)/axiodb-data":/app \
  theankansaha/axiodb
```

## =� Additional Resources

- **Official Documentation**: [https://axiodb.in/](https://axiodb.in/)
- **NPM Package**: [https://www.npmjs.com/package/axiodb](https://www.npmjs.com/package/axiodb)
- **GitHub Repository**: [https://github.com/nexoral/AxioDB](https://github.com/nexoral/AxioDB)
- **API Reference**: Access via `http://localhost:27018/api` when container is running

## > Support

For support and questions:

- Open an issue on [GitHub](https://github.com/nexoral/AxioDB/issues)
- Check the [documentation](https://axiodb.in/)
- Visit the API reference at `http://localhost:27018/api`

---

**Note**: This Docker image is designed for development, testing, and small-scale production use. For high-performance Node.js applications, consider using the AxioDB NPM package directly for optimal performance.
