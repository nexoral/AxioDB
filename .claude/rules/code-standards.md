# Code Standards

## Core Principles

1. **Respect Existing Code**: Read before modifying, follow patterns, maintain consistency
2. **SOLID Principles**: Single responsibility, Open/Closed, Liskov, Interface segregation, Dependency inversion
3. **DRY**: Don't Repeat Yourself - extract common logic
4. **No Hacks**: Production-grade only, no temporary fixes

## SOLID Examples

### Single Responsibility
```typescript
// ✅ GOOD: One responsibility
class FileManager { readFile(), writeFile(), deleteFile() }
class CryptoHelper { encrypt(), decrypt() }

// ❌ BAD: Multiple responsibilities
class DataManager { readFile(), encrypt(), validateUser(), sendEmail() }
```

### Open/Closed
```typescript
// ✅ GOOD: Extend without modifying
interface QueryOperator { evaluate(value, operand): boolean }
class GreaterThanOperator implements QueryOperator { evaluate() { return value > operand } }
class RegexOperator implements QueryOperator { evaluate() { return new RegExp(operand).test(value) } }
```

### Dependency Inversion
```typescript
// ✅ GOOD: Depend on abstraction
interface IFileManager { readFile(), writeFile() }
class Collection { constructor(private fileManager: IFileManager) {} }

// ❌ BAD: Depend on concrete
class Collection { private fileManager = new FileManager(); }
```

## DRY Principle

```typescript
// ❌ BAD: Duplicated
// Reader.operation.ts - 50 lines filtering
// Update.operation.ts - Same 50 lines

// ✅ GOOD: Shared utility
// Helper/QueryMatcher.helper.ts
export class QueryMatcher {
  static matchDocument(doc, query): boolean { /* logic */ }
  static filterDocuments(docs, query) { return docs.filter(d => this.matchDocument(d, query)); }
}
// Import in Reader and Update
```

## No Hacky Solutions

```typescript
// ❌ NEVER
setTimeout(() => { /* hope this works */ }, 1000);
eval(userInput);
try { risky(); } catch (e) { /* ignore */ }
const data: any = complexObject;

// ✅ ALWAYS
await properAsyncOperation();
const sanitized = validateAndSanitize(userInput);
try { await risky(); } catch (error) {
  logger.error('Failed', error);
  return ResponseHelper.error('Failed', StatusCodes.ERROR);
}
interface ComplexObject { field1: string; field2: number; }
const data: ComplexObject = complexObject;
```

## TypeScript Standards

### Type Safety
```typescript
// ✅ GOOD
interface InsertOptions { documentId?: string; skipValidation?: boolean; }
function insert(doc: object, opts: InsertOptions): Promise<SuccessInterface> {}

// ❌ BAD
function insert(doc: any, opts?: any): Promise<any> {}
```

### Avoid `any`
```typescript
// ✅ GOOD
interface OperationResult { success: boolean; data: DocumentData; }
const result: OperationResult = await op();

// Use unknown when truly unknown
const result: unknown = await op();
if (typeof result === 'object' && result !== null) { /* type guard */ }

// ❌ BAD
const result: any = await op();
```

### Enums/Const Objects
```typescript
// ✅ GOOD
enum OperationType { INSERT = 'insert', UPDATE = 'update', DELETE = 'delete' }
// Or
const OperationType = { INSERT: 'insert', UPDATE: 'update' } as const;

// ❌ BAD: Magic strings
if (operation === 'insert') {}
```

### Strict Null Checks
```typescript
// ✅ GOOD
function getDocument(id: string): Document | null {
  return this.cache.get(id) ?? null;
}
const doc = getDocument('123');
if (doc !== null) { console.log(doc.name); }

// ❌ BAD
function getDocument(id: string): Document {
  return this.cache.get(id); // Might be undefined!
}
```

## Module Organization

### Naming Conventions
- **Files**: `{Feature}.operation.ts`, `{Feature}.service.ts`, `{Feature}.helper.ts`
- **Classes**: PascalCase: `FileManager`, `QueryMatcher` (descriptive, nouns)
- **Methods**: camelCase: `createDatabase()`, `isValidDocument()` (verbs)
- **Variables**: camelCase: `documentId`, `collectionPath` (descriptive)
- **Constants**: `UPPER_SNAKE_CASE` or `camelCase const`

## Error Handling

```typescript
// ✅ GOOD
async function readDocument(id: string): Promise<SuccessInterface | ErrorInterface> {
  try {
    const content = await this.fileManager.readFile(path);
    const doc = JSON.parse(content);
    return this.ResponseHelper.success(doc);
  } catch (error) {
    this.logger.error(`Failed to read ${id}`, error);
    return this.ResponseHelper.error(`Document not found: ${id}`, StatusCodes.NOT_FOUND);
  }
}

// ❌ BAD
async function readDocument(id: string): Promise<any> {
  const content = await this.fileManager.readFile(path); // Unhandled
  return JSON.parse(content); // Unhandled parse error
}
```

### Specific Error Messages
```typescript
// ✅ GOOD
if (!doc.name) throw new Error('Validation failed: "name" field required');

// ❌ BAD
if (!doc.name) throw new Error('Invalid document');
```

## Performance

### 1. Use Cache
```typescript
// ✅ GOOD
const cached = this.cache.get(key);
if (cached) return cached;
const data = await this.readFromDisk(id);
this.cache.set(key, data);
```

### 2. Batch Operations
```typescript
// ✅ GOOD
const results = await Promise.all(docs.map(d => this.insert(d)));

// ❌ BAD
for (const d of docs) { await this.insert(d); } // Sequential
```

### 3. Avoid Unnecessary I/O
```typescript
// ✅ GOOD
const docs = await this.loadAll();
const filtered = docs.filter(d => d.age > 25);
const sorted = filtered.sort((a,b) => a.name.localeCompare(b.name));

// ❌ BAD
const filtered = await this.filter({ age: { $gt: 25 } }); // Read
const sorted = await this.sort(filtered, { name: 1 }); // Read again
```

### 4. Data Structures
```typescript
// ✅ GOOD: Map for O(1)
const map = new Map<string, Document>();
const found = map.get(id); // O(1)

// ❌ BAD: Array for lookups
const found = docs.find(d => d.id === id); // O(n)
```

## Security

### 1. Validate Input
```typescript
function insert(doc: object): Promise<SuccessInterface | ErrorInterface> {
  if (!doc || typeof doc !== 'object') return error('Invalid document', BAD_REQUEST);
  if (Array.isArray(doc)) return error('Cannot be array', BAD_REQUEST);
  // ...
}
```

### 2. Sanitize Paths
```typescript
// ✅ GOOD: Prevent traversal
import path from 'path';
function getPath(collectionPath: string, docId: string): string {
  const sanitized = docId.replace(/[^a-zA-Z0-9-_]/g, '_');
  return path.join(collectionPath, `${sanitized}.axiodb`);
}

// ❌ BAD
return `${collectionPath}/${docId}.axiodb`; // Vulnerable to ../../../
```

### 3. Sensitive Data
```typescript
// ✅ GOOD
const users = await db.createCollection('Users', true, process.env.KEY);
logger.info('User auth', { userId: user.id }); // Don't log passwords
return error('Auth failed', UNAUTHORIZED); // No stack traces to users
```

## Testing

```typescript
// ✅ GOOD: Testable (dependency injection)
class Collection {
  constructor(private fileManager: FileManager, private cache: Cache) {}
}

// ❌ BAD: Hard to test
class Collection {
  private fileManager = new FileManager();
  private cache = new Cache();
}
```

**Test coverage**: Happy path, empty input, null/undefined, large data, invalid data, concurrent ops, errors

## Review Checklist

- [ ] SOLID principles
- [ ] DRY (no duplication)
- [ ] Proper error handling
- [ ] Type-safe (no `any`)
- [ ] Performance considered
- [ ] Security validated
- [ ] Modular
- [ ] Clear naming
- [ ] Tests written/updated
- [ ] Docs updated
- [ ] Build passes
- [ ] Lint passes

## Summary
- SOLID: Single responsibility, Open/Closed, Liskov, Interface segregation, Dependency inversion
- DRY: Extract common logic
- No hacks: Production-grade only
- Type safety: Use TypeScript properly
- Modular: Feature-based, clear separation
- Performance: Cache, batch, avoid I/O
- Security: Validate, sanitize, encrypt
- Testable: Dependency injection
