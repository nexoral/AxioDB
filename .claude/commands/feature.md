Implement new feature: $ARGUMENTS

Follow AxioDB patterns:

**Step 1: Plan**
- Identify affected components (Collection, CRUD, Index, Transaction)
- Choose appropriate location:
  - Services/{category}/ for core operations
  - Helper/ for utilities
  - engine/ for file operations
  - server/router/ + controller/ for HTTP API
  - tcp/handler/ for TCP commands

**Step 2: Implement**
- Follow SOLID principles (single responsibility, dependency injection)
- Use TypeScript strict mode (no `any` types)
- Add proper error handling with ResponseHelper
- Use InMemoryCache where appropriate
- Follow dual-write pattern for indexes (memory + disk)

**Step 3: Test**
- Add tests to Test/modules/ (MANDATORY)
- Test happy path, edge cases, errors
- Run `npm run build && npm test`

**Step 4: Document**
- Update README.md (if public API)
- Update Document/ folder (create/update page)
- Update Dockerfile (if deployment-related)
- Add JSDoc comments to public methods

**Step 5: Verify**
- Build passes: `npm run build`
- Tests pass: `npm test`
- Lint passes: `npm run lint`
- Documentation builds: `cd Document && npm run build`

Only mark complete when ALL steps are done.
