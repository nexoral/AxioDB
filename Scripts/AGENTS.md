# Scripts/ — Build & Release Automation (Agent Instructions)

Global rules live in [../AGENTS.md](../AGENTS.md). This file only adds `Scripts/` specifics — read the root first.

**Role** — bash automation shared by devs and CI. Version sync, Go binary builds, packaging, and the git pre-commit hook. These are the **source of truth for the version-bump pipeline** — keep them authoritative and idempotent.

## Files

```
versionController.sh   version sync engine + interactive target picker (see below)
BinBuilder.sh          cross-compiles the Go CLI → cli/bin/axiodb_{os}_{arch} (5 platforms)
PackageBuilder.sh      wraps the linux binary into .deb/.rpm-style packages via xpack
setup.sh               installs the .git/hooks/pre-commit hook (no-op without .git)
```

## versionController.sh

* Fetches remote `package.json`, compares with local, prompts for a new (higher) semver, then rewrites every versioned file.
* Targets (interactive menu): `root`, `cli`, `electron`, `gui`, `document`, `docker`; **`root` also syncs `CONTRIBUTING.md`** (not separately selectable).
* Defaults to **all** targets (empty input, `a`, or `all`).
* On an all-targets run it also runs the post-bump pipeline: `cd Document && npm run build` (regenerates sitemap/llms/openapi/feed/markdown) and rebuilds the graphify graph if installed.
* Non-interactive: `./Scripts/versionController.sh <version>`.

Full target → file map (each sed is the authoritative location):

| Target | Files rewritten |
| --- | --- |
| root | `package.json` · `CONTRIBUTING.md` |
| cli | `cli/VERSION` · `cli/cmd/version.go` |
| electron | `electron/package.json` · `electron/src/layout/StatusBar.jsx` |
| gui | `GUI/package.json` |
| document | `Document/package.json` · `public/llms.txt` · `public/llms-full.txt` · `Document/index.html` · `src/components/content/ControlGui.tsx` (installer filenames) · `src/data/changelog.ts` |
| docker | `Docker/README.md` (badge) |

## Hard rules

* When a new versioned file is introduced anywhere in the repo, **add it to the matching `sync_*` function** here — otherwise it silently drifts. Cross-check the 13-place list in root `AGENTS.md`.
* Note the `CURRENT_VERSION` gotchas documented inline (brace-delimit `${CURRENT_VERSION}_...`; read the old version *before* `sync_root` rewrites `package.json`). Preserve those comments and the ordering.
* `BinBuilder.sh` injects the version via `-ldflags -X github.com/nexoral/axiodb-cli/cmd.cliVersion`; keep the package path in sync with `cli/`.
* Scripts must be idempotent and fail fast (`set -e`), and must not leave half-synced state.
* `setup.sh` is also run by npm's postinstall; it exits cleanly when `.git` is absent.

## Running

```bash
./Scripts/versionController.sh          # interactive: pick version + targets
./Scripts/versionController.sh 22.22.0  # non-interactive, all targets
./Scripts/BinBuilder.sh                 # build CLI binaries
./Scripts/setup.sh                      # install pre-commit hook
```

## Done for this folder

- [ ] `shellcheck` clean; `set -e`; no unquoted expansions on user input
- [ ] Any new versioned file wired into the correct `sync_*` function
- [ ] `versionController.sh` maps still match the root 13-place version list
- [ ] Destructive steps (branch/remote operations) are not added without asking the user
