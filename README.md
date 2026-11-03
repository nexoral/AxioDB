<p align="center">
  <img src="https://axiodb.in/AXioDB.png" alt="AxioDB Logo" width="120" height="120" />
</p>

<h1 align="center">Embedded NoSQL Database for TypeScript & Agents</h1>
<p align="center"><b>Zero-native document database with ACID transactions & in-memory cache — verified on Node.js, Bun & Deno.</b></p>

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

### 🤖 AI Agent Skill

Building with Claude Code, Cursor, Copilot, Antigravity, or Windsurf? Install the official AxioDB skill so your AI agent generates verified query syntax, accurate transaction patterns, and avoids hallucinated APIs:

```bash
npx skills add nexoral/AxioDB --skill skill
```

## Why AxioDB?

* 📦 **Zero Setup & Zero C++:** Pure JavaScript and TypeScript. No `node-gyp` errors, no build tools, and no native compilation issues on Node.js, Bun, Deno, or Electron.
* 📄 **Native JSON (No SQL Migrations):** Store raw objects directly. Perfect for AI agents, chats, and apps where data structures change often and SQL schemas are painful.
* 🛡️ **Safe from Crashes & Corruption:** Uses real ACID transactions and Write-Ahead Logging (WAL). Even if your app or server crashes mid-write, your data stays intact.
* ⚡ **Fast In-Memory Caching:** Delivers sub-millisecond (<1ms) reads with a built-in memory cache and fast disk indexes.
* 🤖 **AI-Ready:** Works out-of-the-box with AI coding assistants (Cursor, Claude Code, Copilot) via our official agent skill.

## When to Use It

**Great for:**
* **AI Agent Memory** — Save conversation history, tool calls, and agent state locally.
* **Desktop & Electron Apps** — An embedded database that never breaks on user machines during updates.
* **CLI Tools & Local Apps** — Save and query data easily without running a database server.
* **Fast Prototyping** — Build full features with MongoDB-like queries without setting up Docker or cloud DBs.

**Best fit:** 1,000 to 500,000 documents.

**When NOT to use it:**
* Millions of records, hundreds of concurrent web connections, or distributed clusters — use PostgreSQL or MongoDB instead. See [measured limits](https://axiodb.in/limitations).

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

## Performance & Testing

AxioDB is verified across **14 isolated test suites (329+ tests)** with a 100% pass rate, benchmarked at 100,000 documents on an AMD Ryzen 5 5500U / Node v26:

| Operation | Latency |
|---|---|
| Indexed query | 1–2 ms |
| `documentId` point lookup | <1 ms |
| In-memory cache hit | <1 ms |
| Range query ($gt/$gte/$lt/$lte) | 2–5 ms |
| Sorted pagination (`.Sort().Limit()`) | 1–2 ms |
| Insert single | ~31 ms |
| Rollback | ~8 ms |

Full performance charts, test suites, and methodology: [axiodb.in/performance](https://axiodb.in/performance).

## Tooling & Deployment

### Desktop GUI & CLI

AxioDB ships an interactive Go CLI and an Electron desktop app for Linux, macOS, and Windows:

```bash
# Linux / macOS
curl -fsSL https://raw.githubusercontent.com/nexoral/AxioDB/main/cli/Scripts/install.sh | bash

# Windows (PowerShell)
irm https://raw.githubusercontent.com/nexoral/AxioDB/main/cli/Scripts/install.ps1 | iex
```

Prebuilt binaries are also available on [GitHub Releases](https://github.com/nexoral/AxioDB/releases).

### Docker

```bash
docker run -d --name axiodb-server \
  -p 27018:27018 -p 27019:27019 \
  -v axiodb-data:/app \
  theankansaha/axiodb
```

All surfaces default to on, seeded with an `admin` account. See [Docker/README.md](Docker/README.md) for environment variables and configuration.

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
| [Agent Skill](https://axiodb.in/.well-known/agent-skills/axiodb/SKILL.md) | AI agent progressive disclosure reference & runbooks |
| [Limitations](https://axiodb.in/limitations) | Scope and measured limits |
| [Comparison](https://axiodb.in/comparison) | Against SQLite, JSON files, lowdb, nedb, better-sqlite3 |

## Contributing, security & license

Contributions are welcome — see [CONTRIBUTING.md](CONTRIBUTING.md) and [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).

Security issues: report privately through [GitHub Security Advisories](https://github.com/nexoral/AxioDB/security/advisories/new). Policy details in [SECURITY.md](SECURITY.md).

Released under the [MIT License](LICENSE). Author: Ankan Saha.

Support the project with a ⭐ on [GitHub](https://github.com/nexoral/AxioDB) or through [GitHub Sponsors](https://github.com/sponsors/AnkanSaha).
