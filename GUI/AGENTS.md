# GUI/ — AxioControl Web Dashboard (Agent Instructions)

Global rules live in [../AGENTS.md](../AGENTS.md). This file only adds `GUI/` specifics — read the root first.

**Role** — the browser dashboard served by the core's HTTP server on **27018** (and embedded in the Electron app). It is a static React bundle that talks to the HTTP API; it has no server or auth of its own. Its `build` output (`AxioControl/`) is copied into `lib/server/public` by CI — that is what the core serves.

## Stack

React 19 · Vite 6 · Tailwind CSS v4 (`@tailwindcss/vite`) · Zustand · React Router 7 · Axios · Recharts · Framer Motion · PWA (`vite-plugin-pwa`). Code is **`.jsx`** in `src/` (the README's "TypeScript" wording is stale).

## Layout

```
src/
  api/        HTTP calls (config.jsx, key.js under src/config)
  components/ UI building blocks
  config/     config.jsx, key.js — API base + endpoint keys
  layout/     shell, nav
  pages/      route screens
  store/      Zustand stores
  utils/      shared helpers
  main.jsx    entry · index.css global styles
scripts/optimize-assets.mjs   image pass (sharp)
public/                        static assets
```

## Commands

```bash
cd GUI
npm install
npm run dev        # dev server http://localhost:5173
npm run build      # → GUI/AxioControl/ (emptyOutDir)
npm run preview    # serves the production build (port 3000)
npm run lint
```

## Hard rules

* Dev on **5173**, never 27018 — 27018 belongs to the core HTTP server. Point `src/config` at `http://localhost:27018`.
* Talk to the API through `src/api` + `src/config/key.js`; never scatter raw endpoint strings through components.
* Tailwind **v4** here (config via `@tailwindcss/vite`, no `tailwind.config.js`). Do not copy v3 config style from `Document/`.
* `build.outDir` is `AxioControl/` and is gitignored — never commit build output.
* Keep the bundle dev/local-oriented; no secrets in client code (it is static and public).

## Quirks (don't "fix" blindly)

* `vite.config.js` carries a stale `resolve.alias` block (`@component` → `/src/Components`, etc.) and a very long `assetsInclude` list. The real source folders are lowercase (`components`, `pages`) — verify an alias resolves before relying on it.
* `server.strictPort: true` — if 5173 is taken the dev server fails instead of shifting ports.

## Version sync (this folder)

* `GUI/package.json` → `"version"`. Keep in lockstep with root (13-place list in root).

## Done for this folder

- [ ] `npm run dev` renders against a running core; `npm run build` clean
- [ ] `npm run lint` clean
- [ ] Endpoints come from `src/config`; no hardcoded URLs in components
- [ ] `GUI/package.json` version matches root when releasing
