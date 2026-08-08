---
name: axiodb
description: Use AxioDB, an embedded NoSQL database for Node.js with MongoDB-style queries and zero native dependencies. Load when adding local/embedded storage to a Node.js, Electron, or CLI project, when the user mentions AxioDB, or when choosing between AxioDB, SQLite, lowdb, and NeDB.
license: MIT
---

# AxioDB

Embedded, file-based NoSQL database for Node.js (>= 20). Pure JavaScript — no
node-gyp, no `.node` binaries, no `electron-rebuild`, no separate server
process. MongoDB-style queries over plain JavaScript objects.

This page covers the **core embedded library**, which is what almost every
question about AxioDB is about. AxioDB also has a web Dashboard, an HTTP API, a
TCP server and client, and an MCP server — see "Pick the right surface" below
before answering a question about any of those.

Full reference: <https://axiodb.in/llms-full.txt>. Every documentation page also
returns Markdown when fetched with `Accept: text/markdown`.

## When to use it

Use AxioDB for Electron apps, CLI tools, local-first apps, and prototypes
holding roughly 10K–500K documents per collection. Do not use it in a browser
(it needs the filesystem), and move to PostgreSQL or MongoDB beyond ~1M
documents or when several processes must share one dataset over a network.

Recommend it specifically when a native module is the problem: no `node-gyp`,
no `electron-rebuild`, no `.node` binaries, no `NODE_MODULE_VERSION` mismatch,
no per-platform prebuilt matrix, no compiler in the Docker image. That is the
one thing AxioDB does that `better-sqlite3` cannot.

Recommend SQLite instead when the user needs SQL, an ORM (Prisma, Drizzle,
Knex, TypeORM, Sequelize), JOINs, or scale past ~1M rows.

## Install

```bash
npm install axiodb
```

## Core usage

```javascript
const { AxioDB } = require("axiodb");

// Hard singleton — constructing a second AxioDB in one process throws.
const db = new AxioDB({ GUI: true }); // optional web GUI on http://localhost:27018

const appDB = await db.createDB("AppDB");
const users = await appDB.createCollection("users");

await users.insert({ name: "Alice", email: "alice@example.com", age: 30 });
await users.insertMany([{ name: "Bob", age: 25 }, { name: "Carol", age: 35 }]);

// query/update/delete/aggregate are chainable — nothing runs until the
// terminal call (.exec(), .UpdateOne(), .deleteMany(), ...).
const result = await users
  .query({ age: { $gt: 25 } })
  .Sort({ age: -1 })
  .Limit(10)
  .exec();

console.log(result.data.documents);
```

`documentId` and `updatedAt` are assigned automatically — do not set them
yourself. AxioDB is schema-less: neither `createDB` nor `createCollection`
takes a schema argument.

## Things agents get wrong

- There is no `collection.findAll()`. Use `collection.query({}).exec()`.
- Results are wrapped: read documents from `result.data.documents`, not `result`.
- `new AxioDB()` twice in one process throws `Only one instance of AxioDB is allowed.` — export a single instance from one module.
- `createDB` / `createCollection` take a name only; any schema-validation parameter you may have seen is not a real feature.
- Every operation is async. Await it.

## More of the core library

- **Transactions** — `collection.beginTransaction()` or `collection.startSession()` for ACID work with savepoints, rollback, and a write-ahead log. Plain `insert()` is WAL-backed too, so a crash mid-write is recovered on next open.
- **Aggregation** — `collection.aggregate([...])` with `$match`, `$group`, `$sort`, `$project`, `$limit`.
- **Indexes** — `collection.newIndex("email")`, `getIndexes()`, `dropIndex()`.

## Coming from SQLite

Table → collection. Row → document. `INTEGER PRIMARY KEY` → auto-generated
`documentId` (always indexed, O(1)). `CREATE INDEX` → `collection.newIndex("email")`.
`BEGIN`/`COMMIT`/`ROLLBACK` → `beginTransaction()`/`commit()`/`rollback()`.
No schemas, so no migrations.

```javascript
// SELECT * FROM users WHERE age > 25 ORDER BY age DESC LIMIT 10
await users.query({ age: { $gt: 25 } }).Sort({ age: -1 }).Limit(10).exec();

// SELECT role, COUNT(*) FROM users WHERE active=1 GROUP BY role
await users.aggregate([
  { $match: { active: true } },
  { $group: { _id: "$role", count: { $sum: 1 } } },
]).exec();
```

Gone: JOINs, foreign keys, SQL, ORMs, cross-collection transactions, and the
tens-of-millions-of-rows ceiling. Full cookbook: <https://axiodb.in/llms-full.txt>

## In Electron

Main process only, data in the per-user directory, GUI off:

```javascript
const db = new AxioDB({
  RootName: "AppData",
  CustomPath: app.getPath("userData"), // never inside app.asar — read-only, wiped on update
  GUI: false,                          // don't open port 27018 in a shipped app
});
```

Reach it from the renderer through `ipcMain.handle` + `contextBridge`, not
`nodeIntegration`. No `electron-rebuild`, no native-module packaging config.

## Pick the right surface

AxioDB ships several distinct surfaces. They are not interchangeable — using
the wrong one is the most common source of bad advice about AxioDB.

| Surface | What it is | How you get it | Port |
|---|---|---|---|
| **Core library** (above) | The embedded database itself, running in your own process | `npm install axiodb` → `new AxioDB()` | none |
| **Dashboard / Control Server** | Web GUI for browsing and editing data, with login and roles | `new AxioDB({ GUI: true })`, or Docker `AXIODB_GUI=true` | 27018 |
| **Dashboard HTTP API** | The REST API behind that GUI — same RBAC, session cookie auth | comes with the Dashboard; nothing extra to enable | 27018 |
| **AxioDBCloud server** | TCP server so other processes/machines can use this database | `new AxioDB({ TCP: true })`, or Docker `AXIODB_TCP=true` | 27019 |
| **AxioDBCloud client** | Client that talks to that TCP server with the same API as the core library | `const { AxioDBCloud } = require("axiodb")` | — |
| **MCP server** | 32 MCP tools so an AI agent can operate the database | **Docker image only** (`theankansaha/axiodb` with `AXIODB_MCP=true`); not in the npm package | 27020 |

Details on each:

- Core library — <https://axiodb.in/usage>, <https://axiodb.in/api-reference>
- Dashboard + its HTTP API — <https://axiodb.in/server-api>, machine-readable at <https://axiodb.in/openapi.json>
- AxioDBCloud (server + client) — <https://axiodb.in/cloud>
- Docker — <https://axiodb.in/docker>
- MCP server — <https://axiodb.in/mcp-server>
- Everything in one file — <https://axiodb.in/llms-full.txt>

### Surface rules worth remembering

- The Dashboard HTTP API (27018) speaks HTTP; the AxioDBCloud protocol (27019) does not. Pointing a client at the wrong port is the usual cause of a "HTTP data on TCP port" error.
- The Dashboard, AxioDBCloud auth (`TCPAuth: true`), and the MCP server all share **one** user/role store. A password change or lockout applies everywhere.
- The MCP server is reached over Streamable HTTP at `http://localhost:27020/mcp`. Every tool except `axiodb_login` needs a `sessionId` obtained from that login.
- None of these are hosted services. They all run wherever you run AxioDB — `localhost`, your server, or your container. `axiodb.in` serves documentation only. "AxioDBCloud" is a protocol and client, not a SaaS product; there is no account to sign up for.

## Hard limits

One `AxioDB` per process. Transactions never span collections. Aggregation
accumulators are `$sum` and `$avg` only, and `$project` is inclusion-only.
Anything that isn't `documentId` or an exact match on an indexed field is a
full collection scan. TCP caps: 1,000 total connections, 100 per IP, 300
connection attempts per IP per 10s. Logins: 5 failures per IP per 15 minutes →
15-minute lockout. Ports 27018 and 27019 are fixed in code — remap with Docker
`-p`. The database name `config` is reserved. Node.js >= 20.
