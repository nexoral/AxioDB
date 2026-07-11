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

👉 **[Official Documentation](https://axiodb.in/)**: Access full guides, examples, and API references.

---

## Table of Contents

- [What is AxioDB, and why does it exist?](#what-is-axiodb-and-why-does-it-exist)
- [Installation](#-installation)
- [Quick Start — Local AxioDB](#-quick-start--local-axiodb)
- [Features](#-features)
- [AxioDBCloud — Connecting Remotely](#-axiodbcloud--connecting-remotely)
  - [Simple: connect without authentication](#simple-connect-without-authentication)
  - [Advanced: TCP authentication](#advanced-tcp-authentication)
  - [Advanced: TLS encryption](#advanced-tls-encryption)
- [Troubleshooting](#-troubleshooting)
- [Docker Deployment](#-docker-deployment)
  - [Simple: run the container](#simple-run-the-container)
  - [Advanced: env vars, volumes, Compose](#advanced-env-vars-volumes-compose)
- [MCP Server — AI Agent Integration](#-mcp-server--ai-agent-integration)
- [Built-in Web GUI & Authentication (RBAC)](#-built-in-web-gui--authentication-rbac)
- [Detailed Usage](#-detailed-usage)
- [API Reference](#-api-reference)
- [Best Practices](#-best-practices)
- [Architecture & Internal Mechanisms](#-architecture--internal-mechanisms)
- [Comparisons](#-comparisons)
- [Limitations & Honest Positioning](#-limitations--honest-positioning)
- [FAQ](#-faq)
- [Contributing, License & Support](#-contributing-license--support)

---

## What is AxioDB, and why does it exist?

**AxioDB is an embedded NoSQL database for Node.js, with MongoDB-style queries, zero native dependencies, and a built-in web GUI.** Think SQLite, but NoSQL — install it with npm, and you have a working database with no server, no compilation step, and no platform-specific binaries.

### The problem

SQLite is great, but its native C bindings cause real deployment pain in JavaScript projects:

- ❌ `electron-rebuild` on every Electron update
- ❌ Platform-specific builds (Windows `.node` files ≠ Mac `.node` files)
- ❌ SQL strings instead of JavaScript objects
- ❌ Schema migrations when your data model changes
- ❌ `node-gyp` compilation headaches

Meanwhile, plain JSON files have no querying, no caching, and no indexing — they just don't scale past a few thousand records. And MongoDB solves the query/caching problem, but needs a separate server process, which is overkill for a desktop app, CLI tool, or embedded system.

### The solution

AxioDB combines the parts of each that actually matter for an embedded use case:

- ✅ Works everywhere Node.js runs — no rebuild, no native dependencies
- ✅ MongoDB-style queries: `{ age: { $gt: 25 } }`
- ✅ Schema-less JSON documents — no migrations
- ✅ Built-in `InMemoryCache` with automatic invalidation
- ✅ Multi-core parallelism with Worker Threads
- ✅ Built-in web GUI at `localhost:27018`
- ✅ AxioDBCloud — optional TCP remote access for Docker/cloud deployments

### Is it a fit for you?

**Great fit for:**
- 🖥️ Desktop apps (Electron, Tauri)
- 🛠️ CLI tools
- 📦 Embedded systems
- 🚀 Rapid prototyping
- 🏠 Local-first applications
- 💻 Node.js apps requiring local storage

**Sweet spot:** 10K–500K documents with intelligent caching.

**Not a fit for:**
- 10M+ documents, or datasets that need to scale far beyond a single node → use PostgreSQL, MongoDB, or SQLite
- Multi-user web applications with hundreds of concurrent connections → AxioDB is single-instance, not a client-server database
- Relational data with JOINs and foreign-key constraints → AxioDB is document-based NoSQL
- Distributed systems needing replication, sharding, or clustering → AxioDB is single-node only
- Cross-collection ACID transactions → AxioDB's transactions are scoped to a single collection

**AxioDB isn't competing with PostgreSQL or MongoDB.** It's for when you need a database *embedded in your app* — no server setup, no native dependencies. When you outgrow it, migrating to PostgreSQL or MongoDB is the right call, and expected.

---

## 📦 Installation

```bash
npm install axiodb@latest --save
```

**Requirements:** Node.js ≥20.0.0, npm ≥6.0.0 (yarn ≥1.0.0 optional). AxioDB runs on Node.js servers only — it requires the filesystem, so it does not run in a browser.

---

## 🛠️ Quick Start — Local AxioDB

```javascript
const { AxioDB } = require('axiodb');

// Create AxioDB instance with the built-in GUI enabled
const db = new AxioDB({ GUI: true }); // GUI available at http://localhost:27018

// Create a database and a collection
const myDB = await db.createDB('HelloWorldDB');
const collection = await myDB.createCollection('greetings');

// Insert and query — Hello World! 👋
await collection.insert({ message: 'Hello, Developer! 👋' });
const result = await collection.query({}).exec();
console.log(result.data.documents[0].message); // Hello, Developer! 👋
```

> **Only one `AxioDB` instance per application.** It's a singleton by design — create it once, then create as many databases and collections as you need under it.

### `new AxioDB(options?)` — all constructor options

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `GUI` | `boolean` | `false` | Enable the web-based GUI dashboard at `localhost:27018` |
| `RootName` | `string` | `"AxioDB"` | Name of the root folder database files are stored under |
| `CustomPath` | `string` | current working directory | Custom filesystem path for database storage |
| `TCP` | `boolean` | `false` | Enable the AxioDBCloud TCP server on port 27019 |
| `TCPAuth` | `boolean` | `false` | Require username/password authentication on TCP connections (same RBAC accounts as the GUI) — see [Advanced: TCP authentication](#advanced-tcp-authentication) |

```javascript
const db = new AxioDB({
  GUI: true,
  RootName: 'MyDB',
  CustomPath: './data',
  TCP: true,
  TCPAuth: true,
});
```

---

## 🚀 Features

### Querying
- **Chainable Query API:** `.query()`, `.Sort()`, `.Limit()`, `.Skip()`, `.setCount()`, `.setProject()`, `.exec()` / `.findOne()`
- **MongoDB-style Query Operators:** `$gt`, `$gte`, `$lt`, `$lte`, `$ne`, `$in`, `$nin`, `$exists`, `$regex`, `$or`, `$and`
- **Aggregation Pipelines:** MongoDB-compatible (`$match`, `$group`, `$sort`, `$project`, `$limit`, `$skip`, `$unwind`, `$addFields`, ...)
- **Bulk Operations:** high-performance `insertMany`, `UpdateMany`, `deleteMany`

### Indexing
- **Auto Indexing:** every collection gets an automatic `documentId` index for O(1) lookups
- **Custom Field Indexes:** `newIndex(...fieldNames)` to add fast lookups on any field, `dropIndex(indexName)` to remove one, `getIndexes()` to list what's registered
- **Index Cache with TTL:** in-memory index cache with random 5–15 min TTL (prevents cache stampede) and disk persistence for cold-start recovery
- **Automatic Document Removal:** documents are automatically removed from indexes when deleted
- **Dual-Write Pattern:** indexes persist to both memory (speed) and disk (durability)

### Transactions
- **ACID-compliant, single-collection transactions** with savepoints, rollback, and Write-Ahead Logging (WAL) for crash recovery
- **Session Management:** scoped transactions with timeout support

```javascript
const session = collection.startSession();
await session.withTransaction(async (tx) => {
  await tx.insert({ name: 'Alice', balance: 1000 });
  await tx.update({ name: 'Bob' }, { $inc: { balance: -100 } });
  // Auto-commits on success, auto-rolls-back on error
});
```

### Caching
- **`InMemoryCache`:** automatic eviction policies, random TTL (5–15 min) to avoid thundering-herd cache expiry
- **Selective Invalidation:** only the affected cache entries are cleared on update/delete — not the whole cache
- **Async, Non-blocking Updates:** cache writes don't block the response path
- **Collection-Scoped Keys:** cache keys include the collection path, so there's no cross-collection collision

### Encryption & Security
- **AES-256 Encryption:** optional per collection, with an auto-generated or custom key
- **File-level Isolation:** each document lives in its own `.axiodb` file with locking
- See [Built-in Web GUI & Authentication](#-built-in-web-gui--authentication-rbac) for RBAC/login and [Security Best Practices](#-best-practices) below

### Architecture
- **Tree-like Storage:** hierarchical, file-per-document layout for efficient retrieval, selective loading, and easy backup
- **Worker Threads:** non-blocking I/O and multi-core utilization, especially for reads
- **Single Instance Architecture:** one `AxioDB` instance manages unlimited databases and collections, with strong consistency
- **Zero-Configuration Setup:** serverless — install and start building instantly
- **Custom Database Path:** flexible storage location via `CustomPath`

### GUI & Remote Access
- **Web-based GUI Dashboard:** visual database browser, query execution, real-time monitoring at `localhost:27018`
- **Role-Based Access Control:** Super Admin / Admin / View roles, shared between the GUI and AxioDBCloud
- **AxioDBCloud:** TCP-based remote access — connect to a running AxioDB instance from anywhere with the exact same API as embedded mode

---

## ☁️ AxioDBCloud — Connecting Remotely

**Host AxioDB in Docker or on a server, connect from anywhere** — AxioDBCloud is a TCP client that mirrors the embedded API exactly, so switching from local to remote is a one-line change (`new AxioDB()` → `new AxioDBCloud()`).

- **🔄 Zero Code Changes:** same `createDB`/`createCollection`/`insert`/`query` API as embedded AxioDB
- **⚡ Fast Binary Protocol:** length-prefixed JSON framing, with automatic reconnection
- **🔐 Optional Authentication:** shared RBAC with the GUI, per-IP rate limiting (see [Advanced](#advanced-tcp-authentication) below)
- **📦 35+ Commands:** full CRUD, aggregation, and indexing over the wire
- **🔁 Auto-Reconnect:** exponential backoff, up to 10 retry attempts
- **💓 Heartbeat Monitoring:** `PING`/`PONG` every 30 seconds
- **🆔 Request Correlation:** UUID-based request/response matching
- **🧵 Connection Pooling:** client keeps a pool of `maxPoolSize` concurrent connections (default: 10, mirrors MongoDB's driver option) and routes each command to the least-busy connected member (fewest in-flight requests); server accepts 1,000+ concurrent connections total, capped at 100 per remote IP (see the [file descriptor limit note](#connection-refused--too-many-open-files-errors-at-high-concurrency) below if you're running near that scale)
- **🛡️ Connection-Level DoS Protection:** per-IP concurrent connection cap (100) plus a separate per-IP connection-*attempt* rate limiter (300 attempts / 10s → 30s cooldown), so one client can't starve the server either by holding too many sockets open or by rapidly opening and dropping them
- **🔒 Optional TLS Encryption:** encrypt the wire protocol with your own cert (see [Advanced: TLS](#advanced-tls-encryption) below) — off by default, so existing plaintext deployments are unaffected unless you turn it on
- **📐 TypeScript Support:** full type definitions included

**Use cases:** microservices sharing one AxioDB instance, Electron apps connecting to a local or remote database, teams sharing a development database, container/cloud deployments (AWS, Azure, GCP, DigitalOcean).

### Simple: connect without authentication

By default, TCP connections are unauthenticated — anyone who can reach the port can run any command. This is fine for local development or a fully trusted private network.

**Server:**
```javascript
const { AxioDB } = require('axiodb');
const db = new AxioDB({ GUI: false, RootName: 'MyDB', CustomPath: '.', TCP: true }); // TCP on port 27019
```

**Client:**
```javascript
const { AxioDBCloud } = require('axiodb');

const client = new AxioDBCloud("axiodb://localhost:27019");
await client.connect();

const db = await client.createDB("ProductionDB");
const users = await db.createCollection("Users");

await users.insert({ name: "Alice", role: "admin" });
const results = await users.query({ role: "admin" })
  .Limit(10)
  .Sort({ createdAt: -1 })
  .exec();

await client.disconnect();
```

### Advanced: TCP authentication

Opt in with `TCPAuth: true` to require a username/password on every connection. This reuses the **exact same accounts and roles** as the GUI's RBAC system (see [Built-in Web GUI & Authentication](#-built-in-web-gui--authentication-rbac)) — one set of credentials for both.

**Server:**
```javascript
const db = new AxioDB({ TCP: true, TCPAuth: true, RootName: 'MyDB', CustomPath: '.' });
```

**Client — credentials in the constructor** (recommended; `connect()` authenticates automatically):
```javascript
const client = new AxioDBCloud("axiodb://localhost:27019", {
  username: 'admin',
  password: 'admin',
});
await client.connect();

console.log(client.authenticatedUser); // { username, role, mustChangePassword }
```

**Client — authenticate after connecting** (e.g. credentials supplied at runtime):
```javascript
const client = new AxioDBCloud("axiodb://localhost:27019");
await client.connect();
await client.login('admin', 'admin');
```

**What's enforced:**
- Every command except `PING`/`DISCONNECT`/`AUTHENTICATE` requires a prior successful login on that connection.
- The same role permissions as the GUI apply per command (e.g. a `View`-role user gets `403` on `CREATE_DB`).
- **Shared per-IP login rate limiter with the GUI:** 5 failed attempts within a trailing 15-minute window locks that IP out for 15 minutes (`429 Too Many Requests`) — counted across both TCP and GUI login attempts from that IP.
- **Accounts that still need their forced password change are rejected outright (`403`)**, not allowed through with a warning — there's no TCP command to change a password today, so log into the GUI (`http://localhost:27018`) to complete it first, or authenticate with an account that already has.
- If a Super Admin resets a user's password, changes their role, or deletes them via the GUI while that user has an open TCP connection, the TCP connection is immediately forced to re-authenticate on its next command.

**Known limitations:** there's currently no TCP command to change a password; that must go through the GUI.

### Advanced: TLS encryption

By default, the TCP protocol is **plaintext** — anyone who can capture the network traffic between client and server (e.g. Wireshark on a shared network) can read your data and, if `TCPAuth` is on, your password. TLS fixes this. It's **off by default** — nothing below is required, and existing plaintext deployments keep working exactly as before unless you turn it on.

**You must provide your own certificate + key.** AxioDB never generates one for you — that's a security decision only you can make (a real cert from a CA, or a self-signed one for local/private use).

**Step 1 — get a cert + key.** For local/dev/private use, generate a self-signed one (one-time, takes a second):
```bash
openssl req -x509 -newkey rsa:2048 -keyout key.pem -out cert.pem -days 365 -nodes -subj "/CN=localhost"
```
This creates two files, `cert.pem` and `key.pem`, in your current folder. For a real production deployment reachable from the internet, use a cert from a real CA (Let's Encrypt, your org's CA, your cloud provider's managed cert) instead — the rest of the setup below is identical either way.

**Step 2 — point the server at them:**
```javascript
const { AxioDB } = require('axiodb');
const db = new AxioDB({
  TCP: true,
  TLS: true,
  TLSCertPath: './cert.pem', // path to the file from step 1
  TLSKeyPath: './key.pem',
});
```
If `TLS: true` but either path is missing or unreadable, AxioDB throws immediately at startup — it never silently falls back to plaintext.

**Step 3 — point the client at the same cert** (only needed because it's self-signed; a real CA-issued cert wouldn't need this step, the same way your browser trusts `https://` sites without extra setup):
```javascript
const { AxioDBCloud } = require('axiodb');
const client = new AxioDBCloud("axiodb://localhost:27019", {
  tls: true,
  tlsCAPath: './cert.pem', // same cert.pem from step 1 - proves this server is the real one
});
await client.connect();
```
Without `tlsCAPath`, the client refuses to connect to a self-signed server by default (`tlsRejectUnauthorized` defaults to `true`) — this is intentional, it's the same protection that stops your browser from silently trusting a fake `https://` site. Only set `tlsRejectUnauthorized: false` for local/dev testing, never in production, since it turns that protection off entirely.

**Running this in Docker?** The cert/key files need to get *into* the container. The simplest way to think about it: your cert files live on your real machine; a Docker **bind mount** (`-v`) makes a folder from your machine visible inside the container at whatever path you choose, and you point `AXIODB_TLS_CERT_PATH`/`AXIODB_TLS_KEY_PATH` at *that in-container path*, not your real machine's path:
```bash
# cert.pem and key.pem are really at /home/you/mycerts/ on your machine.
# "/certs" below is just a name we're choosing for where they'll appear inside the container.
docker run -d --name axiodb-server \
  -p 27018:27018 -p 27019:27019 \
  -v /home/you/mycerts:/certs:ro \
  -e AXIODB_TLS=true \
  -e AXIODB_TLS_CERT_PATH=/certs/cert.pem \
  -e AXIODB_TLS_KEY_PATH=/certs/key.pem \
  theankansaha/axiodb
```
The rule: the `-e AXIODB_TLS_CERT_PATH=...` value must always match the *right-hand side* of the `-v` mount (`/certs/...`), never the real path on your machine (`/home/you/mycerts/...`) — the container can't see your machine's filesystem directly, only whatever you've explicitly mounted into it.

👉 **[Full AxioDBCloud Documentation](https://axiodb.in/cloud)** — setup guides, API reference, Docker examples

---

## 🔧 Troubleshooting

### "Not connected to server" right after calling `connect()`

`client.connect()` is asynchronous and must be `await`ed before you use the connection — it resolves only once the TCP handshake (and, if `TCPAuth` is on, the `AUTHENTICATE` round-trip) has completed.

```javascript
// ❌ Wrong — races ahead before the connection (and login) finish
client.connect();
console.log(client.authenticatedUser); // undefined
await client.createDB("MyDB");         // "Not connected to server"

// ✅ Right
await client.connect();
console.log(client.authenticatedUser); // populated
await client.createDB("MyDB");         // works
```

### `401` — "Authentication required..."

You're running with `TCPAuth: true` and sent a command before a successful `AUTHENTICATE`. Either pass `{ username, password }` in the `AxioDBCloud` constructor (auto-authenticates on `connect()`), or call `await client.login(username, password)` yourself before any other command.

### `403` — "This account must change its password before it can be used over TCP..."

Your credentials are correct, but that account is still flagged for a forced password change (true for the default `admin`/`admin` account, and for any newly created user). Log into the GUI at `http://localhost:27018`, sign in, and complete the password change there — there's no TCP command for this yet. Then reconnect with the new password, or use a different account that has already completed its change.

### `429` — "Too many failed login attempts..."

Five failed logins from your IP within 15 minutes trigger a 15-minute lockout, shared between TCP and the GUI. Double check the credentials you're sending, wait out the cooldown, or fix the underlying typo/config issue causing repeated failures — there's no way to clear the lockout early.

### `429` — "Too many concurrent connections from this IP address"

Unrelated to the login lockout above — this fires at connection time, before any `AUTHENTICATE`, once a single remote IP has 100 concurrent open TCP sockets to the server (`MAX_CONNECTIONS_PER_IP`), regardless of whether any of those connections are authenticated. This caps how much of the server's total 1,000-connection budget one IP can claim, so one client can't starve every other client. It's per-*connection*, not per-*request* — a single `AxioDBCloud` client at the default `maxPoolSize: 10` is nowhere near this limit; you'd only hit it by running many separate client processes behind the same IP/NAT gateway, or a runaway reconnect loop leaking sockets. If you legitimately need more than 100 concurrent connections from one IP, that's a server-side constant (`MAX_CONNECTIONS_PER_IP` in `source/tcp/config/keys.ts`) — there's no runtime option to raise it yet.

If you do set a `maxPoolSize` that pushes past this cap (or any other subset of the pool fails for another reason, e.g. a network blip), `connect()` doesn't throw as long as at least one pool member connected — it resolves with a smaller-than-requested pool and emits a `poolDegraded` event so you know about it instead of silently running under capacity:

```javascript
client.on('poolDegraded', ({ requested, connected, failed, errors }) => {
  console.warn(`Pool came up smaller than requested: ${connected}/${requested} connected, ${failed} failed`);
  console.warn(errors[0].message); // e.g. "Too many concurrent connections from this IP address"
});

await client.connect(); // resolves even if some pool members were rejected
```

(The very first connection in the pool is the exception — if *that* one fails, `connect()` rejects entirely, since it's the signal that the server is reachable and credentials are valid at all.)

### `429` — "Too many connection attempts from this IP address. Try again later."

Different from both `429`s above, and checked first: this guards against rapid connect-then-drop *churn*, which the concurrent-connection cap (`MAX_CONNECTIONS_PER_IP`) doesn't catch on its own — an attacker who never holds more than a few sockets open at once could still hammer the server with a high rate of connection attempts, each costing a TCP handshake and an accept/reject cycle, and stay under that cap the whole time. This is tracked separately, per IP, as a sliding window: once an IP crosses 300 connection attempts (successful or rejected, it doesn't matter which) within a trailing 10-second window, every new connection from that IP is rejected outright for the next 30 seconds. A normal `AxioDBCloud` client, even reconnecting a full `maxPoolSize: 10` pool repeatedly, is nowhere near this threshold — you'd only hit it via a genuine connection flood or a reconnect loop gone very wrong (e.g. retrying without backoff). There's no runtime option to raise these thresholds yet; they're constants in `source/tcp/config/keys.ts` (`CONNECTION_RATE_LIMIT_*`).

### `403` — "This is a reserved system database"

You (or a client) tried to read/write a database literally named `config` — that name is reserved for AxioDB's own RBAC storage (`users`/`roles`/`permissions`) and is blocked on both the GUI and TCP, authenticated or not. Use a different database name.

### Connection refused / timeout connecting to `axiodb://host:27019`

- Confirm the server was started with `TCP: true` (or, in Docker, `AXIODB_TCP=true`, the default).
- Confirm the port is published: `-p 27019:27019` on `docker run`, or that nothing else on the host is bound to 27019.
- If you're getting a protocol error mentioning "Message exceeds maximum size" or "Received HTTP data on TCP port," you're likely pointed at the GUI port (27018) instead of the TCP port (27019) — check your connection string.

### Docker container issues (won't start, port conflicts, data not persisting)

See the [Docker Deployment](#-docker-deployment) section below, and `Docker/README.md` in the repository for a fuller Docker-specific troubleshooting guide (`docker logs`, port-conflict remapping, volume-mounting checklist).

### Connection refused / "Too many open files" errors at high concurrency

Each `AxioDBCloud` client opens `maxPoolSize` TCP sockets (default: 10), and the server holds one socket per connected client — both count against the OS's open-file-descriptor limit. Most Linux distros default `ulimit -n` to 1024 per process, which is enough for only ~100 clients at the default pool size before the server starts refusing new connections with `EMFILE`/`ENFILE`.

If you're deploying towards the 1,000+ concurrent connections the server supports, raise the limit before starting the process:

```bash
ulimit -n 65536          # current shell / process
node lib/config/DB.js
```

In Docker, set it on the container instead of the host shell:

```bash
docker run --ulimit nofile=65536:65536 -p 27018:27018 -p 27019:27019 theankansaha/axiodb
```

or, in Compose:

```yaml
services:
  axiodb:
    image: theankansaha/axiodb
    ulimits:
      nofile:
        soft: 65536
        hard: 65536
```

On the client side, prefer a smaller `maxPoolSize` per instance rather than raising it — the least-busy routing (see [Connection Pooling](#-axiodbcloud--connecting-remotely) above) already avoids the head-of-line blocking a bigger pool would otherwise compensate for.

---

## 🐳 Docker Deployment

### Simple: run the container

```bash
docker run -d \
  --name axiodb-server \
  -p 27018:27018 \
  -p 27019:27019 \
  -e AXIODB_TCP_AUTH=true \
  -v axiodb-data:/app \
  theankansaha/axiodb

# Ports:
# 27018 - HTTP GUI Dashboard
# 27019 - TCP Remote Access (AxioDBCloud)
# Volume: /app is the main data directory
```

TCP authentication is on by default in the image. Log into the GUI at `http://localhost:27018` as `admin`/`admin` to complete the forced password change before connecting over TCP (see [Troubleshooting](#-troubleshooting) if you skip this step).

### Advanced: env vars, volumes, Compose

Every option below has a default matching the image's previous fixed behavior — override any of them with `-e VAR=value` at `docker run` time, no rebuild required:

| Variable | Default | Description |
| --- | --- | --- |
| `AXIODB_GUI` | `true` | Enable the HTTP Control Server / web GUI on port 27018 |
| `AXIODB_TCP` | `true` | Enable the AxioDBCloud TCP server on port 27019 |
| `AXIODB_TCP_AUTH` | `true` | Require username/password authentication on TCP connections (same RBAC accounts as the GUI) |
| `AXIODB_TLS` | `false` | Encrypt TCP connections with TLS instead of plaintext (see [Advanced: TLS encryption](#advanced-tls-encryption)) |
| `AXIODB_TLS_CERT_PATH` | *(none)* | Path **inside the container** to a PEM cert file - required when `AXIODB_TLS=true`. Mount the real file in with `-v` first (see the TLS section above) |
| `AXIODB_TLS_KEY_PATH` | *(none)* | Path **inside the container** to the matching PEM private key - required when `AXIODB_TLS=true` |
| `AXIODB_ROOT_NAME` | `AxioDB` | Name of the root database folder created under the data volume |
| `AXIODB_CUSTOM_PATH` | *(container's working directory)* | Custom path for database storage inside the container |
| `AXIODB_MCP` | `false` | Enable the MCP server (AI agent integration) on port 27020 - see [MCP Server](#-mcp-server--ai-agent-integration) |
| `AXIODB_MCP_PORT` | `27020` | Port the MCP server listens on inside the container |

> Ports themselves (27018/27019) aren't configurable via environment variable — remap them at the Docker layer with `-p <host-port>:27018` / `-p <host-port>:27019`.

**Disabling TCP authentication** (only on a trusted private network — the wire is plaintext unless you also enable `AXIODB_TLS`; see [Advanced: TLS encryption](#advanced-tls-encryption)):
```bash
docker run -d \
  --name axiodb-server \
  -p 27018:27018 \
  -p 27019:27019 \
  -e AXIODB_TCP_AUTH=false \
  -v axiodb-data:/app \
  theankansaha/axiodb
```

**Docker Compose:**
```yaml
version: "3.8"

services:
  axiodb:
    image: theankansaha/axiodb
    container_name: axiodb-server
    ports:
      - "27018:27018"
      - "27019:27019"
    environment:
      - AXIODB_GUI=true
      - AXIODB_TCP=true
      - AXIODB_TCP_AUTH=true
      - AXIODB_ROOT_NAME=AxioDB
    volumes:
      - axiodb-data:/app
    restart: unless-stopped

volumes:
  axiodb-data:
```

**The same, with TLS enabled** — note the two different kinds of entry under `volumes:`: `./mycerts:/certs:ro` is *your real folder* on the machine running Compose (because it contains a `/`), mounted read-only at `/certs` inside the container; `axiodb-data:/app` is a Docker-managed named volume (no `/`, just a label) for the actual database files:
```yaml
version: "3.8"

services:
  axiodb:
    image: theankansaha/axiodb
    container_name: axiodb-server
    ports:
      - "27018:27018"
      - "27019:27019"
    environment:
      - AXIODB_GUI=true
      - AXIODB_TCP=true
      - AXIODB_TCP_AUTH=true
      - AXIODB_TLS=true
      - AXIODB_TLS_CERT_PATH=/certs/cert.pem
      - AXIODB_TLS_KEY_PATH=/certs/key.pem
      - AXIODB_ROOT_NAME=AxioDB
    volumes:
      - ./mycerts:/certs:ro      # your real cert.pem/key.pem folder -> /certs in the container
      - axiodb-data:/app         # Docker-managed volume for database files
    restart: unless-stopped

volumes:
  axiodb-data:
```

**Building the image from source, and a fuller Docker troubleshooting guide** (container won't start, port-in-use, data-persistence checks) live in [`Docker/README.md`](Docker/README.md) — the canonical Docker doc, not duplicated here in full.

---

## 🤖 MCP Server — AI Agent Integration

Spin up the same Docker container with `AXIODB_MCP=true` and let Claude (or any MCP-compatible
AI agent) talk to your AxioDB instance directly — 32 tools covering databases, collections,
documents, aggregation, indexes, dashboard stats, and user/role management, all gated by the
same RBAC as the web GUI. It runs in the same process as your existing container; nothing new
to install, no second database instance.

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

Every tool except `axiodb_login` requires a `sessionId` obtained by logging in first (default
seeded account: `admin`/`admin`, same as the GUI) — every subsequent call is checked against
that logged-in user's actual role, exactly like the HTTP Control Server. A View-role session
gets a real `403` on write tools; nothing is gated by a static container environment variable.

`AXIODB_MCP=true` only has RBAC to serve once it's actually seeded, which requires
`AXIODB_GUI=true` (the default) or `AXIODB_TCP=true` + `AXIODB_TCP_AUTH=true`.

Full tool catalogue, examples, and security notes: **[MCP Server docs](https://axiodb.in/mcp-server)**.

---

## 🎨 Built-in Web GUI & Authentication (RBAC)

AxioDB includes a built-in web-based GUI for database visualization and management — perfect for Electron apps and development environments.

### Enabling the GUI

```javascript
// Enable GUI when creating the AxioDB instance
const db = new AxioDB({ GUI: true }); // GUI available at localhost:27018

// With a custom database path
const db = new AxioDB({ GUI: true, RootName: "MyDB", CustomPath: "./custom/path" });
```

**GUI Features:** visual database and collection browser, real-time data inspection, query execution interface, performance monitoring, no external dependencies required. Access at `http://localhost:27018` when enabled.

### Authentication & Access Control

The Control Server ships with built-in login and role-based access control (RBAC) — the same system TCP's [`TCPAuth`](#advanced-tcp-authentication) reuses. On first start with `GUI: true` (or `TCP: true, TCPAuth: true`), AxioDB seeds a reserved `config` database (hidden from the regular database list) containing three collections — `users`, `roles`, `permissions` — and a default account:

```
Username: admin
Password: admin
```

You'll be forced to change this password on first login (this applies to every account, not just the default one — there's currently no way around it other than completing the change via the GUI). Three predefined roles are seeded automatically:

| Role | Access |
|------|--------|
| **Super Admin** | Full access, including creating users/roles |
| **Admin** | Full database/collection/document access, no user or role management |
| **View** | Read-only access to databases, collections, documents, and indexes |

A Super Admin can create additional roles from the predefined permission catalogue and create new users with any role. Sessions are held only in server memory (never persisted to disk) and are tied to an httpOnly cookie, so restarting the server logs everyone out.

**Login rate limiting:** after 5 failed login attempts from the same IP within a trailing 15-minute window, that IP is locked out for 15 minutes (`429 Too Many Requests`) — regardless of username. This limiter is shared with [TCP `AUTHENTICATE` attempts](#advanced-tcp-authentication) (see [Troubleshooting](#-troubleshooting) for what the error looks like).

**Index management:** the Control Server also exposes `GET /api/index/list`, `POST /api/index/create`, and `DELETE /api/index/delete`, gated by the same `index:view` / `index:create` / `index:delete` permissions (View role gets view-only, Admin and Super Admin get all three).

> **Security note:** RBAC protects the Control Server's HTTP API and TCP server, but the HTTP GUI itself has no TLS support - keep it on a trusted local/private network, not public internet exposure. The TCP server *can* be encrypted (see [Advanced: TLS encryption](#advanced-tls-encryption)), which is recommended if it's reachable over any untrusted network.

---

## 🛠️ Detailed Usage

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

// Create a basic collection
const userCollection = await userDB.createCollection("Users");

// Create an encrypted collection with a custom key
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
console.log(results.data.documents);
```

### Worked example: e-commerce product catalog

```javascript
const { AxioDB } = require('axiodb');
const db = new AxioDB();

const shopDB = await db.createDB('ecommerce');
const products = await shopDB.createCollection('products');

await products.insert({
  name: 'Laptop',
  price: 999.99,
  category: 'Electronics',
  inStock: true,
});

// Sorted, filtered query
const electronics = await products
  .query({ category: 'Electronics', inStock: true })
  .Sort({ price: 1 })
  .exec();
```

### Worked example: encrypted user records

```javascript
const users = await db.createCollection(
  'users',
  true,                              // encrypted
  process.env.USER_ENCRYPTION_KEY,   // custom key from env — see Best Practices below
);

await users.insert({
  username: 'johndoe',
  email: 'john@example.com',
  passwordHash: hashedPassword,
  createdAt: new Date(),
});

const user = await users.query({ username: 'johndoe' }).exec();
```

---

## 🌟 Advanced Features

- **Multiple Databases:** architect scalable apps with multiple databases and collections, each with independent security settings
- **Custom Query Processing:** the full operator set (`$gt`, `$lt`, `$in`, `$regex`, `$gte`, `$lte`, `$ne`, `$nin`, `$exists`, `$or`, `$and`) plus aggregation pipelines
- **Enterprise Data Management:** bulk operations, conditional updates, atomic transactions
- **Performance Optimization:** fast lookups, pagination, and intelligent caching with random TTL

---

## 📖 API Reference

### AxioDB

- `createDB(dbName: string): Promise<Database>`
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
- `getIndexes(): Promise<SuccessInterface | ErrorInterface>` — lists all indexes registered on the collection

### Updater / Deleter

`update(query)` and `delete(query)` on their own don't change anything — they return a chainable object. Call one of the methods below to actually apply the change:

- `updater.UpdateOne(data: object): Promise<SuccessInterface | ErrorInterface>` — applies `data` to the first document matching `query`
- `updater.UpdateMany(data: object): Promise<SuccessInterface | ErrorInterface>` — applies `data` to every document matching `query`
- `deleter.deleteOne(): Promise<SuccessInterface | ErrorInterface>` — deletes the first document matching `query`
- `deleter.deleteMany(): Promise<SuccessInterface | ErrorInterface>` — deletes every document matching `query`

```javascript
// Update the first matching document
await collection.update({ name: 'Alice' }).UpdateOne({ status: 'active' });

// Update every matching document
await collection.update({ role: 'trial' }).UpdateMany({ role: 'active' });

// Delete the first matching document
await collection.delete({ name: 'Alice' }).deleteOne();

// Delete every matching document
await collection.delete({ status: 'inactive' }).deleteMany();
```

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

## ✅ Best Practices

**Use environment variables for encryption keys and TCP credentials — never hardcode them:**

```javascript
// ❌ Bad
const collection = await db.createCollection('data', true, 'myKey123');

// ✅ Good
const collection = await db.createCollection(
  'data',
  true,
  process.env.AXIODB_ENCRYPTION_KEY,
);
```

**Use `documentId` for the fastest possible lookups** — it's the one field that's always indexed automatically, backed by `InMemoryCache`:

```javascript
const user = await collection.query({ documentId: 'ABC123' }).exec();
```

**Handle errors explicitly** — AxioDB operations reject/return error responses rather than throwing silently:

```javascript
try {
  await collection.insert({ name: 'User' });
} catch (error) {
  console.error('Insert failed:', error);
}
```

**Clean up resources you no longer need:**

```javascript
await database.deleteCollection('tempCollection');
await db.deleteDatabase('tempDB');
```

**Encryption & access control:**
- Use strong, unique encryption keys
- Never hardcode keys — use environment variables or a secrets manager
- Implement proper access controls and take regular backups
- For AxioDBCloud/GUI, rotate the default `admin` password immediately (see [Authentication & Access Control](#-built-in-web-gui--authentication-rbac))

For vulnerability reporting, see [SECURITY.md](SECURITY.md).

---

## ⚙️ Architecture & Internal Mechanisms

- **Tree Structure for Fast Data Retrieval:** hierarchical storage enables O(1) document lookups and efficient indexing. Each document is isolated in its own file, supporting selective loading and easy backup.
- **Worker Threads for Parallel Processing:** leverages Node.js Worker Threads for non-blocking I/O, multi-core utilization, and scalable performance — especially for read operations.
- **Two-Pointer Searching Algorithm:** optimized for range queries and filtered searches, minimizing memory usage and computational overhead.
- **`InMemoryCache` System:** automatic eviction policies, TTL support, and memory optimization, delivering sub-millisecond response times for frequently accessed data.
- **Query Processing Pipeline:** intelligent caching, parallelized processing, lazy evaluation, and just-in-time query optimization.
- **Single Instance Architecture:** ensures ACID compliance, strong data consistency, and simplified deployment — one `AxioDB` instance manages all databases and collections.
- **Designed for Node.js Developers:** native JavaScript API, promise-based interface, lightweight dependency footprint, simple learning curve.

---

## 🏆 Comparisons

### AxioDB vs SQLite

| Feature | SQLite | AxioDB |
| ------- | ------ | ------ |
| **Native Dependencies** | ❌ Yes (C bindings) | ✅ Pure JavaScript |
| **Query Language** | SQL Strings | JavaScript Objects |
| **Schema Migrations** | ❌ Required (ALTER TABLE) | ✅ Schema-less |
| **Built-in Caching** | ⚠️ Manual | ✅ InMemoryCache |
| **Multi-core Processing** | ❌ Single-threaded | ✅ Worker Threads |
| **Built-in GUI** | ❌ External tools only | ✅ Web interface included |
| **Best For** | 10M+ records, relational data | 10K–500K documents, embedded apps |

### AxioDB vs Traditional JSON Files

| Feature | Traditional JSON Files | AxioDB |
| ------- | --------------------- | ------ |
| **Storage** | Single JSON file | File-per-document |
| **Caching** | None | InMemoryCache |
| **Indexing** | None | Auto `documentId` + custom fields |
| **Query Speed** | Linear O(n) | Sub-millisecond O(1) |
| **Scalability** | Poor | Excellent (up to sweet spot) |
| **Built-in Query Operators** | None | `$gt`, `$lt`, `$regex`, `$in`, ... |

**Benchmark:** AxioDB's `documentId` search with `InMemoryCache` provides instant retrieval compared to traditional JSON files, which require full-file parsing (tested with 1M+ documents).

### AxioDB vs lowdb, nedb, better-sqlite3

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

## ⚠️ Limitations & Honest Positioning

- **Dataset Size:** optimized for 10K–500K documents. For 10M+, use PostgreSQL, MongoDB, or SQLite.
- **Concurrency:** single-instance architecture. For multi-user web apps with hundreds of concurrent connections, use a traditional client-server database.
- **Relational Data:** document-based NoSQL, no JOIN operations. For complex relational data with foreign keys, use a SQL database.
- **Distributed Systems:** single-node only — no replication, sharding, or clustering. Use MongoDB or CouchDB for that.
- **Transactions:** single-collection ACID transactions only. For cross-collection transaction requirements, use PostgreSQL or MongoDB.

None of this is a shortcoming to apologize for — AxioDB is deliberately scoped to the embedded/local-first niche. When you outgrow it, that's a sign to migrate, not a bug to file.

---

## ❓ FAQ

**Q: What is AxioDB?**
An embedded NoSQL database for Node.js. Pure JavaScript, zero native dependencies. `npm install axiodb` and you have a database — no server, no `node-gyp`, no `electron-rebuild`.

**Q: Is AxioDB a replacement for MongoDB?**
No. AxioDB is embedded (runs inside your app); MongoDB is a client-server database for multi-user systems. Use AxioDB for desktop apps, CLI tools, and local-first apps up to ~500K documents; use MongoDB when you need a shared networked database.

**Q: Does AxioDB work with Electron?**
Yes — this is the primary use case it was built for. Zero native dependencies means no `electron-rebuild`, no platform-specific `.node` files, no compilation step.

**Q: How does AxioDB compare to better-sqlite3 / lowdb / nedb?**
See the [Comparisons](#-comparisons) tables above for the full breakdown — in short: no native bindings (unlike better-sqlite3), no single-file bottleneck (unlike lowdb), and actively maintained with TypeScript/transactions/encryption (unlike the abandoned nedb).

**Q: How many documents can AxioDB handle?**
Optimized for 10,000–500,000 documents. For 1M+, use PostgreSQL or MongoDB. `documentId` lookups take ~1ms on 10K documents with `InMemoryCache`.

**Q: Does AxioDB support TypeScript?**
Yes. Full type definitions are included — no separate `@types` package needed.

**Q: Does AxioDB work in the browser?**
No. AxioDB requires Node.js (v20+) and the filesystem — server-side and desktop only.

**Q: What is AxioDBCloud?**
TCP-based remote access for AxioDB. Deploy AxioDB in Docker, connect from multiple clients with the exact same API. Supports 1,000+ concurrent connections with auto-reconnect. Optional username/password authentication (`TCPAuth: true`) reuses the same RBAC accounts as the GUI, and optional TLS encryption (`TLS: true`) protects the wire protocol on untrusted networks — see [AxioDBCloud](#-axiodbcloud--connecting-remotely) above.

---

## 🤝 Contributing, License & Support

**Contributing:** we welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

**License:** MIT. See [LICENSE](LICENSE).

**Requirements:** Node.js ≥20.0.0, npm ≥6.0.0, yarn ≥1.0.0 (optional).

**Documentation website:** built with React 18 + TypeScript, Vite, TailwindCSS, and Lucide React. To run it locally:
```bash
cd Document
npm install
npm run dev
```
Available at `http://localhost:5173`.

**Author:** Ankan Saha

**Support the project:**
- ⭐ Star the repository
- 🐛 Report issues
- 💡 Suggest features
- 🤝 Contribute code
- 💰 [Sponsor the project](https://github.com/sponsors/AnkanSaha)

**Acknowledgments:** special thanks to all contributors and supporters of AxioDB — your feedback and contributions make this project better.

---
