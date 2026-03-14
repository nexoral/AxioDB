# AxioDB Core Rules for Cursor IDE

## Project Context

**AxioDB** is an embedded NoSQL database for Node.js with MongoDB-style queries. Pure TypeScript/JavaScript, zero native dependencies.

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

**Critical Implication**: Tests MUST run in separate child processes. Cannot run tests in parallel due to singleton constraint.

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

### Test Execution
```bash
npm test                           # All tests
npm test crud                      # CRUD tests only
node Test/modules/crud.test.js     # Direct execution
```

## Documentation Requirements

### README.md
Update when:
- New public API methods
- Feature additions
- Behavior changes
- Configuration changes

### Document/ (React Docs Site)
```bash
cd Document
npm run dev    # localhost:5173
# Edit src/pages/
npm run build  # Verify builds
```

Update for ALL new features with:
- Feature overview
- Code examples (tested!)
- API reference
- Best practices
- Common pitfalls

### Dockerfile
Update when:
- Port numbers change
- Environment variables added
- Build process changes
- Startup command changes

### JSDoc Comments
Required for ALL public methods:
```typescript
/**
 * Method description.
 *
 * @param {Type} paramName - Description
 * @returns {Promise<Type>} Description
 * @throws {Error} When something fails
 *
 * @example
 * const result = await method(param);
 */
```

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

### 4. Avoid Unnecessary File I/O
```typescript
// ✅ Read once
const docs = await this.loadAll();
const filtered = docs.filter(d => d.age > 25);

// ❌ Multiple reads
for (const id of ids) {
  const doc = await this.readFile(id);  // N reads!
}
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

## Error Handling Pattern

```typescript
async function operation(): Promise<SuccessInterface | ErrorInterface> {
  try {
    // Validate
    if (!valid) {
      return this.ResponseHelper.error('Validation failed', StatusCodes.BAD_REQUEST);
    }

    // Execute
    const result = await this.execute();

    // Cache update if needed
    this.cache.set(key, result, TTL);

    return this.ResponseHelper.success(result);
  } catch (error) {
    this.logger.error('Operation failed', error);
    return this.ResponseHelper.error(
      'Operation failed',
      StatusCodes.INTERNAL_SERVER_ERROR
    );
  }
}
```

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

## Commit Message Format

```
<type>: <subject>

<body>

<footer>
```

**Types**: feat, fix, docs, refactor, perf, test, chore

**Example**:
```
feat: Add bulk upsert operation

- Implemented upsertMany with atomic operations
- Added transaction support
- Updated cache invalidation
- Tests in Test/modules/crud.test.js

Closes #123
```

## Agent Behavior Guidelines

### When Implementing Features
1. Read related files FIRST
2. Understand existing patterns
3. Follow established architecture
4. Build after changes: `npm run build`
5. Add/update tests
6. Update documentation
7. Verify: build + test + lint

### When Refactoring
1. Ensure tests exist first
2. Make changes incrementally
3. Run tests after each change
4. Verify no performance regression
5. Update docs if behavior changes

### When Fixing Bugs
1. Write failing test first (TDD)
2. Fix the bug
3. Verify test now passes
4. Check for similar issues elsewhere
5. Document the fix

## Quick Reference

**Build**: `npm run build` (MANDATORY after changes)
**Test**: `npm test` (all) or `npm test crud` (specific)
**Lint**: `npm run lint`
**Docs**: `cd Document && npm run dev`

**Singleton**: Only one AxioDB instance allowed
**Tests**: Separate processes required
**Types**: No `any` - use interfaces
**Cache**: Random TTL 5-15min
**Indexes**: Dual-write (memory + disk)
**Security**: Validate, sanitize, encrypt
**Performance**: Cache, batch, Map
