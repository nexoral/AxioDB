# Development Workflow

## Critical Rules

### 1. ALWAYS Build After Changes
`npm run build` after every code change - catch TypeScript errors immediately, not in production.
Never ignore a build error; fix it before moving on.

### 2. ALWAYS Update Tests
**Location**: `Test/modules/` - `crud`, `transaction`, `read`, `auth`, `tcp-auth`, `tcp-noauth`,
`tcp-tls`, `crash-recovery`, `mcp-confirm`.

New feature → add cases. Modified feature → update them. Bug fix → add a regression test.
API change → update every affected test. New module → new test file (register it in `Test/run.js`).

### 3. Rebuild the Knowledge Graph (if graphify is installed)

`graphify query "<question>"` is the default codebase search here, so the graph has to match the
code. Once, from the repo root, after the change is finished - not after every edit:

```bash
python3 -c "import graphify" 2>/dev/null \
  && python3 -c "from graphify.watch import _rebuild_code; from pathlib import Path; _rebuild_code(Path('.'))" \
  || echo "graphify not installed - skipping graph rebuild"
```

graphify is optional local tooling, not a project dependency - if the import fails, skip it and
carry on, never fail or block a task over it. A stale graph is worse than no graph: it points the
next search at symbols and line numbers that have already moved. `graphify-out/` is gitignored, so
this never changes what you commit.

### 4. NEVER Leave Incomplete

❌ "I've implemented 80%..." ❌ "Code written but not tested..."
✅ "Feature complete. Build passes. Tests pass."

**"Done" means all of**:
1. Code follows standards (SOLID, DRY, no `any`)
2. `npm run build` ✓
3. Tests added/updated in `Test/modules/` ✓
4. `npm test` ✓
5. `npm run lint` ✓
6. Docs updated (README, `Document/`, Dockerfile) ✓
7. AI artifacts updated + regenerated (`Document/public/`) ✓ - see `documentation.md`
8. Knowledge graph rebuilt if graphify is installed ✓
9. No breaking changes (or noted) ✓
10. Self-reviewed (performance, security) ✓

### 5. Plan Mode
Create plan → get approval → execute EVERY step → build + test each step → update docs → verify.
Do not leave a plan half-finished.

### 6. Incremental Verification

```bash
npm run build                              # after each logical unit
npm test                                   # after related changes
npm run build && npm test && npm run lint  # before commit

# then refresh the knowledge graph, if graphify is installed
python3 -c "import graphify" 2>/dev/null \
  && python3 -c "from graphify.watch import _rebuild_code; from pathlib import Path; _rebuild_code(Path('.'))" \
  || true
```

## Feature Development Flow

**Understand** (read spec, clarify ambiguities) → **Design** (choose pattern, identify affected
files) → **Implement** (build after logical units) → **Test** (`Test/modules/`) →
**Document** (README, `Document/`, Dockerfile, AI artifacts) → **Verify** (build, test, lint,
self-review) → **Complete** (commit).

## Self-Review Checklist

- **Functionality**: works as specified, edge cases handled, no regressions
- **Code quality**: SOLID, DRY, clear names, modular
- **Performance**: no regressions, efficient algorithms, proper caching
- **Security**: input validated, no injection, no sensitive data logged
- **TypeScript**: no `any`, proper interfaces, strict mode
- **Documentation**: README / `Document/` / Dockerfile / AI artifacts updated
- **Testing**: existing tests pass, new tests written
- **Build**: `npm run build` succeeds with no warnings

## Commit Standards

```
<type>: <subject>     # feat, fix, docs, refactor, perf, test, chore

<body>                # what changed, bullet per item
<footer>              # Closes #123
```

Run `npm run build && npm test && npm run lint` before committing.

## Performance Testing

Measure with `performance.now()` around the operation and compare before/after. No performance
regressions are allowed.
