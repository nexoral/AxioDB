# Codex Agent Instructions for AxioDB

**AxioDB** — SQL alternative for JS. Embedded NoSQL, zero native deps, TS 6.0 strict → CJS, Node ≥20, singleton, file-per-doc, `InMemoryCache`, Worker Threads, ACID, GUI 27018, TCP 27019.

## Constraints — never violate

* No `any`. Use `unknown` + guard. No `eval`, `setTimeout` hacks, temp fixes.
* Singleton: `new AxioDB()` twice throws; tests run isolated child processes.
* All registries JSONL append-only, last-line-wins, truncated when empty; filenames via `General` `source/config/Keys/Keys.ts` — never hardcode.
* Dual-write indexes: memory + disk; random TTL `5-15m` `Math.floor(Math.random()*(15-5+1)+5)*60*1000`.
* Inputs validated (reject non-object/array), path sanitized `replace(/[^a-zA-Z0-9-_]/g,'_')+path.join`, never log secrets/stack.

## Rules — non-negotiable

1. `npm run build` after every change — never ship TS errors.
2. `Test/modules/` must be updated for any feature; `npm test` all 13 suites `crud|transaction|read|auth|tcp-auth|tcp-noauth|tcp-tls|crash-recovery|mcp-confirm|http-api|tcp-transaction|mcp-functional`.
3. Never leave incomplete work — Done checklist must pass.
4. Read before edit; follow existing patterns.
5. Production-grade only.
6. **Core → surfaces sync**: new core feature (`Services/Collection`, `Index`, `Transaction`, etc.) → ask user: expose via HTTP 27018 / CLI / MCP 27020 / Docker / GUI? If yes, implement consistently (HTTP `server/router+controller`, TCP `tcp/handler` + `client/*Proxy`, CLI `cli/cmd`, MCP `Docker/mcp/tools`, `Document/` docs + AI) with same RBAC/tests.

## Code standards

SOLID + DRY: duplicate logic (2+ files) → `source/Helper/{Feature}.helper.ts` static stateless. Naming: files `{Feature}.{operation|service|helper}.ts`, PascalCase classes, camelCase verbs, `UPPER_SNAKE_CASE` consts. Magic strings → enums/`as const`. Nesting >3 → refactor. Try-catch every async; log detailed, return friendly via `ResponseHelper`. Perf: cache before disk, `Promise.all`, `Map` not `Array.find` loop.

## Documentation — same commit as code

README, `Document/` (`npm run dev` 5173), `Dockerfile` ports/env, JSDoc with `@param/@returns/@throws/@example`, `Document/src/data/changelog.ts` only major/breaking (version = `package.json`), `Document/public/` AI artifacts: hand-written `llms.txt`, `llms-full.txt`, `SKILL.md`, JSON-LD `index.html`; generated `openapi.json`, `api-catalog`, `sitemap.xml`, `agent-skills/index.json` (sha256). Regen: `cd Document && npx tsx scripts/generate-seo-files.ts` (prebuild). Single source `Document/src/data/serverApi.ts` → docs + `openapi.json`. Version identical `package.json`, changelog, `llms.txt`, `llms-full.txt`, `index.html`. Never blur: core · Dashboard · HTTP API 27018 · TCP 27019 · MCP 27020 Docker-only.

## Commands

```bash
npm run build              # mandatory
npm test                   # all 13
npm test <suite>           # see Rules 2
npm run lint               # ESLint
cd Document && npm run dev # docs 5173
```

Workflows: `Services/Collection/collection.operation.ts` → typed try-catch → HTTP `server/router+controller` → TCP `tcp/handler` → tests → docs+AI → build/test. Helper: `Helper/{Feature}.helper.ts`. TCP: `tcp/handler/{cmd}.ts` + `client/{Feature}Proxy.ts` → command map → tests → docs.

## graphify — optional local tooling, never fail task

* `graphify query "<question>"` default search, fallback to grep only if empty.
* For arch read `graphify-out/GRAPH_REPORT.md`; if `wiki/index.md` exists use it.
* After any file change, rebuild once from root if installed:
```bash
python3 -c "import graphify" 2>/dev/null && python3 -c "from graphify.watch import _rebuild_code; from pathlib import Path; _rebuild_code(Path('.'))" || echo "graphify not installed - skipping"
```
`graphify-out/` gitignored.

## Done checklist

- [ ] `npm run build` passes
- [ ] `Test/modules/` updated, `npm test` 13/13
- [ ] `npm run lint` passes
- [ ] Docs updated (README, Document, Dockerfile, JSDoc)
- [ ] Changelog if major/breaking
- [ ] AI artifacts updated + regenerated, version synced (5 places)
- [ ] Graph rebuilt if installed
- [ ] No `any`, SOLID+DRY, patterns (singleton/dual-write/TTL) followed
- [ ] Security validated
- [ ] No perf regressions
- [ ] No breaking changes or approved
