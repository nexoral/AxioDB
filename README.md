# AxioDB: The Pure JavaScript Alternative to SQLite

[![npm version](https://badge.fury.io/js/axiodb.svg)](https://badge.fury.io/js/axiodb)
[![npm downloads total](https://img.shields.io/npm/dt/axiodb.svg)](https://www.npmjs.com/package/axiodb)
[![npm downloads yearly](https://img.shields.io/npm/dy/axiodb.svg)](https://www.npmjs.com/package/axiodb)
[![npm downloads weekly](https://img.shields.io/npm/dw/axiodb.svg)](https://www.npmjs.com/package/axiodb)
[![npm downloads monthly](https://img.shields.io/npm/dm/axiodb.svg)](https://www.npmjs.com/package/axiodb)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

[![Push to Registry](https://github.com/nexoral/AxioDB/actions/workflows/Push.yml/badge.svg?branch=main)](https://github.com/nexoral/AxioDB/actions/workflows/Push.yml)
[![CodeQL](https://github.com/nexoral/AxioDB/actions/workflows/github-code-scanning/codeql/badge.svg?branch=main)](https://github.com/nexoral/AxioDB/actions/workflows/github-code-scanning/codeql)
[![Socket Security](https://socket.dev/api/badge/npm/package/axiodb)](https://socket.dev/npm/package/axiodb)

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen)](https://nodejs.org)
[![Tested on Node.js](https://img.shields.io/badge/tested%20on-20%20%7C%2021%20%7C%2022%20%7C%2023%20%7C%2024%20%7C%2025%20%7C%2026-blue)](https://github.com/nexoral/AxioDB/actions/workflows/Push.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue)](https://www.typescriptlang.org/)
[![Zero Dependencies](https://img.shields.io/badge/dependencies-0%20native-success)](https://www.npmjs.com/package/axiodb)

> **AxioDB** is an embedded NoSQL database for Node.js with MongoDB-style queries. Zero native dependencies, no compilation, no platform issues. Pure JavaScript from npm install to production. Think SQLite, but NoSQL with JavaScript queries—perfect for desktop apps, CLI tools, and embedded systems.

👉 **[Official Documentation](https://axiodb.in/)**: Access full guides, examples, and API references.

---

## 🎯 Why AxioDB?

**SQLite requires native C bindings that cause deployment headaches. JSON files have no querying or caching. MongoDB needs a separate server. AxioDB combines the best of all: embedded like SQLite, NoSQL queries like MongoDB, intelligent caching built-in.**

### The Problem with SQLite

SQLite is great, but it requires native bindings that break in Electron and cross-platform deployments:

- ❌ `electron-rebuild` on every Electron update
- ❌ Platform-specific builds (Windows .node files ≠ Mac .node files)
- ❌ SQL strings instead of JavaScript objects
- ❌ Schema migrations when your data model changes
- ❌ `node-gyp` compilation headaches

### AxioDB Solution

- ✅ Works everywhere Node.js runs—no rebuild, no native dependencies
- ✅ MongoDB-style queries: `{age: {$gt: 25}}`
- ✅ Schema-less JSON documents—no migrations
- ✅ Built-in InMemoryCache with automatic invalidation
- ✅ Multi-core parallelism with Worker Threads
- ✅ Built-in web GUI at `localhost:27018`
- ✅ **NEW:** AxioDBCloud - TCP remote access for Docker/Cloud deployments

---

## 🚀 Key Features

- **Intelligent Caching:** Advanced `InMemoryCache` system with automatic eviction policies, random TTL (5-15 min), and smart data persistence
- **Production Security:** Enterprise-grade AES-256 encryption for sensitive cached data and secure access controls
- **Frontend Integration:** Seamless integration with React, Vue, Angular, and all modern frontend frameworks
- **Chainable Query Methods:** Fluent API for real-time data retrieval and filtering (`.query()`, `.Sort()`, `.Limit()`, `.Skip()`)
- **Aggregation Pipelines:** MongoDB-compatible aggregation operations (`$match`, `$group`, `$sort`, `$project`, etc.)
- **Bulk Operations:** High-performance bulk insert, update, and delete operations (`insertMany`, `UpdateMany`, `DeleteMany`)
- **Tree-like Structure:** Hierarchical data storage for efficient retrieval and organization
- **Auto Indexing:** Optimized indexes on document IDs for lightning-fast queries
- **Index Cache with TTL:** In-memory index cache with automatic expiration (5-15 min random TTL) and disk persistence
- **Selective Cache Invalidation:** Smart cache invalidation that only clears affected entries on updates/deletes
- **Transaction Support:** ACID-compliant transactions with savepoints, rollback, and Write-Ahead Logging (WAL)
- **Single Instance Architecture:** Unified management for unlimited databases, collections, and documents
- **Web-Based GUI Dashboard:** Visual database administration, query execution, and real-time monitoring at `localhost:27018`
- **Role-Based Access Control:** Built-in login for the Control Server with Super Admin/Admin/View roles and per-permission enforcement
- **AxioDBCloud Remote Access:** TCP-based client for connecting to AxioDB from anywhere—Docker, Cloud, or local network
- **Zero-Configuration Setup:** Serverless architecture—install and start building instantly
- **Custom Database Path:** Flexible storage locations for better project organization

---

## 🆕 Recent Enhancements (v5.33+)

### Transaction Support
Full ACID-compliant transaction support with:
- **Savepoints:** Create intermediate checkpoints within transactions
- **Rollback:** Revert to previous state on errors
- **Write-Ahead Logging (WAL):** Crash recovery and data durability
- **Session Management:** Scoped transactions with timeout support

```javascript
// Transaction example
const session = collection.startSession();
await session.withTransaction(async (tx) => {
  await tx.insert({ name: 'Alice', balance: 1000 });
  await tx.update({ name: 'Bob' }, { $inc: { balance: -100 } });
  // Auto-commits on success, auto-rollbacks on error
});
```

### Enhanced Index System
- **Index Cache with TTL:** Random 5-15 minute TTL prevents cache stampede
- **Automatic Document Removal:** Documents are automatically removed from indexes when deleted
- **Dual-Write Pattern:** Indexes persist to both memory (speed) and disk (durability)
- **Cold Start Recovery:** Indexes reload from disk automatically on server restart

### Intelligent Cache System
- **Selective Invalidation:** Only affected cache entries are cleared on update/delete
- **Random TTL:** 5-15 minute random expiration prevents thundering herd
- **Async Operations:** Non-blocking cache updates for faster response times
- **Collection-Scoped Keys:** Cache keys include collection path to prevent collisions

---

## ☁️ AxioDBCloud - Remote Database Access (NEW!)

**Host AxioDB in Docker, connect from anywhere!** AxioDBCloud provides TCP-based remote access to your AxioDB instance with the exact same API as local embedded mode.

### 🌟 Why AxioDBCloud?

- **🚀 Deploy Once, Connect Everywhere:** Host AxioDB in Docker/Cloud, connect from multiple clients
- **🔄 Zero Code Changes:** Same API as embedded AxioDB - just change the client class!
- **⚡ TCP Protocol:** Fast binary protocol with automatic reconnection
- **🔐 Production Ready:** Connection pooling, heartbeat monitoring, error recovery
- **📦 Docker Support:** One-command deployment with included Dockerfile

### Quick Start - Server (Docker)

```bash
# Pull and run the AxioDB Docker container
docker run -d \
  --name axiodb-server \
  -p 27018:27018 \
  -p 27019:27019 \
  -v axiodb-data:/app \
  theankansaha/axiodb

# Ports:
# 27018 - HTTP GUI Dashboard
# 27019 - TCP Remote Access (AxioDBCloud)
# Volume: /app is the main data directory
```

**Or run locally with Node.js:**

```javascript
const { AxioDB } = require('axiodb');
const db = new AxioDB({ GUI: false, RootName: 'MyDB', CustomPath: '.', TCP: true }); // Enable TCP on port 27019
```

### Quick Start - Client

```javascript
const { AxioDBCloud } = require('axiodb');

// Connect to remote AxioDB (same API as embedded!)
const client = new AxioDBCloud("axiodb://localhost:27019");
await client.connect();

// Use exactly like embedded AxioDB
const db = await client.createDB("ProductionDB");
const users = await db.createCollection("Users");

// All operations work identically
await users.insert({ name: "Alice", role: "admin" });
const results = await users.query({ role: "admin" })
  .Limit(10)
  .Sort({ createdAt: -1 })
  .exec();

await client.disconnect();
```

### 🔐 TCP Authentication (NEW!)

TCP connections are unauthenticated by default (same as before). Opt in with `TCPAuth: true` to require a username/password on every connection, reusing the **exact same accounts and roles** as the GUI's RBAC system (see [Authentication & Access Control](#authentication--access-control-v98)) — one set of credentials for both.

```javascript
// Server
const db = new AxioDB({ TCP: true, TCPAuth: true, RootName: 'MyDB', CustomPath: '.' });
```

```javascript
// Client - pass credentials in the constructor options; connect() authenticates automatically
const client = new AxioDBCloud("axiodb://localhost:27019", {
  username: 'admin',
  password: 'admin',
});
await client.connect();

console.log(client.authenticatedUser); // { username, role, mustChangePassword }
```

Or authenticate after connecting, e.g. if credentials are supplied at runtime:

```javascript
const client = new AxioDBCloud("axiodb://localhost:27019");
await client.connect();
await client.login('admin', 'admin');
```

**What's enforced:**
- Every command except `PING`/`DISCONNECT`/`AUTHENTICATE` requires a prior successful login on that connection.
- The same role permissions as the GUI apply per command (e.g. a `View`-role user gets `403` on `CREATE_DB`).
- The same per-IP login rate limiter as the GUI: 5 failed attempts within 15 minutes locks that IP out for 15 minutes (`429 Too Many Requests`), shared across both TCP and GUI login attempts from that IP.
- **Accounts that still need their forced password change are rejected outright** (`403`), not allowed through with a warning — there's no TCP command to change a password today, so log into the GUI (`http://localhost:27018`) to complete it first, or authenticate with an account that already has.
- If a Super Admin resets a user's password, changes their role, or deletes them via the GUI while that user has an open TCP connection, the TCP connection is immediately forced to re-authenticate on its next command.

**Known limitations:** the TCP protocol itself is unencrypted (no TLS) — deploy behind a private network, VPN, or your own TLS termination if connecting over an untrusted network. There's currently no TCP command to change a password; that must go through the GUI.

### Features

✅ **35+ Commands** - Full CRUD, aggregation, indexing
✅ **Optional Authentication (NEW!)** - Shared RBAC with the GUI, per-IP rate limiting, forced-password-change enforcement
✅ **Auto-Reconnect** - Exponential backoff with up to 10 retry attempts
✅ **Heartbeat Monitoring** - PING/PONG every 30 seconds
✅ **Request Correlation** - UUID-based request/response matching
✅ **Connection Pooling** - Supports 1000+ concurrent connections
✅ **TypeScript Support** - Full type definitions included
✅ **Zero Breaking Changes** - Existing AxioDB code works unchanged

### Use Cases

- **Microservices:** Share one AxioDB instance across multiple services
- **Desktop Apps:** Electron apps connecting to local/remote database
- **Development:** Team members sharing a development database
- **Docker Deployments:** Container-based production deployments
- **Cloud Hosting:** Deploy to AWS, Azure, Google Cloud, DigitalOcean

👉 **[Full AxioDBCloud Documentation](https://axiodb.in/cloud)** - Setup guides, API reference, Docker examples

---

## 🏆 Performance Comparison

### AxioDB vs SQLite

| Feature | SQLite | AxioDB |
| ------- | ------ | ------ |
| **Native Dependencies** | ❌ Yes (C bindings) | ✅ Pure JavaScript |
| **Query Language** | SQL Strings | JavaScript Objects |
| **Schema Migrations** | ❌ Required (ALTER TABLE) | ✅ Schema-less (optional) |
| **Built-in Caching** | ⚠️ Manual | ✅ InMemoryCache |
| **Multi-core Processing** | ❌ Single-threaded | ✅ Worker Threads |
| **Built-in GUI** | ❌ External tools only | ✅ Web interface included |
| **Best For** | 10M+ records, relational data | 10K-500K documents, embedded apps |

### AxioDB vs Traditional JSON Files

| Feature | Traditional JSON Files | AxioDB |
| ------- | --------------------- | ------ |
| **Storage** | Single JSON file | File-per-document |
| **Caching** | None | InMemoryCache |
| **Indexing** | None | Auto documentId |
| **Query Speed** | Linear O(n) | Sub-millisecond O(1) |
| **Scalability** | Poor | Excellent |
| **Built-in Query Operators** | None | $gt, $lt, $regex, $in |

**Benchmark:** AxioDB's documentId search with InMemoryCache provides **instant retrieval** compared to traditional JSON files that require full-file parsing (tested with 1M+ documents).

---

## 🛡️ Security

- **AES-256 Encryption:** Optional for collections, with auto-generated or custom keys
- **Secure Storage:** Data stored in `.axiodb` files with file-level isolation and locking
- **InMemoryCache:** Minimizes disk reads and exposure of sensitive data
- **Configurable Access Controls:** Protects against unauthorized access
- **Automatic Cache Invalidation:** Ensures stale data is never served

**Best Practices:**

- Use strong, unique encryption keys
- Never hardcode keys—use environment variables or secure key management
- Implement proper access controls and regular backups

For vulnerabilities, see [SECURITY.md](SECURITY.md).

---

## 🎨 Built-in Web GUI

AxioDB includes a built-in web-based GUI for database visualization and management—perfect for Electron apps and development environments.

### Enabling the GUI

```javascript
// Enable GUI when creating AxioDB instance
const db = new AxioDB({ GUI: true }); // GUI available at localhost:27018

// With custom database path
const db = new AxioDB({ GUI: true, RootName: "MyDB", CustomPath: "./custom/path" });
```

### GUI Features

- 📊 Visual database and collection browser
- 🔍 Real-time data inspection
- 📝 Query execution interface
- 📈 Performance monitoring
- 🎯 No external dependencies required

Access the GUI at `http://localhost:27018` when enabled.

### Authentication & Access Control (v9.8+)

The Control Server ships with built-in login and role-based access control (RBAC). On first start with `GUI: true`, AxioDB seeds a reserved `config` database (hidden from the regular database list) containing three collections—`users`, `roles`, `permissions`—and a default account:

```
Username: admin
Password: admin
```

You'll be forced to change this password on first login (this applies to every account, not just the default one). Three predefined roles are seeded automatically:

| Role | Access |
|------|--------|
| **Super Admin** | Full access, including creating users/roles |
| **Admin** | Full database/collection/document access, no user or role management |
| **View** | Read-only access to databases, collections, and documents |

A Super Admin can create additional roles from the predefined permission catalogue and create new users with any role. Sessions are held only in server memory (never persisted to disk) and are tied to an httpOnly cookie, so restarting the server logs everyone out.

**Login rate limiting (NEW!):** after 5 failed login attempts from the same IP within 15 minutes, that IP is locked out for 15 minutes (`429 Too Many Requests`) — regardless of username. This limiter is shared with [TCP AUTHENTICATE attempts](#tcp-authentication-new), so brute-forcing either surface counts against the same per-IP cooldown.

**Index management:** the Control Server also exposes `GET /api/index/list`, `POST /api/index/create`, and `DELETE /api/index/delete`, gated by the same `index:view` / `index:create` / `index:delete` permissions (View role gets view-only, Admin and Super Admin get all three).

> **Security note:** RBAC protects the Control Server's HTTP API; it is still intended for trusted local/network access, not public internet exposure.

---

## ⚙️ Architecture & Internal Mechanisms

### Tree Structure for Fast Data Retrieval

Hierarchical storage enables O(1) document lookups, logarithmic query time, and efficient indexing. Each document is isolated in its own file, supporting selective loading and easy backup.

### Worker Threads for Parallel Processing

Leverages Node.js Worker Threads for non-blocking I/O, multi-core utilization, and scalable performance—especially for read operations.

### Two-Pointer Searching Algorithm

Optimized for range queries and filtered searches, minimizing memory usage and computational overhead.

### InMemoryCache System

Built-in intelligent caching with automatic eviction policies, TTL support, and memory optimization. Delivers sub-millisecond response times for frequently accessed data.

### Query Processing Pipeline

Intelligent caching, parallelized processing, lazy evaluation, and just-in-time query optimization for maximum throughput.

### Single Instance Architecture

Ensures ACID compliance, strong data consistency, and simplified deployment. One AxioDB instance manages all databases and collections.

### Designed for Node.js Developers

Native JavaScript API, promise-based interface, lightweight dependency, and simple learning curve.

---

## 📦 Installation

```bash
npm install axiodb@latest --save
```

---

## 🛠️ Quick Start

### Hello World in 30 Seconds

```javascript
// npm install axiodb
const { AxioDB } = require('axiodb');

// Create AxioDB instance with built-in GUI
const db = new AxioDB({ GUI: true }); // Enable GUI at localhost:27018

// Create database and collection
const myDB = await db.createDB('HelloWorldDB');
const collection = await myDB.createCollection('greetings', false);

// Insert and retrieve data - Hello World! 👋
await collection.insert({ message: 'Hello, Developer! 👋' });
const result = await collection.findAll();
console.log(result[0].message); // Hello, Developer! 👋
```

**Node.js Required:** AxioDB runs on Node.js servers (v20.0.0+), not in browsers.

---

## 🛠️ Detailed Usage

> **Important:** Only one AxioDB instance should be initialized per application for consistency and security.

### Collection Creation Options

```javascript
createCollection(
  name: string,           // Name of the collection (required)
  isEncrypted?: boolean,  // Whether to encrypt the collection (default: false)
  encryptionKey?: string  // Custom encryption key (optional, auto-generated if not provided)
)
```

### Example

```javascript
const { AxioDB } = require("axiodb");
const db = new AxioDB();

const userDB = await db.createDB("MyDB");

// Create basic collection
const userCollection = await userDB.createCollection("Users");

// Create encrypted collection with custom key
const secureCollection = await userDB.createCollection(
  "SecureUsers",
  true,
  "mySecretKey",
);

await userCollection.insert({
  name: "John Doe",
  email: "john.doe@example.com",
  age: 30,
});

const results = await userCollection
  .query({ age: { $gt: 25 } })
  .Limit(10)
  .Sort({ age: 1 })
  .exec();
console.log(results);
```

---

## 🌟 Advanced Features

- **Multiple Databases:** Architect scalable apps with multiple databases and collections with flexible security
- **Aggregation Pipelines:** Complex data processing with MongoDB-like syntax
- **Encryption:** Military-grade AES-256 encryption for collections
- **Bulk Operations:** Efficient batch insert, update, and delete
- **Flexible Collection Types:** Basic or encrypted
- **Custom Query Operators:** `$gt`, `$lt`, `$in`, `$regex`, `$gte`, `$lte`, `$ne`, `$nin`, `$exists`, `$or`, `$and`
- **Schema-less Design:** Store any JSON structure without predefined schemas
- **Performance Optimization:** Fast lookups, pagination, and intelligent caching with random TTL
- **ACID Transactions:** Single-collection transactions with savepoints, rollback, and WAL recovery
- **Index Management:** Create custom indexes, automatic document-to-index sync on CRUD operations
- **Enterprise Data Management:** Bulk operations, conditional updates, atomic transactions

---

## 📖 API Reference

### AxioDB

- `createDB(dbName: string, schemaValidation: boolean = true): Promise<Database>`
- `deleteDatabase(dbName: string): Promise<SuccessInterface | ErrorInterface>`

### Database

- `createCollection(name: string, isEncrypted?: boolean, encryptionKey?: string): Promise<Collection>`
- `deleteCollection(name: string): Promise<SuccessInterface | ErrorInterface>`
- `getCollectionInfo(): Promise<SuccessInterface>`

### Collection

- `insert(document: object): Promise<SuccessInterface | ErrorInterface>`
- `insertMany(documents: object[]): Promise<SuccessInterface | ErrorInterface>`
- `query(query: object): Reader`
- `update(query: object): Updater`
- `delete(query: object): Deleter`
- `aggregate(pipeline: object[]): Aggregation`
- `startSession(options?: SessionOptions): Session`
- `newIndex(...fieldNames: string[]): Promise<SuccessInterface>`
- `dropIndex(indexName: string): Promise<SuccessInterface | ErrorInterface>`
- `getIndexes(): Promise<SuccessInterface | ErrorInterface>` — lists all indexes registered on the collection (**NEW!**)

### Reader

- `Limit(limit: number): Reader`
- `Skip(skip: number): Reader`
- `Sort(sort: object): Reader`
- `setCount(count: boolean): Reader`
- `setProject(project: object): Reader`
- `exec(): Promise<SuccessInterface | ErrorInterface>`
- `findOne(): Promise<SuccessInterface | ErrorInterface>`

### Transaction (Session)

- `startSession(options?: { timeout?: number }): Session`
- `session.withTransaction(callback: Function): Promise<any>`
- `session.startTransaction(): Transaction`
- `transaction.insert(document: object): Transaction`
- `transaction.update(query: object, update: object): Transaction`
- `transaction.delete(query: object): Transaction`
- `transaction.savepoint(name: string): Transaction`
- `transaction.rollbackToSavepoint(name: string): Transaction`
- `transaction.commit(): Promise<SuccessInterface>`
- `transaction.rollback(): Promise<void>`

---

## 🎯 When to Use AxioDB

**Perfect For:**
- 🖥️ Desktop apps (Electron, Tauri)
- 🛠️ CLI tools
- 📦 Embedded systems
- 🚀 Rapid prototyping
- 🏠 Local-first applications
- 💻 Node.js apps requiring local storage

**Sweet Spot:** 10K-500K documents with intelligent caching

---

## 💭 Honest Positioning

**AxioDB is not competing with PostgreSQL or MongoDB.** It's for when you need a database embedded in your app—no server setup, no native dependencies. Think SQLite-scale with MongoDB-style queries and built-in caching.

When you outgrow AxioDB (1M+ documents, distributed systems), migrate to PostgreSQL or MongoDB. That's the right choice, and we support it.

---

## ⚠️ Limitations & Scale Considerations

### Scale & Performance Boundaries

- **Dataset Size:** Optimized for 10K-500K documents. For 10M+ documents, use PostgreSQL, MongoDB, or SQLite which are designed for massive scale.

- **Concurrency:** Single-instance architecture. For multi-user web applications with hundreds of concurrent connections, use traditional client-server databases.

- **Relational Data:** Document-based NoSQL architecture. No JOIN operations. For complex relational data with foreign keys and constraints, use SQL databases.

- **Distributed Systems:** Single-node only. No replication, no sharding, no clustering. For distributed systems, use MongoDB or CouchDB.

- **Transactions:** Single-collection ACID transactions supported. Cross-collection transactions are not supported. For multi-collection transaction requirements, use PostgreSQL or MongoDB.

---

## ⚖️ AxioDB vs lowdb, nedb, better-sqlite3

| Feature | lowdb | nedb | better-sqlite3 | AxioDB |
|---------|-------|------|---------------|--------|
| **Maintained** | ✅ | ❌ Abandoned | ✅ | ✅ |
| **Native bindings** | ✅ None | ✅ None | ❌ Yes (C/node-gyp) | ✅ None |
| **Storage** | Single JSON file | Single file / in-memory | Single .db file | File-per-document |
| **Query language** | JS/Lodash | JS objects | SQL strings | JS objects (MongoDB-style) |
| **Built-in caching** | ❌ | ❌ | ❌ | ✅ InMemoryCache |
| **Worker Threads** | ❌ | ❌ | ❌ | ✅ |
| **ACID Transactions** | ❌ | ❌ | ✅ | ✅ |
| **AES-256 Encryption** | ❌ | ❌ | ❌ | ✅ |
| **Aggregation Pipelines** | ❌ | Partial | ❌ | ✅ MongoDB-compatible |
| **TypeScript support** | ✅ | Partial | ✅ | ✅ Full |
| **Electron compatible** | ✅ | ✅ | ❌ (requires rebuild) | ✅ |
| **Sweet spot** | <5K docs | <100K docs | 10M+ (relational) | 10K–500K docs |
| **Built-in GUI** | ❌ | ❌ | ❌ | ✅ localhost:27018 |

---

## ❓ FAQ

**Q: What is AxioDB?**
An embedded NoSQL database for Node.js. Pure JavaScript, zero native dependencies. `npm install axiodb` and you have a database — no server, no node-gyp, no electron-rebuild.

**Q: Is AxioDB a replacement for MongoDB?**
No. AxioDB is embedded (runs inside your app). MongoDB is a client-server database for multi-user systems. Use AxioDB for desktop apps, CLI tools, and local-first apps up to 500K documents. Use MongoDB when you need a shared networked database.

**Q: Does AxioDB work with Electron?**
Yes — this is the primary use case it was built for. Zero native dependencies means no `electron-rebuild`, no platform-specific `.node` files, no compilation step.

**Q: What is the difference between AxioDB and better-sqlite3?**
`better-sqlite3` uses C native bindings and requires `node-gyp` compilation. AxioDB is pure JavaScript — no compilation, works across all platforms including Electron without a rebuild step. AxioDB also uses MongoDB-style JSON queries instead of SQL strings.

**Q: What is the difference between AxioDB and lowdb?**
`lowdb` stores everything in a single JSON file — it gets slow above 1,000–5,000 records because every read parses the entire file. AxioDB uses file-per-document storage, InMemoryCache, Worker Threads, and auto-indexing — optimized for 10K–500K documents with O(1) lookups by documentId.

**Q: What is the difference between AxioDB and nedb?**
NeDB is abandoned since 2016. AxioDB is actively maintained with TypeScript, ACID transactions, Worker Threads, AES-256 encryption, custom field indexing, built-in GUI, and AxioDBCloud remote access.

**Q: How many documents can AxioDB handle?**
Optimized for 10,000–500,000 documents. For 1M+, use PostgreSQL or MongoDB. documentId lookups take ~1ms on 10K documents with InMemoryCache.

**Q: Does AxioDB support TypeScript?**
Yes. Full type definitions are included — no separate `@types` package needed.

**Q: Does AxioDB work in the browser?**
No. AxioDB requires Node.js (v20+) and the filesystem. Server-side and desktop only.

**Q: What is AxioDBCloud?**
TCP-based remote access for AxioDB. Deploy AxioDB in Docker, connect from multiple clients with the exact same API. Supports 1,000+ concurrent connections with auto-reconnect. Optional username/password authentication (`TCPAuth: true`) reuses the same RBAC accounts as the GUI.

---

## 🔮 Future Roadmap

- **Data Export & Import:** Seamless data migration with support for JSON, CSV, and native AxioDB formats
- **Enhanced Web GUI:** Advanced web interface with real-time analytics, visual query builder, and performance monitoring
- **Comprehensive Documentation:** Extensive tutorials, interactive examples, and complete API references for all skill levels
- **Performance Optimizations:** Continued improvements to query performance and caching strategies

---

## 🤝 Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

## 📜 License

MIT License. See [LICENSE](LICENSE).

---

## 🙌 Acknowledgments

Special thanks to all contributors and supporters of AxioDB. Your feedback and contributions make this project better!

---

## 📋 Requirements

- **Node.js:** >=20.0.0
- **npm:** >=6.0.0
- **yarn:** >=1.0.0 (optional)

---

## 🌐 Documentation Website

The AxioDB documentation is built with:
- **React 18** with TypeScript
- **Vite** for fast development and building
- **TailwindCSS** for styling
- **Lucide React** for icons

To run the documentation locally:

```bash
cd Document
npm install
npm run dev
```

The documentation site will be available at `http://localhost:5173`

---

## 📝 Author

**Ankan Saha**

---

## 💖 Support

If you find AxioDB helpful, consider:
- ⭐ Starring the repository
- 🐛 Reporting issues
- 💡 Suggesting features
- 🤝 Contributing code
- 💰 [Sponsoring the project](https://github.com/sponsors/AnkanSaha)

---

