# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**AxioDB** - Embedded NoSQL database for Node.js. Pure TypeScript/JavaScript, zero native dependencies.

- **Stack**: TypeScript (strict) → CommonJS, Node.js ≥20.0.0
- **Pattern**: Singleton, file-per-document storage
- **Features**: InMemoryCache, Worker Threads, ACID transactions, Web GUI, TCP remote access

## Commands

```bash
npm run build    # TypeScript → lib/ (MANDATORY after changes)
npm test        # Run all tests (separate processes)
npm run lint    # ESLint check

# Test specific module
npm test crud | transaction | read | auth | tcp-auth | tcp-noauth | tcp-tls | crash-recovery | mcp-confirm
node Test/modules/crud.test.js
```

## Core Rules (NON-NEGOTIABLE)

1. **ALWAYS build**: `npm run build` after EVERY code change
2. **ALWAYS test**: Add/update tests in `Test/modules/` for ANY feature change
3. **NEVER incomplete**: Build passes + Tests pass + Docs updated = Done
4. **Respect existing**: Read files before modifying, follow patterns
5. **SOLID + DRY**: No hacks, no duplication, modular design
6. **Update docs**: README.md, Document/, Dockerfile when features change
7. **Update changelog**: Any major/breaking change (new feature, breaking API change, security fix, significant perf work) gets an entry in `Document/src/data/changelog.ts` - see `.claude/rules/documentation.md`
8. **Update the AI artifacts with the docs, always in the same commit**: `Document/public/llms.txt`, `llms-full.txt`, `.well-known/agent-skills/axiodb/SKILL.md`, and the `index.html` JSON-LD. Then regenerate the derived ones with `cd Document && npx tsx scripts/generate-seo-files.ts` (openapi.json, api-catalog, sitemap, and the sha256 digest of SKILL.md). Version must match `package.json` everywhere. These files are what AI assistants read to recommend AxioDB - stale content there teaches models something false. Full rules in `.claude/rules/documentation.md`.

## Definition of "Done"

- ✅ Code follows standards
- ✅ `npm run build` passes
- ✅ Tests added/updated in `Test/modules/`
- ✅ `npm test` passes
- ✅ Docs updated (README, Document/, Dockerfile)
- ✅ Changelog updated (`Document/src/data/changelog.ts`) if the change is major/breaking
- ✅ AI artifacts updated + regenerated (`llms.txt`, `llms-full.txt`, `SKILL.md`, JSON-LD; then `npx tsx scripts/generate-seo-files.ts`)
- ✅ Version identical across package.json, changelog, llms.txt, llms-full.txt, index.html
- ✅ Knowledge graph rebuilt if graphify is installed (see the graphify section; skip silently if not)
- ✅ No breaking changes (unless approved)

## Structure

```
source/
├── Services/      # Core: Database, Collection, CRUD, Index, Transaction, Aggregation
├── engine/        # File operations: FileManager, FolderManager
├── server/        # HTTP GUI (port 27018, Fastify)
├── tcp/           # TCP server (port 27019, AxioDBCloud)
├── client/        # AxioDBCloud TCP client
├── Helper/        # Utils: Converter, Response
├── Memory/        # InMemoryCache
└── config/        # Entry point: DB.ts exports AxioDB, AxioDBCloud

Test/modules/      # crud.test.js, transaction.test.js, read.test.js
Document/          # React docs site (npm run dev)
```

## Key Constraints

- **Singleton**: Only one AxioDB instance per app
- **Test isolation**: Tests run in separate processes
- **No `any` types**: Use proper TypeScript types
- **Backward compatibility**: Maintain unless explicitly approved
- **Permissions**: See `.claude/settings.json` for allowed/denied commands


## Custom Slash Commands

Use `.claude/commands/` for common tasks:
- `/review {path}` - Code review (security, errors, types)
- `/test {feature}` - Create/update tests
- `/feature {description}` - Full feature workflow
- `/build-check` - Build verification
- `/docs {feature}` - Update documentation
- `/collection-op {operation}` - New collection method
- `/tcp-command {command}` - AxioDBCloud TCP command
- `/index-op {operation}` - Index operations
- `/transaction-op {operation}` - Transaction support
- `/helper {utility}` - Create helper utility
- `/fix-build` - Fix TypeScript errors
- `/perf-check {path}` - Performance analysis

## Detailed Rules

See `.claude/rules/` for specifics:
- `commands.md` - Build, test, Docker commands
- `architecture.md` - Design patterns, data flow
- `workflow.md` - Development process, completion criteria
- `documentation.md` - What/when to update docs
- `code-standards.md` - SOLID, TypeScript, security, performance

## graphify

This project has a graphify knowledge graph at `graphify-out/`.

Rules:
- Use `graphify query "<question>"` as the DEFAULT codebase search: run it before any grep/glob/file-read, and fall back to raw search only when the graph returns nothing
- Before answering architecture or codebase questions, read `graphify-out/GRAPH_REPORT.md` for god nodes and community structure
- If `graphify-out/wiki/index.md` exists, navigate it instead of reading raw files
- **After changing any file, rebuild the graph - but check that graphify is installed first.**
  It is optional local tooling, not a dependency: if the import fails, skip silently and carry
  on. Never fail or block a task because graphify is missing.
  ```bash
  python3 -c "import graphify" 2>/dev/null \
    && python3 -c "from graphify.watch import _rebuild_code; from pathlib import Path; _rebuild_code(Path('.'))" \
    || echo "graphify not installed - skipping graph rebuild"
  ```
  Run it from the repo root, once, after the change is finished - not after every edit. A stale
  graph is worse than no graph: it points the next search at symbols and line numbers that have
  already moved. `graphify-out/` is gitignored, so this never affects what you commit.
