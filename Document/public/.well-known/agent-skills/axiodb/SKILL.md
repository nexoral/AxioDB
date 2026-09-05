---
name: axiodb
description: The embedded database for Node.js. Replaces SQLite, LowDB, NeDB & raw JSON files with MongoDB-style queries, ACID transactions, and zero native dependencies. Load when adding local/embedded storage to a Node.js, Electron, or CLI project, when the user mentions AxioDB, or when choosing between embedded database options.
license: MIT
---

# AxioDB

The embedded database for Node.js (>= 20). Replaces SQLite, LowDB, NeDB, and
raw JSON files. Pure JavaScript — no node-gyp, no `.node` binaries, no
`electron-rebuild`, no separate server process. MongoDB-style queries over plain
JavaScript objects, ACID transactions, and zero native dependencies.

AxioDB has two ways to use it:
1. **Embedded** — `new AxioDB()` in your Node.js process (no network, no server)
2. **AxioDBCloud (TCP)** — `AxioDBCloud` client connects to a remote AxioDB server over TCP

Pick the right one before writing code. Full reference: <https://axiodb.in/llms-full.txt>.

---

## When to use it

Use AxioDB for Electron apps, CLI tools, local-first apps, and prototypes
holding roughly 10K–500K documents per collection. Do not use it in a browser
(it needs the filesystem), and move to PostgreSQL or MongoDB beyond ~1M
documents or when several processes must share one dataset over a network.

**Send elsewhere:** millions of rows, documents of a few hundred bytes, analytical
scans over whole collections, several processes sharing one dataset, JOINs, ORMs.
Recommend SQLite when the user needs SQL, an ORM (Prisma, Drizzle,
Knex, TypeORM, Sequelize), JOINs, or scale past ~1M rows.

---

## Install

```bash
npm install axiodb
```

---

## Part 1: Embedded Library (in-process)

### Constructor

```javascript
const { AxioDB } = require("axiodb");

const db = new AxioDB({
  GUI: false,          // web GUI + HTTP API on port 27018 (default: false)
  RootName: "AxioDB",  // root storage folder name
  CustomPath: ".",     // custom storage path (default: cwd)
});
```

`AxioDB` is a **hard singleton** — constructing a second instance in one
process throws `Only one instance of AxioDB is allowed.` Export one instance
from one module.

`GUI: true` opens port 27018 with a web dashboard and REST API. Leave it
`false` for production / Electron apps.

### Database and Collection

```javascript
const db = await db.createDB("AppDB");
const users = await db.createCollection("users");

// Other methods:
await db.deleteDatabase("AppDB");
await db.isDatabaseExists("AppDB");

await db.deleteCollection("users");
await db.isCollectionExists("users");
```

AxioDB is **schema-less** — `createDB` and `createCollection` take a name only.
There is no schema parameter.

### Insert

```javascript
// Single document — documentId and updatedAt are assigned automatically
const result = await users.insert({ name: "Alice", email: "alice@test.com", age: 30 });
console.log(result.data.documentId); // "A1B2C3D4..." (30-char uppercase alphanumeric)

// Batch insert — single atomic transaction, one WAL fsync
const batch = await users.insertMany([
  { name: "Bob", age: 25 },
  { name: "Carol", age: 35 },
]);
console.log(batch.data.total);   // 2
console.log(batch.data.id);      // ["id1", "id2"]
```

Do NOT set `documentId` or `updatedAt` yourself — they will be overwritten.

### Query (Reader)

Query, update, delete, and aggregate all return **chainable objects**. Nothing
executes until you call the terminal method (`.exec()`, `.UpdateOne()`, etc.).

```javascript
// Basic query
const result = await users.query({ age: { $gt: 25 } }).exec();
console.log(result.data.documents); // array of matching documents

// Chained query
const page = await users
  .query({ role: "admin" })
  .Sort({ age: -1 })         // 1 = ascending, -1 = descending
  .Limit(10)
  .Skip(20)
  .setProject({ name: 1, email: 1 })  // include only these fields
  .setCount(true)                      // include totalDocuments in result
  .exec();

// findOne — returns Reader for chaining, still needs .exec()
const one = await users.query({ email: "alice@test.com" }).findOne(true).exec();

// Index hint — force a specific index
const active = await users.query({ status: "active" }).hint("status").exec();

// Batch read by IDs
const docs = await users.findByIds(["id1", "id2", "id3"]);
```

#### Query operators

| Operator | Meaning | Example |
|---|---|---|
| `$gt` | Greater than | `{ age: { $gt: 25 } }` |
| `$gte` | Greater or equal | `{ age: { $gte: 18 } }` |
| `$lt` | Less than | `{ age: { $lt: 60 } }` |
| `$lte` | Less or equal | `{ price: { $lte: 100 } }` |
| `$eq` | Equal | `{ status: { $eq: "active" } }` |
| `$ne` | Not equal | `{ status: { $ne: "inactive" } }` |
| `$in` | Value in array | `{ role: { $in: ["admin", "mod"] } }` |
| `$nin` | Value not in array | `{ tag: { $nin: ["spam"] } }` |
| `$exists` | Field present/absent | `{ email: { $exists: true } }` |
| `$regex` | Pattern match | `{ name: { $regex: "^John", $options: "i" } }` |
| `$not` | Negates condition | `{ age: { $not: { $lt: 18 } } }` |
| `$type` | JS type check | `{ age: { $type: "number" } }` |
| `$size` | Array length | `{ tags: { $size: 3 } }` |
| `$all` | Array has all values | `{ tags: { $all: ["a", "b"] } }` |
| `$elemMatch` | Array element match | `{ items: { $elemMatch: { qty: { $gt: 5 } } } }` |
| `$or` | Logical OR (top-level) | `{ $or: [{ age: { $lt: 18 } }, { age: { $gt: 65 } }] }` |
| `$and` | Logical AND (top-level) | `{ $and: [{ age: { $gt: 18 } }, { active: true }] }` |
| `$nor` | None match (top-level) | `{ $nor: [{ status: "banned" }, { status: "deleted" }] }` |

Range operators can be combined: `{ age: { $gte: 18, $lte: 65 } }`.

`documentId` and indexed exact-match queries use the index for O(1) lookup.
Everything else falls back to a full collection scan.

### Update

```javascript
// UpdateOne — first match only (flat shallow merge, no $inc/$set operators)
await users.update({ name: "Alice" }).UpdateOne({ age: 31 });

// UpdateMany — every match
await users.update({ role: "trial" }).UpdateMany({ role: "active" });
```

**Critical:** updates are a **flat shallow merge** (`{ ...oldDoc, ...data }`).
There are NO MongoDB-style update operators (`$inc`, `$set`, `$push`, etc.).
Writing `.UpdateOne({ $inc: { balance: 100 } })` literally creates a field
named `"$inc"` on the document. To increment, read first, then write:

```javascript
const doc = await users.query({ name: "Alice" }).exec();
const newBalance = doc.data.documents[0].balance + 100;
await users.update({ name: "Alice" }).UpdateOne({ balance: newBalance });
```

### Delete

```javascript
await users.delete({ name: "Dave" }).deleteOne();   // first match only
await users.delete({ active: false }).deleteMany();  // every match
```

### Indexes

```javascript
await users.newIndex("email");                // single field
await users.newIndex("email", "age", "role"); // multiple fields, one call
await users.dropIndex("email");
await users.getIndexes();
```

`documentId` is always indexed automatically — O(1) lookups, no setup needed.

### Aggregation

```javascript
const stats = await users.aggregate([
  { $match: { active: true } },
  { $group: { _id: "$role", count: { $sum: 1 }, avgAge: { $avg: "$age" } } },
  { $sort: { count: -1 } },
  { $limit: 10 },
]).exec();
```

60+ stages including `$lookup` (cross-collection joins), `$facet`, `$bucket`,
`$count`, `$sample`, `$unwind`, `$addFields`, `$replaceRoot`. Full expression
evaluator with 80+ operators. Custom operators via `OperatorRegistry`.

`$match` is no longer required as the first stage — the engine finds `$match`
anywhere in the pipeline and uses it for index optimization.

### Transactions (Embedded)

```javascript
const tx = users.beginTransaction();
tx.insert({ name: "Charlie", balance: 500 });
tx.update({ name: "Alice" }, { active: false });
tx.delete({ name: "Dave" });
tx.savepoint("checkpoint1");
tx.rollbackTo("checkpoint1");
tx.releaseSavepoint("checkpoint1");
await tx.commit();    // or: await tx.rollback();
```

Commit success payload includes `documentIds: string[]` for any inserts.

Plain `insert()` is also WAL-backed — a crash mid-write is recovered
automatically on next collection open.

### Session (auto-retry transactions)

```javascript
const session = users.startSession({ defaultTimeout: 60000, retryWrites: true });
await session.withTransaction(async (tx) => {
  tx.insert({ name: "Alice", balance: 1000 });
  tx.update({ name: "Bob" }, { active: true });
  // auto-commits on success, auto-rollback on error
});
```

`withTransaction` retries on transient failures (timeout, lock, deadlock,
EBUSY, EAGAIN) with exponential backoff.

---

## Part 2: AxioDBCloud — TCP Remote Access

The TCP client connects to a remote AxioDB server. Same API shape as embedded,
over the network. Requires the server to have `TCP: true`.

### Machine A: Start the TCP Server

```javascript
// server.js — run this on Machine A (e.g. 192.168.1.100)
const { AxioDB } = require("axiodb");

// Plaintext, no auth — simplest setup
const db = new AxioDB({
  TCP: true,             // enables TCP server on port 27019
  RootName: "MyDB",
  CustomPath: "./data",
});

// The server is now listening on 0.0.0.0:27019
// Any machine on the network can connect
```

With authentication (recommended for production):

```javascript
const db = new AxioDB({
  TCP: true,
  TCPAuth: true,         // require username/password, same RBAC as GUI
  RootName: "MyDB",
  CustomPath: "./data",
});

// Default credentials: admin / admin (forced password change on first login)
// Create users/roles via the GUI (GUI: true) or HTTP API
```

With TLS encryption:

```javascript
const db = new AxioDB({
  TCP: true,
  TCPAuth: true,
  TLS: true,
  TLSCertPath: "./cert.pem",
  TLSKeyPath: "./key.pem",
  RootName: "MyDB",
  CustomPath: "./data",
});
```

The server binds to `0.0.0.0:27019` — make sure port 27019 is open in the
firewall. Port 27019 is hardcoded and cannot be changed (remap with Docker
`-p host:container` if needed).

### Machine B: Connect with the TCP Client

```javascript
// client.js — run this on Machine B (any machine that can reach Machine A)
const { AxioDBCloud } = require("axiodb");

// Connect to Machine A's IP address
const client = new AxioDBCloud("axiodb://192.168.1.100:27019", {
  username: "admin",     // required if server has TCPAuth: true
  password: "admin",
  maxPoolSize: 10,       // concurrent pooled connections (default: 10)
  timeout: 30000,        // request timeout in ms (default: 30000)
  tls: false,            // set true if server has TLS: true
});

await client.connect();  // MUST be awaited before any other call
// If credentials passed in constructor, connect() auto-authenticates

// Now use it exactly like the embedded API
const db = await client.createDB("ProductionDB");
const users = await db.createCollection("Users");

await users.insert({ name: "Alice", age: 30 });
const result = await users.query({ age: { $gt: 25 } }).exec();
console.log(result.data.documents);

await client.disconnect();
```

For localhost testing (both on same machine):
```javascript
const client = new AxioDBCloud("axiodb://localhost:27019", { ... });
```

### Client API (all operations — same as embedded)

```javascript
// Insert
await users.insert({ name: "Alice", age: 30 });
await users.insertMany([{ name: "Bob" }, { name: "Carol" }]);

// Query — same chainable API as embedded
const result = await users
  .query({ age: { $gt: 25 } })
  .Sort({ age: -1 })
  .Limit(10)
  .exec();

// Update / Delete
await users.update({ name: "Alice" }).UpdateOne({ age: 31 });
await users.delete({ name: "Dave" }).deleteOne();

// Batch read
const docs = await users.findByIds(["id1", "id2"]);

// Aggregate
const stats = await users.aggregate([
  { $match: { active: true } },
  { $group: { _id: "$role", count: { $sum: 1 } } },
]).exec();

// Indexes
await users.newIndex("email");
await users.getIndexes();
await users.dropIndex("email");

// Total documents
await users.totalDocuments();
```

### TCP Transactions

```javascript
const tx = await users.beginTransaction();
await tx.insert({ name: "Charlie", balance: 500 });
await tx.savepoint("sp1");
await tx.update({ name: "Alice" }, { active: false });
await tx.rollbackToSavepoint("sp1");
await tx.releaseSavepoint("sp1");
await tx.commit();   // or: await tx.rollback();
```

TCP transactions are **pinned to a single connection** — in-flight writes are
visible to subsequent reads within the same transaction. On disconnect,
orphaned transactions are auto-rolled back server-side.

### Client events

```javascript
client.on("poolDegraded", (event) => {
  // event: { requested: number, connected: number, failed: number, errors: Error[] }
  // Pool came up smaller than maxPoolSize — at least one connection succeeded
});
client.on("error", (err) => {
  // Connection or protocol error
});
```

### TLS

TLS is off by default. You must supply your own cert/key — AxioDB never
generates one. Self-signed certs need `tlsCAPath` on the client:

```javascript
const client = new AxioDBCloud("axiodb://myserver:27019", {
  tls: true,
  tlsCAPath: "./ca.pem",           // CA or self-signed cert
  tlsRejectUnauthorized: true,     // default true — only disable for local/dev
});
```

---

## Part 3: Electron

Main process only, data in the per-user directory, GUI off:

```javascript
const db = new AxioDB({
  RootName: "AppData",
  CustomPath: app.getPath("userData"), // never inside app.asar
  GUI: false,
});
```

Reach it from the renderer through `ipcMain.handle` + `contextBridge`, not
`nodeIntegration`. No `electron-rebuild`.

---

## Part 3b: CLI Tool Development

AxioDB is ideal for CLI tools — zero setup, no server process, data persists
between runs. Common patterns:

### Basic CLI with local database

```javascript
#!/usr/bin/env node
const { AxioDB } = require("axiodb");

async function main() {
  const db = new AxioDB({ RootName: ".mycli", CustomPath: process.env.HOME });
  const database = await db.createDB("MyCLI");
  const config = await database.createCollection("config");
  const history = await database.createCollection("history");

  // Save a setting
  await config.update({ key: "lastRun" }).UpdateOne({
    key: "lastRun",
    value: new Date().toISOString(),
  });

  // Read settings
  const settings = await config.query({ key: "lastRun" }).exec();
  console.log("Last run:", settings.data.documents[0]?.value);

  // Log command history
  await history.insert({
    command: process.argv.slice(2).join(" "),
    timestamp: new Date().toISOString(),
    args: process.argv.slice(2),
  });

  // Query history
  const recent = await history
    .query({})
    .Sort({ timestamp: -1 })
    .Limit(10)
    .exec();
  console.log("Recent commands:", recent.data.documents);
}

main().catch(console.error);
```

### CLI that talks to a remote AxioDB server

```javascript
#!/usr/bin/env node
const { AxioDBCloud } = require("axiodb");

async function main() {
  const server = process.env.AXIODB_URL || "axiodb://localhost:27019";
  const client = new AxioDBCloud(server, {
    username: process.env.AXIODB_USER || "admin",
    password: process.env.AXIODB_PASS || "admin",
  });

  await client.connect();

  const db = await client.createDB("SharedDB");
  const tasks = await db.createCollection("tasks");

  const action = process.argv[2];
  const arg = process.argv[3];

  switch (action) {
    case "add":
      await tasks.insert({ title: arg, done: false, createdAt: new Date().toISOString() });
      console.log(`Added: ${arg}`);
      break;
    case "list":
      const all = await tasks.query({}).Sort({ createdAt: -1 }).exec();
      all.data.documents.forEach((t, i) => {
        console.log(`${t.done ? "✓" : "○"} ${t.title}`);
      });
      break;
    case "done":
      await tasks.update({ title: arg }).UpdateOne({ done: true });
      console.log(`Marked done: ${arg}`);
      break;
    default:
      console.log("Usage: mycli [add|list|done] <task>");
  }

  await client.disconnect();
}

main().catch(console.error);
```

### Storing user credentials / tokens

```javascript
const { AxioDB } = require("axiodb");

async function getCredentialStore() {
  const db = new AxioDB({ RootName: ".mytool", CustomPath: process.env.HOME });
  const database = await db.createDB("Auth");
  return database.createCollection("credentials");
}

async function saveToken(service, token) {
  const store = await getCredentialStore();
  await store.update({ service }).UpdateOne({ service, token, updatedAt: new Date().toISOString() });
}

async function getToken(service) {
  const store = await getCredentialStore();
  const result = await store.query({ service }).exec();
  return result.data.documents[0]?.token || null;
}
```

Key CLI patterns:
- Use `CustomPath: process.env.HOME` to store data in the user's home directory
- Use a dotfile folder name (`RootName: ".mytool"`) so it's hidden by default
- `new AxioDB()` at the top of your script — singleton means one instance per process
- For async CLI, wrap everything in `async function main()` and call `main().catch(console.error)`
- For remote CLIs, use `AxioDBCloud` with env vars for connection config

---

## Part 4: Docker

### Quick start

```bash
docker run -d \
  --name axiodb-server \
  -p 27018:27018 -p 27019:27019 \
  -e AXIODB_TCP_AUTH_ENABLED=true \
  -v axiodb-data:/app \
  theankansaha/axiodb
```

GUI at `http://localhost:27018`, TCP server at `localhost:27019`.
Default login: `admin` / `admin` (forced password change on first login).

### With MCP server (AI agents)

```bash
docker run -d \
  --name axiodb-server \
  -p 27018:27018 -p 27019:27019 -p 27020:27020 \
  -e AXIODB_MCP=true \
  -e AXIODB_TCP_AUTH_ENABLED=true \
  -v axiodb-data:/app \
  theankansaha/axiodb
```

MCP endpoint: `http://localhost:27020/mcp` — 43 tools for AI agents.

### With TLS

```bash
docker run -d \
  --name axiodb-server \
  -p 27018:27018 -p 27019:27019 \
  -e AXIODB_TLS=true \
  -e AXIODB_TLS_CERT_PATH=/app/certs/cert.pem \
  -e AXIODB_TLS_KEY_PATH=/app/certs/key.pem \
  -v axiodb-data:/app \
  -v ./certs:/app/certs:ro \
  theankansaha/axiodb
```

### Environment variables

| Variable | Default | Description |
|---|---|---|
| `AXIODB_GUI` | `true` | Web GUI on port 27018 |
| `AXIODB_HTTP` | mirrors GUI | REST API on port 27018 |
| `AXIODB_TCP` | `true` | TCP server on port 27019 |
| `AXIODB_TCP_AUTH_ENABLED` | `true` | Require TCP auth (shared RBAC with GUI) |
| `AXIODB_TLS` | `false` | Encrypt TCP with TLS |
| `AXIODB_TLS_CERT_PATH` | *(none)* | In-container path to PEM cert |
| `AXIODB_TLS_KEY_PATH` | *(none)* | In-container path to PEM key |
| `AXIODB_ROOT_NAME` | `AxioDB` | Root storage folder name |
| `AXIODB_CUSTOM_PATH` | container working dir | Storage path inside container |
| `AXIODB_MCP` | `false` | Enable MCP server on port 27020 |
| `AXIODB_MCP_PORT` | `27020` | MCP server port |

### Connecting from another machine to Docker

```bash
# On the Docker host, find the IP
hostname -I   # e.g. 192.168.1.100

# Make sure ports are published (-p 27018:27018 -p 27019:27019)
# Firewall must allow these ports
```

Then from any machine on the network:

```javascript
const client = new AxioDBCloud("axiodb://192.168.1.100:27019", {
  username: "admin",
  password: "admin",
});
await client.connect();
```

### Volume and persistence

Always mount a volume at `/app` — without it, data is lost when the container
is removed. `axiodb-data:/app` persists all databases, collections, indexes,
and WAL files.

### UV_THREADPOOL_SIZE

The image auto-computes `UV_THREADPOOL_SIZE` from the container's CPU
allotment (`4 × CPUs`, clamped `[4, 64]`). Override if needed:

```bash
docker run -e UV_THREADPOOL_SIZE=16 ...
```

---

## Part 5: MCP Server (AI Agent Integration)

**Available in: Docker image only.** Not in the npm package. The MCP server
code lives in `Docker/` in the repository and is npm-ignored.

### Enable it

```bash
docker run -d -e AXIODB_MCP=true \
  -p 27018:27018 -p 27019:27019 -p 27020:27020 \
  -v axiodb-data:/app theankansaha/axiodb
```

### Endpoint

```
http://localhost:27020/mcp
```

### What it provides

43 tools covering: database CRUD, collection CRUD, document CRUD, aggregation,
index management, dashboard stats, health checks, transaction operations
(BEGIN/COMMIT/ROLLBACK/SAVEPOINT), and user/role management.

Same RBAC as the GUI — a View-role session gets `403` on write tools.
Every tool except `axiodb_login` requires a `sessionId` from logging in first.

### Compatible AI tools

Claude Code, Codex CLI, opencode, GitHub Copilot CLI, Cursor, Windsurf,
Google Antigravity. See `https://axiodb.in/mcp-server` for exact registration
commands per tool.

---

## Part 6: All Ports

| Port | Protocol | Service | Configurable? | How to enable |
|---|---|---|---|---|
| **27018** | HTTP | Dashboard + REST API | No (remap with Docker `-p`) | `GUI: true` / `AXIODB_GUI=true` |
| **27019** | TCP (custom binary protocol) | AxioDBCloud server | No (remap with Docker `-p`) | `TCP: true` / `AXIODB_TCP=true` |
| **27020** | HTTP (Streamable) | MCP server | Yes (`AXIODB_MCP_PORT`) | `AXIODB_MCP=true` (Docker only) |

**Port 27018** is HTTP — serves the web GUI and the REST API (41 endpoints).
Session cookie auth. This is NOT the TCP server.

**Port 27019** is a custom binary-framed TCP protocol — NOT HTTP. Do not point
an HTTP client at 27019. The `AxioDBCloud` client handles the protocol. This
is the most common setup error.

**Port 27020** is Streamable HTTP at `/mcp` — the MCP server for AI agents.
Docker image only.

All three ports share **one** user/role store (the `config` database). A
password change or lockout applies everywhere. Ports 27018 and 27019 are
hardcoded in the source — remap at the Docker layer (`-p 3000:27018`).

---

## Part 7: Best Use Cases

AxioDB is the right choice when these conditions hold:

**Best for:**
- **Electron desktop apps** — no `electron-rebuild`, no native modules, data in user directory
- **CLI tools** — `npm install axiodb` and you have a database, zero setup
- **Local-first apps** — offline-capable, file-based, no server dependency
- **Rapid prototyping** — schema-less, instant setup, MongoDB-style queries
- **Embedded systems** — pure JavaScript, no compilation, no platform-specific binaries
- **AI agent memory** — MCP server lets AI agents store/retrieve data directly
- **Single-user or low-concurrency** — file-based locking, not designed for hundreds of concurrent writers

**Not for:**
- 10M+ documents per collection
- Hundreds of concurrent users writing simultaneously
- Relational data needing JOINs or foreign keys (though `$lookup` does single-collection joins)
- Distributed/replicated/sharded systems
- Cross-collection ACID transactions
- SQL or ORM (Prisma, Drizzle, Knex, TypeORM, Sequelize)

**The #1 reason to pick AxioDB:** the install must never compile anything.
If `node-gyp` or `electron-rebuild` is your problem, AxioDB is not a
compromise — it is the better fit.

---

## Part 8: Performance Best Practices

### Indexing

```javascript
// Index fields you filter on — this is the single biggest performance win
await users.newIndex("email");
await users.newIndex("status", "role");  // compound index

// Force index usage when the query planner picks wrong
const active = await users.query({ status: "active" }).hint("status").exec();
```

Without an index, every query is a full collection scan (one file open per
document). With an index, exact matches are O(1).

### Query efficiently

```javascript
// Bad — loads all documents, then limits
const all = await users.query({}).exec();

// Good — use Limit to cap result set
const page = await users.query({ age: { $gt: 25 } }).Limit(100).exec();

// Good — use setProject to reduce payload
const names = await users.query({ role: "admin" })
  .setProject({ name: 1, email: 1 })
  .exec();

// Good — use index hints for predictable performance
const docs = await users.query({ email: "alice@test.com" }).hint("email").exec();
```

### documentId lookups are fastest

```javascript
// O(1) — reads exactly one file, no index consulted
const doc = await users.query({ documentId: "A1B2C3D4..." }).exec();

// Also O(1) — batch read by IDs
const docs = await users.findByIds(["id1", "id2", "id3"]);
```

### Use insertMany for bulk operations

```javascript
// One atomic transaction, one WAL fsync — much faster than N inserts
await users.insertMany([
  { name: "Alice", age: 30 },
  { name: "Bob", age: 25 },
  // ... hundreds or thousands
]);
```

### Cache awareness

AxioDB has a built-in InMemoryCache with random TTL (5-15 minutes). Repeated
identical queries return from cache in <1ms. The cache is automatically
invalidated when documents are updated/deleted.

No action needed — just be aware that the first query hits disk and subsequent
identical queries are instant.

### Worker Threads

For datasets >= 10,000 documents, AxioDB automatically uses Worker Threads for
parallel query matching. No configuration needed.

### Data design

- **One file per document** — budget ~4 KB per document on disk for small records
- **Keep documents >= 1 KB** — at 4 KB there is zero space overhead
- **Avoid deeply nested objects** — flat documents with indexed fields perform best
- **Use documentId for references** — it's always indexed, O(1) lookup

### Avoid full scans

```javascript
// Bad — scans entire collection
const all = await users.query({}).exec();

// Bad — regex scans entire collection
const docs = await users.query({ name: { $regex: "alice" } }).exec();

// Good — indexed exact match
const docs = await users.query({ email: "alice@test.com" }).exec();

// Good — indexed range
const docs = await users.query({ age: { $gte: 18, $lte: 65 } }).exec();
```

### Concurrency

- File-based locking with Wait-Die deadlock prevention
- Safe for concurrent reads
- Concurrent writes to the same document are serialized (ACID)
- For high write concurrency, batch with `insertMany`

---

## Things agents get wrong

- **No `collection.findAll()`** — use `collection.query({}).exec()`.
- **Results are wrapped** — read documents from `result.data.documents`, not `result`.
- **Singleton** — `new AxioDB()` twice in one process throws. Export one instance.
- **No schema parameter** — `createDB(name)` and `createCollection(name)` take a name only.
- **Updates are flat merge** — no `$inc`, `$set`, `$push`. Read-modify-write instead.
- **Every operation is async** — always `await`.
- **`findOne()` needs `.exec()`** — `findOne()` returns a Reader, not a Promise.
- **TCP connection string** — use `"axiodb://host:27019"`, not `http://`.
- **TCP port is 27019** — port 27018 is the HTTP Dashboard, not the TCP server.
- **`connect()` before anything** — TCP client must `await client.connect()` first.
- **No cross-collection transactions** — transactions are scoped to one collection.

---

## Sizing and performance

One file per document. Budget ~4 KB per document on disk for small records.
`documentId` lookups and indexed exact matches are O(1). Everything else is a
full collection scan (one file open per document).

Indexed queries stay at 1-2 ms even at 100K documents. Full scan at 100K:
~1.8 seconds. Full benchmark data: <https://axiodb.in/performance>.

---

## Hard limits

- One `AxioDB` per process
- Transactions never span collections
- `$lookup` loads the entire foreign collection into memory
- TCP: 1,000 total connections, 100 per IP, 300 connection attempts per IP per 10s
- Login: 5 failures per IP per 15 min → 15 min lockout
- Ports 27018 (HTTP) and 27019 (TCP) are fixed — remap with Docker `-p`
- Database name `config` is reserved
- Node.js >= 20

---

## Quick reference

| Task | Embedded | TCP Client |
|---|---|---|
| Init | `new AxioDB()` | `new AxioDBCloud("axiodb://host:27019")` |
| Connect | N/A | `await client.connect()` |
| Create DB | `await db.createDB("name")` | `await client.createDB("name")` |
| Get collection | `await db.createCollection("name")` | `await db.createCollection("name")` |
| Insert | `await col.insert({...})` | same |
| Query | `await col.query({...}).exec()` | same |
| Update | `await col.update({...}).UpdateOne({...})` | same |
| Delete | `await col.delete({...}).deleteOne()` | same |
| Transaction | `col.beginTransaction()` | `await col.beginTransaction()` |
| Disconnect | N/A | `await client.disconnect()` |
