export interface ChangelogEntry {
  version: string;
  date: string;
  title: string;
  changes: string[];
}

/**
 * Curated major-milestone changelog, derived from git history (git log, dated 2024-10-01
 * onward). Not an exhaustive commit log - consecutive trivial version bumps are folded
 * into whichever entry actually shipped something notable.
 */
export const changelog: ChangelogEntry[] = [
  {
    version: "15.0.0",
    date: "2026-08-09",
    title: "Every non-document file is now JSONL, plus a self-deletion guard and a document-count fix",
    changes: [
      "Breaking, on-disk: the per-database collection registry moved from collection.meta (one JSON array) to collection.meta.jsonl (one appended line per collection). There is no migration - a database created before this release opens with an empty collection list until its collections are recreated. The .axiodb document files themselves are untouched.",
      "Breaking, on-disk: the transaction registry moved from .transactions/txn-meta.json to .transactions/txn-meta.jsonl, and WAL files from {transactionId}.wal to {transactionId}.wal.jsonl. Any transaction still in flight across the upgrade is not recovered.",
      "Performance: registering a transaction, changing its status, and removing it used to each read, parse, and rewrite the whole registry with an fsync - three full rewrites per transaction, each growing with the number of concurrent transactions. All three are now a single appended, fsync'd line, and the file is truncated whenever no transaction is left in flight.",
      "Performance: adding a collection appends one line instead of rewriting the registry, and the WAL is now read with the same streaming line reader the indexes use, so a large transaction's log never lands in memory whole.",
      "WAL files carry the .wal.jsonl suffix rather than a bare .jsonl: crash recovery scans the .transactions/ folder by suffix, and a bare .jsonl would make it pick up the registry and replay it as if it were a transaction log.",
      "New FileManager.AppendFileDurable() - an O(1) append that fsyncs before returning, for append-only journals whose loss would break crash recovery.",
      "Security: a user can no longer delete their own account, over the Dashboard HTTP API, the MCP server, or the GUI. Self-deletion destroyed the caller's own session mid-request, and a Super Admin doing it could strand an instance with no way back in. The refusal names who to ask instead.",
      "Fixed: the Dashboard collection list reported the wrong document count - it counted every file under the collection folder, so a collection with 3 documents, 5 index files, and a transaction log showed 9. It now counts only .axiodb documents, matching the dashboard's own tree view.",
    ],
  },
  {
    version: "14.1.5",
    date: "2026-07-30",
    title: "Human-in-the-loop confirmation for the MCP server's destructive tools",
    changes: [
      "The 9 MCP tools that destroy or overwrite data (delete_database, delete_collection, delete_document, update_document, drop_index, delete_user, delete_role, update_user_role, reset_user_password) now ask a human through the MCP client's own confirmation prompt (elicitation/create) before touching the database, naming the exact target - decline, cancel, or an unchecked box aborts with 409 and never reaches a controller",
      "Every one of the 32 MCP tools now ships readOnlyHint/destructiveHint/idempotentHint annotations, so clients can auto-approve reads and hold writes for review",
      "Clients without elicitation support are unaffected (the call proceeds on the annotations alone) - a View-role login remains the server-side way to make an agent strictly read-only",
      "Fixed two dishonest annotations caught by the new tests: axiodb_collection_exists and axiodb_total_documents are not readOnly, since createDB()/createCollection() create-if-missing and can leave an empty database/collection behind",
      "New test suite: npm test mcp-confirm (confirmation gate, advisory fallback, and a static check that no destructive tool can be added without a gate)",
    ],
  },
  {
    version: "14.1.4",
    date: "2026-07-25",
    title: "Transaction durability hardening, single-fsync WAL batching, and 30-char document IDs",
    changes: [
      "Fixed: a WAL append or .tmp staging-write failure during commit was silently swallowed - appendLog()/WriteFile() return an Error result instead of throwing, so the commit proceeded and mutated a document with no log to recover from. Both are now checked and abort the commit, routing into the existing rollback path.",
      "Fixed: rollback left orphaned .tmp staging files behind (executeOperations can now throw mid-loop after staging some files); rollback() sweeps them.",
      "Fixed: rollbackIndexUpdates only discarded the staged map, but stageIndexUpdates mutates the shared in-memory index cache in place (IndexCache.getIndex returns the live object) - a rolled-back transaction left a phantom index entry pointing at a never-written document, causing post-rollback \"Failed to read file\" noise and wasted reads. Rollback now invalidates the touched index fields so the next read reloads a clean copy from disk.",
      "Fixed: recoverTransactions is registry-driven and never cleaned WAL files with no registry entry - a crash between createWAL() and registerTransaction() left an orphan .wal that survived recovery (a timing-dependent crash-recovery test failure, seen on Node 21 CI). Recovery now snapshots WAL files at startup and sweeps orphans not tracked by the registry; added a deterministic regression test that plants an orphan WAL.",
      "Performance: transaction commit now persists all WAL entries in a single fsync'd batch (appendLogBatch) instead of one fsync per operation - a 1000-document insertMany drops from ~1000 WAL fsyncs to 1, roughly 6x faster per document in local benchmarks (~4.5ms/doc to ~0.7ms/doc). Single-document insert is unchanged.",
      "Auto-generated document IDs are now 30-character uppercase alphanumeric (was 15-character letters-only), lowering collision odds; existing shorter IDs remain valid and readable.",
    ],
  },
  {
    version: "13.1.3",
    date: "2026-07-24",
    title: "Fixed a process-exit hang; added real crash-recovery test coverage",
    changes: [
      "Fixed: InMemoryCache's background eviction interval had no unref(), so any short-lived script or CLI process using AxioDB (a stated core use case) would never exit on its own without an explicit process.exit() call - it now unrefs the same way IndexCache's cleanup interval already did",
      "Added a real crash-recovery test suite (npm test crash-recovery): spawns a child process hammering inserts/updates, SIGKILLs it mid-write with no graceful shutdown, then verifies from a fresh process that every recovered document is complete and valid, and the WAL is cleaned up - this is the one guarantee this project had only reasoned about, never actually tested, until now",
      "Added regression tests for this release's index-reordering fix, the cache-invalidation-scope fix, and the \"no match\" error contract for UpdateOne/UpdateMany/deleteOne/deleteMany",
      "Wired the new crash-recovery suite into CI (Push.yml and auto_ci.yml Gate 4, alongside crud/transaction/read); synced the npm test command reference across CLAUDE.md, AGENTS.md, .claude/rules/commands.md, .github/copilot/instructions.md, and the axiodb-development skill, which had all drifted to list only crud/transaction/read",
    ],
  },
  {
    version: "13.1.1",
    date: "2026-07-24",
    title: "Update and delete are now WAL-backed (full ACID coverage)",
    changes: [
      "UpdateOne/UpdateMany/deleteOne/deleteMany now route through the same Transaction/WAL machinery insert() already used, instead of a separate ad-hoc lock-and-write path",
      "Fixed: a failed index-sync after a successful document write used to be silently swallowed (fire-and-forget), leaving the index out of sync with no way to recover on crash - it's now staged and committed atomically with the document change, with WAL redo/undo on failure",
      "Removed the now-redundant per-call LockManager/DocumentLoader-reread/DeleteIndex/InsertIndex wiring from UpdateOperation and DeleteOperation - Transaction already does locking, the fresh re-read under lock, and index staging correctly",
      "insertMany's earlier index-rewrite batching win (Document/src/data/changelog.ts 13.0.0) now applies to UpdateMany/deleteMany too: one index-file rewrite per affected field for the whole batch, not one per document",
      "Fixed: TransactionIndexManager.stageIndexUpdates was removing and re-appending a document's file entry in an index bucket even when that field's value hadn't changed, silently reordering the bucket - for documents sharing an indexed value (e.g. duplicate names), this could make a later query's \"first match\" resolve to a different document than the one just written. It now skips a field's index entirely when its value is unchanged.",
      "Removed InsertIndex.service.ts and DeleteIndex.service.ts - both were only used by the old ad-hoc update/delete path this release replaced, leaving them with zero live callers; Collection now constructs the shared IndexManager base class directly for createIndex/dropIndex/listIndexes",
      "Fixed: routing update/delete through Transaction.commit() had it invalidate the whole collection's cache on every write (the behavior insert() always needed) instead of only the affected documents' cache entries - an update to one document was evicting unrelated cached queries that never matched it. commit() now only does the broad invalidation when the transaction contains an INSERT; update/delete-only transactions evict just the specific documents that changed.",
    ],
  },
  {
    version: "13.0.0",
    date: "2026-07-24",
    title: "Encryption removed; sorted-index range queries; batched inserts",
    changes: [
      "BREAKING: removed per-collection AES-256 encryption (isEncrypted/encryptionKey params on createCollection and every downstream API) - unnecessary overhead for an embedded database; existing encrypted collections will not be readable after upgrading",
      "CryptoHelper/CryptoGraphy helpers, and every isEncrypted/encryptionKey parameter across Collection, Reader, Update, Delete, Aggregation, Transaction, Session, and the HTTP/TCP APIs, removed",
      "Range queries ($gt/$gte/$lt/$lte) on indexed fields now resolve via a sorted-value binary search instead of a full collection scan",
      "insertMany now batches every document into a single Transaction (one index-file rewrite per field instead of one per document) instead of committing a separate Transaction per document",
      "Fixed: UpdateOne/UpdateMany/deleteOne/deleteMany now re-read the target document under the lock instead of trusting the pre-lock snapshot, closing a lost-update race under concurrent writers",
      "Fixed: document rewrites during update are now an atomic temp-file-plus-rename instead of delete-then-recreate, so a concurrent unlocked read can no longer observe a transiently missing file",
      "Fixed: the transaction registry (txn-meta.json) is now fsynced on every write, so recovery can no longer lose track of a committed WAL entry on crash",
    ],
  },
  {
    version: "12.10.20+",
    date: "2026-07-12",
    title: "MCP Server for AI agent integration",
    changes: [
      "MCP server (Model Context Protocol) added to the Docker image, opt-in via AXIODB_MCP=true, exposing 32 tools over Streamable HTTP on port 27020",
      "Real login required (axiodb_login) - every tool is gated by the logged-in user's actual RBAC role, mirroring the HTTP Control Server's permissions exactly",
      "Full coverage: database/collection/document CRUD, aggregation, indexes, dashboard stats, and user/role management (including a new role-deletion capability, added to both the HTTP API and MCP)",
      "Session tools: axiodb_logout, axiodb_whoami, axiodb_change_own_password",
      "Fixed: aggregation $sum/$avg crashing on numeric literal operands (e.g. { $sum: 1 })",
      "Fixed: delete-by-query silently deleting nothing while reporting success when isMany was left unset",
      "Fixed: total document count including the collection's internal indexes folder in the total",
      "Fixed: collection metadata responses no longer leak the raw AES encryption key",
      "Removed dead chmod-based file/directory locking code (LockFile/UnlockFile/IsFileLocked, LockDirectory/IsDirectoryLocked) that was never actually engaged by any internal flow",
    ],
  },
  {
    version: "11.9.13+",
    date: "2026-07-11",
    title: "AxioDBCloud connection pooling, rate limiting & TLS",
    changes: [
      "Connection pooling for AxioDBCloud with least-busy routing (fewest in-flight requests) instead of round-robin",
      "Per-IP concurrent connection cap and connection-attempt rate limiting on the TCP server",
      "TLS/SSL encryption support for TCP connections",
      "RBAC and TCP Auth test gates added to CI",
      "SEO metadata integrated across all documentation pages",
    ],
  },
  {
    version: "9.7.7",
    date: "2026-07-10",
    title: "Session-based GUI auth & TCP authentication",
    changes: [
      "Session-based authentication with cookie support for the Control Server GUI",
      "TCP authentication (RBAC) and index management commands added to AxioDBCloud",
    ],
  },
  {
    version: "9.6.1",
    date: "2026-03-27",
    title: "AxioDB constructor refactor",
    changes: [
      "AxioDB constructor refactored to accept a single options object instead of positional arguments",
    ],
  },
  {
    version: "8.33.235",
    date: "2026-03-23",
    title: "ACID compliance milestone & CI matrix testing",
    changes: [
      "Pseudo-ACID transaction compliance across CRUD operations",
      "CI test matrix expanded across multiple Node.js versions",
      "Query optimization in Reader and Searcher classes",
    ],
  },
  {
    version: "7.33.234",
    date: "2026-03-15",
    title: "Path-traversal hardening",
    changes: [
      "DocumentLoader and PathSanitizer utilities added to centralize safe file handling",
      "Formal contributor rules and development guidelines added to the repo",
    ],
  },
  {
    version: "6.33.128",
    date: "2026-03-13",
    title: "AxioDBCloud (TCP remote access) begins",
    changes: [
      "TCP server and ConnectionManager implemented - the foundation of AxioDBCloud remote access",
      "Protocol error handling and HTTP-vs-TCP-port misconfiguration detection",
    ],
  },
  {
    version: "6.33.127",
    date: "2026-03-11",
    title: "Smarter caching & index cleanup",
    changes: [
      "Selective cache invalidation and randomized TTL to avoid cache-stampede synchronization",
      "DeleteIndex service for removing documents from indexes",
      "IndexCache gained TTL-based expiry and cleanup",
    ],
  },
  {
    version: "5.33.127",
    date: "2026-03-10",
    title: "ACID transactions with Write-Ahead Log",
    changes: [
      "TransactionIndexManager, TransactionRegistry, and Write-Ahead Log (WAL) services implemented",
      "Foundation for session-based transactions with commit/rollback",
    ],
  },
  {
    version: "3.31.104",
    date: "2025-10-31",
    title: "Worker-thread performance overhaul",
    changes: [
      "File processing parallelized with Promise.all across worker threads",
      "Reader/search operations tuned to use all available CPU cores",
      "Sorting utility optimized to use native comparison",
    ],
  },
  {
    version: "2.30.93",
    date: "2025-08-31",
    title: "Database export/import",
    changes: [
      "Database export as a compressed .tar.gz archive",
      "Database import from an uploaded archive",
      "Advanced JSON query search support",
    ],
  },
  {
    version: "2.28.81",
    date: "2025-08-24",
    title: "API reference page & transaction tokens",
    changes: [
      "API reference documentation page added to the Control Server GUI",
      "Transaction token support added to the HTTP API",
    ],
  },
  {
    version: "2.28.77",
    date: "2025-08-20",
    title: "Dashboard caching & transaction tokens",
    changes: [
      "Caching and transaction token support for collections and databases",
      "Dashboard stats retrieval integrated with the cache layer",
    ],
  },
  {
    version: "2.24.71",
    date: "2025-08-11",
    title: "Full CRUD document management UI",
    changes: [
      "Create, read, update, delete, and aggregate operations added to the Control Server GUI as modal-driven workflows",
      "Advanced search with JSON query and document-ID lookup in the Documents page",
    ],
  },
  {
    version: "2.19.65",
    date: "2025-07-27",
    title: "Database management UI & JWT key management",
    changes: [
      "Database management routes/controller and GUI dashboard (Zustand state management)",
      "JWT-based key management for database instances",
    ],
  },
  {
    version: "2.18.54",
    date: "2025-06-23",
    title: "Engine refactor & worker-based search",
    changes: [
      "Legacy FileManager/FolderManager replaced by the current engine/ module structure",
      "HashmapSearch replaced by worker-thread-based Searcher for parallel file reads",
    ],
  },
  {
    version: "2.13.47",
    date: "2025-06-21",
    title: "Control Server (HTTP GUI) foundation",
    changes: [
      "AxioDB Control Server implemented on Fastify with health check and routes endpoints",
      "Tailwind CSS integrated into the GUI",
    ],
  },
  {
    version: "2.11.29",
    date: "2025-06-14",
    title: "GUI authentication & schema validation",
    changes: [
      "JWT-based authentication checks added to the GUI",
      "Schema validation for user registration and collection data",
    ],
  },
  {
    version: "2.10.19",
    date: "2025-06-08",
    title: "Initial Docker support",
    changes: [
      "First Docker setup: package.json, tsconfig.json, and a schema generator utility for containerized deployments",
    ],
  },
  {
    version: "1.5.8",
    date: "2025-04-02",
    title: "Cache invalidation on writes",
    changes: [
      "Cache clearing wired into update and delete operations, and a clearAllCache method added",
    ],
  },
  {
    version: "1.4.3",
    date: "2025-03-26",
    title: "Aggregation pipelines",
    changes: [
      "aggregate() method added to Collection with MongoDB-style pipeline stages",
      "$match filtering extended to support regex and object matching",
    ],
  },
  {
    version: "1.3.9",
    date: "2025-03-20",
    title: "Full CRUD operation suite",
    changes: [
      "Reader class: query, sort, skip/limit pagination, and total-count support",
      "DeleteOperation: deleteOne and deleteMany with detailed error handling",
      "UpdateOperation: UpdateOne and UpdateMany with schema-aware partial updates",
    ],
  },
  {
    version: "1.1.4",
    date: "2025-02-28",
    title: "Encryption support",
    changes: [
      "CryptoHelper class added for AES encryption/decryption of collection data",
    ],
  },
  {
    version: "1.1.2",
    date: "2025-02-14",
    title: "Core Collection & Database classes",
    changes: [
      "Collection and Database classes implemented - the foundation of the document store",
      "FileManager/FolderManager error handling improved",
    ],
  },
  {
    version: "1.0.16",
    date: "2024-12-25",
    title: "Initial Web GUI",
    changes: [
      "First GUI setup with Vite and React, alongside a server-file restructure",
    ],
  },
  {
    version: "1.0.14",
    date: "2024-12-23",
    title: "In-memory caching",
    changes: [
      "InMemoryCache class added, with TTL-based expiry for cached query results",
    ],
  },
  {
    version: "1.0.0",
    date: "2024-12-07",
    title: "Fastify server & first insert",
    changes: [
      "Fastify HTTP server integrated into the project",
      "The `Configuration` class was renamed to `AxioDB`",
      "First working document insert feature",
    ],
  },
  {
    version: "1.0.0",
    date: "2024-10-01",
    title: "Project inception",
    changes: [
      "Initial commit: repository scaffolding, FileManager/FolderManager engine, and an initial `Configuration` class (later renamed to `AxioDB`)",
    ],
  },
];
