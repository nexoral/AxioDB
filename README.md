<p align="center">
  <img src="https://axiodb.in/AXioDB.png" alt="AxioDB Logo" width="120" height="120" />
</p>

<h1 align="center">AxioDB: The Embedded Database for Node.js</h1>

[![npm version](https://badge.fury.io/js/axiodb.svg)](https://badge.fury.io/js/axiodb)
[![npm downloads total](https://img.shields.io/npm/dt/axiodb.svg)](https://www.npmjs.com/package/axiodb)
[![npm downloads yearly](https://img.shields.io/npm/dy/axiodb.svg)](https://www.npmjs.com/package/axiodb)
[![npm downloads weekly](https://img.shields.io/npm/dw/axiodb.svg)](https://www.npmjs.com/package/axiodb)
[![npm downloads monthly](https://img.shields.io/npm/dm/axiodb.svg)](https://www.npmjs.com/package/axiodb)
[![jsDelivr hits](https://img.shields.io/jsdelivr/npm/hm/axiodb.svg)](https://www.jsdelivr.com/package/npm/axiodb)
[![install size](https://img.shields.io/npm/unpacked-size/axiodb?label=install%20size)](https://www.npmjs.com/package/axiodb)
[![npm types](https://img.shields.io/npm/types/axiodb?label=types)](https://www.npmjs.com/package/axiodb)
[![Zero native deps](https://img.shields.io/badge/dependencies-0%20native-success)](https://www.npmjs.com/package/axiodb)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen)](https://nodejs.org)
[![Tested on Node.js](https://img.shields.io/badge/tested%20on-20%20%7C%2021%20%7C%2022%20%7C%2023%20%7C%2024%20%7C%2025%20%7C%2026-blue)](https://github.com/nexoral/AxioDB/actions/workflows/Push.yml)
[![Bun tested](https://img.shields.io/badge/Bun%20tested-v1.4.0-black?logo=bun)](https://bun.sh)
[![Deno tested](https://img.shields.io/badge/Deno%20tested-v2.9.6-black?logo=deno)](https://deno.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-blue)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub Stars](https://img.shields.io/github/stars/nexoral/AxioDB?style=social)](https://github.com/nexoral/AxioDB)
[![GitHub Forks](https://img.shields.io/github/forks/nexoral/AxioDB?style=social)](https://github.com/nexoral/AxioDB/forks)
[![Contributors](https://img.shields.io/github/contributors/nexoral/AxioDB)](https://github.com/nexoral/AxioDB/graphs/contributors)
[![Last Commit](https://img.shields.io/github/last-commit/nexoral/AxioDB)](https://github.com/nexoral/AxioDB/commits/main)

[![Push to Registry](https://github.com/nexoral/AxioDB/actions/workflows/Push.yml/badge.svg?branch=main)](https://github.com/nexoral/AxioDB/actions/workflows/Push.yml)
[![CodeQL](https://github.com/nexoral/AxioDB/actions/workflows/github-code-scanning/codeql/badge.svg?branch=main)](https://github.com/nexoral/AxioDB/actions/workflows/github-code-scanning/codeql)

👉 **[Official Documentation — axiodb.in](https://axiodb.in/)**: full guides, API reference, and examples. This README is a quick start.

## Quick start

```bash
npm install axiodb
```

```javascript
const { AxioDB } = require('axiodb');

const db = new AxioDB({ GUI: true });          // Dashboard at http://localhost:27018
const users = await (await db.createDB('AppDB')).createCollection('users');

await users.insert({ name: 'Alice', age: 30 });
const { data } = await users.query({ age: { $gt: 25 } }).Sort({ age: -1 }).Limit(10).exec();
console.log(data.documents);
```

No server to run, no `node-gyp`, no `electron-rebuild`. Requires Node.js ≥20 (also verified on Bun v1.4.0 and Deno v2.9.6).

## Why AxioDB

**The problem.** `better-sqlite3` needs compiled binaries and an `electron-rebuild` on every Electron update. Plain JSON files have no query layer, no cache, and no indexes. NeDB has been unmaintained since 2016.

**The solution.** A file-based document database with MongoDB-style queries and real ACID transactions, running on plain JavaScript objects — pure JS, so it installs on any platform Node.js runs on.

## When to use it

**Great for** Electron apps, CLI tools, embedded and local-first software, and rapid prototyping.

**Sweet spot** 10K–500K documents in a local application that wants a real database without a database server.

**Not for** datasets beyond ~500K documents, hundreds of concurrent users, JOINs, or replication/sharding — use PostgreSQL or MongoDB there. Measured limits, including per-document disk overhead and scan costs: [axiodb.in/limitations](https://axiodb.in/limitations).

## Features

**Core** — the embedded engine

* **MongoDB-style queries** — `{ age: { $gt: 25 } }`, 19 operators, plus `.hint()` and `.findByIds()`
* **ACID transactions** — commit/rollback, savepoints, write-ahead log, crash recovery via `Transaction.recoverTransactions()`
* **Aggregation** — 19 stages including `$lookup` joins, extensible through `OperatorRegistry`
* **Indexes** — dual-write memory + disk index, served by a TTL-backed `IndexCache`
* **InMemoryCache** — per-instance, invalidated on write, tunable via `{ Cache, minTTL, maxTTL, cacheClearUp }`

**Self-hostable server** — the same engine, reachable remotely

* **Embedded** — `new AxioDB({...})` in-process, no server, the default
* **HTTP API** — port 27018, 41 documented endpoints, REST and OpenAPI
* **AxioDBCloud (TCP)** — port 27019, 32 commands, optional `TCPAuth` and TLS
* **MCP server** — port 27020, 43 tools for AI agents, bundled in the Docker image only
* **Docker** — `theankansaha/axiodb`, every surface configurable by environment variable

**Clients and apps**

* **Dashboard** — browser UI served by the HTTP surface, for browsing collections and running queries
* **AxioDBCloud client** — the TypeScript client for the TCP surface, with connection pooling and auto-reconnect
* **CLI** — Go binary for 12 platforms: interactive REPL, TLS, export/import
* **Desktop app** — Electron GUI for Linux, macOS, and Windows

## Stability

AxioDB is **actively developed and not yet at 1.0**. Semantic versioning is followed, but treat minor releases with care and keep independent backups of your data directory.

| Tier | What it covers |
|---|---|
| **Stable** | Core CRUD, queries, indexes, transactions, aggregation, InMemoryCache |
| **Usable, evolving** | HTTP API, AxioDBCloud TCP, Dashboard, CLI, RBAC, MCP server, Bun compiled binaries |
| **Verified** | Deno v2.9.6 (all 100 runtime tests passing), Bun v1.4.0 |

Data at rest is stored as plain JSON files, not encrypted. Encrypt the volume if that matters to you.

## Testing

The full suite is **329 tests across 14 suites**, all passing, each in an isolated child process. Benchmarked at 100,000 documents on an AMD Ryzen 5 5500U / Node v26.8.1:

| Operation | Time |
|---|---|
| Indexed query | 1–2 ms |
| `documentId` lookup | <1 ms |
| Cache hit | <1 ms |
| Insert single | ~31 ms |
| Rollback | ~8 ms |

Full per-suite breakdown: [axiodb.in/performance](https://axiodb.in/performance).

Run it yourself with `npm test`.

## ⚡ Benchmarking & Performance Verification

If you are evaluating AxioDB, testing performance for your application, or verifying throughput and ACID rollback guarantees, you can run the built-in benchmark suite on your own machine. 

No configuration or database setup is needed: simply clone the repository, install dependencies, and run:

```bash
git clone https://github.com/nexoral/AxioDB.git
cd AxioDB
npm install
npm run benchmark
```

> **Automated Pre-Check:** The benchmark script checks if compiled files exist in `lib/`. If not, it automatically runs `npm run build` before starting. It also handles cleanup automatically, deleting the temporary benchmark directory upon completion or on `Ctrl+C`.

---

### Default Benchmark Configuration

Running `npm run benchmark` without arguments executes the default verification profile:
* **Scale:** **`15,000` documents** inserted via WAL-backed `insertMany`.
* **Batch Size:** Chunked into **`3,000` documents** per batch to ensure optimal V8 heap utilization.
* **Indexed Point Reads:** 500 random lookups on the indexed `email` field (reporting **Min, p25, p50, p75, p90, p95, p99, Max, and Avg** latencies).
* **Unindexed Scans:** 25 random lookups requiring a full collection scan (calculating the exact **Index Advantage multiplier**).
* **Updates & Deletions:** Compares indexed vs unindexed `UpdateOne` and `deleteOne` latency.
* **Cache Acceleration:** Measures cold lookups against warm `InMemoryCache` speedup (typically **~50x+ faster**).
* **ACID Transactions:** Verifies an atomic batch commit (1,000 documents) and an atomic batch rollback (1,000 documents) confirming **zero data leakage**.
* **Storage Footprint:** Measures physical directory size on disk (**With Indexes** vs. **Data Only**) and compares against estimated storage for SQLite, LowDB, and raw JSON files.

---

### Command-Line Arguments & Flags

You can customize the benchmark scale, batch chunking, query samples, and cleanup behavior:

| Flag | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `--docs=N` | `number` | `15000` | Total number of documents to insert and index (e.g. `5000`, `50000`, `100000`, `500000`). |
| `--batch=N` | `number` | `3000` | Chunk size per `insertMany` batch to keep memory lean. |
| `--queries=N` | `number` | `500` | Number of random indexed point queries to measure for latency percentiles. |
| `--unindexed=N` | `number` | `25` | Number of unindexed full-scan lookups, updates, and deletes to sample. |
| `--keep` | `boolean` | `false` | Preserves the temporary benchmark database on disk for inspection instead of auto-deleting. |
| `--help`, `-h` | `boolean` | — | Displays the help menu with all options and usage examples. |

---

### Ready-to-Copy Benchmark Commands

#### 1. Default Benchmark (15k docs)
```bash
npm run benchmark
```

#### 2. Quick Smoke Test (5,000 docs — fast ~2s run)
```bash
npm run benchmark -- --docs=5000 --batch=1000 --queries=100 --unindexed=10
```

#### 3. Mid-Scale Test (50,000 docs, 5k batches)
```bash
npm run benchmark -- --docs=50000 --batch=5000 --queries=500
```

#### 4. High-Volume Stress Test (100,000 docs, 10k batches)
```bash
npm run benchmark -- --docs=100000 --batch=10000 --queries=1000
```

#### 5. Maximum Capacity Stress Test (500,000 docs)
```bash
npm run benchmark -- --docs=500000 --batch=10000 --queries=1000 --unindexed=15
```

#### 6. Inspect Physical Storage & Indexes on Disk (`--keep`)
```bash
# Run benchmark and prevent automatic cleanup of the data directory
npm run benchmark -- --docs=15000 --keep

# Inspect the created .axiodb document files and indexes/*.jsonl files:
ls -lh benchmark/Benchmark_TempData/BenchmarkDB/BenchDB/Users
ls -lh benchmark/Benchmark_TempData/BenchmarkDB/BenchDB/Users/indexes
```

## Installation

### npm — the library

```bash
npm install axiodb
```

### CLI and Desktop GUI — system-wide

AxioDB ships a Go CLI and an Electron desktop app for Linux, macOS, and Windows. The installer shows a menu when run interactively — **1)** CLI, **2)** GUI, **3)** both — and defaults to CLI when piped.

```bash
# Linux / macOS
curl -fsSL https://raw.githubusercontent.com/nexoral/AxioDB/main/cli/Scripts/install.sh | bash

# Windows (PowerShell)
irm https://raw.githubusercontent.com/nexoral/AxioDB/main/cli/Scripts/install.ps1 | iex
```

In scripts and CI, set `CHOICE` before piping to skip the menu:

| `CHOICE` | Installs |
|----------|----------|
| `1` | CLI only (also the default when piped) |
| `2` | Desktop GUI only |
| `3` | CLI + GUI |

```bash
# Desktop GUI — Linux
curl -fsSL https://raw.githubusercontent.com/nexoral/AxioDB/main/cli/Scripts/install.sh | CHOICE=2 bash

# Desktop GUI — Windows
$env:CHOICE=2; irm https://raw.githubusercontent.com/nexoral/AxioDB/main/cli/Scripts/install.ps1 | iex

# CLI + GUI — Linux
curl -fsSL https://raw.githubusercontent.com/nexoral/AxioDB/main/cli/Scripts/install.sh | CHOICE=3 bash

# CLI + GUI — Windows
$env:CHOICE=3; irm https://raw.githubusercontent.com/nexoral/AxioDB/main/cli/Scripts/install.ps1 | iex
```

Prebuilt binaries are also on [GitHub Releases](https://github.com/nexoral/AxioDB/releases).

### Docker

```bash
docker run -d --name axiodb-server \
  -p 27018:27018 -p 27019:27019 \
  -v axiodb-data:/app \
  theankansaha/axiodb
```

All surfaces default to on, with a seeded `admin` account. See [Docker/README.md](Docker/README.md) for every environment variable.

## Basic CRUD

```javascript
const { AxioDB } = require('axiodb');

const db = new AxioDB();
const database = await db.createDB('AppDB');
const users = await database.createCollection('users');

// Create — documentId and updatedAt are added automatically.
const created = await users.insert({ name: 'Alice', email: 'alice@example.com', age: 30 });
const userId = created.data.documentId;

// Read — the reader is chainable and lazy until .exec().
const result = await users.query({ age: { $gte: 18 } }).exec();

// Update — the first document matching the query.
await users.update({ documentId: userId }).UpdateOne({ age: 31 });

// Delete — the first document matching the query.
await users.delete({ documentId: userId }).deleteOne();
```

Use `UpdateMany()` and `deleteMany()` to affect every match. Updates are flat merges — MongoDB update operators like `$inc`, `$set`, and `$push` are not supported.

## Running a local server

`axiodb serve` starts a disposable AxioDB for development: it installs the published npm package into a temporary directory, keeps the server attached to your terminal, and deletes the data on `Ctrl+C`. Requires Node.js ≥20 and npm.

```bash
axiodb serve http                 # HTTP API only
axiodb serve tcp                  # TCP, no authentication
axiodb serve tcp-auth mypassword  # authenticated TCP
axiodb serve full                 # HTTP + authenticated TCP
```

Ports are fixed at `27018` (HTTP) and `27019` (TCP). The optional password seeds the shared `admin` account; `tcp-auth` requires one, since it has no HTTP surface to rotate the password through. Embedding uses the `AdminPassword` constructor option, and Docker uses `AXIODB_ADMIN_PASSWORD`.

## Documentation

| Page | Covers |
|---|---|
| [axiodb.in](https://axiodb.in/) | Documentation home |
| [Create a database](https://axiodb.in/create-database) | Constructor options, collections, indexes |
| [API reference](https://axiodb.in/api-reference) | Full method signatures and types |
| [AxioDBCloud](https://axiodb.in/cloud) | Remote TCP access, TLS, authentication |
| [Server API](https://axiodb.in/server-api) | The 41 HTTP endpoints |
| [CLI](https://axiodb.in/cli) | Go CLI reference |
| [Docker](https://axiodb.in/docker) | Image and environment variables |
| [Security](https://axiodb.in/security) | RBAC roles, password policy, rate limits |
| [MCP server](https://axiodb.in/mcp-server) | AI agent integration |
| [Limitations](https://axiodb.in/limitations) | Scope and measured limits |
| [Comparison](https://axiodb.in/comparison) | Against SQLite, JSON files, lowdb, nedb, better-sqlite3 |

## Contributing, security & license

Contributions are welcome — see [CONTRIBUTING.md](CONTRIBUTING.md) and [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).

Security issues: report privately through [GitHub Security Advisories](https://github.com/nexoral/AxioDB/security/advisories/new). Policy details in [SECURITY.md](SECURITY.md).

Released under the [MIT License](LICENSE). Author: Ankan Saha.

Support the project with a ⭐ on [GitHub](https://github.com/nexoral/AxioDB) or through [GitHub Sponsors](https://github.com/sponsors/AnkanSaha).
