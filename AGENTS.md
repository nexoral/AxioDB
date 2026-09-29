# AxioDB — Agent Instructions

**AxioDB** — SQL alternative for JS. Embedded NoSQL, zero native deps, TS 6.0 strict → CJS, Node ≥20, singleton, file-per-doc, `InMemoryCache`, Worker Threads, ACID, GUI 27018, TCP 27019.

## Directory Layout

```
source/
  config/        # DB init, Keys, constants
  Services/      # Collection, Database, Index, Transaction, Auth, Aggregation
  engine/        # Core query engine, storage engine
  Memory/        # InMemoryCache, IndexCache
  tcp/           # TCP server (27019), handler/
  server/        # HTTP Fastify (27018), router/ + controller/
  client/        # *Proxy.ts — TCP client wrappers
  Helper/        # Static stateless helpers
  utility/       # Shared utils (ResponseHelper, etc.)
Test/
  modules/       # 14 test suites (JS, node-based)
  helpers/       # TestRunner, assertions, fixtures
Docker/          # Dockerfile, MCP config
Document/        # Vite docs site (port 5173), SEO scripts, AI artifacts
cli/             # CLI commands
```

## Constraints — never violate

* No `any`. Use `unknown` + guard. No `eval`, `setTimeout` hacks, temp fixes.
* Singleton: `new AxioDB()` twice throws; tests run isolated child processes.
* All registries JSONL append-only, last-line-wins, truncated when empty; filenames via `General` `source/config/Keys/Keys.ts` — never hardcode.
* Dual-write indexes: memory + disk; random TTL `5-15m` — `InMemoryCache` randomizes between the configurable `minTTL`/`maxTTL` options; `IndexCache` hardcodes `Math.floor(Math.random()*(MAX_TTL_MS-MIN_TTL_MS+1)+MIN_TTL_MS)`.
* Inputs validated (reject non-object/array), path sanitized `replace(/[^a-zA-Z0-9-_]/g,'_')+path.join`, never log secrets/stack.

## Rules — non-negotiable

1. `npm run build` after every change — never ship TS errors.
2. `Test/modules/` must be updated for any feature; `npm test` all 14 suites `crud|transaction|read|aggregation|auth|http-api|tcp-auth|tcp-noauth|tcp-transaction|tcp-tls|crash-recovery|mcp-confirm|mcp-functional|cache-options`.
3. Never leave incomplete work — Done checklist must pass.
4. Read before edit; follow existing patterns.
5. Production-grade only.
6. **Core → surfaces sync**: new core feature (`Services/Collection`, `Index`, `Transaction`, etc.) → ask user: expose via HTTP 27018 / CLI / MCP 27020 / Docker / GUI? If yes, implement consistently (HTTP `server/router+controller`, TCP `tcp/handler` + `client/*Proxy`, CLI `cli/cmd`, MCP `Docker/mcp/tools`, `Document/` docs + AI) with same RBAC/tests.

## Code standards

SOLID + DRY: duplicate logic (2+ files) → `source/Helper/{Feature}.helper.ts` static stateless. Naming: files `{Feature}.{operation|service|helper}.ts`, PascalCase classes, camelCase verbs, `UPPER_SNAKE_CASE` consts. Magic strings → enums/`as const`. Nesting >3 → refactor. Try-catch every async; log detailed, return friendly via `ResponseHelper`. Perf: cache before disk, `Promise.all`, `Map` not `Array.find` loop.

## Don't (anti-patterns)

```ts
// ❌ Never hardcode filenames — use Keys.ts
const dir = './data/MyDB';

// ❌ Never use any — use unknown + type guard
function parse(input: any) { ... }

// ❌ Never nest >3 levels — extract helper
if (a) { if (b) { if (c) { if (d) { ... } } } }

// ❌ Never use Array.find in hot paths — use Map
items.find(i => i.id === targetId);
```

## Tests

Framework: custom `TestRunner` + `assert` from `Test/helpers/`. Run all: `npm test`. Single suite: `npm test crud`. New test file: `Test/modules/{feature}.test.js`, extend `TestRunner`, use `fixtures` for data, clean up in `setUp()`/`tearDown()`.

```js
const TestRunner = require('../helpers/TestRunner');
const { assert } = require('../helpers/assertions');

class MyTests extends TestRunner {
  constructor() { super('My Test Suite'); }
  async setUp() { /* create temp dir, init DB */ }
  async tearDown() { /* rm temp dir */ }
}
```

## Version sync (13 places — all must match)

* `package.json` → `"version"`
* `package-lock.json` → auto via `npm install`
* `GUI/package.json` → `"version"`
* `electron/package.json` → `"version"`
* `Document/package.json` → `"version"`
* `cli/VERSION` → plain text version
* `cli/cmd/version.go` → `var cliVersion`
* `Document/src/data/changelog.ts` → latest entry
* `Document/src/components/layout/Footer.tsx` → displayed version
* `Document/public/llms.txt` → version line
* `Document/public/llms-full.txt` → version line
* `Document/index.html` → JSON-LD `softwareVersion`
* `Document/public/feed.xml` → RSS feed title + guid
* `Docker/README.md` → shield badge version

Regen AI artifacts: `cd Document && npx tsx scripts/generate-seo-files.ts`

## Documentation — same commit as code

README, `Document/` (`npm run dev` 5173), `Dockerfile` ports/env, JSDoc with `@param/@returns/@throws/@example`. Single source: `Document/src/data/serverApi.ts` → docs + `openapi.json`. Never blur: core · Dashboard · HTTP API 27018 · TCP 27019 · MCP 27020 Docker-only.

## Commands

```bash
npm run build              # mandatory
npm test                   # all 14
npm test <suite>           # see Rules 2
npm run lint               # ESLint
cd Document && npm run dev # docs 5173
```

Workflows: `Services/Collection/collection.operation.ts` → typed try-catch → HTTP `server/router+controller` → TCP `tcp/handler` → tests → docs+AI → build/test. Helper: `Helper/{Feature}.helper.ts`. TCP: `tcp/handler/{cmd}.ts` + `client/{Feature}Proxy.ts` → command map → tests → docs.

## Graphify (optional)
After file changes, if graphify is available and `graphify-out/` exists, rebuild: `python3 -c "from graphify.watch import _rebuild_code; from pathlib import Path; _rebuild_code(Path('.'))"`

## Ask before action

Always ask user permission before:
* `git commit` — confirm message and changes
* `git push` — confirm branch and remote
* `npm test` (full suite) — may be slow
* Launching sub-agents (explore/plan) — costly and time-consuming; user may already know the answer or have a better approach

Do NOT ask for:
* `npm test <suite>` (scoped) — run directly
* `npm run build` — run directly
* `npm run lint` — run directly

## Never assume

* If confused or unclear about anything — ask the user. Don't guess.
* Do web search when you need external data or documentation.
* Ask mid-task too, not just at the start. Always prefer asking over assuming — wrong assumptions waste more time than a quick question.

## Git

* Branches: `main` (production), `maintainer/<name>` (personal). Never force-push `main`.
* Commits: conventional format — `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`. One logical change per commit.

## Done checklist

- [ ] `npm run build` passes
- [ ] `Test/modules/` updated, `npm test` 14/14
- [ ] `npm run lint` passes
- [ ] Docs updated (README, Document, Dockerfile, JSDoc)
- [ ] Changelog if major/breaking
- [ ] AI artifacts updated + regenerated, version synced (13 places)
- [ ] No `any`, SOLID+DRY, patterns (singleton/dual-write/TTL) followed
- [ ] Security validated
- [ ] No perf regressions