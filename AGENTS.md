# Codex Agent Instructions for AxioDB

**AxioDB** - embedded NoSQL database for Node.js, zero native dependencies.
TypeScript 5.6+ strict → CommonJS · Node.js ≥20 · singleton, file-per-document storage ·
InMemoryCache, Worker Threads, ACID transactions, HTTP GUI (27018), TCP server (27019).

## Non-negotiable rules

1. **Build after every change**: `npm run build`. TypeScript errors must never reach production.
2. **Update tests for any feature change**: `Test/modules/` (`crud`, `transaction`, `read`, `auth`,
   `tcp-auth`, `tcp-noauth`, `tcp-tls`, `crash-recovery`, `mcp-confirm`). Tests run in separate
   processes because of the singleton.
3. **Never leave work incomplete** - see the Done checklist at the bottom.
4. **Read before modifying.** Follow existing patterns; consistency beats personal preference.
5. **Production-grade only** - no hacks, no temporary fixes, no `setTimeout` workarounds, no `eval`.

## Architecture patterns you MUST follow

- **Singleton**: one `AxioDB` per process; the constructor throws on a second instance. This is why
  tests must run in separate child processes.
- **Dual-write (indexes)**: write to memory (speed) *and* disk (durability); reload from disk on
  cold start.
- **Random cache TTL**: 5-15 minutes, randomised - prevents a stampede when keys expire together.
  `Math.floor(Math.random() * (15 - 5 + 1) + 5) * 60 * 1000`
- **File-per-document**: O(1) access by ID, per-document backup/restore.

### On-disk layout

```
{RootPath}/{DatabaseName}/
├── collection.meta.jsonl               collection registry (append-only)
└── {CollectionName}/
    ├── {documentId}.axiodb             documents - the only non-JSONL files
    ├── indexes/
    │   ├── index.meta.jsonl            index registry (append-only)
    │   └── {indexName}.jsonl
    └── .transactions/
        ├── txn-meta.jsonl              in-flight transaction registry
        └── {transactionId}.wal.jsonl
```

Every registry/log is append-only JSONL, folded last-line-wins on read, truncated when empty.
Filenames live in `General` in `source/config/Keys/Keys.ts` - never hardcode them.

## Code standards

- **No `any`.** Use interfaces; use `unknown` + a type guard when the type is genuinely unknown.
- **SOLID** - one responsibility per class/module. **DRY** - logic appearing in 2+ files moves to
  `source/Helper/{Feature}.helper.ts` (static, stateless).
- **Naming**: files `{Feature}.{operation|service|helper}.ts` · classes PascalCase ·
  methods camelCase verbs · variables camelCase descriptive · constants `UPPER_SNAKE_CASE`.
- **Magic strings** → enums or `as const` objects.
- **Nesting** deeper than 3 levels → refactor.
- **Error handling**: try-catch every async op; log the detailed error with context; return a
  specific, user-friendly message via `ResponseHelper` - never expose internals or say
  "Error occurred".
- **Performance**: check InMemoryCache before disk; `Promise.all` for independent work; `Map` for
  lookups, never `Array.find` in a loop.
- **Security**: validate every input (reject non-objects and arrays); sanitize path components
  (`documentId.replace(/[^a-zA-Z0-9-_]/g, '_')` + `path.join`) to block traversal; never log
  passwords, tokens, or stack traces to users.

## Module organization

```
source/
├── Services/            Database, Collection, CRUD Operation, Index, Aggregation, Transaction
├── engine/Filesystem/   FileManager, FolderManager (low-level)
├── server/              HTTP GUI + REST API (Fastify, 27018)
├── tcp/                 TCP server (AxioDBCloud, 27019)
├── client/              TCP client + Proxies
├── Helper/              Converter, Response, PathSanitizer
└── Memory/              InMemoryCache

Test/modules/            Tests (separate processes)
Document/                React docs site
```

## Documentation - update with the code, in the same commit

1. **README.md** - public API, features, quick start
2. **Document/** - React docs site (`cd Document && npm run dev`)
3. **Dockerfile** - ports, env vars, commands
4. **JSDoc** on every public method: description, `@param`, `@returns`, `@throws`, and a working
   `@example`
5. **Changelog** - `Document/src/data/changelog.ts`, entry shape (`version`, `date`, `title`,
   `changes[]`), version matching whatever `package.json` bumps to. Only for major/breaking work:
   new features, breaking API changes, security fixes, significant performance work. It is a
   curated milestone list, not a commit log - skip trivial fixes, refactors, chores.
6. **AI discovery artifacts** - `Document/public/`. These are how AI assistants learn what AxioDB is
   and when to recommend it, so stale content teaches models something false long after release.
   - Hand-written: `llms.txt`, `llms-full.txt`, `.well-known/agent-skills/axiodb/SKILL.md`, JSON-LD
     in `Document/index.html` (`softwareVersion`, `dateModified`, FAQPage). Also `robots.txt` /
     `_headers`, but only when a machine-readable entry point is added or removed.
   - Generated, never hand-edit: `openapi.json`, `.well-known/api-catalog`, `sitemap.xml`,
     `.well-known/agent-skills/index.json` (holds a sha256 digest of `SKILL.md`).
     Regenerate: `cd Document && npx tsx scripts/generate-seo-files.ts` (also runs on `prebuild`).
     Editing SKILL.md without regenerating leaves a digest that no longer matches the file.
   - `Document/src/data/serverApi.ts` is the single source feeding both the docs page and
     `openapi.json`.
   - Version identical in `package.json`, changelog, `llms.txt`, `llms-full.txt`, `index.html`.
   - **Never blur the surfaces**: core embedded library · Dashboard · Dashboard HTTP API (27018) ·
     AxioDBCloud TCP (27019) · MCP server (27020, Docker image only). Keeping these distinct is the
     entire reason those files exist.

## Commands

```bash
npm run build              # TypeScript → lib/ (MANDATORY after every change)
npm test                   # All suites (separate processes)
npm test <suite>           # crud | transaction | read | auth | tcp-auth | tcp-noauth
                           # tcp-tls | crash-recovery | mcp-confirm
npm run lint               # ESLint
node Test/modules/crud.test.js  # Run one suite directly
cd Document && npm run dev      # Docs site (localhost:5173)
```

## Common workflows

- **Collection operation**: `Services/Collection/collection.operation.ts` → typed method with
  try-catch → HTTP (`server/router/` + `controller/`) → TCP (`tcp/handler/`) → tests in
  `Test/modules/crud.test.js` → docs + AI artifacts → build & test.
- **Helper utility**: create `Helper/{Feature}.helper.ts` (static, stateless) → extract the
  duplicated logic from the 2+ call sites → import → test if the logic is non-trivial.
- **TCP command**: `tcp/handler/{command}.ts` → client proxy `client/{Feature}Proxy.ts` → register
  in the command map → tests → docs.

## graphify

Knowledge graph at `graphify-out/`.

- `graphify query "<question>"` is the DEFAULT codebase search - run it before any
  grep/glob/file-read, and fall back to raw search only when it returns nothing.
- For architecture questions read `graphify-out/GRAPH_REPORT.md` (god nodes, communities) first;
  if `graphify-out/wiki/index.md` exists, navigate that instead of raw files.
- **After changing any file, rebuild - checking that graphify is installed first.** It is optional
  local tooling, not a dependency: if the import fails, skip silently. Never fail a task over it.
  ```bash
  python3 -c "import graphify" 2>/dev/null \
    && python3 -c "from graphify.watch import _rebuild_code; from pathlib import Path; _rebuild_code(Path('.'))" \
    || echo "graphify not installed - skipping graph rebuild"
  ```
  Once, from the repo root, after the change is finished - not per edit. A stale graph is worse than
  no graph: it points the next search at symbols that have already moved. `graphify-out/` is
  gitignored, so this never affects what you commit.

## Done checklist - verify ALL before calling a task complete

- [ ] `npm run build` passes
- [ ] Tests added/updated in `Test/modules/`, `npm test` passes
- [ ] `npm run lint` passes
- [ ] Docs updated (README, Document/, Dockerfile, JSDoc)
- [ ] Changelog updated if the change is major/breaking
- [ ] AI artifacts updated **and regenerated**; version identical across all five places
- [ ] Knowledge graph rebuilt if graphify is installed
- [ ] No `any`; SOLID + DRY; patterns followed (singleton, dual-write, random TTL)
- [ ] Security validated (input validation, path sanitization, no secrets logged)
- [ ] No performance regressions
- [ ] No breaking changes, or explicitly approved
