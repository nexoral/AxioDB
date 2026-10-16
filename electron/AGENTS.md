# electron/ — AxioDB Control Desktop App (Agent Instructions)

Global rules live in [../AGENTS.md](../AGENTS.md). This file only adds `electron/` specifics — read the root first.

**Role** — the native desktop app **"AxioDB Control"** (`appId: com.axiodb.control`). Renderer is a React UI that connects to any AxioDB server; main process is TypeScript compiled to CJS. Packaged with `electron-builder` for Linux (`.deb`/`.AppImage`), Windows (NSIS `.exe`), macOS (`.zip`).

## Stack

Electron 34 · electron-builder 25 · Vite 6 + `@vitejs/plugin-react-swc` (renderer) · React 19 · Tailwind v4 · Zustand · Axios · Recharts · `concurrently` + `wait-on` for dev.

## Layout

```
main/            main.cts (entry), preload.cts — compiled to dist-electron/main.cjs
src/             renderer (React) — api/ (client.js, authApi.js), components/, config/key.js,
                 layout/ (Sidebar.jsx, StatusBar.jsx, Titlebar.jsx), pages/, store/, utils/,
                 App.jsx, main.jsx, index.html
resources/       build resources + icons (icon.png, icons/) — bundled via extraResources
electron-builder.json   packaging config (targets, icons, nsis options)
vite.config.js   renderer build → dist/
dist/ · dist-electron/ · release/   generated, gitignored
```

## Commands

```bash
cd electron
npm install
npm run dev            # vite + electron together (waits on tcp:5173)
npm run build:renderer # vite build → dist/
npm run build:main     # tsc -p tsconfig.json → dist-electron/
npm run pack           # electron-builder --dir (unpacked, for smoke testing)
npm run dist:linux     # deb + AppImage
npm run dist:win       # nsis
npm run dist:mac       # zip
npm run dist           # linux only; `npm run build` does all three + pack
```

## Hard rules

* Package `main` is `dist-electron/main.cjs` — the main-process TS (`main.cts`) compiles to CJS via `tsconfig.json` (`module: NodeNext`, `rootDir: main`, `outDir: dist-electron`). Don't change the extension or output path without updating `package.json`.
* Only `dist/**`, `dist-electron/**`, `resources/**`, `package.json` ship (see `electron-builder.json` `files`). New runtime assets must be added there or reachable from `resources/`.
* Keep the renderer talking to the server through `src/api` + `src/config/key.js`; no hardcoded hosts in components.
* `dist/`, `dist-electron/`, `release/`, `node_modules/`, `.vite/` are gitignored — never commit them.
* Rendering/CI cross-compiles with Wine for Windows — don't assume a Windows host.

## Version sync (this folder)

* `electron/package.json` → `"version"`
* `src/layout/StatusBar.jsx` → displayed `AxioDB Control v<version>`

Both are rewritten by `Scripts/versionController.sh`.

## Done for this folder

- [ ] `npm run build:renderer` + `npm run build:main` pass
- [ ] `npm run pack` launches and connects to a running server
- [ ] New assets registered in `electron-builder.json` `files`/`extraResources`
- [ ] `electron/package.json` + `StatusBar.jsx` versions match root when releasing
