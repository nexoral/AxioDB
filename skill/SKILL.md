---
name: skill
description: >-
  Expert operational guide, runbook, and architectural reference for AxioDB (version 26.40.4).
  Use this skill when developing, querying, installing, configuring, troubleshooting,
  or automating AxioDB embedded NoSQL, TCP remote access (AxioDBCloud), Docker containers,
  MCP server integration, Desktop GUI, or CLI operations.
---

# AxioDB Operational Skill (v26.40.4)

AxioDB is an embedded NoSQL database for TypeScript & AI agents. Zero-native document database with ACID transactions & in-memory cache — verified on Node.js (>=20) and Bun.

This skill provides step-by-step instructions and references for AI agents to operate AxioDB across all supported environments.

---

## 1. Quick Decision Matrix

Choose the appropriate mode based on the user's requirement:

| Requirement / Goal | Recommended Mode | Surface / Port | Action / Guide |
| :--- | :--- | :--- | :--- |
| **Local Node.js Service** | Embedded Core | In-process | Read [core-api-and-syntax.md](references/core-api-and-syntax.md) |
| **Remote Node.js / Microservice** | `AxioDBCloud` TCP | Port `27019` | Read [docker-and-tcp.md](references/docker-and-tcp.md) |
| **Containerized Deployment** | Docker Image | `27018` & `27019` | Run [run_docker.sh](scripts/run_docker.sh) |
| **AI Agent Tool Calling** | MCP Server | Port `27020` | Core (`{ MCP: true }`) / Docker (`AXIODB_MCP=true`) |
| **HTTP REST API** | HTTP Server | Port `27018` | Start with `HTTP: true` or `AXIODB_HTTP=true` |
| **Desktop App (Visual GUI)** | Electron GUI | Desktop OS | Download from [GitHub Releases](https://github.com/nexoral/AxioDB/releases/latest) |
| **Terminal / Scripts / REPL** | CLI Tool | Terminal | Download from [GitHub Releases](https://github.com/nexoral/AxioDB/releases/latest) |
| **Unit Testing / CI Mocking** | Ephemeral Instance | Temp Folder | Read [installation-and-setup.md](references/installation-and-setup.md) |

---

## 2. Component Scopes & Surface Boundaries

AxioDB features are strictly partitioned across specific surfaces:

1. **Embedded Core (`axiodb` npm package)**:
   - In-process NoSQL engine with file-per-document storage.
   - Singleton pattern: `new AxioDB()` can only be called once per process.
2. **HTTP API (Port 27018)**:
   - Fastify control server providing REST API endpoints (`/api/*`).
3. **TCP Remote Access (Port 27019)**:
   - High-throughput binary protocol used by `AxioDBCloud` client with connection pooling (`maxPoolSize: 10`) and RBAC authentication.
4. **MCP Server (Port 27020)**:
   - Native in core (`new AxioDB({ MCP: true })`) and Docker (`AXIODB_MCP=true`). Exposes 45 database management tools over Streamable HTTP for AI agents.
5. **Desktop GUI (Electron)**:
   - Standalone native desktop viewer connecting over TCP or HTTP.

For deep architectural details, consult [architecture-and-scope.md](references/architecture-and-scope.md).

---

## 3. Operational Workflows

### A. Installing AxioDB
Install the core database library directly into your project via npm:
```bash
npm install axiodb
```
For native Desktop GUI or CLI binaries, download directly from [GitHub Releases](https://github.com/nexoral/AxioDB/releases/latest). For platform matrices and setup options, read [installation-and-setup.md](references/installation-and-setup.md).

### B. Launching Docker Containers
When asked to start AxioDB via Docker, use the pre-configured runner:
```bash
# Standard profile (HTTP 27018 + TCP 27019 with auth)
./skill/scripts/run_docker.sh standard "<ADMIN_PASSWORD>"

# Headless TCP profile (no HTTP, port 27019 with seeded password)
./skill/scripts/run_docker.sh headless "<ADMIN_PASSWORD>"

# MCP profile for AI agents (Ports 27018, 27019, 27020)
./skill/scripts/run_docker.sh mcp "<ADMIN_PASSWORD>"

# Unauthenticated profile (trusted private network only)
./skill/scripts/run_docker.sh no-auth
```
For volume mounts, environment variables, and Docker Compose templates, read [docker-and-tcp.md](references/docker-and-tcp.md).

### C. System Diagnostics & Health Checks
When troubleshooting connection errors, port conflicts, or container status:
```bash
./skill/scripts/diagnose.sh
```

---

## 4. Legitimate Code Syntax

### Embedded Initialization & CRUD
```typescript
import { AxioDB } from "axiodb";

const db = new AxioDB({ RootName: "AppDB", CustomPath: "./data", Cache: true });
const database = await db.createDB("production");
const users = await database.createCollection("users");

// Insert document
await users.insert({ name: "Alex", role: "developer", active: true });

// Query with operators
const results = await users
  .query({ role: "developer", active: { $ne: false } })
  .Sort({ name: 1 })
  .Limit(20)
  .exec();
```

### Remote TCP Connection (`AxioDBCloud`)
```typescript
import { AxioDBCloud } from "axiodb";

const client = new AxioDBCloud("axiodb://admin:<ADMIN_PASSWORD>@localhost:27019", {
  maxPoolSize: 10,
  timeout: 10000,
});
await client.connect();

const db = await client.createDB("production");
const users = await db.createCollection("users");
```

For complete query operators (`$in`, `$regex`, `$gt`, etc.), aggregation pipelines, index hints, and ACID transactions, refer to [core-api-and-syntax.md](references/core-api-and-syntax.md).

---

## 5. Production Rules & Gotchas

1. **Singleton Guard**: Always instantiate `new AxioDB()` once and export the instance. Never call it in request handlers.
2. **First-Login Password Rotation**: The default `admin/admin` credentials reject TCP connections until rotated via the HTTP API (`http://localhost:27018`), Desktop GUI, or initialized via `AXIODB_ADMIN_PASSWORD`.
3. **Cache Jitter**: Leave `minTTL` (5m) and `maxTTL` (15m) active to prevent cache stampedes.
4. **Index Selectivity**: Add secondary indexes (`newIndex`) only on fields used in query filters. Always use `.hint("field")` for guaranteed O(1) lookups.

Consult [production-best-practices.md](references/production-best-practices.md) and [limitations-and-gotchas.md](references/limitations-and-gotchas.md) before writing production code.
