# AxioDB — Master Knowledge Base

> **Target Audience:** AxioDB Dev Team, Vector-Less RAG Pipelines, Autonomous AI Agents, and Production Engineers.  
> **Package Version:** `24.34.4` | **License:** MIT | **Runtime:** Node.js `>= 20.0.0`, Bun `>= 1.4.0`, Deno `>= 2.9.6`, Electron.  
> **Official Distribution:** [npm: axiodb](https://www.npmjs.com/package/axiodb) | [GitHub: nexoral/AxioDB](https://github.com/nexoral/AxioDB) | [Docs: axiodb.in](https://axiodb.in)  
> **Purpose:** Single complete source of truth. Contains all architectures, constants, APIs, schemas, protocols, tools, endpoints, troubleshooting playbooks, and design patterns.

---

## Table of Contents
1. [Executive Summary & The Vector-Less Database Paradigm](#1-executive-summary--the-vector-less-database-paradigm)
2. [System Architecture & Runtime Execution Model](#2-system-architecture--runtime-execution-model)
3. [Physical Storage Engine, File Formats & Block Amplification](#3-physical-storage-engine-file-formats--block-amplification)
4. [In-Memory Cache & Dual-Write Indexing Subsystem](#4-in-memory-cache--dual-write-indexing-subsystem)
5. [ACID Transactions, Write-Ahead Logging & Crash Recovery](#5-acid-transactions-write-ahead-logging--crash-recovery)
6. [Core Query Engine & All 19 Operators (Reader, Update, Delete)](#6-core-query-engine--all-19-operators-reader-update-delete)
7. [Aggregation Pipeline (19 Stages & OperatorRegistry)](#7-aggregation-pipeline-19-stages--operatorregistry)
8. [The 45 Model Context Protocol (MCP) AI Tools Reference](#8-the-45-model-context-protocol-mcp-ai-tools-reference)
9. [The 41 HTTP REST API Endpoints Specification](#9-the-41-http-rest-api-endpoints-specification)
10. [The 32 AxioDBCloud TCP Wire Protocol Commands](#10-the-32-axiodbcloud-tcp-wire-protocol-commands)
11. [RBAC Security, Permissions Matrix & Rate Limiting](#11-rbac-security-permissions-matrix--rate-limiting)
12. [Internal Constants, File Keys & System Identifiers](#12-internal-constants-file-keys--system-identifiers)
13. [Go CLI Reference & Interactive REPL Commands](#13-go-cli-reference--interactive-repl-commands)
14. [Vector-Less Database Design Patterns for AI Teams](#14-vector-less-database-design-patterns-for-ai-teams)
15. [Pros, Cons & Strategic Decision Matrix](#15-pros-cons--strategic-decision-matrix)
16. [Complete Troubleshooting, Errors & Recovery Playbook](#16-complete-troubleshooting-errors--recovery-playbook)
17. [Exhaustive Frequently Asked Questions (FAQ)](#17-exhaustive-frequently-asked-questions-faq)

---

## 1. Executive Summary & The Vector-Less Database Paradigm

### 1.1 Zero-Native Philosophy
AxioDB is an embedded NoSQL document database written entirely in strict TypeScript (compiling to CommonJS) with **zero native C/C++ dependencies**:
- **No `node-gyp` or C toolchains:** Never requires `make`, `gcc`, `python`, or `build-essential`. Installs cleanly on minimal Linux containers, Alpine musl environments, and locked-down CI/CD runners.
- **No `electron-rebuild`:** Never compiles `.node` shared libraries. Updating Electron versions or shipping across Windows/macOS/Linux never breaks binary ABIs.
- **In-process embedded execution:** Runs directly inside the host process memory space. No separate database server daemon (`mongod`, `postgres`, `mysqld`) to install or configure.

### 1.2 The Vector-Less Database Architecture
In AI agent and RAG systems, traditional vector databases rely on high-dimensional floating-point embeddings (cosine/dot-product similarity). While useful for fuzzy semantic matching, vector systems introduce:
1. **Non-deterministic hallucinations:** Inaccurate semantic drift.
2. **Heavy computational overhead:** Massive RAM footprint and GPU/SIMD requirements.
3. **50–200ms latency:** Embedding model inference bottlenecks every query.

AxioDB provides the foundational storage for **Vector-Less RAG & Agent State**:
- **Deterministic Multi-Key Indexing:** Sub-millisecond (<1ms) exact attribute and category lookups.
- **Taxonomy & Inverted Token Queries:** Array-based keyword indexing using `$in`, `$all`, and `$elemMatch`.
- **Graph Traversal via `$lookup`:** Single-collection and cross-collection relational joins without an external graph database.
- **ACID Transaction Checkpoints:** Savepoints and rollbacks for speculative agent reasoning trees.
- **Native MCP Server (Port 27020):** 45 built-in tools allowing LLMs to directly inspect, query, and mutate structured state.

---

## 2. System Architecture & Runtime Execution Model

### 2.1 Process Singleton Constraint
AxioDB enforces a **strict singleton pattern** per operating system process.
- Calling `new AxioDB()` a second time in the same process throws:
  ```
  Error: Only one instance of AxioDB is allowed.
  ```
- **Pattern:** Initialize AxioDB once in a central module (e.g. `db.ts` or Electron's `main.js`) and export the instance across the application.

### 2.2 Threading Model & Worker Threads
- **Core CRUD & In-Memory Operations:** Run asynchronously on Node's main event loop using non-blocking asynchronous I/O.
- **Worker Threads:** AxioDB offloads CPU-intensive aggregation stages, large JSON serialization pipelines, and parallel batch processing to Node.js `worker_threads`.
- **Libuv I/O Pool:** Disk writes utilize the internal libuv threadpool. Under concurrent disk I/O, tune:
  ```bash
  export UV_THREADPOOL_SIZE=16  # Recommended: max(4, min(64, 4 * CPU_CORES))
  ```

### 2.3 Constructor Specification
```typescript
new AxioDB(options?: {
  RootName?: string;      // Storage folder name (default: "AxioDB")
  CustomPath?: string;    // Parent directory (default: process.cwd())
  GUI?: boolean;          // Enable Web Dashboard on port 27018 (default: false)
  HTTP?: boolean;         // Enable REST API on port 27018 (default: true if GUI: true)
  TCP?: boolean;          // Enable TCP Server on port 27019 (default: false)
  TCPAuth?: boolean;      // Require authentication on TCP (default: false)
  AdminPassword?: string; // Seed password for 'admin' (skips forced change)
  TLS?: boolean;          // Encrypt TCP with TLS (default: false)
  TLSCertPath?: string;   // Path to PEM cert file (required if TLS: true)
  TLSKeyPath?: string;    // Path to PEM key file (required if TLS: true)
  Cache?: boolean;        // Enable in-memory caching (default: true)
  minTTL?: number;        // Min cache TTL in minutes (default: 5)
  maxTTL?: number;        // Max cache TTL in minutes (default: 15)
  cacheClearUp?: number;  // Background sweep interval in seconds (default: 86400)
  MCP?: boolean;          // Enable native AI Agent MCP Server on port 27020 (default: false)
})
```

---

## 3. Physical Storage Engine, File Formats & Block Amplification

### 3.1 Physical On-Disk Directory Tree
```
{CustomPath}/{RootName}/
├── config/                                 # Reserved System Database (RBAC & Auth)
│   ├── collection.meta.jsonl               # Collection registry
│   └── users/                              # User credentials and role documents
│       └── {documentId}.axiodb
└── {DatabaseName}/
    ├── collection.meta.jsonl               # Append-only collection registry
    └── {CollectionName}/
        ├── {documentId}.axiodb             # Document file (Pure JSON)
        ├── indexes/
        │   ├── index.meta.jsonl            # Index registry
        │   └── {fieldName}.jsonl           # Dual-write disk index file
        └── .transactions/
            ├── txn-meta.jsonl              # Active transaction status registry
            └── {transactionId}.wal.jsonl   # Write-Ahead Log per transaction
```

### 3.2 Physical File Specifications
1. **Document Files (`{documentId}.axiodb`):**
   - Format: Pure formatted JSON.
   - Filename: Exactly 16-character uppercase alphanumeric string (e.g. `84UK9ACMYTBM792F.axiodb`).
   - O(1) Lookups: Path is computed mathematically via string concatenation (`path.join(dir, id + '.axiodb')`). Zero B-tree traversal needed for point lookups.
2. **Metadata Registries (`*.meta.jsonl`):**
   - Format: Append-only JSON Lines.
   - Mutating a collection or index appends one line to EOF (`O(1)` append).
   - On startup, registries are read sequentially; the **last line wins** for any given identifier.
   - When all entries are dropped, the file is safely truncated to 0 bytes.
3. **Write-Ahead Logs (`*.wal.jsonl`):**
   - Isolated inside `.transactions/` with the `.wal.jsonl` suffix to distinguish logs from metadata registries during crash recovery.

### 3.3 The 4 KB Block Size Storage Amplification Economics
Because each document is an individual file, the host operating system allocates disk space in discrete cluster blocks (typically **4,096 bytes** on ext4, APFS, and NTFS):
- **128-byte document:** Occupies 4,096 bytes on disk (**31× space amplification**).
- **1,024-byte document:** Occupies 4,096 bytes on disk (**4× space amplification**).
- **4,096-byte document:** Occupies 4,096 bytes on disk (**1× amplification / 0% waste**).

**Engineering Recommendation:**
- **Target Size:** Documents of **1 KB to 10 KB** achieve optimal filesystem density.
- **Budgeting Rule:** Budget roughly 4 KB of disk space per document. For 100,000 documents, budget ~400 MB of storage.
- **Sweet Spot:** Collections of **10,000 to 500,000 documents**.

---

## 4. In-Memory Cache & Dual-Write Indexing Subsystem

### 4.1 InMemoryCache Lifecycle & Anti-Stampede Jitter
AxioDB includes an integrated, per-instance memory cache (`InMemoryCache`):
- **Read Path:** Incoming `.query()` executions check memory cache first. Hits resolve in **< 1ms (0.38ms – 0.6ms)**.
- **Write Path:** Any `insert`, `update`, `delete`, or transaction commit automatically invalidates cached results for that collection.
- **Randomized TTL Jitter (5–15 min):** To prevent "Cache Stampede" (where thousands of keys expire simultaneously causing a sudden spike in disk syscalls), each cached query receives a randomized TTL between `minTTL` and `maxTTL`:
  $$\text{TTL}_{\text{ms}} = \lfloor \text{random}() \times (\text{maxTTL} - \text{minTTL} + 1) + \text{minTTL} \rfloor \times 60 \times 1000$$
- **Disabling Cache:** Pass `{ Cache: false }` in constructor options to force every query to hit disk directly.

### 4.2 Dual-Write Indexing (`IndexCache`)
Indexes created via `collection.newIndex('field')` maintain two synchronized representations:
1. **Memory Representation:** In-memory hash map for instant $O(1)$ lookups.
2. **Disk Representation:** Append-only JSONL file in `indexes/{field}.jsonl`.

- **Automatic `documentId` Index:** The primary key `documentId` is always indexed automatically.
- **Targeted Updates:** When updating a document, AxioDB inspects which fields were modified; only the index files corresponding to changed fields are written.
- **Index Hints:** Use `.hint('fieldName')` to force the query engine to use a specific index rather than falling back to an unindexed collection scan:
  ```javascript
  const users = await collection.query({ role: 'admin' }).hint('role').exec();
  ```

---

## 5. ACID Transactions, Write-Ahead Logging & Crash Recovery

### 5.1 Transaction Scope & Guarantees
- **Atomicity:** All operations in a transaction succeed together on `.commit()`, or all revert on `.rollback()`.
- **Consistency:** Write-Ahead Logging prevents corrupt or half-written JSON files.
- **Isolation:** File locks prevent overlapping concurrent updates to the same documents during an active transaction.
- **Durability:** Committed transactions are flushed to disk before the commit call resolves.
- **Scope Boundary:** Transactions are **scoped to a single collection**. Cross-collection transactions are not supported.

### 5.2 Complete Transaction API
```javascript
const tx = collection.beginTransaction();
try {
  tx.insert({ title: 'Draft Post', status: 'draft' });
  tx.savepoint('step_1_done');
  tx.update({ authorId: 'USR_1' }, { lastPostAt: new Date() });
  
  if (validationFailed) {
    tx.rollbackTo('step_1_done');
    tx.releaseSavepoint('step_1_done');
  }
  
  const result = await tx.commit();
  console.log(result.data.documentIds); // Array of newly inserted IDs
} catch (error) {
  await tx.rollback();
}
```

### 5.3 Session API with Automatic Retries
```javascript
const session = collection.startSession({
  defaultTimeout: 60000,
  retryWrites: true,
  maxRetries: 3,
});

await session.withTransaction(async (tx) => {
  tx.insert({ account: 'A', balance: 500 });
  tx.update({ account: 'B' }, { balance: 1500 });
});
```
`withTransaction` inspects errors and automatically retries with exponential backoff if the error is transient (`timeout`, `lock`, `deadlock`, `conflict`, `busy`, `temporary`, `EBUSY`, or `EAGAIN`).

### 5.4 Crash Recovery Mechanism
When a collection is opened, AxioDB runs `Transaction.recoverTransactions()` automatically:
1. Reads `txn-meta.jsonl` in `.transactions/`.
2. Identifies any transactions marked `COMMITTED` whose writes were interrupted mid-flight; re-applies their writes from `{transactionId}.wal.jsonl`.
3. Uncommitted or abandoned transaction files are unlinked, and partially written temporary files are cleaned up.

---

## 6. Core Query Engine & All 19 Operators (Reader, Update, Delete)

### 6.1 Database & Collection Operations
```typescript
// Database level
const myDB = await db.createDB("ProductionDB");
const exists = await db.isDatabaseExists("ProductionDB");
const info = await db.getInstanceInfo();
await db.deleteDatabase("OldDB");

// Collection level
const users = await myDB.createCollection("users");
const collExists = await myDB.isCollectionExists("users");
const collInfo = await myDB.getCollectionInfo();
const count = await users.totalDocuments();
await myDB.deleteCollection("temp_logs");
```

### 6.2 All 19 Supported Query Operators
AxioDB supports 19 powerful filtering operators passed into `.query(filter)`:

| Operator | Type | Purpose | Example |
|---|---|---|---|
| `$eq` | Comparison | Exact equality | `{ status: { $eq: "active" } }` |
| `$ne` | Comparison | Not equal | `{ role: { $ne: "banned" } }` |
| `$gt` | Comparison | Greater than | `{ age: { $gt: 21 } }` |
| `$gte` | Comparison | Greater than or equal | `{ price: { $gte: 99.99 } }` |
| `$lt` | Comparison | Less than | `{ stock: { $lt: 5 } }` |
| `$lte` | Comparison | Less than or equal | `{ score: { $lte: 100 } }` |
| `$in` | Comparison | Target value matches any in array | `{ tag: { $in: ["dev", "qa"] } }` |
| `$nin` | Comparison | Target value not in array | `{ status: { $nin: ["archived"] } }` |
| `$exists` | Element | Checks if field exists | `{ verifiedAt: { $exists: true } }` |
| `$type` | Element | Matches JavaScript data type | `{ score: { $type: "number" } }` |
| `$regex` | Evaluation | Regular expression matching | `{ email: { $regex: "@gmail\\.com$" } }` |
| `$options`| Evaluation | Regex flags (`i`, `m`, `s`) | `{ name: { $regex: "^alex", $options: "i" } }` |
| `$not` | Logical | Negates a nested query condition | `{ age: { $not: { $lt: 18 } } }` |
| `$size` | Array | Matches array exact length | `{ tags: { $size: 3 } }` |
| `$all` | Array | Array contains all listed elements | `{ tags: { $all: ["admin", "staff"] } }` |
| `$elemMatch`| Array | Array element matches sub-object | `{ items: { $elemMatch: { qty: { $gt: 10 } } } }` |
| `$or` | Logical | Logical OR of multiple criteria | `{ $or: [{ role: "admin" }, { vip: true }] }` |
| `$and` | Logical | Logical AND of multiple criteria | `{ $and: [{ active: true }, { age: { $gte: 18 } }] }` |
| `$nor` | Logical | Fails if any criteria match | `{ $nor: [{ locked: true }, { banned: true }] }` |

### 6.3 Reader Chaining API
```javascript
const results = await users.query({ status: 'active' })
  .hint('status')                     // Force use of index
  .Sort({ createdAt: -1 })            // 1 = ascending, -1 = descending
  .Skip(20)                           // Offset pagination
  .Limit(10)                          // Limit count
  .setProject({ name: 1, email: 1 })  // 1 = include, 0 = exclude
  .setCount(true)                     // Include total matching count
  .exec();

// findOne chaining:
const singleDoc = await users.query({ email: 'alice@example.com' }).findOne(true).exec();
```

### 6.4 Batch Point Retrieval (`findByIds`)
```javascript
const docs = await users.findByIds(['DOC_ID_1', 'DOC_ID_2', 'DOC_ID_3']);
```

### 6.5 CRITICAL WARNING: Update Mechanics Are Flat Shallow Merges
> [!CAUTION]
> **AxioDB DOES NOT support MongoDB update modifiers like `$set`, `$inc`, `$push`, or `$pull`.**
> Updates are implemented as a **flat shallow object merge**:
> ```javascript
> newDocument = { ...existingDocument, ...updateData, updatedAt: new Date() };
> ```
> If you execute:
> ```javascript
> await users.update({ id: 'USR_1' }).UpdateOne({ $inc: { views: 1 } });
> ```
> AxioDB will **NOT** increment `views`. It will literally write a field named `"$inc": { "views": 1 }` onto the document!

**Correct Update Patterns:**
```javascript
// 1. Partial property overwrite (shallow merge)
await users.update({ id: 'USR_1' }).UpdateOne({ status: 'active', tier: 'gold' });

// 2. Arithmetic or array updates (Read-Modify-Write pattern)
const doc = (await users.query({ id: 'USR_1' }).findOne(true).exec()).data.documents[0];
await users.update({ id: 'USR_1' }).UpdateOne({
  views: (doc.views || 0) + 1,
  tags: [...(doc.tags || []), 'featured']
});
```

### 6.6 Delete Operations
```javascript
await users.delete({ id: 'USR_1' }).deleteOne();
await users.delete({ status: 'archived' }).deleteMany();
```

---

## 7. Aggregation Pipeline (19 Stages & OperatorRegistry)

### 7.1 The 19 Aggregation Stages
```javascript
const summary = await orders.aggregate([
  { $match: { status: 'completed' } },
  { $lookup: {
      from: 'Customers',
      localField: 'customerId',
      foreignField: 'documentId',
      as: 'customerDetails'
  }},
  { $unwind: '$customerDetails' },
  { $group: {
      _id: '$customerDetails.tier',
      totalRevenue: { $sum: '$total' },
      avgOrderSize: { $avg: '$total' }
  }},
  { $sort: { totalRevenue: -1 } },
  { $limit: 5 }
]).exec();
```

Full Stage List:
1. `$match`: Filter stream using any query operator (utilizes indexes automatically).
2. `$group`: Groups by `_id`. Accumulators: `$sum`, `$avg`, `$min`, `$max`, `$first`, `$last`, `$push`, `$addToSet`, `$stdDevPop`, `$stdDevSamp`.
3. `$sort`: Multi-field ordering (`{ field: 1 | -1 }`).
4. `$project`: Restructure fields and evaluate expressions.
5. `$limit`: Restrict document volume.
6. `$skip`: Offset streaming documents.
7. `$unwind`: Flatten an array field into discrete documents.
8. `$addFields` / `$set`: Compute new attributes using expressions.
9. `$unset`: Strip fields from documents.
10. `$lookup`: Cross-collection joins (equality syntax and pipeline join syntax).
11. `$facet`: Run multi-pipeline analytics in parallel.
12. `$bucket`: Categorize values into discrete numeric buckets.
13. `$bucketAuto`: Dynamically categorize values into evenly distributed buckets.
14. `$count`: Emit count of documents passing through stage.
15. `$sortByCount`: Convenient grouping by expression and sorting by frequency descending.
16. `$sample`: Randomly sample $N$ documents.
17. `$replaceRoot`: Replace top-level document with nested sub-document.
18. `$replaceWith`: Alias for `$replaceRoot`.
19. Expression Evaluator: Supports 80+ expressions (arithmetic, string, date, array, logical).

### 7.2 Custom Operator Registration (`OperatorRegistry`)
```javascript
import { OperatorRegistry } from 'axiodb';

OperatorRegistry.registerAccumulator('$customJaccard', (collection, expr) => {
  const setA = new Set(expr.targetTokens);
  return collection.map(doc => {
    const setB = new Set(doc[expr.field] || []);
    const intersection = new Set([...setA].filter(x => setB.has(x)));
    const union = new Set([...setA, ...setB]);
    return union.size === 0 ? 0 : intersection.size / union.size;
  });
});
```

---

## 8. The 45 Model Context Protocol (MCP) AI Tools Reference

The native MCP server runs on **port 27020** at `/mcp` (Streamable HTTP). All tools except `axiodb_login` require an active `sessionId`.

| # | Tool Name | Scope | Description |
|---|---|---|---|
| 1 | `axiodb_login` | Auth | Authenticate with username and password; returns `sessionId`. |
| 2 | `axiodb_logout` | Auth | Terminate the current authenticated session. |
| 3 | `axiodb_whoami` | Auth | Retrieve information about the currently authenticated session user. |
| 4 | `axiodb_change_own_password` | Auth | Change the password for the active authenticated user account. |
| 5 | `axiodb_list_databases` | Database | List all user databases managed by this AxioDB instance. |
| 6 | `axiodb_create_database` | Database | Create a new database directory and initialize its metadata registry. |
| 7 | `axiodb_delete_database` | Database | Permanently delete a database and all its collections. |
| 8 | `axiodb_database_exists` | Database | Check if a specified database exists. |
| 9 | `axiodb_get_instance_info` | Database | Get runtime information, version, uptime, and memory usage. |
| 10 | `axiodb_list_collections` | Collection | List all collections inside a specified database. |
| 11 | `axiodb_get_collection_info` | Collection | Get metadata, index counts, and storage stats for a collection. |
| 12 | `axiodb_collection_exists` | Collection | Check if a collection exists inside a database. |
| 13 | `axiodb_create_collection` | Collection | Create a new collection directory and register its metadata. |
| 14 | `axiodb_delete_collection` | Collection | Permanently drop a collection and its document files. |
| 15 | `axiodb_insert_document` | Document | Insert a single JSON document (returns generated `documentId`). |
| 16 | `axiodb_insert_many_documents` | Document | Batch insert an array of JSON documents. |
| 17 | `axiodb_query_documents` | Document | Query documents with filter operators, sorting, limit, and projections. |
| 18 | `axiodb_update_document` | Document | Update documents by query using flat shallow merge. |
| 19 | `axiodb_delete_document` | Document | Delete documents matching a query filter. |
| 20 | `axiodb_total_documents` | Document | Get exact count of documents in a collection. |
| 21 | `axiodb_find_documents_by_ids`| Document | Retrieve multiple documents by their 16-character IDs. |
| 22 | `axiodb_aggregate` | Document | Execute a 19-stage aggregation pipeline. |
| 23 | `axiodb_create_index` | Index | Build dual-write memory/disk index on one or more fields. |
| 24 | `axiodb_drop_index` | Index | Drop an existing index from a collection. |
| 25 | `axiodb_list_indexes` | Index | List all configured indexes on a collection. |
| 26 | `axiodb_begin_transaction` | Transaction | Open a new ACID transaction session on a collection. |
| 27 | `axiodb_transaction_insert` | Transaction | Stage an insert operation inside an active transaction. |
| 28 | `axiodb_transaction_update` | Transaction | Stage a flat merge update operation inside an active transaction. |
| 29 | `axiodb_transaction_delete` | Transaction | Stage a delete operation inside an active transaction. |
| 30 | `axiodb_transaction_savepoint` | Transaction | Create a named rollback checkpoint in an active transaction. |
| 31 | `axiodb_transaction_rollback_to_savepoint` | Transaction | Rollback operations to a named savepoint. |
| 32 | `axiodb_transaction_release_savepoint` | Transaction | Release a previously created savepoint. |
| 33 | `axiodb_commit_transaction`| Transaction | Commit all staged transaction writes to disk. |
| 34 | `axiodb_rollback_transaction`| Transaction | Abort transaction and discard all staged writes. |
| 35 | `axiodb_health` | System | Healthcheck endpoint returning server operational status. |
| 36 | `axiodb_get_dashboard_stats` | System | Get system performance, collection sizes, and memory stats. |
| 37 | `axiodb_list_users` | Security | List all user accounts in the reserved RBAC database. |
| 38 | `axiodb_create_user` | Security | Create a new user with an assigned role. |
| 39 | `axiodb_delete_user` | Security | Delete a user account from the RBAC store. |
| 40 | `axiodb_update_user_role` | Security | Assign a new RBAC role to an existing user. |
| 41 | `axiodb_reset_user_password` | Security | Reset a user's password (forces change on next login). |
| 42 | `axiodb_list_roles` | Security | List all predefined and custom RBAC roles. |
| 43 | `axiodb_create_role` | Security | Create a new custom role with specific permissions. |
| 44 | `axiodb_delete_role` | Security | Delete a custom role (must have no assigned users). |
| 45 | `axiodb_list_permissions` | Security | List the complete system permission catalogue. |

---

## 9. The 41 HTTP REST API Endpoints Specification

Fastify server running on **port 27018**:

### System & Health (5 endpoints)
- `GET /api/info`: Instance version, uptime, node environment.
- `GET /api/health`: Health status and subsystem readiness.
- `GET /api/system`: CPU, RAM, and disk utilization statistics.
- `GET /api/routes`: Manifest of all active HTTP endpoints.
- `GET /api/dashboard-stats`: Aggregated database, collection, and storage counts.

### Authentication & RBAC (13 endpoints)
- `POST /api/auth/login`: Authenticate credentials; sets `axiodb_session` cookie.
- `POST /api/auth/logout`: Revoke active session token.
- `GET /api/auth/me`: Current session identity and permissions.
- `PATCH /api/auth/change-password`: Update own password.
- `GET /api/auth/users`: List users in `config` database.
- `POST /api/auth/users`: Create user account.
- `PATCH /api/auth/users/:username/role`: Update user's assigned role.
- `PATCH /api/auth/users/:username/reset-password`: Reset target user's password.
- `DELETE /api/auth/users/:username`: Delete user account.
- `GET /api/auth/roles`: List all system and custom roles.
- `POST /api/auth/roles`: Create new custom role.
- `DELETE /api/auth/roles/:roleName`: Delete custom role.
- `GET /api/auth/roles/permissions`: Full catalogue of 23 permission keys.

### Database Operations (5 endpoints)
- `GET /api/db/databases`: List all databases.
- `POST /api/db/create-database`: Create database by name.
- `DELETE /api/db/delete-database`: Delete database by name.
- `GET /api/db/export-database/`: Export database as `.tar.gz` stream.
- `POST /api/db/import-database/`: Restore database from uploaded `.tar.gz`.

### Collection Operations (3 endpoints)
- `GET /api/collection/all/`: List collections in a database.
- `POST /api/collection/create-collection`: Create new collection.
- `DELETE /api/collection/delete-collection/`: Delete collection.

### Index Operations (3 endpoints)
- `GET /api/index/list`: List indexes on a collection.
- `POST /api/index/create`: Create new index on field(s).
- `DELETE /api/index/delete`: Drop index by field name.

### Document Operations (12 endpoints)
- `GET /api/operation/total/`: Total document count in collection.
- `GET /api/operation/all/`: Paginated document scan.
- `POST /api/operation/all/by-query/`: Paginated query with filter body.
- `GET /api/operation/all/by-id/`: Point lookup by single `documentId`.
- `POST /api/operation/all/by-ids/`: Batch lookup by array of IDs.
- `POST /api/operation/create/`: Insert single document.
- `POST /api/operation/create-many/`: Batch insert documents.
- `PUT /api/operation/update/by-id/`: Update document by ID (flat merge).
- `PUT /api/operation/update/by-query/`: Update documents by query filter.
- `DELETE /api/operation/delete/by-id/`: Delete document by ID.
- `DELETE /api/operation/delete/by-query/`: Delete documents matching query.
- `POST /api/operation/aggregate/`: Execute aggregation pipeline.

---

## 10. The 32 AxioDBCloud TCP Wire Protocol Commands

TCP binary-framed server running on **port 27019**:

1. `PING`: Heartbeat check to verify connection liveliness.
2. `HEALTH`: Retrieve service health status over TCP.
3. `DISCONNECT`: Gracefully terminate client connection socket.
4. `AUTHENTICATE`: Authenticate connection credentials when `TCPAuth: true`.
5. `CREATE_DB`: Create a new database.
6. `DELETE_DB`: Delete a database.
7. `DB_EXISTS`: Verify existence of database.
8. `GET_INSTANCE_INFO`: Retrieve runtime instance metadata.
9. `CREATE_COLLECTION`: Create a new collection.
10. `DELETE_COLLECTION`: Delete a collection.
11. `COLLECTION_EXISTS`: Verify existence of collection.
12. `GET_COLLECTION_INFO`: Retrieve collection metrics.
13. `INSERT_DOCUMENT`: Insert a single JSON document.
14. `INSERT_MANY_DOCUMENTS`: Insert an array of documents.
15. `QUERY_DOCUMENTS`: Query documents with filter operators.
16. `QUERY_BY_ID`: Point lookup by 16-character ID.
17. `FIND_BY_IDS`: Batch point lookup by array of IDs.
18. `UPDATE_DOCUMENT_BY_ID`: Update document by ID using flat merge.
19. `UPDATE_DOCUMENTS_BY_QUERY`: Update documents by query filter.
20. `DELETE_DOCUMENT_BY_ID`: Delete document by ID.
21. `DELETE_DOCUMENTS_BY_QUERY`: Delete documents matching query.
22. `AGGREGATE`: Run an aggregation pipeline.
23. `TOTAL_DOCUMENTS`: Get document count.
24. `CREATE_INDEX`: Create index on collection field.
25. `DROP_INDEX`: Drop index from collection.
26. `LIST_INDEXES`: List indexes on collection.
27. `BEGIN_TRANSACTION`: Start a pinned transaction session.
28. `COMMIT_TRANSACTION`: Commit active transaction writes.
29. `ROLLBACK_TRANSACTION`: Rollback active transaction writes.
30. `SAVEPOINT`: Mark transaction savepoint.
31. `ROLLBACK_TO_SAVEPOINT`: Rollback transaction to savepoint.
32. `RELEASE_SAVEPOINT`: Release savepoint marker.

---

## 11. RBAC Security, Permissions Matrix & Rate Limiting

### 11.1 The 23 Permission Keys
- **Database (5):** `db:view`, `db:create`, `db:delete`, `db:export`, `db:import`.
- **Collection (3):** `collection:view`, `collection:create`, `collection:delete`.
- **Document (6):** `document:view`, `document:query`, `document:create`, `document:update`, `document:delete`, `document:aggregate`.
- **Dashboard (1):** `dashboard:view`.
- **User Management (5):** `user:view`, `user:create`, `user:update-role`, `user:reset-password`, `user:delete`.
- **Role Management (3):** `role:view`, `role:create`, `role:delete`.
- **Index Management (3):** `index:view`, `index:create`, `index:delete`.

### 11.2 Predefined System Roles
1. **Super Admin:** Has all 23 permissions. Cannot be deleted or stripped of permissions.
2. **Admin:** Has all 17 Data Plane permissions (`db:*`, `collection:*`, `document:*`, `index:*`, `dashboard:view`). Cannot manage users or roles.
3. **View:** Read-only permissions (`db:view`, `collection:view`, `document:view`, `document:query`, `document:aggregate`, `dashboard:view`, `index:view`).

### 11.3 Rate Limiting & Protection Thresholds
- **Login Lockout:** 5 failed logins within 15 minutes $\rightarrow$ **15-minute IP lockout** (`429 Too Many Requests`).
- **Concurrent TCP Connections:** Max 1,000 global; max 100 per client IP.
- **TCP Churn Guard:** 300 connection attempts per 10s per IP $\rightarrow$ 30s cooldown.
- **Session Memory:** Active sessions live exclusively in server RAM (`SESSION_TTL_MS = 24h`). Process restart logs out all sessions.

---

## 12. Internal Constants, File Keys & System Identifiers

Defined in `source/config/Keys/`:
- `General.DBMS_Name`: `"AxioDB"`
- `General.DBMS_File_EXT`: `".axiodb"` (Document files)
- `General.Index_File_EXT`: `".jsonl"` (Index entries)
- `General.Index_Meta_File`: `"index.meta.jsonl"` (Index registry)
- `General.Collection_Meta_File`: `"collection.meta.jsonl"` (Collection registry)
- `General.Transaction_Registry_File`: `"txn-meta.jsonl"` (Transaction registry)
- `General.WAL_File_EXT`: `".wal.jsonl"` (Write-Ahead Log)
- `General.DocumentId_Length`: `16` (Length of alphanumeric IDs)
- `RESERVED_DB_NAME`: `"config"` (Internal system database)
- `CONFIG_USERS_COLLECTION`: `"users"`
- `CONFIG_ROLES_COLLECTION`: `"roles"`
- `CONFIG_PERMISSIONS_COLLECTION`: `"permissions"`
- `DEFAULT_ADMIN_USERNAME`: `"admin"`
- `DEFAULT_ADMIN_PASSWORD`: `"admin"`
- `DEFAULT_MCP_PORT`: `27020`
- `MCP_PROTOCOL_VERSION`: `"2024-11-05"`

---

## 13. Go CLI Reference & Interactive REPL Commands

AxioDB provides a standalone Go CLI binary for Linux, macOS, and Windows.

### 13.1 CLI Commands
- `axiodb connect <host:port>`: Connect to an AxioDBCloud TCP server.
- `axiodb serve`: Boot an isolated temporary local instance for testing.
- `axiodb export <dbname>`: Export database via HTTP API to local tarball.
- `axiodb import <tarball>`: Import database archive into remote instance.

### 13.2 Interactive REPL Shell Commands
When connected via `axiodb connect`:
```bash
> show dbs
> use ProductionDB
> show collections
> db.users.find({ role: "admin" })
> db.users.insert({ name: "Charlie", age: 28 })
> db.users.count()
```

---

## 14. Vector-Less Database Design Patterns for AI Teams

### 14.1 Semantic Tagging & Facet Hierarchy
Store dense categorization tags instead of opaque float vectors:
```typescript
interface MemoryNode {
  documentId?: string;        // 16-char indexed ID
  nodeType: "fact" | "rule" | "dialogue" | "task";
  tokens: string[];           // Tokenized stems for exact/partial keyword search
  facets: {
    domain: string;           // e.g. "billing"
    confidence: number;       // e.g. 0.95
    tags: string[];           // e.g. ["invoice", "stripe", "refund"]
  };
  payload: Record<string, unknown>;
  createdAt: string;
}
```

### 14.2 Hybrid Faceted Query Pattern
```javascript
const memories = await memoryColl.query({
  nodeType: "rule",
  "facets.domain": "billing",
  "facets.tags": { $in: ["stripe", "refund"] },
  tokens: { $all: ["invoice", "chargeback"] }
})
.hint("nodeType")
.Limit(10)
.exec();
```

### 14.3 Agent Conversation Tree with Speculative Savepoints
```javascript
const agentTx = sessionColl.beginTransaction();
try {
  agentTx.insert({ step: 1, action: "Parsed user input" });
  agentTx.savepoint("step_1_ok");

  // Speculative sub-agent execution
  agentTx.insert({ step: 2, action: "Executing tool call" });

  if (toolFailed) {
    agentTx.rollbackTo("step_1_ok");
    agentTx.insert({ step: 2, action: "Fallback path selected" });
  }

  await agentTx.commit();
} catch (err) {
  await agentTx.rollback();
}
```

---

## 15. Pros, Cons & Strategic Decision Matrix

| Dimension | Ideal for AxioDB | Send to PostgreSQL / MongoDB |
|---|---|---|
| **Collection Volume** | 10,000 – 500,000 documents | 10,000,000+ records |
| **Document Size** | 1 KB – 10 KB | Tens of bytes or >100 MB blobs |
| **Deployment Boundary** | Zero C++ compilers, Electron, CLI, local-first | Multi-node cluster with dedicated DBA |
| **Access Pattern** | ID point lookups, indexed filters, agent state | Heavy analytical OLAP, complex multi-table JOINs |
| **Schema Evolution** | Dynamic, unconstrained JSON schemas | Strictly typed relational schemas |

---

## 16. Complete Troubleshooting, Errors & Recovery Playbook

### 1. `Error: Only one instance of AxioDB is allowed.`
* **Root Cause:** Calling `new AxioDB()` twice in the same process.
* **Fix:** Export a shared singleton instance from a single file.

### 2. `Error: Port 27018 / 27019 / 27020 already in use`
* **Root Cause:** Previous instance did not exit or port is claimed.
* **Fix:** Terminate occupying process:
  ```bash
  kill -9 $(lsof -t -i:27018 -i:27019 -i:27020)
  ```

### 3. `Error: 403 Must change password before TCP/GUI use`
* **Root Cause:** First-boot security requirement for default admin account.
* **Fix:** Log in at `http://localhost:27018` to complete change, or pass `AdminPassword: "my_password"` on first start.

### 4. `Error: 403 This is a reserved system database`
* **Root Cause:** Attempting to create or mutate `config`.
* **Fix:** Rename target database (e.g. `AppDB`, `UserData`).

### 5. `Error: 429 Too many failed login attempts`
* **Root Cause:** 5 failed logins within 15 minutes.
* **Fix:** Wait 15 minutes, or restart the process (lockout is in-memory only).

### 6. `Error: EMFILE / ENFILE: too many open files`
* **Root Cause:** Scanning thousands of files exceeds OS file descriptor limit.
* **Fix:** Raise limit via `ulimit -n 65536`.

### 7. Inadvertent `$inc` or `$set` Fields on Documents
* **Root Cause:** Passing MongoDB operator objects into `UpdateOne()`.
* **Fix:** Read document, perform calculation in JS, and write via shallow merge.

### 8. Electron ASAR Read-Only Filesystem Errors
* **Root Cause:** Setting `CustomPath` inside read-only `app.asar`.
* **Fix:** Set `CustomPath: app.getPath('userData')`.

---

## 17. Exhaustive Frequently Asked Questions (FAQ)

**Q: Is AxioDB a drop-in replacement for MongoDB?**  
A: No. AxioDB is an embedded engine running in-process inside your application. It uses similar object query syntax but requires zero external server daemon.

**Q: Can I run AxioDB in a web browser?**  
A: No. AxioDB requires access to a physical filesystem via Node.js standard libraries (`fs`, `path`, `os`, `crypto`). It runs in Node.js, Bun, Deno, and Electron main processes.

**Q: How do I backup an AxioDB database?**  
A: Backup the `{CustomPath}/{RootName}` folder using standard zip/tar tools while idle, or call the HTTP endpoint `GET /api/db/export-database/?dbName=X` to stream a `.tar.gz`.

**Q: Are transactions durable across sudden power cuts?**  
A: Yes. All transactional writes are logged to a `.wal.jsonl` file before disk commits occur. `Transaction.recoverTransactions()` automatically replays or reverts interrupted writes on startup.

**Q: Does AxioDB support TypeScript?**  
A: Yes. AxioDB is written in 100% strict TypeScript and ships built-in `.d.ts` definitions.

**Q: How does AxioDB achieve sub-millisecond read latency?**  
A: Through direct $O(1)$ filepath computation on `documentId` and in-memory dual-write indexing with `InMemoryCache`.
