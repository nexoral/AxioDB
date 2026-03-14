# Documentation

## CRITICAL: ALWAYS Update Docs When Changing Features

## What to Update

### 1. README.md (Root)
**When**: New public API, feature addition, behavior change, config change, installation change

**Sections**: Features list, Quick Start, API Reference, Usage examples, Limitations

**Example**:
```markdown
### Custom Query Operators
- `$gt`, `$lt`, `$in`, `$regex` ✅ NEW, `$gte`, ...
```

### 2. Document/ (React Docs Site)
**When**: ANY new feature, modified functionality, new API methods

**How**:
```bash
cd Document
npm install       # First time
npm run dev      # localhost:5173
# Edit src/ files
npm run build    # Verify builds
```

**Structure**: `src/components/`, `src/pages/`, `src/data/`

**Add**: Feature description, code examples, API reference, usage patterns, best practices

### 3. Dockerfile
**When**: Port changes, env vars, build process, startup command, dependencies, volume mounts

**Example**:
```dockerfile
# Port 27019 for AxioDBCloud TCP (added v5.33+)
EXPOSE 27018 27019
```

### 4. JSDoc (Code Comments)
**Public APIs**:
```typescript
/**
 * Creates document in collection.
 * @param {object} document - Document to insert
 * @returns {Promise<SuccessInterface | ErrorInterface>} Result with documentId
 * @example
 * const result = await collection.insert({ name: 'John' });
 */
async insert(document: object): Promise<SuccessInterface | ErrorInterface> { }
```

**Complex logic**: Add inline comments explaining "why" not "what"

## Documentation Workflow

1. **During implementation**: Add JSDoc, inline comments
2. **After implementation**: Update README, Document/, Dockerfile
3. **Before commit**: Verify docs updated, examples work, links valid, docs build succeeds

## Checklist for Feature Addition

- [ ] README.md updated (if public API)
- [ ] Document/ updated
  - [ ] Page created/updated
  - [ ] Code examples added and tested
  - [ ] API reference updated
  - [ ] Navigation links added
- [ ] Dockerfile updated (if relevant)
- [ ] JSDoc comments added
- [ ] Examples tested and working

## Standards

### Code Examples
- Must be runnable and tested
- Must be complete (no `// ...`)
- Must show best practices
- Must be realistic use cases

### API Reference
- Full TypeScript signature
- Parameters: type, description, optional/required
- Returns: type and description
- Throws: possible errors
- Examples: at least one working example

### Feature Pages
- Overview: What, why
- Quick Start: Minimal example
- Detailed Usage: Comprehensive guide
- API Reference: All methods
- Best Practices: How to use effectively
- Common Pitfalls: What to avoid

## Good Examples

### README.md
```markdown
## Transaction Support (v5.33+)

ACID transactions with savepoints, rollback, WAL.

### Example
\`\`\`javascript
const session = collection.startSession();
await session.withTransaction(async (tx) => {
  await tx.insert({ name: 'Alice' });
  await tx.update({ name: 'Bob' }, { status: 'active' });
});
\`\`\`

API: https://axiodb.in/transactions
```

### Dockerfile
```dockerfile
# AxioDB Docker Image
# Ports: 27018 (HTTP GUI), 27019 (TCP - v5.33+)
# Volumes: /app (data directory)
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY lib/ ./lib/
EXPOSE 27018 27019
CMD ["node", "lib/config/DB.js"]
```

## Testing Docs

Before commit:
1. **Test examples**: `node -e "const {AxioDB} = require('./lib/config/DB.js'); /* example */"`
2. **Build docs**: `cd Document && npm run build`
3. **Check links**: Internal, external, anchors
4. **Review**: Spelling, formatting, clarity

## Common Mistakes

### ❌ BAD: Vague
```markdown
Added new stuff for performance.
```
### ✅ GOOD: Specific
```markdown
Index cache with 5-15min random TTL. Memory + disk persistence. Cold-start recovery.
```

### ❌ BAD: Untested
```javascript
collection.insert({ data });  // Might work?
```
### ✅ GOOD: Tested
```javascript
const result = await collection.insert({ name: 'John', email: 'john@example.com' });
console.log(`ID: ${result.documentId}`);
```

### ❌ BAD: No context
```markdown
Use `withTransaction()` for transactions.
```
### ✅ GOOD: Full context
```markdown
Start session, use `withTransaction()` for auto commit/rollback:
\`\`\`javascript
const session = collection.startSession();
await session.withTransaction(async (tx) => {
  await tx.insert({ name: 'Alice' });
  // Auto-commits on success, rolls back on error
});
\`\`\`
```

## Summary
- Always update: README, Document/, Dockerfile
- Test examples: Ensure they work
- Be specific: What changed, why, how
- Provide context: Don't assume knowledge
- Docs = part of feature: Not done until docs done
