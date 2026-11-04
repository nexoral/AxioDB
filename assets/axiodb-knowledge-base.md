# AxioDB — Master Knowledge Base & Single Source of Truth

> **Target Audience:** AxioDB Dev Team, Vector-Less RAG Pipelines, AI Agents, and Production Engineers.  
> **Package Version:** `24.34.3` | **License:** MIT | **Runtime:** Node.js `>= 20.0.0`, Bun `>= 1.4.0`, Deno `>= 2.9.6`, Electron.  
> **Official Distribution:** [npm: axiodb](https://www.npmjs.com/package/axiodb) | [GitHub: nexoral/AxioDB](https://github.com/nexoral/AxioDB) | [Documentation: axiodb.in](https://axiodb.in)

---

## 1. System Architecture & Fundamentals

### 1.1 Core Mission & The "Zero-Native" Philosophy
AxioDB is an embedded NoSQL document database written entirely in strict TypeScript (compiling to CommonJS) with **zero native C/C++ dependencies**.
- **No `node-gyp` or build toolchains:** Never requires `make`, `gcc`, `python`, or `build-essential`. Installs cleanly on minimal Linux containers, Alpine musl environments, and locked-down CI/CD runners.
- **No `electron-rebuild`:** Never compiles `.node` shared libraries. Updating Electron versions or shipping to Windows/macOS/Linux never breaks binary ABIs.
- **In-process embedded execution:** Runs directly inside the host process memory space. No separate database server daemon (`mongod`, `postgres`, `mysqld`) to install or configure.

### 1.2 The Vector-Less Database Architecture
In an AI agent or RAG architecture, traditional vector databases rely on high-dimensional floating-point embeddings (cosine/dot-product similarity). While useful for fuzzy search, vector systems introduce:
1. **Non-deterministic hallucinations:** Inaccurate semantic drift.
2. **Heavy computational overhead:** High RAM usage and GPU/SIMD requirements.
3. **50–200ms latency:** Embedding model inference bottlenecks every query.

AxioDB provides the foundational storage for **Vector-Less RAG & Agent State**:
- **Deterministic Multi-Key Indexing:** Sub-millisecond (<1ms) exact attribute and category lookups.
- **Taxonomy & Inverted Token Queries:** Array-based keyword indexing using `$in`, `$all`, and `$elemMatch`.
- **Graph Traversal via `$lookup`:** Single-collection and cross-collection relational joins without an external graph database.
- **ACID Transaction Checkpoints:** Savepoints and rollbacks for speculative agent reasoning trees.
- **Native MCP Server (Port 27020):** 45 built-in tools allowing LLMs to directly inspect, query, and mutate structured state.

### 1.3 Singleton Lifecycle Constraint
AxioDB enforces a **strict singleton pattern** per operating system process.
- Calling `new AxioDB()` a second time in the same process throws:
  ```
  Error: Only one instance of AxioDB is allowed.
  ```
- **Pattern:** Initialize AxioDB once in a central module (e.g. `db.ts` or Electron's `main.js`) and export the instance across the application.

### 1.4 Threading Model & Worker Offloading
- **Core CRUD & In-Memory Operations:** Run asynchronously on Node's main event loop using non-blocking asynchronous I/O.
- **Worker Threads:** AxioDB spawns Node.js `worker_threads` for CPU-intensive aggregation stages, large JSON serialization pipelines, and parallel batch processing.
- **Libuv I/O Pool:** Disk writes utilize the internal libuv threadpool. For high-concurrency workloads, configure:
  ```bash
  export UV_THREADPOOL_SIZE=16  # Recommended: max(4, min(64, 4 * CPU_CORES))
  ```

---

## 2. On-Disk Physical Storage Engine

### 2.1 File-Per-Document Storage Layout
AxioDB stores each document in its own dedicated JSON file on disk rather than bundling the entire database into a monolithic binary file.

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

### 2.2 Physical File Specifications
1. **Document Files (`{documentId}.axiodb`):**
   - Format: Pure JSON object string.
   - Filename: Exactly 16-character uppercase alphanumeric string generated via cryptographic entropy (e.g. `84UK9ACMYTBM792F.axiodb`).
   - O(1) Lookups: Path is computed mathematically via string concatenation (`path.join(dir, id + '.axiodb')`). Zero B-tree traversal needed for point lookups.
2. **Metadata Registries (`*.meta.jsonl`):**
   - Format: Append-only JSON Lines.
   - Mutating a collection or index appends one line to EOF (`O(1)` append).
   - On startup, registries are read sequentially; the **last line wins** for any given identifier.
   - When all entries are dropped, the file is safely truncated to 0 bytes.
3. **Write-Ahead Logs (`*.wal.jsonl`):**
   - Isolated inside `.transactions/` with the `.wal.jsonl` suffix to distinguish logs from metadata registries during crash recovery.

### 2.3 The 4 KB Block Size Storage Amplification Economics
Because each document is an individual file, the host operating system allocates disk space in discrete cluster blocks (typically **4,096 bytes** on ext4, APFS, and NTFS):
- **128-byte document:** Occupies 4,096 bytes on disk (**31× space amplification**).
- **1,024-byte document:** Occupies 4,096 bytes on disk (**4× space amplification**).
- **4,096-byte document:** Occupies 4,096 bytes on disk (**1× amplification / 0% waste**).

**Engineering Recommendation:**
- **Target Size:** Documents of **1 KB to 10 KB** achieve optimal filesystem density.
- **Budgeting Rule:** Budget roughly 4 KB of disk space per document. For 100,000 documents, budget ~400 MB of storage.
- **Sweet Spot:** Collections of **10,000 to 500,000 documents**.

---

## 3. In-Memory Cache & Dual-Write Indexing

### 3.1 InMemoryCache Lifecycle & Anti-Stampede Jitter
AxioDB includes an integrated, per-instance memory cache (`InMemoryCache`):
- **Read Path:** Incoming `.query()` executions check memory cache first. Hits resolve in **< 1ms (0.38ms – 0.6ms)**.
- **Write Path:** Any `insert`, `update`, `delete`, or transaction commit automatically invalidates cached results for that collection.
- **Randomized TTL Jitter (5–15 min):** To prevent "Cache Stampede" (where thousands of keys expire simultaneously causing a sudden spike in disk syscalls), each cached query receives a randomized TTL between `minTTL` and `maxTTL`:
  $$\text{TTL}_{\text{ms}} = \lfloor \text{random}() \times (\text{maxTTL} - \text{minTTL} + 1) + \text{minTTL} \rfloor \times 60 \times 1000$$
- **Disabling Cache:** Pass `{ Cache: false }` in constructor options to force every query to hit disk directly.

### 3.2 Dual-Write Indexing (`IndexCache`)
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

## 4. ACID Transactions, WAL & Crash Recovery

### 4.1 Transaction Scope & Guarantees
- **Atomicity:** All operations in a transaction succeed together on `.commit()`, or all revert on `.rollback()`.
- **Consistency:** Write-Ahead Logging prevents corrupt or half-written JSON files.
- **Isolation:** File locks prevent overlapping concurrent updates to the same documents during an active transaction.
- **Durability:** Committed transactions are flushed to disk before the commit call resolves.
- **Scope Boundary:** Transactions are **scoped to a single collection**. Cross-collection transactions are not supported.

### 4.2 Complete Transaction API
```javascript
const tx = collection.beginTransaction();
try {
  // 1. Queue operations (WAL logged)
  tx.insert({ title: 'Draft Post', status: 'draft' });
  
  // 2. Set named rollback checkpoint
  tx.savepoint('step_1_done');
  
  tx.update({ authorId: 'USR_1' }, { lastPostAt: new Date() });
  
  // 3. Rollback to checkpoint if speculative validation fails
  if (validationFailed) {
    tx.rollbackTo('step_1_done');
    tx.releaseSavepoint('step_1_done');
  }
  
  // 4. Commit all queued operations
  const result = await tx.commit();
  console.log(result.data.documentIds); // Array of newly inserted IDs
} catch (error) {
  // 5. Full rollback
  await tx.rollback();
}
```

### 4.3 Session API with Automatic Retries
```javascript
const session = collection.startSession({
  defaultTimeout: 60000,
  retryWrites: true,
  maxRetries: 3,
});

await session.withTransaction(async (tx) => {
  tx.insert({ account: 'A', balance: 500 });
  tx.update({ account: 'B' }, { balance: 1500 });
  // Automatically commits on function exit, or rolls back on thrown error
});
```
`withTransaction` inspects errors and automatically retries with exponential backoff if the error is transient (`timeout`, `lock`, `deadlock`, `conflict`, `busy`, `temporary`, `EBUSY`, or `EAGAIN`).

### 4.4 Crash Recovery Mechanism
When a collection is opened, AxioDB runs `Transaction.recoverTransactions()` automatically:
1. Reads `txn-meta.jsonl` in `.transactions/`.
2. Identifies any transactions marked `COMMITTED` whose writes were interrupted mid-flight; re-applies their writes from `{transactionId}.wal.jsonl`.
3. Uncommitted or abandoned transaction files are unlinked, and partially written temporary files are cleaned up.

---

## 5. Complete API Reference & Query Mechanics

### 5.1 Constructor Options (`AxioDB`)
```typescript
const db = new AxioDB({
  RootName: "AxioData",         // Storage root directory name (default: "AxioDB")
  CustomPath: "/var/data",      // Parent directory (default: process.cwd())
  GUI: false,                   // Start Web Dashboard on port 27018 (default: false)
  HTTP: false,                  // Start Fastify REST API on port 27018 (default: false)
  TCP: false,                   // Start TCP Server on port 27019 (default: false)
  TCPAuth: false,               // Require authentication on TCP connections (default: false)
  AdminPassword: "Secret",      // Seed password for 'admin' user (skips forced change)
  TLS: false,                   // Encrypt TCP with TLS (default: false)
  TLSCertPath: "./cert.pem",    // Required if TLS: true
  TLSKeyPath: "./key.pem",      // Required if TLS: true
  Cache: true,                  // Enable in-memory caching (default: true)
  minTTL: 5,                    // Min cache TTL in minutes (default: 5)
  maxTTL: 15,                   // Max cache TTL in minutes (default: 15)
  cacheClearUp: 86400,          // Sweep interval in seconds (default: 86400)
  MCP: false,                   // Enable native AI Agent MCP Server on port 27020 (default: false)
});
```

### 5.2 Database & Collection Operations
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
const count = await users.totalDocuments(); // { status: 200, data: { count: 42 } }
await myDB.deleteCollection("temp_logs");
```

### 5.3 Query Engine: The 19 Supported Operators
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

### 5.4 Reader Chaining Methods
```javascript
const results = await users.query({ status: 'active' })
  .hint('status')                     // Force use of index
  .Sort({ createdAt: -1 })            // 1 = ascending, -1 = descending
  .Skip(20)                           // Offset pagination
  .Limit(10)                          // Limit count
  .setProject({ name: 1, email: 1 })  // 1 = include, 0 = exclude
  .setCount(true)                     // Include total matching count
  .exec();

console.log(results.data.documents);
console.log(results.data.totalDocuments);
```
*Note on `findOne()`:* Calling `.findOne(true)` returns the `Reader` instance for chaining; you **must still call `.exec()`** to execute:
```javascript
const singleDoc = await users.query({ email: 'alice@example.com' }).findOne(true).exec();
```

### 5.5 Batch Point Retrieval (`findByIds`)
```javascript
const docs = await users.findByIds(['DOC_ID_1', 'DOC_ID_2', 'DOC_ID_3']);
// Retrieves multiple documents via direct O(1) paths in parallel. Missing IDs omitted.
```

### 5.6 CRITICAL WARNING: Update Mechanics Are Flat Shallow Merges
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

---

## 6. Aggregation Pipeline & Extension Registry

### 6.1 The 19 Aggregation Stages
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

Supported Stages:
1. `$match`: Filter stream using any query operator (utilizes indexes automatically).
2. `$group`: Groups by `_id`. Accumulators: `$sum`, `$avg`, `$min`, `$max`, `$first`, `$last`, `$push`, `$addToSet`, `$stdDevPop`, `$stdDevSamp`.
3. `$sort`: Multi-field ordering (`{ field: 1 | -1 }`).
4. `$project`: Restructure fields and evaluate expressions.
5. `$limit`: Restrict document volume.
6. `$skip`: Offset streaming documents.
7. `$unwind`: Flatten an array field into discrete documents.
8. `$addFields` / `$set`: Compute new attributes using expressions.
9. `$unset`: Strip fields from documents.
10. `$lookup`: Cross-collection joins (both equality syntax and pipeline join syntax).
11. `$facet`: Run multi-pipeline analytics in parallel.
12. `$bucket`: Categorize values into discrete numeric buckets.
13. `$bucketAuto`: Dynamically categorize values into evenly distributed buckets.
14. `$count`: Emit count of documents passing through stage.
15. `$sortByCount`: Convenient grouping by expression and sorting by frequency descending.
16. `$sample`: Randomly sample $N$ documents.
17. `$replaceRoot`: Replace top-level document with nested sub-document.
18. `$replaceWith`: Alias for `$replaceRoot`.
19. Expression Evaluator: Supports 80+ expressions (arithmetic, string, date, array, logical).

### 6.2 Custom Operator Registration (`OperatorRegistry`)
You can register custom accumulators or pipeline stages at application startup:
```javascript
import { OperatorRegistry } from 'axiodb';

// Register custom accumulator for Vector-Less distance calculation
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

## 7. Network Surfaces, Protocols & AI MCP Server

| Surface | Port | Protocol | Purpose | How to Enable |
|---|---|---|---|---|
| **Core Engine** | *(none)* | In-Memory / FS | Embedded database inside Node process | Default (`new AxioDB()`) |
| **Web Dashboard** | `27018` | HTTP | Browser GUI for browsing collections/queries | `{ GUI: true }` |
| **REST API** | `27018` | HTTP / JSON | 41 REST endpoints with OpenAPI specs | Enabled with GUI or `{ HTTP: true }` |
| **AxioDBCloud TCP** | `27019` | Custom Binary Frame | High-throughput remote client connections | `{ TCP: true }` |
| **AI Agent MCP Server**| `27020`| Streamable HTTP | 45 tools for LLM agent integration (`/mcp`)| `{ MCP: true }` |

### 7.1 Port Immutability Rule
Ports **27018** (HTTP/GUI) and **27019** (TCP) are hard-coded in the engine. To expose them on different ports, use Docker port remapping (`-p 8080:27018`). Only the MCP port (`27020`) can be overridden via `AXIODB_MCP_PORT`.

### 7.2 Native Model Context Protocol (MCP) Server (Port 27020)
AxioDB includes a built-in MCP server compliant with the Model Context Protocol (`2024-11-05`):
- **Activation:** `new AxioDB({ MCP: true })` or Docker `-e AXIODB_MCP=true`.
- **Endpoint:** `http://localhost:27020/mcp` (Streamable HTTP).
- **The 45 Tools:**
  - *Authentication (4):* `axiodb_login`, `axiodb_logout`, `axiodb_whoami`, `axiodb_change_own_password`.
  - *Database (4):* `axiodb_create_database`, `axiodb_delete_database`, `axiodb_database_exists`, `axiodb_get_instance_info`.
  - *Collection (4):* `axiodb_create_collection`, `axiodb_delete_collection`, `axiodb_collection_exists`, `axiodb_get_collection_info`.
  - *Document CRUD (8):* `axiodb_insert_document`, `axiodb_insert_many_documents`, `axiodb_query_documents`, `axiodb_update_document`, `axiodb_delete_document`, `axiodb_aggregate`, `axiodb_total_documents`, `axiodb_find_documents_by_ids`.
  - *Indexes (3):* `axiodb_create_index`, `axiodb_drop_index`, `axiodb_list_indexes`.
  - *Transactions (9):* `axiodb_begin_transaction`, `axiodb_transaction_insert`, `axiodb_transaction_update`, `axiodb_transaction_delete`, `axiodb_transaction_savepoint`, `axiodb_transaction_rollback_to_savepoint`, `axiodb_transaction_release_savepoint`, `axiodb_commit_transaction`, `axiodb_rollback_transaction`.
  - *Monitoring & Users (13):* Health, ping, stats, users CRUD, roles, permissions.
- **Client Configuration (Claude Code, Cursor, Windsurf):**
  ```json
  {
    "mcpServers": {
      "axiodb": {
        "url": "http://localhost:27020/mcp"
      }
    }
  }
  ```

---

## 8. Strategic Comparison Matrix (Pros & Cons)

### 8.1 Comparison Against Other Embedded Databases

| Feature | AxioDB | SQLite / better-sqlite3 | LowDB | NeDB |
|---|---|---|---|---|
| **Native C++ Compilation** | **Zero (Pure JS/TS)** | Required (`node-gyp`) | Zero (Pure JS) | Zero (Pure JS) |
| **Electron Upgrades** | **Never breaks** | Requires `electron-rebuild` | Never breaks | Never breaks |
| **Project Status** | **Actively Maintained**| Actively Maintained | Stale (3+ years) | Abandoned (2016) |
| **Crash Safety** | **ACID WAL (File-safe)**| ACID WAL (Page-safe) | Unsafe (Corrupts) | Unsafe (Data loss) |
| **Query Syntax** | Object Filters (`$gt`, etc.) | SQL Strings | JS Array Filters | MongoDB-style Callbacks |
| **Built-in Cache** | **Yes (<1ms TTL)** | No | No | In-memory only |
| **Built-in GUI** | **Yes (Port 27018)** | No | No | No |
| **Native AI MCP Server** | **Yes (Port 27020)** | No | No | No |
| **Ideal Scale** | **10K – 500K docs** | 10M+ rows | < 5K docs | < 10K docs |

### 8.2 When AxioDB Is the Best Choice
1. **Desktop & Electron Applications:** When eliminating `node-gyp` build errors and cross-platform compilation matrices is essential.
2. **Local-First & CLI Tools:** When you need a single `npm install axiodb` command that works immediately on Node, Bun, and Deno without external services.
3. **AI Agent Memory & State Stores:** When LLMs require structured document storage, speculative execution with savepoints, and direct MCP tool calling.
4. **Document Sizes of 1 KB – 10 KB:** When storing medium-sized JSON payloads with high read volume dominated by point lookups and indexed queries.

### 8.3 When NOT to Use AxioDB (Use PostgreSQL, SQLite, or MongoDB instead)
1. **10 Million+ Records:** Storage amplification and file descriptor overhead make page-based engines (PostgreSQL, SQLite) superior at this scale.
2. **Multi-User High-Concurrency Web Applications:** AxioDB is designed for single-node / embedded workloads, not hundreds of concurrent write connections.
3. **Complex Relational JOINs & Foreign Keys:** AxioDB does not enforce relational integrity or foreign key cascades.
4. **Distributed Clusters:** AxioDB does not support automatic sharding, leader election, or multi-node clustering.

---

## 9. Comprehensive Troubleshooting & Error Resolution

### 1. `Error: Only one instance of AxioDB is allowed.`
* **Cause:** `new AxioDB()` was called multiple times in the same runtime process.
* **Fix:** Export the initialized database instance from a dedicated singleton module:
  ```javascript
  // db.js
  const { AxioDB } = require('axiodb');
  const db = new AxioDB();
  module.exports = { db };
  ```

### 2. `Error: Port 27018 / 27019 / 27020 already in use`
* **Cause:** An existing instance of AxioDB or another service is listening on the port.
* **Fix:** Terminate the lingering process:
  ```bash
  kill -9 $(lsof -t -i:27018 -i:27019 -i:27020)
  ```

### 3. `Error: 403 Must change password before TCP/GUI use`
* **Cause:** Security policy requires changing default `admin`/`admin` credentials on first boot.
* **Fix:** Log into the GUI at `http://localhost:27018` and complete the prompt, or supply `AdminPassword` in constructor options on first boot:
  ```javascript
  const db = new AxioDB({ AdminPassword: "MyProductionPassword123!" });
  ```

### 4. `Error: 403 This is a reserved system database`
* **Cause:** Calling `createDB("config")`. The database name `config` is reserved for internal authentication and RBAC.
* **Fix:** Choose any other database name (e.g. `AppDB`, `MainData`).

### 5. `Error: 429 Too many failed login attempts`
* **Cause:** 5 failed logins within 15 minutes from the same IP address.
* **Fix:** Wait for the 15-minute window to expire, or restart the AxioDB process (session lockouts are held in memory only).

### 6. `Error: EMFILE / ENFILE: too many open files`
* **Cause:** High concurrency connection pooling or scanning thousands of unindexed documents exceeding OS file descriptor limits.
* **Fix:** Raise the operating system limit:
  ```bash
  ulimit -n 65536
  ```
  In Docker:
  ```bash
  docker run --ulimit nofile=65536:65536 theankansaha/axiodb
  ```

### 7. Inadvertent `"$inc"` or `"$set"` Fields Created During Updates
* **Cause:** Attempting MongoDB update operator syntax in `UpdateOne()` / `UpdateMany()`.
* **Fix:** Read the document first, perform arithmetic in JavaScript, and write the updated values using shallow merge.

### 8. Electron Read-Only Filesystem Errors in Production Builds
* **Cause:** Configuring `CustomPath` inside `app.getAppPath()` or `__dirname` (which are packaged into read-only `app.asar`).
* **Fix:** Always set storage to the user data directory:
  ```javascript
  const db = new AxioDB({
    RootName: "MyAppDB",
    CustomPath: app.getPath("userData"),
    GUI: false
  });
  ```

---

## 10. Frequently Asked Questions (FAQ)

**Q: Is AxioDB a drop-in replacement for MongoDB?**  
A: No. MongoDB is a standalone distributed database server. AxioDB is an embedded database running in-process inside your application. It uses similar object query syntax but requires zero external server setup.

**Q: Can I run AxioDB in a web browser?**  
A: No. AxioDB requires access to a physical filesystem via Node.js standard libraries (`fs`, `path`, `os`, `crypto`). It runs in Node.js, Bun, Deno, and Electron main processes.

**Q: How do I backup my AxioDB database?**  
A: Because AxioDB's storage engine uses a clean folder tree, a backup is as simple as creating a standard archive (tar.gz or zip) of your `{CustomPath}/{RootName}` directory while the database is idle, or using the built-in HTTP export endpoint (`/api/database/export`).

**Q: Are transactions durable across sudden power loss?**  
A: Yes. All transactional mutations are logged to a Write-Ahead Log (`.wal.jsonl`) before disk commits occur. On startup, `Transaction.recoverTransactions()` automatically replays committed writes and discards incomplete ones.

**Q: Does AxioDB support TypeScript out of the box?**  
A: Yes. AxioDB is written in 100% strict TypeScript and ships with built-in type definitions (`.d.ts`). No `@types/axiodb` package is required.

**Q: How does AxioDB achieve sub-millisecond read latency?**  
A: Through its dual-write indexing and `InMemoryCache`. Point lookups by `documentId` compute filepaths directly in $O(1)$ time, and cached queries return from memory in under 0.6 milliseconds without touching the disk.
