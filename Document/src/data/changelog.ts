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
