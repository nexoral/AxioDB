# cli/ — AxioDB CLI (Agent Instructions)

Global rules live in [../AGENTS.md](../AGENTS.md). This file only adds `cli/` specifics — read the root first.

**Role** — a standalone **Go** binary (`axiodb`) that talks to a running AxioDB server over the TCP protocol (**27019**), plus a MongoDB-style interactive REPL and a `serve` command that boots an isolated temporary local server. Zero relation to the npm build; it is cross-compiled and released separately.

## Stack

Go **1.22** · module `github.com/nexoral/axiodb-cli` · Cobra (commands) · chzyer/readline (REPL) · google/uuid.

## Layout

```
main.go              → cmd.Execute()
cmd/                 cobra commands: root.go, connect.go, db.go, collection.go, document.go,
                     index.go, transaction.go, auth_management.go, health.go, ping.go,
                     serve.go (+ serve_test.go), db_export.go, db_import.go, version.go
pkg/protocol/        wire protocol — client.go, message.go, auth.go
pkg/commands/        command implementations — db, collection, document, index, transaction, health
pkg/httpclient/      HTTP client for export/import against 27018
pkg/serve/           launcher.go, runtime.go, mode.go (+ *_test.go) — local temp server
internal/config/     config.go
Scripts/             install.sh, install.ps1 — user installers (shipped in releases)
VERSION              plain-text version (single source)
```

## Commands

```bash
cd cli
go build -o bin/axiodb .    # local build (VERSION is injected by ldflags in release, see below)
go test ./...               # unit tests (serve_test.go, launcher_test.go, mode_test.go)
go vet ./...
```

Cross-platform binaries are built by `Scripts/BinBuilder.sh` and `.github/workflows/Push.yml` (12 platforms) with the version stamped in:

```
-ldflags "-X github.com/nexoral/axiodb-cli/cmd.cliVersion=$VERSION"
```

## Hard rules

* `cli/VERSION` is the one source of truth; `cmd/version.go`'s `var cliVersion` must match it in source (the release build overrides it via ldflags). Both are in the 13-place version list.
* Never print secrets — the `-u/-p` flags, connection strings, and TLS material must not be echoed.
* Respect the global flags in `cmd/root.go` (`-c/--connection-string`, `--host`, `--port`, `--tls*`, `-o json|table`, `--timeout`, `--db`, `--collection`, `--http-*`) rather than inventing ad-hoc ones.
* Default TCP port is **27019**; export/import HTTP defaults to **27018**. `serve` seeds `admin`/`admin` (mirrors `source/config/Keys/Permissions.ts`) — never change that pairing without changing the core.
* `Scripts/install.sh` / `install.ps1` are user-facing and versioned; keep them in sync with `VERSION`.

## Version sync (this folder)

* `cli/VERSION` (plain text) and `cli/cmd/version.go` (`var cliVersion`) — both updated by `Scripts/versionController.sh`.

## Done for this folder

- [ ] `go build ./...` and `go test ./...` pass; `go vet` clean
- [ ] New flags/commands documented and mirrored in the release notes flow if user-facing
- [ ] `cli/VERSION` and `cli/cmd/version.go` match root when releasing
