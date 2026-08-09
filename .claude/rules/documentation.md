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

### 5. Changelog (`Document/src/data/changelog.ts`)
**When**: Any *major* or breaking change - new feature, breaking API change, security fix,
significant performance work. Rendered live at `/changelog` on the docs site.

**When NOT to**: Trivial fixes, refactors, chores, doc-only tweaks - this is a curated
milestone list (see the file's own header comment), not a full commit log.

**How**: Add a new entry to the top of the `changelog` array (newest first):
```typescript
{
  version: "12.0.0",       // match whatever package.json bumps to for this change
  date: "2026-08-01",      // YYYY-MM-DD
  title: "Short summary of the milestone",
  changes: [
    "One line per notable change in this release",
    "Keep each line scannable - what changed, not why",
  ],
},
```

### 6. AI Discovery Artifacts (`Document/public/`)

**CRITICAL: these are documentation too. Human docs and AI docs ship in the same commit.**

AxioDB is published for AI agents as much as for people - the whole point of these files is
that an assistant answering "which embedded database should I use in Electron?" has correct,
current AxioDB facts. A stale `llms-full.txt` doesn't just look untidy, it actively teaches
models something false, and that error outlives the release.

**When**: The same trigger as README/Document/ - any new feature, changed behaviour, new or
removed service, port change, new limitation, or version bump.

**Hand-written (you must edit these):**

| File | Holds | Update when |
|---|---|---|
| `public/llms.txt` | Short pitch, services/ports table, limits, version | Features, services, ports, limits, version |
| `public/llms-full.txt` | The whole product in one file: API, SQL cookbook, on-disk layout, limits, FAQ, version | Almost any user-visible change |
| `public/.well-known/agent-skills/axiodb/SKILL.md` | Installable agent skill: usage, "things agents get wrong", surface table, hard limits, upgrade breaks | API changes, new pitfalls, breaking upgrades |
| `index.html` | JSON-LD: `softwareVersion`, `dateModified`, FAQPage entries | Version bumps, new FAQ-worthy facts |
| `public/robots.txt`, `public/_headers` | Content-Signal, entry-point comments, `Link:` headers | Only when a machine-readable entry point is added or removed |

**Generated (never hand-edit - regenerate):**

`public/openapi.json`, `public/.well-known/api-catalog`, `public/sitemap.xml`,
`public/.well-known/agent-skills/index.json` (carries a sha256 digest of `SKILL.md`), and the
page list inside `llms.txt`.

```bash
cd Document && npx tsx scripts/generate-seo-files.ts   # also runs automatically on prebuild
```

Editing `SKILL.md` without regenerating leaves a digest that no longer matches the file, so
a client that verifies it will reject the skill. The HTTP API surface comes from
`Document/src/data/serverApi.ts` - that one file feeds both the docs page and `openapi.json`.

**Version consistency**: `package.json`, the changelog entry, `llms.txt`, `llms-full.txt`,
and the `index.html` JSON-LD must all state the same version. Check before finishing:

```bash
grep -rn "<old-version>" --include=*.json --include=*.txt --include=*.html . \
  --exclude-dir=node_modules --exclude-dir=lib | grep -v package-lock
```

**Distinguish the surfaces**: never blur the core embedded library, the Dashboard, the
Dashboard HTTP API (27018), AxioDBCloud TCP (27019), and the MCP server (27020, Docker image
only). These files exist so an AI gets that distinction right - conflating them is the single
most damaging error you can introduce here.

## Documentation Workflow

1. **During implementation**: Add JSDoc, inline comments
2. **After implementation**: Update README, Document/, Dockerfile, Changelog (if major/breaking),
   **and the AI artifacts in `Document/public/`**
3. **Regenerate**: `cd Document && npx tsx scripts/generate-seo-files.ts`
4. **Before commit**: Verify docs updated, examples work, links valid, docs build succeeds,
   version strings agree everywhere

## Checklist for Feature Addition

- [ ] README.md updated (if public API)
- [ ] Document/ updated
  - [ ] Page created/updated
  - [ ] Code examples added and tested
  - [ ] API reference updated
  - [ ] Navigation links added
- [ ] Dockerfile updated (if relevant)
- [ ] JSDoc comments added
- [ ] Changelog entry added (if major/breaking) - `Document/src/data/changelog.ts`
- [ ] **AI artifacts updated** - `llms.txt`, `llms-full.txt`, `SKILL.md`, `index.html` JSON-LD
- [ ] **Generated artifacts regenerated** - `npx tsx scripts/generate-seo-files.ts`
- [ ] **Version identical** across package.json, changelog, llms.txt, llms-full.txt, index.html
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
- Always update: README, Document/, Dockerfile, **and the AI artifacts in `Document/public/`**
- Regenerate after editing SKILL.md or the API: `npx tsx scripts/generate-seo-files.ts`
- Keep the version identical across package.json, changelog, llms.txt, llms-full.txt, index.html
- Test examples: Ensure they work
- Be specific: What changed, why, how
- Provide context: Don't assume knowledge
- Docs = part of feature: Not done until docs done, **AI docs included**
