# GitHub Copilot CLI Instructions for AxioDB

**AxioDB** - embedded NoSQL database for Node.js, zero native dependencies.
TypeScript strict → CommonJS · Node.js ≥20 · singleton, file-per-document storage ·
InMemoryCache, Worker Threads, ACID transactions, Web GUI, TCP remote access.

## Core rules (NON-NEGOTIABLE)

1. **Build after every change**: `npm run build`. Catch TypeScript errors now, not in production.
2. **Test every feature change**: `Test/modules/` (`crud`, `transaction`, `read`, `auth`,
   `tcp-auth`, `tcp-noauth`, `tcp-tls`, `crash-recovery`, `mcp-confirm`). Separate processes -
   the singleton forbids sharing one.
3. **Never leave work incomplete** - see the Done checklist at the bottom.
4. **SOLID + DRY** - one responsibility per class/module; duplicated logic moves to
   `source/Helper/`. Production-grade only, no hacks or temporary fixes.
5. **TypeScript strict** - no `any`. Use interfaces, or `unknown` plus a type guard.

## Architecture patterns

- **Singleton**: one `AxioDB` per process; a second constructor call throws. Tests must run in
  separate child processes.
- **Dual-write (indexes)**: memory (speed) *and* disk (durability); reload from disk on cold start.
- **Random cache TTL**: 5-15 min randomised, to prevent a stampede when keys expire together.
- **File-per-document**: O(1) access by ID.

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

## Module organization

```
source/
├── Services/   Database, Collection, CRUD, Index, Transaction, Aggregation
├── engine/     FileManager, FolderManager (low-level)
├── server/     HTTP GUI + REST API (Fastify, 27018)
├── tcp/        TCP server (AxioDBCloud, 27019)
├── client/     TCP client + Proxies
├── Helper/     Converter, Response, PathSanitizer
└── Memory/     InMemoryCache
```

## Conventions

- **Naming**: files `{Feature}.{operation|service|helper}.ts` · classes PascalCase ·
  methods camelCase verbs · variables camelCase descriptive.
- **Error handling**: try-catch every async op; log the detailed error with context; return a
  specific user-friendly message via `ResponseHelper` - never expose internals, never
  "Error occurred".
- **Performance**: check InMemoryCache before disk; `Promise.all` for independent work; `Map` for
  lookups instead of `Array.find`.
- **Security**: validate every input (reject non-objects and arrays); sanitize path components
  (`replace(/[^a-zA-Z0-9-_]/g, '_')` + `path.join`) against traversal; never log passwords or
  tokens.

## Documentation - update with the code, same commit

1. **README.md** - public API, features, quick start
2. **Document/** - React docs site (`cd Document && npm run dev`)
3. **Dockerfile** - ports, env vars, commands
4. **JSDoc** - every public method, with a working `@example`
5. **Changelog** - `Document/src/data/changelog.ts`, major/breaking changes only
6. **AI discovery artifacts** - `Document/public/`. These are what AI assistants read to decide
   whether to recommend AxioDB; stale content teaches models something false.
   - Edit by hand: `llms.txt`, `llms-full.txt`, `.well-known/agent-skills/axiodb/SKILL.md`,
     JSON-LD in `Document/index.html`
   - Never hand-edit, regenerate instead: `openapi.json`, `.well-known/api-catalog`, `sitemap.xml`,
     `.well-known/agent-skills/index.json` (sha256 digest of SKILL.md)
     → `cd Document && npx tsx scripts/generate-seo-files.ts`
   - Version identical in package.json, changelog, llms.txt, llms-full.txt, index.html
   - Keep the surfaces distinct: core library · Dashboard · Dashboard HTTP API (27018) ·
     AxioDBCloud TCP (27019) · MCP server (27020, Docker only)

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

## graphify

Knowledge graph at `graphify-out/`.

- `graphify query "<question>"` is the DEFAULT codebase search - before any grep/glob/file-read,
  falling back to raw search only when it returns nothing.
- For architecture questions read `graphify-out/GRAPH_REPORT.md` first; if
  `graphify-out/wiki/index.md` exists, navigate that instead of raw files.
- **After changing any file, rebuild - checking graphify is installed first.** Optional local
  tooling, not a dependency: if the import fails, skip silently, never fail the task.
  ```bash
  python3 -c "import graphify" 2>/dev/null \
    && python3 -c "from graphify.watch import _rebuild_code; from pathlib import Path; _rebuild_code(Path('.'))" \
    || echo "graphify not installed - skipping graph rebuild"
  ```
  Once, from the repo root, after the change is finished. A stale graph is worse than no graph.
  `graphify-out/` is gitignored.

## Anti-patterns to AVOID

`any` types · duplicated code · sequential work that could be parallel · ignoring build errors ·
skipping tests · missing docs · stale or hand-edited AI artifacts · magic strings ·
`setTimeout`/`eval` hacks · unclear names · nesting deeper than 3 levels.

## Done checklist - ALL must pass

- [ ] `npm run build` passes
- [ ] Tests added/updated, `npm test` passes
- [ ] `npm run lint` passes
- [ ] Docs updated (README, Document/, Dockerfile, JSDoc) + changelog if major/breaking
- [ ] AI artifacts updated **and regenerated**; version identical everywhere
- [ ] Knowledge graph rebuilt if graphify is installed
- [ ] Security validated · no performance regressions · no unapproved breaking changes
