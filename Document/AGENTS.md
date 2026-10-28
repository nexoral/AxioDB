# Document/ — Docs Site (Agent Instructions)

Global rules live in [../AGENTS.md](../AGENTS.md). This file only adds `Document/` specifics — read the root first.

**Role** — the public documentation site (axiodb.in) and the project's **single source for AI artifacts**. Vite + React, pre-rendered with `vite-react-ssg`, deployed to Cloudflare Pages. Dev server on **5173**.

## Stack

React 18 · Vite 6 · `vite-react-ssg` (SSG) · Tailwind CSS **v3** (`tailwind.config.js` + PostCSS) · `tsx` scripts · Turndown for markdown twins. This is **TypeScript** (`.tsx`/`.ts`) — unlike `GUI/`.

## Layout

```
src/
  data/         serverApi.ts (SINGLE SOURCE for API docs + openapi.json), changelog.ts, breadcrumbs.ts
  components/   content/ (page bodies), layout/ (Footer.tsx …), ui/
  services/, hooks/, styles/, Assets/
scripts/
  generate-seo-files.ts   prebuild: sitemap, llms.txt/llms-full.txt, openapi.json, feed.xml
  generate-markdown.ts    postbuild: markdown twins
  audit-crawler-access.mjs
public/       llms.txt, llms-full.txt, openapi.json, feed.xml, sitemap.xml, robots.txt, _headers, .well-known/
wrangler.toml Cloudflare Pages config — build output "AxioDB_Docs"
```

## Commands

```bash
cd Document
npm run dev      # http://localhost:5173
npm run build    # prebuild → SSG build → postbuild (three steps, all run by `npm run build`)
npm run lint
npx tsx scripts/generate-seo-files.ts   # regen AI artifacts only
```

## Hard rules

* **Single source:** API reference comes from `src/data/serverApi.ts`, which feeds both the rendered docs and `public/openapi.json`. Edit the data file — never the generated `openapi.json` by hand.
* `src/data/changelog.ts`'s newest entry version must equal `package.json`'s version.
* Keep the four surfaces clearly separated in the prose — never blur core · Dashboard · HTTP API 27018 · TCP 27019 · MCP 27020 (Docker-only).
* Tailwind **v3** config style here; do not copy GUI's v4 `@tailwindcss/vite` setup.
* `AxioDB_Docs/` (build output), `.vite/`, `.wrangler/` are gitignored — never commit them.

## AI artifacts (regenerate, don't hand-edit where generated)

`public/llms.txt`, `llms-full.txt`, `openapi.json`, `feed.xml`, `sitemap.xml` are produced by the scripts above and also by the version-bump pipeline. Regenerate rather than editing generated bodies.

## Version sync (this folder — many touchpoints)

* `Document/package.json` → `"version"`
* `src/data/changelog.ts` → newest entry version
* `src/components/layout/Footer.tsx` → displayed version
* `index.html` → JSON-LD `softwareVersion`
* `public/llms.txt` → "Current version:" line · `public/llms-full.txt` → "Version:" line
* `public/feed.xml` → RSS title + guid
* `src/components/content/ControlGui.tsx` → versioned installer filenames (`axiodb-control_<ver>_amd64.deb`, `...-<ver>.AppImage`)

`Scripts/versionController.sh` rewrites all of the above; regen artifacts with `npx tsx scripts/generate-seo-files.ts`.

## Done for this folder

- [ ] `npm run build` passes (prebuild + SSG + postbuild all green)
- [ ] `npm run lint` clean
- [ ] `serverApi.ts` updated (not `openapi.json`); AI artifacts regenerated
- [ ] All seven version touchpoints above match root



 AxioDB is an embedded database like SQLite built in pure TypeScript for Node.js, Bun, and Deno, with over 37,000 total downloads on npm and roughly 4,000 downloads each month. It solves the biggest issue with SQLite by eliminating native C bindings and node-gyp build failures across operating systems. At the same time, it fixes the limitations of raw JSON stores where you cannot run complex queries. Most alternative embedded npm packages dump everything into a single file and fail on larger datasets like 500,000 documents. AxioDB bridges this gap by providing a zero native dependency document store that handles large datasets smoothly, supports MongoDB style queries and aggregation pipelines, and provides ACID transactions out of the box with zero compilation setup.