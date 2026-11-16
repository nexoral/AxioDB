# AxioDB Limitations and Technical Gotchas

<singleton_constraint>
## 1. Process Singleton Constraint

AxioDB enforces a strict singleton pattern per Node.js process:
* Calling `new AxioDB()` twice in the same runtime throws an exception.
* When running automated test suites, test files must either share the instance or run in isolated child processes (`npm run node-test` uses child process isolation).
</singleton_constraint>

<storage_overhead>
## 2. File-per-Document Architecture

* **Filesystem Block Allocation**: Because each document is stored as an individual JSON file (`<doc_id>.json`), each document occupies at least one filesystem block (typically 4 KB) regardless of file size.
* **Inode Planning**: Storing millions of documents requires filesystem inode awareness. For multi-million document workloads, partition documents across logical collections or databases.
* **Read Amplification on Scans**: Full unindexed scans open one file per document. Always build secondary indexes and specify `.hint("field")` for high-volume collections.
</storage_overhead>

<mcp_initiation>
## 3. MCP Server Initiation & AI Tooling

* Initiated in core via `new AxioDB({ MCP: true })` or inside Docker via `AXIODB_MCP=true` on port `27020`.
* AI agents target `http://localhost:27020/mcp` over Streamable HTTP.
* Tools require an active authenticated session with appropriate RBAC permissions.
</mcp_initiation>

<first_login_rotation>
## 4. TCP First-Login Password Rotation

* AxioDB seeds a default `admin` user with password `admin`.
* **Gotcha**: For security, TCP connections reject initial `admin/admin` credentials until changed via HTTP Control Server (`http://localhost:27018`), Desktop GUI, or seeded with a custom password on initial boot.
* **Embedded Headless Bypass**: For in-process code, pass `AdminPassword: process.env.AXIODB_ADMIN_PASSWORD` in `new AxioDB({ TCP: true, HTTP: false, AdminPassword: "..." })`.
* **Docker Headless Bypass**: In container environments, pass `-e AXIODB_ADMIN_PASSWORD=<custom_password>` on initial creation to clear the forced password rotation automatically.
</first_login_rotation>

<append_only_registries>
## 5. Append-Only Registries

* Metadata (`metadata.jsonl`) and secondary indexes (`.indexes/*.jsonl`) use append-only logging for crash resilience.
* The latest line always wins. Over extended periods of high mutation churn, registry files grow until truncated.
</append_only_registries>
