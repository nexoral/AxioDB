# Codex Agent Instructions for AxioDB

## Project Context

**AxioDB** is an embedded NoSQL database for Node.js with zero native dependencies. It's built with TypeScript in strict mode and follows specific architectural patterns.

**Key Facts**:
- Language: TypeScript 5.6+ (strict mode) → CommonJS
- Runtime: Node.js ≥20.0.0
- Pattern: Singleton, file-per-document storage
- Features: InMemoryCache, Worker Threads, ACID transactions, HTTP GUI (27018), TCP server (27019)

## Critical Workflow Rules

### 1. ALWAYS Build After Changes
```bash
npm run build  # MANDATORY after EVERY code change
```
TypeScript errors in production are UNACCEPTABLE. Build immediately after changes.

### 2. ALWAYS Update Tests
- Location: `Test/modules/`
- Files: `crud.test.js`, `transaction.test.js`, `read.test.js`
- Update tests for ANY feature change
- Tests run in separate processes (singleton pattern)

### 3. NEVER Leave Incomplete
"Done" means ALL of these:
- ✅ Code follows standards (SOLID, DRY)
- ✅ `npm run build` passes
- ✅ Tests added/updated in `Test/modules/`
- ✅ `npm test` passes
- ✅ `npm run lint` passes
- ✅ Docs updated: README.md, Document/, Dockerfile
- ✅ No breaking changes (or explicitly approved)
- ✅ Security validated
- ✅ Performance checked (no regressions)

## Architecture Patterns You MUST Follow

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
**Why**: Only one database instance per application.
**Impact**: Tests MUST run in separate child processes.

### Dual-Write Pattern (Indexes)
```typescript
// ALWAYS write to BOTH memory (speed) AND disk (durability)
await this.indexCache.set(indexKey, data, TTL);
await this.fileManager.writeFile(indexPath, JSON.stringify(data));

// Cold start: reload from disk
const diskData = await this.fileManager.readFile(indexPath);
this.indexCache.set(indexKey, JSON.parse(diskData), TTL);
```
**Why**: Fast reads from memory, persistence on disk.

### Random Cache TTL (Prevent Stampede)
```typescript
// 5-15 minutes random TTL
const TTL = Math.floor(Math.random() * (15 - 5 + 1) + 5) * 60 * 1000;
```
**Why**: Prevents cache stampede when multiple keys expire simultaneously.

### File-Per-Document Storage
```
{RootPath}/
└── {DatabaseName}/
    └── {CollectionName}/
        ├── {documentId}.axiodb
        ├── {documentId2}.axiodb
        └── indexes/
            └── {indexName}.json
```
**Why**: O(1) access by ID, easy backup/restore of individual documents.

## Code Quality Standards

### TypeScript Strict Mode

```typescript
// ❌ NEVER DO THIS
const data: any = complexObject;
function process(input: any): any { }

// ✅ ALWAYS DO THIS
interface ComplexObject {
  field1: string;
  field2: number;
}
const data: ComplexObject = complexObject;
function process(input: ComplexObject): ProcessResult { }

// ✅ When type is truly unknown
const data: unknown = complexObject;
if (typeof data === 'object' && data !== null) {
  // Type guard
  const typed = data as ComplexObject;
}
```

### SOLID Principles

**Single Responsibility**:
```typescript
// ✅ GOOD: One responsibility
class FileManager {
  readFile(), writeFile(), deleteFile()
}
class CryptoHelper {
  encrypt(), decrypt()
}

// ❌ BAD: Multiple responsibilities
class DataManager {
  readFile(), encrypt(), validateUser(), sendEmail()
}
```

**DRY (Don't Repeat Yourself)**:
```typescript
// If same logic appears in 2+ files → Extract to Helper/

// ✅ GOOD
// Helper/QueryMatcher.helper.ts
export class QueryMatcher {
  static matchDocument(doc: any, query: any): boolean { }
  static filterDocuments(docs: any[], query: any) {
    return docs.filter(d => this.matchDocument(d, query));
  }
}

// Import in Reader.operation.ts and Update.operation.ts
import { QueryMatcher } from '../Helper/QueryMatcher.helper';
const filtered = QueryMatcher.filterDocuments(documents, query);
```

## Module Organization

```
source/
├── Services/          # Database, Collection, CRUD, Index, Transaction, Aggregation
│   ├── Database/     # Database-level operations
│   ├── Collection/   # Collection-level operations
│   ├── CRUD Operation/   # Create, Reader, Update, Delete
│   ├── Index/       # Index management (cache + disk)
│   ├── Aggregation/ # MongoDB-style pipelines
│   └── Transaction/ # ACID, WAL, sessions
├── engine/Filesystem/    # FileManager, FolderManager (low-level)
├── server/          # HTTP GUI (Fastify, port 27018)
├── tcp/             # TCP server (AxioDBCloud, port 27019)
├── client/          # TCP client + Proxies
├── Helper/          # Utilities (Converter, Crypto, Response)
└── Memory/          # InMemoryCache

Test/modules/        # Tests (separate processes)
Document/            # React docs site
```

## Naming Conventions

- **Files**: `{Feature}.operation.ts`, `{Feature}.service.ts`, `{Feature}.helper.ts`
- **Classes**: PascalCase - `FileManager`, `QueryMatcher`, `Collection`
- **Methods**: camelCase verbs - `createDatabase()`, `insertDocument()`, `isValidDocument()`
- **Variables**: camelCase descriptive - `documentId`, `collectionPath`, `indexCache`
- **Constants**: `UPPER_SNAKE_CASE` or `camelCase const`

## Error Handling Pattern

```typescript
async function operation(): Promise<SuccessInterface | ErrorInterface> {
  try {
    const result = await this.execute();
    return this.ResponseHelper.success(result);
  } catch (error) {
    this.logger.error('Operation failed', error);  // Detailed log
    return this.ResponseHelper.error(
      'User-friendly message',  // Generic to user
      StatusCodes.ERROR
    );
  }
}
```

**Rules**:
- Always use try-catch for async operations
- Log detailed errors with context
- Return user-friendly error messages (don't expose internals)
- Use specific error messages (not "Error occurred")

## Performance Optimizations

### 1. Use InMemoryCache
```typescript
const cacheKey = `${this.collectionPath}:${documentId}`;
const cached = this.cache.get(cacheKey);
if (cached) return cached;

const data = await this.readFromDisk(documentId);
this.cache.set(cacheKey, data, TTL);
return data;
```

### 2. Batch Operations (Parallel)
```typescript
// ✅ GOOD: Parallel with Promise.all
const results = await Promise.all(documents.map(d => this.insert(d)));

// ❌ BAD: Sequential
for (const doc of documents) {
  await this.insert(doc);  // Slow!
}
```

### 3. Use Map for O(1) Lookups
```typescript
// ✅ GOOD: O(1)
const map = new Map<string, Document>();
const found = map.get(id);

// ❌ BAD: O(n)
const found = documents.find(d => d.id === id);
```

## Security Requirements

### 1. Validate All Input
```typescript
if (!document || typeof document !== 'object') {
  return this.ResponseHelper.error('Invalid document', StatusCodes.BAD_REQUEST);
}
if (Array.isArray(document)) {
  return this.ResponseHelper.error('Document cannot be array', StatusCodes.BAD_REQUEST);
}
```

### 2. Sanitize Paths (Prevent Traversal)
```typescript
import path from 'path';

function getDocumentPath(collectionPath: string, documentId: string): string {
  const sanitized = documentId.replace(/[^a-zA-Z0-9-_]/g, '_');
  return path.join(collectionPath, `${sanitized}.axiodb`);
}
```

### 3. Encrypt Sensitive Data
```typescript
// Use AES-256 for sensitive collections
const users = await db.createCollection('Users', true, process.env.ENCRYPTION_KEY);

// NEVER log sensitive data
logger.info('User auth', { userId: user.id });  // ✅
logger.info('User auth', { password: user.password });  // ❌
```

## Documentation Requirements

When adding/changing features, update:

1. **README.md** - Public API, features list, quick start examples
2. **Document/** - React docs site (`cd Document && npm run dev`)
3. **Dockerfile** - If ports, environment vars, or commands change
4. **JSDoc** - All public methods with complete examples

### JSDoc Format
```typescript
/**
 * Creates a new document in the collection.
 *
 * @param {object} document - The document to insert
 * @returns {Promise<SuccessInterface | ErrorInterface>} Insert result with documentId
 * @throws {Error} If document validation fails
 *
 * @example
 * const result = await collection.insert({ name: 'John', age: 30 });
 * console.log(result.documentId); // Auto-generated ID
 */
async insert(document: object): Promise<SuccessInterface | ErrorInterface> {
  // ...
}
```

## Common Anti-Patterns to AVOID

❌ **Using `any` types** - Use proper interfaces
❌ **Duplicating code** - Extract to helpers (DRY)
❌ **Sequential when parallel possible** - Use Promise.all
❌ **Ignoring build errors** - Fix immediately
❌ **Skipping tests** - Update Test/modules/
❌ **Missing docs** - Update README, Document/, Dockerfile
❌ **Magic strings** - Use enums or const objects
❌ **Hacky solutions** - No setTimeout hacks, no eval
❌ **Unclear names** - Be descriptive
❌ **Deep nesting** - Refactor if >3 levels

## Common Commands

```bash
# Build & Test
npm run build              # TypeScript → lib/ (MANDATORY)
npm test                   # All tests (separate processes)
npm test crud              # CRUD tests only
npm test transaction       # Transaction tests only
npm test read              # Read optimization tests
npm run lint               # ESLint

# Development
node Test/modules/crud.test.js  # Run specific test
cd Document && npm run dev      # Docs site (localhost:5173)
```

## Common Workflows

### Adding a Collection Operation
1. Edit `source/Services/Collection/collection.operation.ts`
2. Add method with proper TypeScript types
3. Add error handling (try-catch)
4. Add to HTTP API: `source/server/router/` + `controller/`
5. Add to TCP API: `source/tcp/handler/`
6. Create tests in `Test/modules/crud.test.js`
7. Update docs (README, Document/)
8. Build and test: `npm run build && npm test`

### Adding a Helper Utility
1. Create: `source/Helper/{Feature}.helper.ts`
2. Use static methods (stateless)
3. Extract duplicated logic from 2+ files
4. Import in services that need it
5. Add tests if complex logic

### Adding a TCP Command
1. Create handler: `source/tcp/handler/{command}.ts`
2. Add client proxy: `source/client/{Feature}Proxy.ts`
3. Register in command map
4. Add tests
5. Update docs

## Success Criteria Checklist

Before marking ANY task complete, verify:
- [ ] Builds successfully (`npm run build`)
- [ ] Tests pass (`npm test`)
- [ ] Lint passes (`npm run lint`)
- [ ] Tests added/updated in `Test/modules/`
- [ ] Documentation updated (README, Document/, Dockerfile)
- [ ] No breaking changes (or explicitly approved)
- [ ] Follows SOLID + DRY principles
- [ ] No `any` types (TypeScript strict)
- [ ] Security validated (input validation, path sanitization)
- [ ] Performance checked (no regressions)
- [ ] Patterns followed (singleton, dual-write, random TTL)

## Remember

- **Production-grade only** - No hacks, no temporary fixes
- **Read first** - Understand existing code before modifying
- **Follow patterns** - Consistency is key
- **Test everything** - Update Test/modules/ for features
- **Document thoroughly** - Future you will thank you
