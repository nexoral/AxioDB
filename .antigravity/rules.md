# Antigravity IDE Rules for AxioDB

## Project Identity

**AxioDB** - Embedded NoSQL database for Node.js
- TypeScript strict mode → CommonJS
- Node.js ≥20.0.0
- Zero native dependencies
- Singleton pattern, file-per-document storage

## Agent Instructions

### Planning Mode

When in Planning Mode, create detailed task lists:
1. Identify affected components
2. Plan implementation approach
3. List test requirements
4. Document update requirements
5. Build verification steps

### Fast Mode

For quick tasks, ensure:
- Build after changes
- No breaking existing tests
- Follow existing patterns

## Core Principles

### 1. ALWAYS Build
```bash
npm run build  # After every code change
```
TypeScript errors in production are unacceptable.

### 2. ALWAYS Test
Update `Test/modules/` for ANY feature change:
- `crud.test.js` - CRUD operations
- `transaction.test.js` - Transactions, WAL
- `read.test.js` - Read optimizations

### 3. NEVER Incomplete
Definition of "Done":
- ✅ Code written
- ✅ `npm run build` passes
- ✅ Tests added/updated
- ✅ `npm test` passes
- ✅ Docs updated
- ✅ No regressions

### 4. SOLID + DRY
- Single responsibility per class
- Extract duplicated logic to helpers
- No hacky solutions
- Production-grade code only

### 5. TypeScript Strict
- No `any` types (use proper interfaces)
- Null checks: `if (obj !== null)`
- Type guards for unknown types
- Enums or const objects (no magic strings)

## Architecture Patterns

### Singleton Pattern
```typescript
private static _instance: AxioDB;
constructor() {
  if (AxioDB._instance) throw new Error("Only one instance allowed");
  AxioDB._instance = this;
}
```
**Implication**: Tests must run in separate processes

### Dual-Write (Indexes)
```typescript
// Memory (speed) + Disk (durability)
await this.indexCache.set(key, data, TTL);
await this.fileManager.writeFile(path, JSON.stringify(data));
```

### Random Cache TTL
```typescript
// 5-15 minutes (prevent cache stampede)
const TTL = Math.floor(Math.random() * (15 - 5 + 1) + 5) * 60 * 1000;
```

### File Structure
- Database: `{RootPath}/{DatabaseName}/`
- Collection: `{DatabasePath}/{CollectionName}/`
- Document: `{CollectionPath}/{documentId}.axiodb`

## Module Organization

```
source/
├── Services/          # Database, Collection, CRUD, Index, Transaction
├── engine/           # FileManager, FolderManager
├── server/           # HTTP GUI (Fastify, port 27018)
├── tcp/              # TCP server (AxioDBCloud, port 27019)
├── client/           # TCP client + Proxies
├── Helper/           # Converter, Crypto, Response
└── Memory/           # InMemoryCache

Test/modules/         # Tests (separate processes)
Document/             # React docs site
```

## Naming Conventions

- **Files**: `{Feature}.operation.ts`, `{Feature}.service.ts`, `{Feature}.helper.ts`
- **Classes**: PascalCase: `FileManager`, `QueryMatcher`
- **Methods**: camelCase: `createDatabase()`, `isValidDocument()`
- **Variables**: camelCase: `documentId`, `collectionPath`

## Error Handling

```typescript
async function operation(): Promise<SuccessInterface | ErrorInterface> {
  try {
    const result = await this.execute();
    return this.ResponseHelper.success(result);
  } catch (error) {
    this.logger.error('Operation failed', error);
    return this.ResponseHelper.error('Failed', StatusCodes.ERROR);
  }
}
```

## Performance

1. **Use InMemoryCache**: Check cache before disk reads
2. **Batch operations**: `Promise.all` instead of sequential
3. **Avoid unnecessary I/O**: Read once, process in memory
4. **Use Map**: O(1) lookups vs Array O(n)

## Security

1. **Validate input**: Check types, reject arrays as documents
2. **Sanitize paths**: `documentId.replace(/[^a-zA-Z0-9-_]/g, '_')`
3. **Encrypt sensitive**: Use AES-256 for collections with sensitive data
4. **No stack traces**: Return generic error messages to users

## Documentation Requirements

When adding/changing features, update:
1. **README.md** - Public API, examples, features list
2. **Document/** - React docs site (run `cd Document && npm run dev`)
3. **Dockerfile** - If ports/env/commands change
4. **JSDoc** - All public methods

## Common Workflows

### Add Collection Operation
1. Edit `source/Services/Collection/collection.operation.ts`
2. Add method with proper types, error handling
3. Add to HTTP API: `source/server/router/` + `controller/`
4. Add to TCP API: `source/tcp/handler/`
5. Create tests in `Test/modules/crud.test.js`
6. Update docs (README, Document/)
7. Build: `npm run build && npm test`

### Add TCP Command
1. Create handler: `source/tcp/handler/{command}.ts`
2. Add client proxy: `source/client/{Feature}Proxy.ts`
3. Register in command map
4. Add tests
5. Update docs

### Add Helper Utility
1. Create: `source/Helper/{Feature}.helper.ts`
2. Use static methods (stateless)
3. Import in services that need it
4. DRY principle - extract duplicated logic

## Anti-Patterns to Avoid

❌ Using `any` types
❌ Duplicated code (copy-paste)
❌ Sequential operations that could be parallel
❌ Ignoring build errors
❌ Skipping tests
❌ Missing documentation
❌ Hardcoded values (use constants/config)
❌ Unclear variable names
❌ Deep nesting (>3 levels)

## Agent-Specific Tips

### When Creating Features
1. Read related files first
2. Understand existing patterns
3. Follow established architecture
4. Test edge cases
5. Document thoroughly

### When Refactoring
1. Ensure tests exist first
2. Make changes incrementally
3. Run tests after each change
4. Verify no performance regression

### When Fixing Bugs
1. Write failing test first
2. Fix the bug
3. Verify test passes
4. Check for similar issues elsewhere
5. Document the fix

## Multi-Agent Coordination

If using parallel agents:
- Assign different files/modules to each agent
- Avoid concurrent edits to same file
- Coordinate through planning artifacts
- Merge changes carefully

## Success Criteria

Every task must meet ALL criteria:
- Builds successfully
- Tests pass
- Docs updated
- No regressions
- Follows patterns
- Security validated
- Performance acceptable
