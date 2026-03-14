# Development Workflow

## Critical Rules

### 1. ALWAYS Build After Changes
```bash
npm run build  # MANDATORY after every code change
```
Why: Catch TypeScript errors immediately, not in production.

### 2. NEVER Leave Incomplete
❌ "I've implemented 80%..."
❌ "Code written but not tested..."
✅ "Feature complete. Build passes. Tests pass."

**"Done" means**:
1. Code follows standards
2. `npm run build` ✓
3. **Tests added/updated in `Test/modules/`** ✓
4. `npm test` ✓
5. `npm run lint` ✓
6. Docs updated (README, Document/, Dockerfile) ✓
7. No breaking changes (or noted) ✓
8. Self-reviewed (performance, security) ✓

### 3. ALWAYS Update Tests
**Location**: `Test/modules/` - `crud.test.js`, `transaction.test.js`, `read.test.js`

**When**:
- New feature → Add test cases
- Modified feature → Update tests
- Bug fix → Add regression test
- API change → Update affected tests
- New module → Create new test file

**Example**:
```javascript
// Test/modules/crud.test.js
async testNewFeature() {
  await this.collection.insert({ name: 'Alice', age: 25 });
  const result = await this.collection.query({ age: { $gt: 20 } }).exec();
  this.assertEqual(result.length, 1);
}
```

### 4. Plan Mode Execution
- Create plan → Get approval → Execute EVERY step → Build+test each step → Update docs → Verify → Complete
- DO NOT leave plan incomplete

### 5. Incremental Verification
```bash
# After each logical unit
npm run build

# After related changes
npm test

# Before final commit
npm run build && npm test && npm run lint
```

## Self-Review Checklist

**Functionality**: Works as specified, edge cases handled, no regressions
**Code Quality**: SOLID, DRY, clear names, modular
**Performance**: No regressions, efficient algorithms, proper caching
**Security**: Input validation, no injections, encrypted if sensitive
**TypeScript**: No `any`, proper interfaces, strict mode
**Documentation**: README/Document/Dockerfile updated if needed
**Testing**: Existing tests pass, new tests written
**Build**: `npm run build` succeeds, no warnings

## Common Pitfalls

### ❌ BAD: Any types
```typescript
const temp: any = someObject;
```
### ✅ GOOD: Proper types
```typescript
interface ProperType { field1: string; field2: number; }
const temp: ProperType = someObject;
```

### ❌ BAD: Duplicated logic
```typescript
// Same logic in 3 files
function process1() { /* logic */ }
function process2() { /* same logic */ }
```
### ✅ GOOD: DRY
```typescript
// Helper/utility.helper.ts
export function process() { /* logic */ }
// Imported where needed
```

### ❌ BAD: Ignoring build errors
```bash
npm run build  # Sees errors, ignores
```
### ✅ GOOD: Fix immediately
```bash
npm run build  # Fix all errors until passes
```

## Feature Development Flow

1. **Understand** → Read spec, clarify ambiguities
2. **Design** → Choose pattern, identify affected files
3. **Implement** → Write code, build after logical units
4. **Test** → Add tests in `Test/modules/`, verify pass
5. **Document** → Update README/Document/Dockerfile
6. **Verify** → Build ✓ Test ✓ Lint ✓ Self-review ✓
7. **Complete** → Commit with proper message

## Commit Standards

**Before commit**:
```bash
npm run build && npm test && npm run lint
```

**Message format**:
```
<type>: <subject>

<body>

<footer>
```
Types: feat, fix, docs, refactor, perf, test, chore

**Example**:
```
feat: Add bulk upsert operation

- Implemented upsertMany with atomic operations
- Added transaction support
- Updated cache invalidation
- Tests in Test/modules/crud.test.js

Closes #123
```

## Performance Testing
```javascript
const start = performance.now();
// ... operation ...
const end = performance.now();
console.log(`Took ${end - start}ms`);
```
No performance regressions allowed.

## Summary
- Build always: After every change
- Test always: Update `Test/modules/` for features
- Complete fully: No partial implementations
- Document properly: README, Document/, Dockerfile
- Review critically: Production-grade only
