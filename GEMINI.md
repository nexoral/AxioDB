# GEMINI.md

This file provides guidance to Gemini Code Assist when working with code in this repository.

## Project Overview

**AxioDB** - Embedded NoSQL database for Node.js. Pure TypeScript/JavaScript, zero native dependencies.

- **Stack**: TypeScript (strict) → CommonJS, Node.js ≥20.0.0
- **Pattern**: Singleton, file-per-document storage
- **Features**: InMemoryCache, Worker Threads, ACID transactions, Web GUI (27018), TCP (27019)

## Commands

```bash
npm run build    # TypeScript → lib/ (MANDATORY after changes)
npm test        # Run all tests (separate processes)
npm run lint    # ESLint check
```

## Core Rules (NON-NEGOTIABLE)

1. **ALWAYS build**: `npm run build` after EVERY code change
2. **ALWAYS test**: Add/update tests in `Test/modules/` for ANY feature change
3. **NEVER incomplete**: Build passes + Tests pass + Docs updated = Done
4. **Respect existing**: Read files before modifying, follow patterns
5. **SOLID + DRY**: No hacks, no duplication, modular design
6. **Update docs**: README.md, Document/, Dockerfile when features change

## Structure

```
source/Services/      # Core: Database, Collection, CRUD, Index, Transaction
source/engine/        # File operations: FileManager, FolderManager
source/server/        # HTTP GUI (port 27018, Fastify)
source/tcp/           # TCP server (port 27019, AxioDBCloud)
source/client/        # AxioDBCloud TCP client
source/Helper/        # Utils: Converter, Crypto, Response
Test/modules/         # crud.test.js, transaction.test.js, read.test.js
```

## Key Constraints

- **Singleton**: Only one AxioDB instance per app
- **Test isolation**: Tests run in separate processes
- **No `any` types**: Use proper TypeScript types
- **Backward compatibility**: Maintain unless explicitly approved

## AxioDB Patterns

### Singleton Pattern
```typescript
export class AxioDB {
  private static _instance: AxioDB;
  constructor() {
    if (AxioDB._instance) throw new Error("Only one instance allowed");
    AxioDB._instance = this;
  }
}
```

### Dual-Write (Indexes)
```typescript
// Write to memory (speed) + disk (durability)
await this.indexCache.set(key, data, TTL);
await this.fileManager.writeFile(path, JSON.stringify(data));
```

### Random Cache TTL
```typescript
const TTL = Math.floor(Math.random() * (15 - 5 + 1) + 5) * 60 * 1000; // 5-15min
```

## TypeScript Standards

- No `any` types - use proper interfaces
- Strict mode compliance
- Error handling with try-catch
- ResponseHelper for responses

## Testing Requirements

- Location: `Test/modules/`
- Files: `crud.test.js`, `transaction.test.js`, `read.test.js`
- Coverage: Happy path, edge cases, errors, concurrent operations
- Run in separate processes (singleton constraint)

## Documentation Requirements

Update when features change:
- `README.md` - Public API changes
- `Document/` - Feature documentation (React site)
- `Dockerfile` - Deployment changes
- JSDoc comments for public methods

## Security

- Validate all input
- Sanitize file paths (prevent traversal)
- Encrypt sensitive data (AES-256)
- No stack traces to users

## Performance

- Use InMemoryCache for frequent reads
- Batch operations with Promise.all
- Avoid unnecessary file I/O
- Use Map for O(1) lookups

## Definition of "Done"

- ✅ Code follows standards
- ✅ `npm run build` passes
- ✅ Tests added/updated in `Test/modules/`
- ✅ `npm test` passes
- ✅ Docs updated (README, Document/, Dockerfile)
- ✅ No breaking changes (unless approved)
