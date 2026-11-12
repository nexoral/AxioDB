# AxioDB Architecture and Scope

## 1. What is AxioDB?

AxioDB is an embedded NoSQL database for Node.js designed as a pure TypeScript/JavaScript alternative to SQLite, LowDB, NeDB, and raw JSON files.
It provides:
- **Zero Native Dependencies**: No `node-gyp`, no Python build toolchain, no platform-specific C/C++ binaries. Runs cleanly anywhere Node.js runs.
- **Node Requirement**: Minimum Node.js `>= 20.0.0` (Docker container runs on Node 23).
- **TypeScript 6.0 Strict**: Compiles strictly to CommonJS (`dist` / `lib`).
- **File-per-Document Storage**: Each document is persisted as an individual JSON file inside database and collection folders on disk.
- **Dual-Write Indexing**: Secondary indexes exist in RAM (`IndexCache`) and are persisted as append-only registry files on disk.
- **Randomized Cache TTL**: Built-in `InMemoryCache` randomizes TTL between 5 to 15 minutes (`minTTL`/`maxTTL`) to prevent cache stampedes.
- **Worker Threads**: Offloads compute-heavy document scanning, query filtering, and vector similarity computation to worker threads (`WorkerForSearch.engine.ts`, `WorkerForDataLoad.engine.ts`).
- **ACID Transactions**: Staged working directory with atomic commit/rollback mechanisms.
- **Native Vector Search**: Exact k-NN similarity search (Cosine, Dot product, Euclidean) over `number[]` embedding fields — zero native dependencies, Worker Thread accelerated, available across all surfaces (embedded, HTTP 27018, TCP 27019, MCP 27020).

---

## 2. Component Scopes & Surface Boundaries

AxioDB components are strictly partitioned across 5 distinct execution environments:

| Surface | Port | Runtime | Description & Scope Boundaries |
| :--- | :--- | :--- | :--- |
| **Core Embedded** | In-process | Node.js | Direct in-memory/disk access (`new AxioDB(options)`). Single-process singleton. Highest performance, zero network overhead. |
| **HTTP Control Server** | `27018` | Fastify | REST API (`/api/*`). Visiting `http://localhost:27018` shows desktop GUI install instructions. Enabled via `HTTP: true` or `AXIODB_HTTP=true`. |
| **TCP Remote Server** | `27019` | Node `net` | Binary length-prefixed TCP protocol. Used by `AxioDBCloud` client for remote Node.js applications and CLI. Supports connection pooling (`maxPoolSize: 10`) and RBAC authentication. |
| **MCP Server** | `27020` | Streamable HTTP | Native in core (`new AxioDB({ MCP: true })`) and Docker (`AXIODB_MCP=true`). Exposes 46 database management tools to AI agents. |
| **Desktop GUI** | Local OS Window | Electron + React | Native desktop viewer for Linux, macOS, and Windows. Connects to local or remote AxioDB instances over TCP. |
| **CLI Tool** | Terminal | Go Binary | Standalone compiled CLI for 12 platforms. Supports interactive REPL, admin commands, and temporary server spinning (`axiodb serve`). |

---

## 3. Storage Hierarchy

The physical disk directory structure follows this convention:

```
<CustomPath>/
└── <RootName>/                       # Default: "AxioDB"
    ├── config/                       # Internal configuration database (RBAC users, roles)
    │   └── users/                    # System credentials & authentication state
    └── <UserDatabase>/               # User-created databases
        ├── metadata.jsonl            # Append-only collection registry (last line wins)
        └── <CollectionName>/         # Collection directory
            ├── metadata.jsonl        # Collection metadata & schema validation rules
            ├── <doc_id_1>.json       # Individual document files
            ├── <doc_id_2>.json
            └── .indexes/             # Persisted index directories
                └── <field_name>.jsonl # Index registry mapping keys to document IDs
```

---

## 4. Architectural Rules & Invariants

1. **Singleton Pattern**: Only one `new AxioDB()` instance can exist per Node.js process. Calling `new AxioDB()` a second time throws an error. Applications must share the instance.
2. **Append-Only Registries**: All metadata and index files use JSON Lines (`.jsonl`). Updates append new entries; when loading, the last line wins.
3. **Dual-Write Architecture**: When indexes are modified, mutations write synchronously to memory (`IndexCache`) and disk simultaneously.
4. **No Native Addons**: AxioDB must never introduce C++ bindings or native prebuilts. All file system operations use native Node.js `fs` and `worker_threads`.
