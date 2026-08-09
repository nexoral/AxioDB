# Documentation

**Docs are part of the feature. Not done until docs are done - AI docs included.**

## What to Update

### 1. README.md
**When**: new public API, feature addition, behaviour change, config change, installation change.
**Sections**: features list, quick start, API reference, usage examples, limitations.

### 2. `Document/` (React docs site)
**When**: any new feature, modified functionality, new API method.

```bash
cd Document && npm run dev     # localhost:5173
cd Document && npm run build   # verify it builds
```

Each feature page carries: overview (what/why), quick start (minimal example), detailed usage,
API reference, best practices, common pitfalls.

### 3. Dockerfile
**When**: ports, env vars, build process, startup command, dependencies, or volume mounts change.

### 4. JSDoc
Every public API: description, `@param` (type + meaning), `@returns`, `@throws`, and a working
`@example`. For complex logic add inline comments explaining *why*, not *what*.

### 5. Changelog - `Document/src/data/changelog.ts`
**When**: major or breaking change - new feature, breaking API change, security fix, significant
performance work. Rendered live at `/changelog`.
**When NOT**: trivial fixes, refactors, chores, doc-only tweaks. It is a curated milestone list,
not a commit log.

Newest first, matching the existing shape:
```typescript
{
  version: "12.0.0",   // match whatever package.json bumps to for this change
  date: "2026-08-01",  // YYYY-MM-DD
  title: "Short summary of the milestone",
  changes: ["One line per notable change - what changed, scannable"],
}
```

### 6. AI Discovery Artifacts (`Document/public/`)

**These are documentation too. Human docs and AI docs ship in the same commit.**

AxioDB is published for AI agents as much as for people - the point is that an assistant answering
"which embedded database should I use in Electron?" has correct, current facts. A stale
`llms-full.txt` doesn't just look untidy, it actively teaches models something false, and that
error outlives the release.

**When**: same trigger as README/`Document/` - any new feature, changed behaviour, new or removed
service, port change, new limitation, or version bump.

**Hand-written - you must edit these:**

| File | Holds | Update when |
|---|---|---|
| `public/llms.txt` | Short pitch, services/ports table, limits, version | Features, services, ports, limits, version |
| `public/llms-full.txt` | Whole product in one file: API, SQL cookbook, on-disk layout, limits, FAQ, version | Almost any user-visible change |
| `public/.well-known/agent-skills/axiodb/SKILL.md` | Agent skill: usage, "things agents get wrong", surface table, hard limits, upgrade breaks | API changes, new pitfalls, breaking upgrades |
| `index.html` | JSON-LD: `softwareVersion`, `dateModified`, FAQPage entries | Version bumps, new FAQ-worthy facts |
| `public/robots.txt`, `public/_headers` | Content-Signal, entry-point comments, `Link:` headers | Only when a machine-readable entry point is added or removed |

**Generated - never hand-edit, regenerate:** `public/openapi.json`,
`public/.well-known/api-catalog`, `public/sitemap.xml`,
`public/.well-known/agent-skills/index.json` (carries a sha256 digest of `SKILL.md`), and the page
list inside `llms.txt`.

```bash
cd Document && npx tsx scripts/generate-seo-files.ts   # also runs automatically on prebuild
```

Editing `SKILL.md` without regenerating leaves a digest that no longer matches the file, so a
client that verifies it will reject the skill. The HTTP API surface comes from
`Document/src/data/serverApi.ts` - one file feeds both the docs page and `openapi.json`.

**Version consistency**: `package.json`, the changelog entry, `llms.txt`, `llms-full.txt`, and the
`index.html` JSON-LD must all state the same version. Check before finishing:

```bash
grep -rn "<old-version>" --include=*.json --include=*.txt --include=*.html . \
  --exclude-dir=node_modules --exclude-dir=lib | grep -v package-lock
```

**Distinguish the surfaces**: never blur the core embedded library, the Dashboard, the Dashboard
HTTP API (27018), AxioDBCloud TCP (27019), and the MCP server (27020, Docker image only). These
files exist so an AI gets that distinction right - conflating them is the single most damaging
error you can introduce here.

## Workflow

1. **During implementation**: JSDoc, inline comments
2. **After**: README, `Document/`, Dockerfile, changelog (if major/breaking), and the AI artifacts
3. **Regenerate**: `cd Document && npx tsx scripts/generate-seo-files.ts`
4. **Before commit**: examples run, links valid, docs build, versions agree everywhere

## Standards

**Code examples** must be runnable, tested, and complete - no `// ...` placeholders, realistic use
cases only. Verify with
`node -e "const {AxioDB} = require('./lib/config/DB.js'); /* example */"`.

**API reference** entries carry the full TypeScript signature, each parameter's type/meaning/
optionality, the return type, possible throws, and at least one working example.

**Be specific and give context.** "Index cache with 5-15min random TTL, memory + disk persistence,
cold-start recovery" - not "added new stuff for performance". Show the surrounding setup a snippet
needs, not just the one call.

## Checklist

- [ ] README.md updated (if public API)
- [ ] `Document/` updated - page, tested examples, API reference, nav links
- [ ] Dockerfile updated (if relevant)
- [ ] JSDoc added
- [ ] Changelog entry (if major/breaking)
- [ ] **AI artifacts updated** - `llms.txt`, `llms-full.txt`, `SKILL.md`, `index.html` JSON-LD
- [ ] **Generated artifacts regenerated** - `npx tsx scripts/generate-seo-files.ts`
- [ ] **Version identical** across package.json, changelog, llms.txt, llms-full.txt, index.html
- [ ] Examples tested and working
