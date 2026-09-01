# AxioDB: SQLite Alternative for JavaScript

[![npm version](https://badge.fury.io/js/axiodb.svg)](https://badge.fury.io/js/axiodb)
[![npm version shields](https://img.shields.io/npm/v/axiodb?logo=npm&label=npm)](https://www.npmjs.com/package/axiodb)
[![npm downloads total](https://img.shields.io/npm/dt/axiodb.svg)](https://www.npmjs.com/package/axiodb)
[![npm downloads yearly](https://img.shields.io/npm/dy/axiodb.svg)](https://www.npmjs.com/package/axiodb)
[![npm downloads weekly](https://img.shields.io/npm/dw/axiodb.svg)](https://www.npmjs.com/package/axiodb)
[![npm downloads monthly](https://img.shields.io/npm/dm/axiodb.svg)](https://www.npmjs.com/package/axiodb)
[![install size](https://img.shields.io/npm/unpacked-size/axiodb?label=install%20size)](https://www.npmjs.com/package/axiodb)
[![jsDelivr hits](https://img.shields.io/jsdelivr/npm/hm/axiodb?label=jsDelivr)](https://www.jsdelivr.com/package/npm/axiodb)
[![npm types](https://img.shields.io/npm/types/axiodb?label=types)](https://www.npmjs.com/package/axiodb)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

[![Push to Registry](https://github.com/nexoral/AxioDB/actions/workflows/Push.yml/badge.svg?branch=main)](https://github.com/nexoral/AxioDB/actions/workflows/Push.yml)
[![CodeQL](https://github.com/nexoral/AxioDB/actions/workflows/github-code-scanning/codeql/badge.svg?branch=main)](https://github.com/nexoral/AxioDB/actions/workflows/github-code-scanning/codeql)
[![Socket Security](https://socket.dev/api/badge/npm/package/axiodb)](https://socket.dev/npm/package/axiodb)
[![GitHub Stars](https://img.shields.io/github/stars/nexoral/AxioDB?style=social)](https://github.com/nexoral/AxioDB)

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen)](https://nodejs.org)
[![Tested on Node.js](https://img.shields.io/badge/tested%20on-20%20%7C%2021%20%7C%2022%20%7C%2023%20%7C%2024%20%7C%2025%20%7C%2026-blue)](https://github.com/nexoral/AxioDB/actions/workflows/Push.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-blue)](https://www.typescriptlang.org/)
[![Zero Dependencies](https://img.shields.io/badge/dependencies-0%20native-success)](https://www.npmjs.com/package/axiodb)

👉 **[Official Documentation — axiodb.in](https://axiodb.in/)**: Full guides, API reference, and examples. This README is a quick start — see the site for everything else.

---

## What is AxioDB?

**Embedded NoSQL for Node.js, zero native deps.** `npm install axiodb` and you have a database — no server, no `node-gyp`, no `electron-rebuild`.

**Problem:** `better-sqlite3` needs compiled binaries, `electron-rebuild` on every Electron update, per-platform builds. Plain JSON files have no query/cache/index.

**Solution:** AxioDB is a file-based document database with ACID transactions and MongoDB-style queries on plain JavaScript objects.

```javascript
const { AxioDB } = require('axiodb');
const db = new AxioDB({ GUI: true }); // Dashboard at http://localhost:27018
const users = await (await db.createDB('AppDB')).createCollection('users');

await users.insert({ name: 'Alice', age: 30 });
const { data } = await users.query({ age: { $gt: 25 } }).Sort({ age: -1 }).Limit(10).exec();
console.log(data.documents);
```

## Objective

**Great for:** Electron, CLI tools, embedded systems, local-first apps, rapid prototyping.

**Sweet spot:** Local applications, desktop apps, CLI tools, and services that need a simple document database without a separate database server.

**Not for:** 10M+ docs, hundreds of concurrent users, JOINs, replication/sharding — use PostgreSQL/MongoDB.

---

## Installation

```bash
npm install axiodb
# Node.js ≥20
```

## Basic CRUD

CRUD means **Create, Read, Update, and Delete**. The following example creates a database and
collection, then demonstrates each basic operation:

```javascript
const { AxioDB } = require('axiodb');

const db = new AxioDB();
const database = await db.createDB('AppDB');
const users = await database.createCollection('users');

// Create: insert a document. AxioDB adds documentId and updatedAt automatically.
const created = await users.insert({ name: 'Alice', email: 'alice@example.com', age: 30 });
const userId = created.data.documentId;

// Read: query documents and execute the chainable reader.
const result = await users.query({ age: { $gte: 18 } }).exec();
console.log(result.data.documents);

// Update: update the first document matching the query.
await users.update({ documentId: userId }).UpdateOne({ age: 31 });

// Delete: delete the first document matching the query.
await users.delete({ documentId: userId }).deleteOne();
```

Use `UpdateMany()` or `deleteMany()` when the operation should affect every matching document.
Updates are flat merges; MongoDB update operators such as `$inc`, `$set`, and `$push` are not
supported.

## Features

* **Zero native deps** — pure JS, no `node-gyp`, no `electron-rebuild`
* **MongoDB-style queries** — `{ age: { $gt: 25 } }`, 19 operators + `hint()` + `findByIds()`
* **ACID transactions** — `savepoint`/`rollbackTo`/`WAL`, crashes recover via `Transaction.recoverTransactions()`
* **Aggregation** — 60+ stages, `$lookup` joins, `OperatorRegistry` custom ops
* **InMemoryCache + indexes** — dual-write, auto `IndexCache`
* **Ports:** GUI `27018` · TCP `27019` `AxioDBCloud` · MCP `27020` Docker-only

> **Docs:** `axiodb.in` is the single source — this README is a quick start only.

* **AxioDBCloud (TCP)** — remote `AxioDBCloud` client, 32 commands, optional `TCPAuth` + `TLS` → [axiodb.in/cloud](https://axiodb.in/cloud)
* **CLI (Go)** — `axiodb document insert/query` `--hint` `find-by-ids` `transaction begin/commit` `user change-password` (HTTP `27018` for management, TCP `27019` for data) → [axiodb.in/cli](https://axiodb.in/cli)
* **Docker** — `theankansaha/axiodb` `AXIODB_GUI/TCP/MCP` `27018/27019/27020` → [axiodb.in/docker](https://axiodb.in/docker)
* **MCP Server** — 43 tools `axiodb_login` → `sessionId` + `withConfirmation` `Docker/mcp/tools/*.js` → [axiodb.in/mcp-server](https://axiodb.in/mcp-server)
* **GUI + RBAC** — `Super Admin/Admin/View`, `mustChangePassword`, `LoginRateLimiter` → [axiodb.in/security](https://axiodb.in/security)
* **API & Types** — `Document/src/data/serverApi.ts` 41 endpoints `openapi.json`, TS 6.0 strict → [axiodb.in/api-reference](https://axiodb.in/api-reference) [axiodb.in/server-api](https://axiodb.in/server-api)

---

## Contributing, License & Support

* **Contributing:** see [CONTRIBUTING.md](CONTRIBUTING.md) + [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)
* **Security:** see [SECURITY.md](SECURITY.md) — `admin/admin` must change password, report via GitHub Security Advisories
* **License:** MIT — [LICENSE](LICENSE)
* **Support:** ⭐ star, 🐛 issues, 💡 discussions — [https://github.com/nexoral/AxioDB](https://github.com/nexoral/AxioDB) · [sponsor](https://github.com/sponsors/AnkanSaha)

**Author:** Ankan Saha · **Docs:** `cd Document && npm run dev` `http://localhost:5173`
