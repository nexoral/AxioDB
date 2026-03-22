# AxioDB: The Pure JavaScript Alternative to SQLite

[![npm version](https://badge.fury.io/js/axiodb.svg)](https://badge.fury.io/js/axiodb)
[![npm downloads](https://img.shields.io/npm/dm/axiodb.svg)](https://www.npmjs.com/package/axiodb)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

[![Push to Registry](https://github.com/nexoral/AxioDB/actions/workflows/Push.yml/badge.svg?branch=main)](https://github.com/nexoral/AxioDB/actions/workflows/Push.yml)
[![CodeQL](https://github.com/nexoral/AxioDB/actions/workflows/github-code-scanning/codeql/badge.svg?branch=main)](https://github.com/nexoral/AxioDB/actions/workflows/github-code-scanning/codeql)
[![Socket Security](https://socket.dev/api/badge/npm/package/axiodb)](https://socket.dev/npm/package/axiodb)

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen)](https://nodejs.org)
[![Tested on Node.js](https://img.shields.io/badge/tested%20on-20%20%7C%2021%20%7C%2022%20%7C%2023%20%7C%2024%20(all%20LTS)-blue)](https://github.com/nexoral/AxioDB/actions/workflows/Push.yml)
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
const db = new AxioDB(false, 'MyDB', '.', true); // Enable TCP on port 27019
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

### Features

✅ **35+ Commands** - Full CRUD, aggregation, indexing
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
const db = new AxioDB(true); // GUI available at localhost:27018

// With custom database path
const db = new AxioDB(true, "MyDB", "./custom/path");
```

### GUI Features

- 📊 Visual database and collection browser
- 🔍 Real-time data inspection
- 📝 Query execution interface
- 📈 Performance monitoring
- 🎯 No external dependencies required

Access the GUI at `http://localhost:27018` when enabled.

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
const db = new AxioDB(true); // Enable GUI at localhost:27018

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
- `createIndex(fieldName: string): Promise<SuccessInterface>`
- `dropIndex(indexName: string): Promise<SuccessInterface | ErrorInterface>`

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

## 🤝 Contributing

We welcome contributions from the community! Whether it's code improvements, documentation updates, bug reports, or feature suggestions, your input helps make AxioDB better. Please read the [CONTRIBUTING.md](CONTRIBUTING.md) file for guidelines on how to get started.

---

## 📜 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

## 🙌 Acknowledgments

Special thanks to all contributors and supporters of AxioDB. Your feedback and contributions make this project better!
