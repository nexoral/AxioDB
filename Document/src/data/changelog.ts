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
    version: "20.3.1",
    date: "2026-09-01",
    title: "ACID transactions over TCP with savepoints and connection-pinned client proxy",
    changes: [
      "New: ACID transactions over TCP — BEGIN/COMMIT/ROLLBACK commands routed through a per-connection TransactionManager with WAL-backed durability, Wait-Die deadlock avoidance, and 30-second timeout",
      "New: savepoints over TCP — SAVEPOINT, ROLLBACK_TO_SAVEPOINT, RELEASE_SAVEPOINT commands for partial rollback within a transaction",
      "New: connection-pinned client — TransactionProxy pins all transactional operations to a single TCP connection so in-flight writes are visible to subsequent reads within the same transaction",
      "New: Collection.beginTransaction() on the AxioDBCloud client returns a chainable TransactionProxy with insert/update/delete/commit/rollback/savepoint methods",
      "New: auto-rollback on disconnect — orphaned transactions are automatically rolled back when a TCP connection drops, preventing data corruption from partial writes",
      "New: Transaction.getId() and Collection.getCollectionPath() public getters for TCP handler integration",
      "Quality: OperationHandler routes CRUD with transactionId through the in-flight Transaction, buffering writes until commit",
      "Quality: 20 new TCP transaction tests covering BEGIN/COMMIT, ROLLBACK, savepoints, isolation, cross-connection rejection, and disconnect cleanup",
    ],
  },
  {
    version: "19.2.0",
    date: "2026-09-01",
    title: "Index hints, batch read, zero `any` types, ESLint, and structured Logger",
    changes: [
      "New: index hints on queries — `collection.query({ status: 'active' }).hint('status').exec()` forces the query engine to use a specific index instead of scanning",
      "New: batch document read — `collection.findByIds(['id1', 'id2'])` retrieves multiple documents by ID in a single call; exposed over HTTP (POST /api/operation/all/by-ids/) and TCP (FIND_BY_IDS command)",
      "Quality: all `any` types removed from the TypeScript source — every file in source/ now uses proper types (Record<string, unknown>, unknown, Document, etc.), zero `any` remaining",
      "Quality: ESLint configured with @typescript-eslint, 0 errors 0 warnings across the entire codebase",
      "Quality: all console.log/error/warn calls replaced with a structured Logger helper (source/Helper/Logger.helper.ts) for consistent, configurable output",
    ],
  },
  {
    version: "15.2.0",
    date: "2026-08-27",
    title: "AxioDB CLI — Go-based command line interface with MongoDB shell syntax",
    changes: [
      "New: AxioDB CLI — a Go-based command line tool for interacting with AxioDB servers via the TCP protocol.",
      "New: Interactive REPL mode with MongoDB shell syntax — use, show dbs, show collections, db.coll.find(), db.coll.insert(), and all CRUD operations.",
      "New: All 21 TCP commands supported — database, collection, document CRUD, aggregation, indexing, ping, disconnect.",
      "New: TLS support with --tls, --tls-cert, and --tls-skip-verify flags.",
      "New: TCP authentication support with -u and -p flags.",
      "New: Connection string support — axiodb://host:port format.",
      "New: JSON and table output modes with --output flag.",
      "New: Tab autocomplete in REPL mode.",
      "New: Cross-platform binaries for 12 targets — Linux (amd64, arm64, 386, armv7), macOS (amd64, arm64), Windows (amd64, arm64, 386), FreeBSD, OpenBSD, NetBSD.",
      "New: One-line install scripts for Linux/macOS (install.sh) and Windows (install.ps1) with auto OS/arch detection and checksum verification.",
      "New: Automated GitHub releases with checksums.txt on version bump in cli/VERSION.",
      "New: Version sync script (Scripts/versionController.sh) updates package.json, GUI/package.json, Document/package.json, and cli/VERSION together.",
    ],
  },
  {
    version: "15.1.0",
    date: "2026-08-25",
    title: "Aggregation engine rewrite: 60+ operators, $lookup cross-collection joins, custom operator registry",
    changes: [
      "New: $lookup stage for cross-collection joins — supports both equality join (localField/foreignField) and pipeline-based join with $let/$$var binding. Foreign collection data is loaded via a resolver function threaded from Database through Collection to Aggregation.",
      "New: OperatorRegistry — static class for registering custom stage operators, accumulators, and expression operators. Custom operators integrate seamlessly with built-in operators in the pipeline execution loop.",
      "New: Full expression evaluator supporting 80+ operators — arithmetic ($add, $subtract, $multiply, $divide, $mod, $abs, $ceil, $floor, $sqrt, $pow, $round), string ($concat, $substr, $toLower, $toUpper, $trim, $split, $replaceOne, $replaceAll, $regexMatch), comparison ($eq, $gt, $gte, $lt, $lte, $ne, $cmp), logical ($and, $or, $not, $cond, $ifNull, $switch), array ($filter, $map, $reduce, $arrayElemAt, $concatArrays, $size, $slice, $range, $sortArray, $reverseArray, $zip), date ($year, $month, $dayOfMonth, $hour, $minute, $second, $dayOfWeek, $dayOfYear, $week, $dateToString, $dateFromString, $dateDiff, $dateAdd, $dateSubtract), type ($type, $convert, $toString, $toInt, $toDouble, $toBool, $isNumber, $isArray), set ($setEquals, $setIntersection, $setUnion, $setDifference, $setIsSubset), and misc ($literal, $getField, $mergeObjects, $let).",
      "New: $facet stage for multi-facet aggregation (parallel sub-pipelines on the same input).",
      "New: $bucket and $bucketAuto stages for bucketing documents by boundaries or automatic distribution.",
      "New: $count, $sortByCount, $sample, $replaceRoot/$replaceWith, $set (alias for $addFields), $unset stages.",
      "New: Accumulator operators $min, $max, $first, $last, $push, $addToSet, $stdDevPop, $stdDevSamp (previously only $sum and $avg).",
      "Enhanced: $match now supports top-level logical operators ($and, $or, $nor, $not), $exists, $elemMatch, $all, $size, $type, $mod.",
      "Enhanced: $sort now supports multi-field sorting (e.g., { department: 1, salary: -1 }).",
      "Enhanced: $project now supports exclusion mode ({ field: 0 }) and computed fields via expressions ({ bonus: { $multiply: ['$salary', 0.1] } }).",
      "Enhanced: $addFields now supports computed expressions instead of only literal values.",
      "Enhanced: $unwind now supports the object form with includeArrayIndex and preserveNullAndEmptyArrays options.",
      "Enhanced: $match is no longer required as the first stage — the engine scans the entire pipeline for a $match stage and uses it for index optimization regardless of position.",
      "Enhanced: $lookup uses index optimization on the foreign collection — equality joins pass distinct values as $in query hints, pipeline joins extract $match conditions as query hints.",
      "Fixed: Index lookup in aggregation was broken (accessed this.Pipeline.$match instead of this.Pipeline[0].$match).",
      "63 new test cases covering backward compatibility, enhanced operators, new stages, $lookup integration, expression evaluator, custom operators, edge cases, and pipeline flexibility.",
    ],
  },
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
      "Fixed: importing a database always failed with a 500 (ERR_INVALID_ARG_VALUE, \"The property 'options.recursive' is no longer supported\"). The upload's temp directory was cleaned up with fs.rmdir({recursive:true}), an option removed from rmdir in modern Node - and because it ran after extraction, the data was actually imported while the caller was told it had failed. Cleanup now uses fs.rm and runs in a finally, so a failed extraction no longer leaves the uploaded archive on disk either.",
      "Security: hardened database import against decompression bombs. Extraction meters the stream and refuses anything expanding past 100:1 - a 5 MB archive declaring 5 GB is cut off partway through decompressing rather than after filling the disk. The guard is on expansion ratio, not archive size, so a genuinely large export still imports at any size: a fixed byte cap would have to be either low enough to reject real exports or high enough to pass a bomb. Free disk space (less a margin) bounds the total, and entry count is capped against inode exhaustion. Absolute paths, \"..\" segments and symlinks are refused (Zip Slip), verified explicitly rather than trusting library defaults.",
      "Security: a corrupt upload used to take the whole server process down. unzipFile chained .pipe().pipe().on(\"error\") and so only listened on the final stream - a non-gzip file raised an unhandled 'error' on the zlib stream, which Node turns into an uncaught exception. That was a denial of service available to any account holding db:import. Extraction now runs through stream/promises pipeline and returns 400.",
      "Documented the real cost of one-file-per-document storage, with measured figures rather than estimates: each document occupies at least one filesystem block (typically 4 KB) whatever its size, so 20,000 documents of ~130 bytes take 80 MB on disk for 2.6 MB of data - 31x amplification that disappears as documents approach 4 KB. Full scans pay one file open per document: 208 ms for 20,000 documents against 20 ms for an equivalent single-file format. Added to the Limitations page, llms-full.txt and the agent skill so the trade-off is visible before someone picks AxioDB, alongside what it buys - O(1) documentId lookups, single-document blast radius on a torn write, and no compaction pass. The sweet spot is now stated in three dimensions rather than one: document size (~1 KB and above, zero overhead at 4 KB), collection size (10K-500K), and access pattern (documentId or indexed exact match), plus the deployment constraint that nothing else solves - an install that must never compile anything.",
      "Database import now stages the upload outside the data directory, validates it, and only then promotes it into place. An archive that is not a genuine AxioDB export is rejected with 400 and discarded whole - because nothing was ever written to the live directory, a bad upload can no longer leave a half-imported database behind. Validation is an allowlist of AxioDB shapes (collection.meta.jsonl, collection folders, .axiodb documents, indexes/, .transactions/), which also accepts an export of a database that has no collections yet.",
      "Concurrent imports are handled properly: two people importing different databases run in parallel with separate staging directories, while two imports of the same database conflict - the second gets 409 naming who is currently importing it. The database is identified by the name inside the archive rather than the uploaded filename, so renaming the file does not defeat the check, and an import of a database that already exists is refused with 409 instead of merging into it.",
      "Security: the reserved-database-name guard on import was bypassable. It used path.parse(filename).name, which strips only the last extension - so \"config.tar.gz\" resolved to \"config.tar\" and never matched, despite .tar.gz being exactly what Export produces.",
      "Import uploads are streamed to disk instead of being buffered with toBuffer(), which turned a large upload into the same amount of resident memory before anything was validated - so a multi-gigabyte export no longer has to fit in RAM to be imported. They are also staged in the OS temp directory instead of beside the compiled code (__dirname), which is read-only in most container images and put user uploads inside node_modules when AxioDB was installed as a dependency.",
      "New endpoint: GET /api/system returns process, memory, cache, instance and service-port detail for the Status page. Authenticated and gated behind dashboard:view - GET /api/health stays unauthenticated for the Docker healthcheck and deliberately reports only status, timestamp and uptime, so host characteristics are not exposed anonymously.",
      "Dashboard redesign: a single design-token palette across every page, real charts (storage and cache donuts, documents-per-collection), animated metric counters, shared Button/Card/Modal/Field primitives, working mobile navigation, and a query console with syntax highlighting, completion and live validation. Several dashboard cards were also delaying real data by up to a second with a setTimeout that only simulated loading.",
    ],
  },
  {
    version: "14.1.5",
    date: "2026-07-30",
    title: "Human-in-the-loop confirmation for the MCP server's destructive tools",
    changes: [
      "The 9 MCP tools that destroy or overwrite data (delete_database, delete_collection, delete_document, update_document, drop_index, delete_user, delete_role, update_user_role, reset_user_password) now ask a human through the MCP client's own confirmation prompt (elicitation/create) before touching the database, naming the exact target - decline, cancel, or an unchecked box aborts with 409 and never reaches a controller",
      "Every one of the 43 MCP tools now ships readOnlyHint/destructiveHint/idempotentHint annotations, so clients can auto-approve reads and hold writes for review",
      "Added authenticated MCP transactions with insert, update, delete, savepoints, commit, and rollback",
      "Added HTTP-backed CLI user and role administration while keeping the TCP client data-plane focused",
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
