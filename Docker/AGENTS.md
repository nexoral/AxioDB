# Docker/ — Container Image (Agent Instructions)

Global rules live in [../AGENTS.md](../AGENTS.md). This file only adds `Docker/` specifics — read the root first.

**Role** — ships the compiled core (`lib/`) plus three surfaces in one container: HTTP GUI/API **27018**, TCP AxioDBCloud **27019**, opt-in MCP server **27020**. Image `theankansaha/axiodb`. Container runtime runs on Node 23 (`node:23-alpine`), while base engine maintains Node ≥20 compatibility.

## Layout

```
Dockerfile        node:23-alpine (Node 23 container runtime); drops to non-root `axiodb`; HEALTHCHECK → healthcheck.js
runner.js         entrypoint: maps env → AxioDB options, validates combos, UV_THREADPOOL_SIZE
healthcheck.js    probes GUI /health + a real TCP PING/PONG round-trip
mcpServer.js      boots the MCP server when AXIODB_MCP=true
mcp/              MCP impl — tools/ (auth, collection, dashboard, database, document, index,
                  role, transaction, user), confirmation.helper.js, shared.helpers.js
README.md         user-facing docs + version badge
```

## Build context is assembled by CI

The Dockerfile does `COPY lib/ package*.json Scripts/` — none of which live inside `Docker/` in the repo. CI copies them in first:

```bash
npm run build && (cd GUI && npm install && npm run build) \
  && mv GUI/AxioControl lib/server/public
mv lib/ Docker/ && cp package*.json Docker/ && cp -r Scripts/ Docker/
docker build -t theankansaha/axiodb Docker/
```

So a local `docker build Docker/` only works after those `mv`/`cp` steps. Don't commit `Docker/lib/`, `Docker/package.json`, or `Docker/Scripts/`.

## Env contract (must match `runner.js` + README table)

| Var | Default | Notes |
| --- | --- | --- |
| `AXIODB_GUI` | `true` | HTTP control server / GUI on 27018 |
| `AXIODB_HTTP` | mirrors `AXIODB_GUI` | `GUI=true` + `HTTP=false` is a hard error |
| `AXIODB_TCP` | `true` | 27019 |
| `AXIODB_TCP_AUTH_ENABLED` | `true` | shared RBAC accounts with the GUI |
| `AXIODB_ADMIN_PASSWORD` | *(none)* | **required** when TCP auth on and HTTP off, else the container refuses to start |
| `AXIODB_TLS` / `_CERT_PATH` / `_KEY_PATH` | `false` / — | TLS on 27019 |
| `AXIODB_ROOT_NAME` | `AxioDB` | root DB folder under the data volume |
| `AXIODB_CUSTOM_PATH` | cwd | storage path in-container |
| `AXIODB_MCP` / `AXIODB_MCP_PORT` | `false` / `27020` | opt-in MCP |
| `AXIODB_CACHE`, `AXIODB_CACHE_MIN_TTL`, `AXIODB_CACHE_MAX_TTL`, `AXIODB_CACHE_CLEARUP` | core defaults | supported in `runner.js`; keep README in sync if exposed |

## Hard rules

* Any new core option surfaced as an env var must be added to `runner.js` **and** the README table in the same change.
* `AXIODB_MCP` is image-only: the MCP SDK (`@modelcontextprotocol/sdk`, `zod`) is installed in the image but must **never** enter the published npm package.
* Keep `USER axiodb` (post-install) and the `exec node runner.js` CMD so SIGTERM reaches PID 1 for graceful shutdown.
* Destructive MCP tools (delete/update/drop/reset) must keep their elicitation confirmation and `destructiveHint` annotations.
* Ports are not env-configurable — remap with `-p host:27018` / `-p host:27019`.

## Version sync (this folder)

* `Docker/README.md` → shield badge `badge/AxioDB-<version>` (handled by `Scripts/versionController.sh`).

## Done for this folder

- [ ] `runner.js` and the README env table agree
- [ ] MCP tools still confirmed on destructive paths; MCP SDK not leaked into `package.json`
- [ ] Image builds from the CI-assembled context and `HEALTHCHECK` passes
- [ ] README badge version matches root when releasing
