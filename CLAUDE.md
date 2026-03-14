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
npm test crud | transaction | read
node Test/modules/crud.test.js
```

## Core Rules (NON-NEGOTIABLE)

1. **ALWAYS build**: `npm run build` after EVERY code change
2. **ALWAYS test**: Add/update tests in `Test/modules/` for ANY feature change
3. **NEVER incomplete**: Build passes + Tests pass + Docs updated = Done
4. **Respect existing**: Read files before modifying, follow patterns
5. **SOLID + DRY**: No hacks, no duplication, modular design
6. **Update docs**: README.md, Document/, Dockerfile when features change

## Definition of "Done"

- ✅ Code follows standards
- ✅ `npm run build` passes
- ✅ Tests added/updated in `Test/modules/`
- ✅ `npm test` passes
- ✅ Docs updated (README, Document/, Dockerfile)
- ✅ No breaking changes (unless approved)

## Structure

```
source/
├── Services/      # Core: Database, Collection, CRUD, Index, Transaction, Aggregation
├── engine/        # File operations: FileManager, FolderManager
├── server/        # HTTP GUI (port 27018, Fastify)
├── tcp/           # TCP server (port 27019, AxioDBCloud)
├── client/        # AxioDBCloud TCP client
├── Helper/        # Utils: Converter, Crypto, Response
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
