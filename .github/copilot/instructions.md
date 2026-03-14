# GitHub Copilot CLI Instructions for AxioDB

## Project Overview

**AxioDB** - Embedded NoSQL database for Node.js. Pure TypeScript/JavaScript, zero native dependencies.

- **Stack**: TypeScript (strict) → CommonJS, Node.js ≥20.0.0
- **Pattern**: Singleton, file-per-document storage
- **Features**: InMemoryCache, Worker Threads, ACID transactions, Web GUI, TCP remote access

## Core Rules (NON-NEGOTIABLE)

### 1. ALWAYS Build
```bash
npm run build  # After EVERY code change
```
**Why**: Catch TypeScript errors immediately, not in production.

### 2. ALWAYS Test
- **Location**: `Test/modules/`
- **Files**: `crud.test.js`, `transaction.test.js`, `read.test.js`
- **Requirement**: Update tests for ANY feature change
- **Run**: `npm test` (tests run in separate processes due to singleton)

### 3. NEVER Incomplete
**Definition of "Done"**:
- ✅ Code follows standards
- ✅ `npm run build` passes
- ✅ Tests added/updated in `Test/modules/`
- ✅ `npm test` passes
- ✅ `npm run lint` passes
- ✅ Docs updated (README.md, Document/, Dockerfile)
- ✅ No breaking changes (unless approved)
- ✅ Security validated
- ✅ Performance acceptable

### 4. SOLID + DRY
- Single responsibility per class/module
- Extract duplicated logic to `Helper/`
- No hacky solutions or temporary fixes
- Production-grade code only

### 5. TypeScript Strict
```typescript
// ❌ NEVER
const data: any = complexObject;

// ✅ ALWAYS
interface ComplexObject { field1: string; field2: number; }
const data: ComplexObject = complexObject;

// ✅ When unknown
const data: unknown = complexObject;
if (typeof data === 'object' && data !== null) { /* type guard */ }
```

## Architecture Patterns

### Singleton Pattern
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
**Implication**: Tests MUST run in separate child processes.

### Dual-Write (Indexes)
```typescript
// ALWAYS write to BOTH memory (speed) and disk (durability)
await this.indexCache.set(indexKey, data, TTL);
await this.fileManager.writeFile(indexPath, JSON.stringify(data));

// On cold start: reload from disk
const diskData = await this.fileManager.readFile(indexPath);
this.indexCache.set(indexKey, JSON.parse(diskData), TTL);
```

### Random Cache TTL
```typescript
// 5-15 minutes random TTL (prevent cache stampede)
const TTL = Math.floor(Math.random() * (15 - 5 + 1) + 5) * 60 * 1000;
```

### File Structure
```
{RootPath}/
└── {DatabaseName}/
    └── {CollectionName}/
        ├── {documentId}.axiodb
        ├── {documentId2}.axiodb
        └── indexes/
            └── {indexName}.json
```

## Module Organization

```
source/
├── Services/          # Database, Collection, CRUD, Index, Transaction, Aggregation
├── engine/           # FileManager, FolderManager (low-level)
├── server/           # HTTP GUI (Fastify, port 27018)
├── tcp/              # TCP server (AxioDBCloud, port 27019)
├── client/           # TCP client + Proxies
├── Helper/           # Converter, Crypto, Response
└── Memory/           # InMemoryCache

Test/modules/         # crud.test.js, transaction.test.js, read.test.js
Document/             # React docs site
```

## Naming Conventions

- **Files**: `{Feature}.operation.ts`, `{Feature}.service.ts`, `{Feature}.helper.ts`
- **Classes**: PascalCase - `FileManager`, `QueryMatcher`, `Collection`
- **Methods**: camelCase verbs - `createDatabase()`, `insertDocument()`, `isValidDocument()`
- **Variables**: camelCase descriptive - `documentId`, `collectionPath`, `indexCache`

## Error Handling

```typescript
async function operation(): Promise<SuccessInterface | ErrorInterface> {
  try {
    const result = await this.execute();
    return this.ResponseHelper.success(result);
  } catch (error) {
    this.logger.error('Operation failed', error);
    return this.ResponseHelper.error(
      'Specific error message',
      StatusCodes.ERROR
    );
  }
}
```

**Always**:
- Use try-catch for async operations
- Log detailed errors with context
- Return user-friendly error messages
- Use specific error messages (not generic "Error occurred")

## Performance Best Practices

### 1. Use InMemoryCache
```typescript
const cacheKey = `${this.collectionPath}:${documentId}`;
const cached = this.cache.get(cacheKey);
if (cached) return cached;

const data = await this.readFromDisk(documentId);
this.cache.set(cacheKey, data, TTL);
```

### 2. Batch Operations
```typescript
// ✅ GOOD: Parallel
const results = await Promise.all(documents.map(d => this.insert(d)));

// ❌ BAD: Sequential
for (const doc of documents) {
  await this.insert(doc);
}
```

### 3. Use Map for O(1) Lookups
```typescript
// ✅ GOOD
const map = new Map<string, Document>();
const found = map.get(id); // O(1)

// ❌ BAD
const found = documents.find(d => d.id === id); // O(n)
```

## Security

### 1. Validate Input
```typescript
if (!document || typeof document !== 'object') {
  return this.ResponseHelper.error('Invalid document', StatusCodes.BAD_REQUEST);
}
if (Array.isArray(document)) {
  return this.ResponseHelper.error('Document cannot be array', StatusCodes.BAD_REQUEST);
}
```

### 2. Sanitize Paths
```typescript
import path from 'path';

function getDocumentPath(collectionPath: string, documentId: string): string {
  const sanitized = documentId.replace(/[^a-zA-Z0-9-_]/g, '_');
  return path.join(collectionPath, `${sanitized}.axiodb`);
}
```

### 3. Encrypt Sensitive Data
```typescript
// Use AES-256 for collections with sensitive data
const users = await db.createCollection('Users', true, process.env.ENCRYPTION_KEY);

// Don't log sensitive data
logger.info('User auth', { userId: user.id }); // ✅
logger.info('User auth', { password: user.password }); // ❌
```

## Documentation Requirements

Update when features change:

1. **README.md** - Public API, features, quick start examples
2. **Document/** - React docs site (`cd Document && npm run dev`)
3. **Dockerfile** - If ports, env vars, or commands change
4. **JSDoc** - All public methods with examples

## Common Anti-Patterns to AVOID

❌ Using `any` types
❌ Duplicating code (extract to helpers)
❌ Sequential operations when parallel is possible
❌ Ignoring build errors
❌ Skipping tests
❌ Missing documentation
❌ Magic strings (use enums/const objects)
❌ Hacky solutions or setTimeout hacks
❌ Unclear variable names

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
