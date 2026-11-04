# AxioDB Limitations and Technical Gotchas

## 1. Process Singleton Constraint

AxioDB enforces a strict singleton pattern per Node.js process:
- Calling `new AxioDB()` twice in the same runtime throws an exception.
- When running automated test suites (Jest/Mocha), test files must either share the instance or run in isolated child processes (`jest --runInBand` or separate worker processes).

---

## 2. File-per-Document Architecture

- **Inode Usage**: Because each document is stored as an individual JSON file (`<doc_id>.json`), storing tens of millions of documents requires filesystem inode planning.
- **Directory Limits**: Filesystems handle tens of thousands of files per directory well, but for massive collections, consider partitioning documents logically across collections.

---

## 3. MCP Server Initiation

- The Model Context Protocol (MCP) server can be initiated directly in TypeScript/JavaScript core via `new AxioDB({ MCP: true })` or run inside the official Docker image (`theankansaha/axiodb`) via `AXIODB_MCP=true` on port `27020`.
- AI agents (Antigravity, Claude Code, Cursor, Windsurf, Copilot) connecting over Streamable HTTP target `http://localhost:27020/mcp`.
- Every tool except `axiodb_login` requires an active `sessionId` with appropriate RBAC permissions.

---

## 4. TCP First-Login Authentication Requirement

- AxioDB seeds a default `admin` user with password `admin`.
- **Gotcha**: For security, TCP connections reject the initial `admin/admin` credentials until the password is changed via the HTTP Control Server / Web GUI (`http://localhost:27018`).
- **Headless Bypass**: When starting headless instances or automated Docker containers without GUI access, you **must** supply `AXIODB_ADMIN_PASSWORD=<custom_password>` on initial creation. This automatically clears the password change requirement.

---

## 5. Append-Only Registries

- Metadata (`metadata.jsonl`) and secondary indexes (`.indexes/*.jsonl`) use append-only logging for crash resilience.
- The latest line always wins. Over extended periods of high mutation churn, registry files grow until pruned or truncated.
