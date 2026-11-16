# AxioDB — Agent Instructions

<system_overview>
**AxioDB** — Embedded NoSQL Database for TypeScript & AI Agents. Zero native deps, TS 6.0 strict → CJS, Node ≥22 (engine minimum; Docker runs on Node 23; verified on Node, Bun & Deno), singleton, file-per-doc, `InMemoryCache`, Worker Threads, ACID transactions & WAL, HTTP 27018, TCP 27019.

> For the full system architecture, dual-write lifecycles, and zero-grep codebase map, read [ARCHITECTURE.md](ARCHITECTURE.md).
</system_overview>

<subsystems_map>
## Subsystems & Scoped Guides

When working in a subsystem, read its scoped `AGENTS.md` for local rules and architecture:

* **`source/`** — Core DBMS engine ([source/AGENTS.md](source/AGENTS.md))
  * Strict TS, dual-write cache, core-to-surface fan-out workflows
* **`Test/`** — Test suites & harness ([Test/AGENTS.md](Test/AGENTS.md))
  * 14 integration suites, custom `TestRunner`, child process isolation
* **`Document/`** — Vite docs site port 5173 ([Document/AGENTS.md](Document/AGENTS.md))
  * `serverApi.ts` single API source, 15-target version sync
* **`cli/`** — Standalone Go CLI ([cli/AGENTS.md](cli/AGENTS.md))
  * Go 1.22, Cobra commands, interactive REPL, TCP wire protocol
* **`electron/`** — Desktop GUI app ([electron/AGENTS.md](electron/AGENTS.md))
  * Electron 34, React 19, Zustand, multi-platform packaging
* **`Email/`** — Cloudflare Email Worker Agent ([Email/AGENTS.md](Email/AGENTS.md))
  * Workers AI, vectorless RAG, Postal-MIME, Resend auto-responder
* **`Docker/`** — Container runtime ([Docker/AGENTS.md](Docker/AGENTS.md))
  * Multi-surface image (27018, 27019, MCP 27020), `runner.js`
* **`Scripts/`** — Release & packaging automation ([Scripts/AGENTS.md](Scripts/AGENTS.md))
  * `versionController.sh`, binary cross-compilation, installers
</subsystems_map>

<constraints>
## Constraints — never violate

* No `any`. Use `unknown` + guard. No `eval`, `setTimeout` hacks, temp fixes.
* Singleton: `new AxioDB()` twice throws; tests run isolated child processes.
* All registries JSONL append-only, last-line-wins, truncated when empty; filenames via `General` `source/config/Keys/Keys.ts` — never hardcode.
* Dual-write indexes: memory + disk; randomized TTL 5–15m to prevent cache stampedes. Details in `source/AGENTS.md`.
* Inputs validated (reject non-object/array), path sanitized `replace(/[^a-zA-Z0-9-_]/g,'_')+path.join`, never log secrets/stack.
</constraints>

<rules>
## Rules — non-negotiable

1. `npm run build` after every change — never ship TS errors.
2. `Test/node/modules/` must be updated for any feature; `npm run node-test` all 14 suites `crud|transaction|read|aggregation|auth|http-api|tcp-auth|tcp-noauth|tcp-transaction|tcp-tls|crash-recovery|mcp-confirm|mcp-functional|cache-options`.
3. Never leave incomplete work — Done checklist must pass.
4. **Research before edit — zero trial-and-error**: Trace call chains and contracts first; no speculative fixes. Deliver confident, production-grade solutions.
5. **No over-engineering, no naive shortcuts**: Minimal and maintainable, but scale-appropriate. Avoid needless abstractions, and never use naive in-process shortcuts that fail at scale (e.g. multi-instance, large batch volume).
6. **No unnecessary comments**: Code must be self-explanatory. Never add obvious/conversational comments; comment only complex algorithms, security, or non-obvious invariants.
7. **Core → surfaces sync**: new core feature (`Services/Collection`, `Index`, `Transaction`, etc.) → ask user: expose via HTTP 27018 / CLI / MCP 27020 / Docker / GUI? If yes, implement consistently (HTTP `server/router+controller`, TCP `tcp/handler` + `client/*Proxy`, CLI `cli/cmd`, MCP `Helper/mcp/McpTools`, `Document/` docs + AI) with same RBAC/tests.
</rules>

<code_standards>
## Code standards

SOLID + DRY: duplicate logic (2+ files) → `source/Helper/{Feature}.helper.ts` static stateless. Naming: files `{Feature}.{operation|service|helper}.ts`, PascalCase classes, camelCase verbs, `UPPER_SNAKE_CASE` consts. Magic strings → enums/`as const`. Nesting >3 → refactor. Try-catch every async; log detailed, return friendly via `ResponseHelper`. Perf: cache before disk, `Promise.all`, `Map` not `Array.find` loop.

## Don't (anti-patterns)

```ts
// ❌ Never hardcode filenames — use Keys.ts
const dir = './data/MyDB';
// ❌ Never use any — use unknown + type guard
function parse(input: any) { ... }
// ❌ Never nest >3 levels — extract helper
if (a) { if (b) { if (c) { if (d) { ... } } } }
// ❌ Never use Array.find in hot paths — use Map
items.find(i => i.id === targetId);
```
</code_standards>

<testing_and_verification>
## Tests

Framework: custom `TestRunner` in child processes (singleton forbids sharing). Run all: `npm run node-test`. Single suite: `npm run node-test <suite>`. Suite authoring details in `Test/AGENTS.md`.

## Commands

```bash
npm run build              # mandatory
npm run node-test          # all 14
npm run node-test <suite>  # see Rules 2
npm run lint               # ESLint
cd Document && npm run dev # docs 5173
```

Workflows: Core features fan out to HTTP (27018), TCP (27019), and Client Proxies. Call chain details in `source/AGENTS.md`.

## Graphify (optional)
After file changes, if graphify is available and `graphify-out/` exists, rebuild: `python3 -c "import graphify" 2>/dev/null && python3 -c "from graphify.watch import _rebuild_code; from pathlib import Path; _rebuild_code(Path('.'))" || echo "graphify not installed — skipping graph rebuild"`
</testing_and_verification>

<documentation_and_versioning>
## Version sync (15 places — all must match)

All releases must sync version across all 15 project targets (core, lock, electron, Document, Email, cli, Docker, docs, AI artifacts). Full 15-target registry in `Document/AGENTS.md`.
Regen AI artifacts: `cd Document && npx tsx scripts/generate-seo-files.ts`

## Documentation — same commit as code

Update README, `Document/` (port 5173), `Dockerfile`, and JSDoc with code in same commit. Never blur surfaces. API single source: `Document/src/data/serverApi.ts` (see `Document/AGENTS.md`).
</documentation_and_versioning>

<governance>
## Ask before action

Always ask user permission before:
* `git commit` — confirm message and changes
* `git push` — confirm branch and remote
* `npm run node-test` (full suite) — may be slow
* Launching sub-agents (explore/plan) — costly and time-consuming; user may already know the answer or have a better approach
Do NOT ask for:
* `npm run node-test <suite>` (scoped) — run directly
* `npm run build` — run directly
* `npm run lint` — run directly

## Sub-agent delegation (when approved)

When user approves deploying sub-agents, their prompt must include:
1. Mandate to read the target service folder's `AGENTS.md` before starting work.
2. Root DOs & DON'Ts summary.
3. Pointer to [ARCHITECTURE.md](ARCHITECTURE.md) for full system architecture and zero-grep directory maps.
4. Scope boundary: Sub-agents may only write code, edit files, and run `npm run build` to verify compilation. They must NOT run tests — sub-agents report completion back to the parent, who executes all tests.

## Never assume

* **Clarify with operational context**: When requirements lack detail, never assume naive local implementations. Ask targeted questions addressing environment (single vs multi-instance/container), concurrency, batch sizes, and data volume.
* Web search for external docs; ask mid-task rather than guessing — wrong assumptions waste time.

## Git

* Branches: `main` (production), `maintainer/<name>` (personal). Never force-push `main`.
* Commits: conventional format (`feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`). One logical change per commit.
</governance>

<done_checklist>
## Done checklist

- [ ] `npm run build` passes
- [ ] `Test/node/modules/` updated, `npm run node-test` 14/14
- [ ] `npm run lint` passes
- [ ] Docs updated (README, Document, Dockerfile, JSDoc)
- [ ] Changelog if major/breaking
- [ ] AI artifacts updated + regenerated, version synced (15 places)
- [ ] No `any`, SOLID+DRY, patterns (singleton/dual-write/TTL) followed
- [ ] Security validated · No perf regressions
</done_checklist>
