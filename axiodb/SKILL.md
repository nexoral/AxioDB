---
name: axiodb
description: >-
  Expert operational guide, runbook, and architectural reference for AxioDB (version 28.54.13).
  Use this skill when developing, querying, installing, configuring, troubleshooting,
  or automating AxioDB embedded database, TCP remote access (AxioDBCloud), Docker containers,
  MCP server integration, Desktop GUI, or CLI operations.
---

# AxioDB Operational Skill (v28.54.13)

<system_overview>
AxioDB is an embedded database for AI agents. Everything you expect from a production database without having to run a database.
* Zero native C++ dependencies, strict TypeScript, file-per-document storage.
* ACID transactions via Write-Ahead Logging (WAL) and memory-cached secondary indexes.
* Runtime verified: Node.js (>=22) and Bun (>=1.4.0).
* Multi-surface deployment: In-process Embedded, HTTP (27018), TCP (27019), and MCP (27020).
</system_overview>

<decision_matrix>
## Quick Decision Matrix

| Requirement / Goal | Recommended Mode | Surface / Port | Target Runbook |
| :--- | :--- | :--- | :--- |
| **Local Node / Bun App** | Embedded Core | In-process | [core-crud.md](references/core-crud.md) |
| **Microservice / Remote** | `AxioDBCloud` TCP | Port `27019` | [tcp-remote-client.md](references/tcp-remote-client.md) |
| **Containerized Deployment** | Docker Image | `27018` & `27019` | [docker-deployment.md](references/docker-deployment.md) |
| **AI Agent Tool Calling** | MCP Server | Port `27020` | [vector-search.md](references/vector-search.md) |
| **Semantic / Vector Search** | Embedded / TCP / HTTP | All Surfaces | [vector-search.md](references/vector-search.md) |
| **ACID Multi-Op Mutations** | WAL Transactions | Core / TCP / HTTP | [transactions-and-aggregation.md](references/transactions-and-aggregation.md) |
| **Analytics & Grouping** | Aggregation Pipeline | Core / TCP / HTTP | [transactions-and-aggregation.md](references/transactions-and-aggregation.md) |
| **Desktop Visual GUI** | Electron App | Desktop OS | [installation-and-setup.md](references/installation-and-setup.md) |
| **CLI / Shell Scripting** | Standalone Go CLI | Terminal | [installation-and-setup.md](references/installation-and-setup.md) |
| **CI Unit Testing** | Ephemeral Instance | Temp Folder | [installation-and-setup.md](references/installation-and-setup.md) |
| **System Diagnostics** | Port & Health Checks | Local Ports | [system-diagnostics.md](references/system-diagnostics.md) |
</decision_matrix>

<reference_pointers>
## Progressive Disclosure Triggers

When executing specific database operations, open and read the dedicated modular reference:

* **CRUD & Queries**: Read [core-crud.md](references/core-crud.md) for `$in`, `$regex`, `$gt`, sorting, pagination, and index hints.
* **Vector Similarity**: Read [vector-search.md](references/vector-search.md) for exact k-NN queries across Embedded, TCP, HTTP, and MCP surfaces.
* **Transactions & Analytics**: Read [transactions-and-aggregation.md](references/transactions-and-aggregation.md) for atomic WAL pipelines and 19 aggregation stages.
* **Docker Operations**: Read [docker-deployment.md](references/docker-deployment.md) for Standard, MCP, Headless TCP, and Unauthenticated container profiles.
* **TCP Remote Access**: Read [tcp-remote-client.md](references/tcp-remote-client.md) for `AxioDBCloud` connection pooling (`maxPoolSize: 10`) and authentication.
* **Installation & Setup**: Read [installation-and-setup.md](references/installation-and-setup.md) for package installation, binaries, and ephemeral testing.
* **Diagnostics & Port Conflicts**: Read [system-diagnostics.md](references/system-diagnostics.md) for lsof port inspection, curl health probes, and container logs.
* **Production Best Practices**: Read [production-best-practices.md](references/production-best-practices.md) for singleton guards, TTL jitter, and memory limits.
* **Architecture Details**: Read [architecture-and-scope.md](references/architecture-and-scope.md) for file storage layout and dual-write index lifecycles.
* **Known Gotchas**: Read [limitations-and-gotchas.md](references/limitations-and-gotchas.md) for filesystem block amplification and single-instance locks.
</reference_pointers>

<quick_reference>
## Quickstart Syntax

```typescript
import { AxioDB } from "axiodb";

// 1. Initialize Singleton Instance
const db = new AxioDB({ RootName: "AppDB", CustomPath: "./data", Cache: true });
const database = await db.createDB("production");
const users = await database.createCollection("users");

// 2. Insert Document
await users.insert({ name: "Alex", role: "admin", active: true });

// 3. Query with Operators
const results = await users
  .query({ role: "admin", active: { $ne: false } })
  .Sort({ name: 1 })
  .Limit(10)
  .exec();
```
</quick_reference>

<hard_invariants>
## Hard Operational Invariants

1. **Singleton Guard**: Calling `new AxioDB()` twice in one process throws an error. Instantiate once and export the singleton.
2. **First-Login Password Rotation**: Default credentials (`admin`/`admin`) reject TCP connections until rotated via the HTTP API, Desktop GUI, or initialized with `AXIODB_ADMIN_PASSWORD`.
3. **Randomized Cache TTL**: In-memory cache uses randomized jitter (5–15 minutes) to prevent cache stampedes. Never set static TTL across all keys.
4. **Secondary Index Selectivity**: Build secondary indexes only on frequently filtered fields; use `.hint("fieldName")` for guaranteed O(1) index lookups.
</hard_invariants>
