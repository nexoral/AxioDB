---
name: axiodb-development
description: Core development rules and patterns for AxioDB embedded NoSQL database
version: 1.0.0
tags: [typescript, database, testing, build]
author: AxioDB Team
---

# AxioDB Development Skill

## Project Identity

**AxioDB** - Embedded NoSQL database for Node.js
- TypeScript strict mode → CommonJS
- Node.js ≥20.0.0
- Zero native dependencies
- Singleton pattern, file-per-document storage

## Mandatory Workflows

### After EVERY Code Change
```bash
npm run build  # MANDATORY - catch TypeScript errors immediately
```

### For ANY Feature Change
1. Update tests in `Test/modules/`
2. Run `npm test` - all tests must pass
3. Update docs (README.md, Document/, Dockerfile)
4. Run `npm run lint` - must pass

## Definition of "Done"

A task is NOT complete until ALL of these are true:
- ✅ Code written following standards
- ✅ `npm run build` passes with zero errors
- ✅ Tests added/updated in `Test/modules/`
- ✅ `npm test` passes - all tests green
- ✅ `npm run lint` passes
- ✅ Documentation updated (README, Document/, Dockerfile)
- ✅ No breaking changes (or explicitly noted and approved)
- ✅ Self-reviewed for performance, security, maintainability

## Architecture Constraints

### Singleton Pattern (NON-NEGOTIABLE)
```typescript
export class AxioDB {
  private static _instance: AxioDB;

  constructor() {
    if (AxioDB._instance) {
      throw new Error("Only one instance of AxioDB is allowed.");
    }
    AxioDB._instance = this;
  }
}
```

**Critical Implication**: Tests MUST run in separate child processes. Cannot run tests in parallel.

### File-Per-Document Storage
```
{RootPath}/{DatabaseName}/{CollectionName}/{documentId}.axiodb
```

### Dual-Write Pattern (Indexes)
```typescript
// ALWAYS write to BOTH memory AND disk
await this.indexCache.set(key, data, TTL);  // Memory (speed)
await this.fileManager.writeFile(path, JSON.stringify(data));  // Disk (durability)
```

### Random Cache TTL (5-15 minutes)
```typescript
const TTL = Math.floor(Math.random() * (15 - 5 + 1) + 5) * 60 * 1000;
```
**Why**: Prevents cache stampede/thundering herd

## TypeScript Standards (STRICT)

### NO `any` Types - EVER
```typescript
// ❌ ABSOLUTELY FORBIDDEN
const result: any = await operation();

// ✅ REQUIRED
interface OperationResult {
  success: boolean;
  data: DocumentData;
}
const result: OperationResult = await operation();
```

### Strict Null Checks
```typescript
// ✅ GOOD
function get(id: string): Document | null {
  return this.cache.get(id) ?? null;
}

const doc = get('123');
if (doc !== null) {
  console.log(doc.name);
}
```

## SOLID Principles

### Single Responsibility
Each class/module has ONE reason to change.

### Don't Repeat Yourself (DRY)
If same logic appears in 2+ files, extract to `Helper/` directory.

### No Hacky Solutions
```typescript
// ❌ FORBIDDEN
setTimeout(() => { /* hope this works */ }, 1000);
eval(userInput);
try { risky(); } catch (e) { /* ignore */ }

// ✅ REQUIRED
await properAsyncOperation();
const sanitized = validateAndSanitize(userInput);
try { await risky(); } catch (error) {
  logger.error('Operation failed', error);
  return ResponseHelper.error('Failed', StatusCodes.ERROR);
}
```

## Testing Requirements

### Location
```
Test/modules/
├── crud.test.js          # CRUD operations
├── transaction.test.js   # Transactions, WAL, savepoints
└── read.test.js          # Read optimizations, caching
```

### Coverage Required
- Happy path (success scenarios)
- Edge cases (empty, null, undefined, large data)
- Error cases (validation failures, file errors, conflicts)
- Concurrent operations
- Backward compatibility

## Module Organization

```
source/
├── Services/
│   ├── Database/              # Database ops
│   ├── Collection/            # Collection ops
│   ├── CRUD Operation/        # Create, Reader, Update, Delete
│   ├── Index/                 # Index management (cache + disk)
│   ├── Aggregation/           # MongoDB-style pipelines
│   └── Transaction/           # ACID, WAL, sessions
├── engine/Filesystem/         # FileManager, FolderManager
├── server/                    # HTTP GUI (Fastify, port 27018)
├── tcp/                       # TCP server (AxioDBCloud, port 27019)
├── client/                    # AxioDBCloud TCP client
├── Helper/                    # Converter, Crypto, Response
└── Memory/                    # InMemoryCache
```

## Naming Conventions

- **Files**: `{Feature}.operation.ts`, `{Feature}.service.ts`, `{Feature}.helper.ts`
- **Classes**: PascalCase: `FileManager`, `QueryMatcher`
- **Methods**: camelCase: `createDatabase()`, `isValidDocument()`
- **Variables**: camelCase: `documentId`, `collectionPath`

## Performance Standards

### 1. Use InMemoryCache
```typescript
const cached = this.cache.get(key);
if (cached) return cached;

const data = await this.readFromDisk(id);
this.cache.set(key, data, TTL);
return data;
```

### 2. Batch Operations
```typescript
// ✅ PARALLEL
await Promise.all(docs.map(d => this.insert(d)));

// ❌ SEQUENTIAL (slow)
for (const d of docs) { await this.insert(d); }
```

### 3. Use Map for O(1) Lookups
```typescript
// ✅ O(1)
const map = new Map<string, Document>();
const found = map.get(id);

// ❌ O(n)
const found = array.find(d => d.id === id);
```

## Security Standards

### 1. Validate All Input
```typescript
if (!document || typeof document !== 'object') {
  return this.ResponseHelper.error('Invalid', StatusCodes.BAD_REQUEST);
}
if (Array.isArray(document)) {
  return this.ResponseHelper.error('Cannot be array', StatusCodes.BAD_REQUEST);
}
```

### 2. Sanitize File Paths
```typescript
// Prevent path traversal
const sanitized = documentId.replace(/[^a-zA-Z0-9-_]/g, '_');
return path.join(collectionPath, `${sanitized}.axiodb`);
```

### 3. Handle Sensitive Data
```typescript
// Encrypt collections with sensitive data
const users = await db.createCollection('Users', true, process.env.KEY);

// Never log passwords
logger.info('Auth', { userId }); // ✅
logger.info('Auth', { password }); // ❌
```

## Documentation Requirements

Update when features change:

1. **README.md** - Public API, features, quick start examples
2. **Document/** - React docs site (`cd Document && npm run dev`)
3. **Dockerfile** - If ports, env vars, or commands change
4. **JSDoc** - All public methods with examples

## Anti-Patterns (FORBIDDEN)

❌ Using `any` types
❌ Duplicated code (violates DRY)
❌ Sequential operations that could be parallel
❌ Ignoring build errors
❌ Skipping tests
❌ Missing documentation
❌ Hardcoded values
❌ Magic strings/numbers
❌ Deep nesting (>3 levels)
❌ Unclear variable names
❌ Suppressing errors without handling

## Commands

```bash
# Build & Test
npm run build              # TypeScript → lib/ (MANDATORY)
npm test                   # All tests
npm test crud              # CRUD tests only
npm test transaction       # Transaction tests only
npm test read              # Read optimization tests
npm run lint               # ESLint

# Development
node Test/modules/crud.test.js  # Run specific test
cd Document && npm run dev      # Docs site (localhost:5173)
```

## Success Criteria

Every task must meet ALL:
- ✅ Builds successfully (`npm run build`)
- ✅ Tests pass (`npm test`)
- ✅ Lint passes (`npm run lint`)
- ✅ Docs updated
- ✅ No regressions
- ✅ Follows patterns
- ✅ Security validated
- ✅ Performance acceptable
