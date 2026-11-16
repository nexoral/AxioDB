# AxioDB — System Architecture & Anti-Hallucination Context Map

> **Canonical System Reference**: This document serves as the ground-truth architectural blueprint and zero-grep directory index for human engineers and autonomous AI agents. All statements, module roles, and file paths in this document reflect verified production code.
>
> **AI Ingestion Format**: Uses Anthropic's hybrid XML-Markdown pattern. Semantic XML tags delineate machine-parsable boundaries to eliminate context bleed and ambiguity, while standard Markdown inside provides optimal human readability.

---

<system_overview>
## 1. System Overview & Architecture Topology

AxioDB is an embedded NoSQL Document Database engineered for TypeScript runtimes (Node.js ≥22, Bun, Deno) and AI Agent memory workflows. It operates with zero native dependencies (pure TypeScript compiled to CommonJS via `tsup`), an in-process singleton lifecycle, dual-write memory caching, ACID transactions with Write-Ahead Logging (WAL), and multi-surface network accessibility.

```
                               ┌────────────────────────────────────────────────────────┐
                               │                    AxioDB Surfaces                     │
                               │                                                        │
                               │   In-Process TS Lib  │  HTTP REST (27018)  │ TCP (27019)│
                               │   MCP Server (27020) │  CLI (cmd)          │ Electron   │
                               └───────────────────────────┬────────────────────────────┘
                                                           │
                                                           ▼
                               ┌────────────────────────────────────────────────────────┐
                               │                     Core Engine                        │
                               │  Singleton (`new AxioDB`) • PathSanitizer • Keys.ts     │
                               │                                                        │
                               │   ┌───────────────────────┐  ┌───────────────────────┐ │
                               │   │  Dual-Write In-Memory │  │   ACID & WAL Engine   │ │
                               │   │  Cache (5-15m TTL)    │  │   LockManager & Log   │ │
                               │   └───────────────────────┘  └───────────────────────┘ │
                               │                                                        │
                               │   ┌───────────────────────┐  ┌───────────────────────┐ │
                               │   │  Query & Vector Math  │  │  Worker Threads Pool  │ │
                               │   │  Aggregation Engine   │  │  Background Indexing  │ │
                               │   └───────────────────────┘  └───────────────────────┘ │
                               └───────────────────────────┬────────────────────────────┘
                                                           │
                                                           ▼
                               ┌────────────────────────────────────────────────────────┐
                               │                     Storage Engine                     │
                               │   File-per-Document JSON • Append-only JSONL Registries│
                               └────────────────────────────────────────────────────────┘
```

### High-Level Subsystems & Port Allocation
* **In-Process Core**: Singleton database client imported directly in Node/Bun/Deno projects (`import { AxioDB } from 'axiodb'`).
* **HTTP REST API (Port 27018)**: Fastify-based HTTP server with session cookie auth, role-based access control (RBAC), and document CRUD endpoints (`source/server/`).
* **TCP Server (Port 27019)**: High-performance raw TCP server running a custom framed protocol with optional TCPAuth (`source/tcp/`).
* **MCP Server (Port 27020 / Stdio)**: Model Context Protocol server exposing database query and mutation tools directly to AI coding agents (`source/Helper/mcp/`).
* **Vite Documentation Site (Port 5173)**: Interactive documentation, playground, and live schema browser (`Document/`).
* **Cloudflare Email Worker**: Serverless email triage agent using vectorless RAG for auto-responding to technical issues (`Email/`).
</system_overview>

---

<ground_truth_invariants>
## 2. Ground-Truth Invariants & Anti-Hallucination Guardrails

AI agents and developers **must adhere** to the following inviolable constraints. Do not deviate or assume alternative implementations:

<singleton_concurrency_rules>
### 2.1 Singleton Lifecycle & Concurrency
1. **Strict Process Singleton**: `AxioDB` is an absolute singleton per process (`AxioDB._instance`). Calling `new AxioDB()` more than once in the same process throws an unrecoverable error. Test runners must isolate test suites in dedicated child processes.
2. **Worker Thread Offloading**: CPU-intensive vector similarity math (`utility/VectorMath.utils.ts`) and bulk disk operations offload to worker threads (`Helper/WorkerPool.helper.ts`, `engine/node/workerScript.engine.ts`) to avoid blocking the main event loop.
</singleton_concurrency_rules>

<type_safety_rules>
### 2.2 Strict Type Safety & Code Standards
1. **Zero Native Addons**: AxioDB strictly forbids native C++ bindings (`better-sqlite3`, `node-gyp`, etc.). It runs anywhere pure JavaScript/TypeScript is supported.
2. **Strictly No `any`**: TypeScript strict mode is mandatory. Never use `any`. Always use `unknown` accompanied by explicit runtime type guards.
3. **No Dynamic `eval` or Timeout Hacks**: Code execution via `eval()`, `new Function()`, or `setTimeout` race condition patches is forbidden.
4. **Max Nesting Depth**: Function logic nesting must not exceed 3 levels. Extract deep branches into static stateless helpers in `source/Helper/`.
</type_safety_rules>

<storage_data_rules>
### 2.3 Storage Engine & Cache Invariants
1. **File-Per-Document Storage**: Every record is stored as an individual JSON file on disk. Paths are sanitized using `PathSanitizer.helper.ts` (`/[^a-zA-Z0-9-_]/g`).
2. **No Hardcoded Filenames**: All database folder names, registry files, and metadata paths **must** resolve from `source/config/Keys/Keys.ts` (`General` constants). Never hardcode strings like `./data/mydb`.
3. **Dual-Write Indexing**: Index updates must dual-write simultaneously to memory (`InMemoryCache`) and disk (`IndexCache`).
4. **Randomized TTL (5–15 min)**: `InMemoryCache` entries use a randomized expiration window between `minTTL` (default 5m) and `maxTTL` (default 15m) to mathematically eliminate cache stampedes.
5. **Append-Only JSONL Registries**: Transaction registries and audit logs append one JSON line per event; the last line wins; an empty state truncates the file.
6. **Core → Surfaces Parity**: Every new feature implemented in core (`Services/Collection`, `Index`, `Transaction`) must be mirrored across HTTP (27018), TCP (27019), CLI, and MCP (27020) with identical authorization checks.
</storage_data_rules>
</ground_truth_invariants>

---

<zero_grep_directory_map>
## 3. Zero-Grep Codebase Directory Map

Use this directory map to locate source files without running recursive searches or blind grep operations.

```
AxioDB/
├── source/                     # Core Database TypeScript Source
│   ├── config/                 # DB Entrypoint, Constants, Status Codes & Permissions
│   ├── Services/               # Collection, Index, Transaction, Auth, Aggregation
│   ├── engine/                 # Filesystem & Node Worker Thread Engines
│   ├── Memory/                 # In-Memory Cache Implementation
│   ├── server/                 # Fastify HTTP Server (Port 27018)
│   ├── tcp/                    # TCP Server (Port 27019) & Custom Protocol
│   ├── client/                 # TCP Client Proxies (CollectionProxy, TransactionProxy)
│   ├── Helper/                 # Static Stateless Utilities (MCP, HTTP, WorkerPool)
│   └── utility/                # VectorMath, Searcher, Sorting, Compression
├── Test/                       # 14 Test Suites (Node-based child processes)
├── Document/                   # Vite Documentation Site (Port 5173) & AI Artifacts
├── cli/                        # Go-based CLI tool
├── Docker/                     # Dockerfile & Container MCP Configurations
├── electron/                   # Desktop GUI Application
├── Email/                      # Cloudflare Worker Email Triage Agent
└── AGENTS.md                   # Canonical operational instructions for AI agents
```

<core_services_map>
### 3.1 Core Services & Storage Engine (`source/`)

| Subsystem | Key Files | Primary Responsibilities |
|---|---|---|
| **Entrypoint** | [DB.ts](file:///home/ankan/Documents/Projects/AxioDB/source/config/DB.ts)<br>[Indexation.operation.ts](file:///home/ankan/Documents/Projects/AxioDB/source/Services/Indexation.operation.ts) | Export root `AxioDB` singleton class, initialize storage directories, configure server options. |
| **Constants & Keys** | [Keys.ts](file:///home/ankan/Documents/Projects/AxioDB/source/config/Keys/Keys.ts)<br>[Permissions.ts](file:///home/ankan/Documents/Projects/AxioDB/source/config/Keys/Permissions.ts)<br>[StatusCode.ts](file:///home/ankan/Documents/Projects/AxioDB/source/config/Keys/StatusCode.ts) | Definitive registry for internal file paths, RBAC permission enums, and HTTP/TCP status codes. |
| **Collection & CRUD** | [collection.operation.ts](file:///home/ankan/Documents/Projects/AxioDB/source/Services/Collection/collection.operation.ts)<br>[Create.operation.ts](file:///home/ankan/Documents/Projects/AxioDB/source/Services/CRUD%20Operation/Create.operation.ts)<br>[Reader.operation.ts](file:///home/ankan/Documents/Projects/AxioDB/source/Services/CRUD%20Operation/Reader.operation.ts) | Document CRUD execution, path validation, memory cache coordination, and batch writes. |
| **Indexing** | [Index.service.ts](file:///home/ankan/Documents/Projects/AxioDB/source/Services/Index/Index.service.ts)<br>[IndexCache.service.ts](file:///home/ankan/Documents/Projects/AxioDB/source/Services/Index/IndexCache.service.ts)<br>[ReadIndex.service.ts](file:///home/ankan/Documents/Projects/AxioDB/source/Services/Index/ReadIndex.service.ts) | B-tree/hash secondary index maintenance, dual-write disk caching, and indexed key lookups. |
| **Transactions & WAL** | [Transaction.service.ts](file:///home/ankan/Documents/Projects/AxioDB/source/Services/Transaction/Transaction.service.ts)<br>[WriteAheadLog.service.ts](file:///home/ankan/Documents/Projects/AxioDB/source/Services/Transaction/WriteAheadLog.service.ts)<br>[LockManager.service.ts](file:///home/ankan/Documents/Projects/AxioDB/source/Services/Transaction/LockManager.service.ts) | ACID 2-phase commits, pre/post-image logging in append-only WAL, granular document locking. |
| **In-Memory Cache** | [memory.operation.ts](file:///home/ankan/Documents/Projects/AxioDB/source/Memory/memory.operation.ts) | High-speed cache with randomized TTL (5-15m), LRU evictions, and cache housekeeping routines. |
| **Filesystem Engine** | [FileManager.ts](file:///home/ankan/Documents/Projects/AxioDB/source/engine/Filesystem/FileManager.ts)<br>[FolderManager.ts](file:///home/ankan/Documents/Projects/AxioDB/source/engine/Filesystem/FolderManager.ts) | Atomic disk reads/writes, safe directory creation, and non-blocking IO abstractions. |
| **Vector & Worker Math** | [VectorMath.utils.ts](file:///home/ankan/Documents/Projects/AxioDB/source/utility/VectorMath.utils.ts)<br>[WorkerPool.helper.ts](file:///home/ankan/Documents/Projects/AxioDB/source/Helper/WorkerPool.helper.ts) | Cosine similarity, dot product, L2 distance vector calculations offloaded to worker threads. |
</core_services_map>

<surfaces_map>
### 3.2 Network Surfaces & Integrations

| Surface | Port / Protocol | Key Source Files | Description |
|---|---|---|---|
| **HTTP API** | Port 27018 (HTTP) | [server.ts](file:///home/ankan/Documents/Projects/AxioDB/source/server/config/server.ts)<br>[Router.ts](file:///home/ankan/Documents/Projects/AxioDB/source/server/router/Router.ts)<br>[auth.middleware.ts](file:///home/ankan/Documents/Projects/AxioDB/source/server/middleware/auth.middleware.ts) | Fastify REST API, cookie session auth, user management, and collection CRUD endpoints. |
| **TCP Server** | Port 27019 (TCP) | [server.ts](file:///home/ankan/Documents/Projects/AxioDB/source/tcp/config/server.ts)<br>[CommandHandler.ts](file:///home/ankan/Documents/Projects/AxioDB/source/tcp/handler/CommandHandler.ts)<br>[ConnectionManager.ts](file:///home/ankan/Documents/Projects/AxioDB/source/tcp/connection/ConnectionManager.ts) | High-throughput binary protocol, socket connection pooling, connection rate limiting, TCPAuth. |
| **TCP Client Proxies** | Client SDK | [AxioDBCloud.client.ts](file:///home/ankan/Documents/Projects/AxioDB/source/client/AxioDBCloud.client.ts)<br>[CollectionProxy.ts](file:///home/ankan/Documents/Projects/AxioDB/source/client/CollectionProxy.ts)<br>[TransactionProxy.ts](file:///home/ankan/Documents/Projects/AxioDB/source/client/TransactionProxy.ts) | Remote TCP client libraries mimicking the in-process API over network connections. |
| **MCP Server** | Port 27020 / Stdio | [McpServer.helper.ts](file:///home/ankan/Documents/Projects/AxioDB/source/Helper/mcp/McpServer.helper.ts)<br>[McpTools.helper.ts](file:///home/ankan/Documents/Projects/AxioDB/source/Helper/mcp/McpTools.helper.ts)<br>[McpConfirmation.helper.ts](file:///home/ankan/Documents/Projects/AxioDB/source/Helper/mcp/McpConfirmation.helper.ts) | Model Context Protocol tools allowing AI assistants to query, insert, and update documents. |
| **Documentation** | Port 5173 (HTTP) | [Document/](file:///home/ankan/Documents/Projects/AxioDB/Document/) | Interactive Vite website, live OpenAPI 3.1 schema viewer, and AI context generator (`llms.txt`). |
</surfaces_map>
</zero_grep_directory_map>

---

<execution_lifecycles>
## 4. Core Lifecycles & State Machines

<lifecycle name="dual_write_crud">
### 4.1 Document Dual-Write Lifecycle (CRUD)

```
[ Insert / Update Request ]
             │
             ▼
1. Validate Payload (Must be non-array Object; reject invalid schemas)
             │
             ▼
2. Sanitize Target Path: `PathSanitizer.helper.ts` (Strip dangerous characters)
             │
             ▼
3. Update Memory Cache (`InMemoryCache.set()`) with randomized TTL (5-15 min)
             │
             ▼
4. Persist to Disk (`FileManager.ts` writes JSON file to disk)
             │
             ▼
5. Dual-Write Secondary Indexes (`IndexCache.service.ts` updates RAM + disk index files)
             │
             ▼
6. Return Unified Result via `ResponseHelper`
```
</lifecycle>

<lifecycle name="acid_transaction_wal">
### 4.2 ACID Transaction & Write-Ahead Logging (WAL)

```
[ Begin Transaction ] ──► Initialize Session (`Session.service.ts`)
                                  │
                                  ▼
[ Stage Operation ]   ──► Acquire Locks (`LockManager.service.ts`)
                          Append Pre-Image & Post-Image to WAL (`WriteAheadLog.service.ts`)
                                  │
                                  ▼
[ Commit Requested ]  ──► Write COMMIT record to WAL JSONL
                          Flush Staged Changes to Primary JSON Files
                          Release Locks in `LockManager`
                                  │
                                  ▼
[ Rollback / Crash ]  ──► Replay WAL backward: restore Pre-Image
                          Release Locks and Mark Transaction Aborted
```
</lifecycle>

<lifecycle name="mcp_ai_tool_invocation">
### 4.3 MCP AI Agent Tool Invocation

```
AI Agent requests tool call via MCP (Stdio / Port 27020)
                │
                ▼
1. Authenticate Request & Enforce Tool Permissions (`McpAuth.helper.ts`)
                │
                ▼
2. Is Tool Destructive (Delete Collection / Drop DB)?
   ├── YES ──► Check Confirmation Token (`McpConfirmation.helper.ts`)
   └── NO  ──► Proceed Directly
                │
                ▼
3. Dispatch to Core Service (`Collection`, `Database`, `Aggregation`)
                │
                ▼
4. Format Structured JSON Output & Return to Agent
```
</lifecycle>
</execution_lifecycles>

---

<anti_hallucination_axioms>
## 5. Anti-Hallucination Grounding Rules for Agents

When generating code or debugging AxioDB, AI models must reference these strict axioms:

| Axiom | True Pattern | Forbidden Hallucination |
|---|---|---|
| **Instantiation** | `AxioDB` is a strict singleton (`AxioDB._instance`) | Never instantiate multiple `new AxioDB()` in one process. |
| **Dependencies** | 100% Zero native C++ addons (`better-sqlite3`, `node-gyp`) | Never import SQLite, LevelDB, or native binary bindings. |
| **Typing** | Strict typing; `unknown` + type guards | Never use `any` type casts. |
| **Pathing** | Resolves strictly from `Keys.ts` constants | Never construct ad-hoc file paths like `./data/mydb`. |
| **Caching** | Dual-write cache with randomized 5–15 min TTL | Never disable cache on writes or use static hardcoded TTL. |
| **Ports** | HTTP: `27018`, TCP: `27019`, MCP: `27020`, Docs: `5173` | Never mix or guess port bindings. |
| **Version Sync** | Synced across all 15 project locations | Never change `package.json` version without updating CLI, docs, and LLM text files. |
| **Hot Paths** | Use `Map` / hash lookups for ID matching | Never use `Array.find()` in hot query/index loops. |
</anti_hallucination_axioms>

---

<verification_commands>
## 6. Verification & Test Commands

Run the following verification suites before committing or submitting changes:

```bash
# Compilation (Mandatory after all TypeScript edits)
npm run build

# Run all 14 core integration test suites
npm run node-test (before run this always ask user first,  dont run without asking user)

# Run a single scoped test suite
npm run node-test crud
npm run node-test transaction
npm run node-test mcp-functional

# Linting & Code Style
npm run lint

# Documentation Development Server (Port 5173)
cd Document && npm run dev
```
</verification_commands>
