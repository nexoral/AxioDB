# source/ — AxioDB Core (Agent Instructions)

Global rules live in [../AGENTS.md](../AGENTS.md). This file only adds `source/` specifics — read the root first.

**Role** — the embedded engine. Compiled by `tsc` to `lib/`, published as the `axiodb` npm package (`main: ./lib/config/DB.js`). Every other folder (`cli/`, `Docker/`, `electron/`, `Document/`) is a surface on top of this. Source of truth for HTTP 27018, TCP 27019.

## Directory Map

* **`config/`** — Database initialization, constants, and typing
  * `DB.ts` (entrypoint), `Keys/` (`Keys.ts`, `Permissions.ts`, `StatusCode.ts`), `Interfaces/`
* **`Services/`** — Core database operations & features
  * `Collection/`, `Database/`, `Index/`, `Transaction/` (WAL & LockManager), `Auth/`, `Aggregation/`, `CRUD Operation/`
* **`engine/`** — Low-level query and storage engines
  * `Filesystem/` (`FileManager.ts`, `FolderManager.ts`), `node/` (`workerScript.engine.ts`), `cli/`
* **`Memory/`** — In-memory caching layers
  * `memory.operation.ts` (`InMemoryCache`, `IndexCache`)
* **`server/`** — HTTP REST API (Port 27018)
  * `router/Routers/Router.ts`, `controller/` (Auth, Collections, Database, Index, Operation, Stats)
* **`tcp/`** — TCP Wire Protocol Server (Port 27019)
  * `handler/CommandHandler.ts`, `connection/`, `config/`, `types/`
* **`client/`** — Remote TCP client library
  * `AxioDBCloud.client.ts`, `*Proxy.ts` wrappers, `PooledConnection.ts`
* **`Helper/`** — Static stateless utility helpers
  * `mcp/` (`McpServer.helper.ts`, `McpTools.helper.ts`), `http/`, `{Feature}.helper.ts`
* **`utility/`** — Specialized performance utilities
  * `BufferLoaderWithWorker`, `Searcher`, `SortData`, `VectorMath.utils.ts`

## Commands (from repo root)

```bash
npm run build   # tsc → lib/ — MANDATORY after every change
npm run lint    # eslint source/
npm run node-test crud # one suite; `npm run node-test` = all 14 (ask first, slow)
```

## Hard rules

* `lib/` is generated `tsc` output and is **gitignored** — never hand-edit it, never commit it.
* No `any` — `unknown` + type guard. No `eval`, no `setTimeout` hacks, no temp fixes.
* Singleton: a second `new AxioDB()` throws.
* File-per-document storage; registries are JSONL, append-only, last-line-wins, truncated when empty.
* All filenames come from `config/Keys/Keys.ts` — never hardcode a path or directory name.
* Inputs validated (reject non-object/array); paths sanitized `replace(/[^a-zA-Z0-9-_]/g,'_')` + `path.join`; never log secrets or stacks.
* `ResponseHelper` for every outward response; `try-catch` every async, log detailed, return friendly.

## Indexing & cache invariants

* Dual-write: **memory + disk**, both kept in sync.
* Random TTL 5–15m — `InMemoryCache` randomizes between the configurable `minTTL`/`maxTTL`; `IndexCache` hardcodes `Math.floor(Math.random()*(MAX_TTL_MS-MIN_TTL_MS+1)+MIN_TTL_MS)`.
* Cache before disk; `Map` (not `Array.find`) in hot paths; `Promise.all` for fan-out.

## Adding a feature (core → surface fan-out)

1. Implement in `Services/{Feature}/` with typed try-catch; shared logic → `Helper/{Feature}.helper.ts` (2+ callers only).
2. HTTP: `server/router` + `server/controller`.
3. TCP: `tcp/handler/{cmd}.ts` → register in `CommandHandler` command map → `client/{Feature}Proxy.ts`.
4. Ask the user before fanning out to `cli/`, `Docker/mcp`, `electron/`, `Document/` — expose consistently, same RBAC.
5. Update `Test/node/modules/`, docs, AI artifacts; `npm run build` then the scoped suite.

## Anti-patterns

```ts
const dir = './data/MyDB';                    // ❌ hardcoded path — use Keys.ts
function parse(input: any) {}                 // ❌ any — use unknown + guard
if (a) { if (b) { if (c) { if (d) {} } } }    // ❌ nesting > 3 — extract a helper
items.find(i => i.id === id);                 // ❌ Array.find in hot path — use Map
```

## Done for this folder

- [ ] `npm run build` clean, `npm run lint` clean
- [ ] `Test/node/modules/` covers the change; scoped suite green
- [ ] No `any`; SOLID + DRY; singleton / dual-write / TTL patterns intact
- [ ] HTTP + TCP (+ client proxy) updated if the surface changed; docs + JSDoc same commit
