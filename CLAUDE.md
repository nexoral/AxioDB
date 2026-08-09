# CLAUDE.md

Guidance for Claude Code (claude.ai/code) working in this repository.

**AxioDB** - embedded NoSQL database for Node.js, zero native dependencies.
TypeScript strict → CommonJS · Node.js ≥20 · singleton, file-per-document storage ·
InMemoryCache, Worker Threads, ACID transactions, Web GUI, TCP remote access.

## Commands

```bash
npm run build    # TypeScript → lib/ (MANDATORY after every change)
npm test         # All suites (separate processes)
npm test <suite> # crud | transaction | read | auth | tcp-auth | tcp-noauth
                 # tcp-tls | crash-recovery | mcp-confirm
npm run lint     # ESLint
node Test/modules/crud.test.js   # Run one suite directly
```

## Core Rules (NON-NEGOTIABLE)

1. **ALWAYS build**: `npm run build` after EVERY code change
2. **ALWAYS test**: add/update `Test/modules/` for ANY feature change
3. **NEVER incomplete**: build passes + tests pass + docs updated = done
4. **Respect existing**: read files before modifying, follow the patterns already there
5. **SOLID + DRY**: no hacks, no duplication, modular design
6. **Update docs**: README.md, `Document/`, Dockerfile when features change
7. **Update changelog**: any major/breaking change (new feature, breaking API change, security fix,
   significant perf work) gets an entry in `Document/src/data/changelog.ts`
8. **Update the AI artifacts with the docs, in the same commit**: `Document/public/llms.txt`,
   `llms-full.txt`, `.well-known/agent-skills/axiodb/SKILL.md`, and the `index.html` JSON-LD. Then
   regenerate the derived ones (`openapi.json`, api-catalog, sitemap, and the sha256 digest of
   SKILL.md) with `cd Document && npx tsx scripts/generate-seo-files.ts`. Version must match
   `package.json` everywhere. These files are what AI assistants read to recommend AxioDB - stale
   content there teaches models something false.

## Definition of "Done"

- ✅ Code follows standards · `npm run build` passes · `npm test` passes
- ✅ Tests added/updated in `Test/modules/`
- ✅ Docs updated (README, `Document/`, Dockerfile) + changelog if major/breaking
- ✅ AI artifacts updated + regenerated; version identical across package.json, changelog,
  llms.txt, llms-full.txt, index.html
- ✅ Knowledge graph rebuilt if graphify is installed (see below)
- ✅ No breaking changes (unless approved)

## Structure

```
source/
├── Services/   Database, Collection, CRUD, Index, Transaction, Aggregation
├── engine/     FileManager, FolderManager
├── server/     HTTP GUI + REST API (Fastify, 27018)
├── tcp/        TCP server (AxioDBCloud, 27019)
├── client/     AxioDBCloud TCP client
├── Helper/     Converter, Response
├── Memory/     InMemoryCache
└── config/     Entry point: DB.ts exports AxioDB, AxioDBCloud

Test/modules/   Test suites          Document/   React docs site (npm run dev)
```

## Key Constraints

- **Singleton**: one AxioDB per app - which is why tests run in separate processes
- **No `any` types**: use proper TypeScript types
- **Backward compatibility**: maintain unless explicitly approved
- **Permissions**: see `.claude/settings.json` for allowed/denied commands

## Custom Slash Commands

In `.claude/commands/`: `/review {path}` · `/test {feature}` · `/feature {description}` ·
`/build-check` · `/docs {feature}` · `/collection-op {operation}` · `/tcp-command {command}` ·
`/index-op {operation}` · `/transaction-op {operation}` · `/helper {utility}` · `/fix-build` ·
`/perf-check {path}`

## Detailed Rules

`.claude/rules/` - `commands.md` (build/test/Docker), `architecture.md` (patterns, data flow,
on-disk layout), `workflow.md` (process, completion criteria), `documentation.md` (what/when to
update, including AI artifacts), `code-standards.md` (SOLID, TypeScript, security, performance).

## graphify

Knowledge graph at `graphify-out/`.

- `graphify query "<question>"` is the DEFAULT codebase search - run it before any
  grep/glob/file-read, falling back to raw search only when it returns nothing.
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
  no graph: it points the next search at symbols and line numbers that have already moved.
  `graphify-out/` is gitignored, so this never affects what you commit.
