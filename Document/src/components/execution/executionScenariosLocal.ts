import type { Scenario, StageEdge, StageNode } from "./ExecutionTypes";

/**
 * Local (embedded engine) scenarios for the Animated Execution page.
 *
 * Every layout, file name, and step ordering mirrors the real implementation
 * (`source/`): file-per-doc `.axiodb` storage, JSONL WAL + registries, dual-write
 * indexes in `indexes/*.jsonl`, `InMemoryCache` with random 5-15m TTL, and the
 * single-operation-Transaction write path used by `Collection.insert`.
 */

const n = (id: string, label: string, x: number, y: number, kind: StageNode["kind"], sub?: string, w?: number, h?: number): StageNode => ({ id, label, x, y, kind, sub, w, h });

const e = (id: string, from: string, to: string, dashed?: boolean): StageEdge => ({ id, from, to, dashed });

/* ── 1. On-disk layout ─────────────────────────────────────────────── */

const storage: Scenario = {
  id: "storage",
  title: "On-disk Storage Layout",
  short: "The file-per-document tree",
  mode: "local",
  iconKey: "folder-tree",
  description:
    "Every AxioDB instance is a folder tree: databases hold collections, collections hold one flat `.axiodb` JSON file per document, plus an `indexes/` folder and small JSONL registries.",
  code: `const db = new AxioDB();            // creates ./AxioDB/
const app = await db.createDB('AppDB');  // ./AxioDB/AppDB/
const users = await app.createCollection('users'); // ./AxioDB/AppDB/users/
await users.insert({ name: 'Alice', age: 30 });   // one .axiodb file`,
  viewBox: [1000, 580],
  nodes: [
    n("root", "AxioDB/ (root)", 396, 16, "data", "<CustomPath>/RootName"),
    n("appdb", "AppDB/", 396, 128, "data", "one folder per database"),
    n("users", "users/", 396, 238, "data", "one folder per collection"),
    n("docs", "documents", 92, 348, "data", "<.axiodb> per document"),
    n("indexes", "indexes/", 372, 348, "data", "index files"),
    n("colmeta", "collection.meta.jsonl", 640, 348, "io", "collection registry"),
    n("docfile", "<documentId>.axiodb", 84, 462, "store", '{ "name": "Alice", … }'),
    n("idx", "email.jsonl · age.jsonl", 320, 462, "store", "JSONL entries + range"),
    n("idxmeta", "index.meta.jsonl", 568, 462, "io", "field -> file registry"),
  ],
  edges: [
    e("root-appdb", "root", "appdb"),
    e("appdb-users", "appdb", "users"),
    e("users-docs", "users", "docs"),
    e("users-indexes", "users", "indexes"),
    e("users-colmeta", "users", "colmeta"),
    e("docs-docfile", "docs", "docfile"),
    e("indexes-idx", "indexes", "idx"),
    e("indexes-idxmeta", "indexes", "idxmeta"),
  ],
  steps: [
    {
      title: "Boot & root folder",
      frames: [
        {
          nodes: ["root"],
          log: [
            { text: "const db = new AxioDB({ RootName: 'AxioDB' })" },
            { text: "root = <cwd>/AxioDB — FolderManager.CreateDirectory", tone: "ok" },
          ],
        },
      ],
    },
    {
      title: "Database folder",
      frames: [
        {
          nodes: ["root", "appdb"],
          edges: ["root-appdb"],
          token: { edgeId: "root-appdb", tone: "success", label: "createDB" },
          log: [
            { text: "await db.createDB('AppDB')  →  ./AxioDB/AppDB/", tone: "mut" },
            { text: "name sanitized: replace(/[^a-zA-Z0-9-_]/g,'_')" },
          ],
        },
      ],
    },
    {
      title: "Collection folder",
      frames: [
        {
          nodes: ["users", "colmeta"],
          edges: ["appdb-users"],
          token: { edgeId: "appdb-users", tone: "success", label: "createCollection" },
          log: [
            { text: "AppDB.createCollection('users')  →  ./AxioDB/AppDB/users/", tone: "mut" },
            { text: "collection register elsewhere? no — collection.meta.jsonl tracks it" },
          ],
        },
      ],
    },
    {
      title: "Document files",
      frames: [
        {
          nodes: ["users", "docs", "docfile"],
          edges: ["users-docs", "docs-docfile"],
          token: { edgeId: "docs-docfile", tone: "success", label: "insert" },
          log: [
            { text: "file-per-document: one flat JSON file per record", tone: "ok" },
            { text: "documentId = 30 chars, alphanumeric (General.DocumentId_Length)", tone: "store" },
            { text: "extension .axiodb, NUL-JS `${documentId}.axiodb`" },
          ],
        },
      ],
    },
    {
      title: "Index & registry files",
      frames: [
        {
          nodes: ["indexes", "idx", "idxmeta"],
          edges: ["indexes-idx", "indexes-idxmeta"],
          token: { edgeId: "indexes-idx", tone: "store", label: "write" },
          log: [
            { text: "indexes/{field}.jsonl — one file per indexed field", tone: "store" },
            { text: "index.meta.jsonl — O(1) append-only field registry", tone: "store" },
            { text: "JSONL = append + streaming reads (Index_File_EXT '.jsonl')" },
          ],
        },
      ],
    },
  ],
};

/* ── 2. Create Database & boot ─────────────────────────────────────── */

const createDb: Scenario = {
  id: "create-db",
  title: "Create Database & Boot",
  short: "Singleton, root folder, config + servers",
  mode: "local",
  iconKey: "database",
  description:
    "Solved `new AxioDB()` is a hard singleton. The constructor resolves the root path, builds the in-memory `DatabaseMap`, seeds the reserved `config` database, and optionally starts the GUI (27018) and TCP (27019) servers.",
  code: `const db = new AxioDB({ GUI: true, TCP: true, TCPAuth: true });
const database = await db.createDB('AppDB');`,
  viewBox: [1000, 560],
  nodes: [
    n("main", "new AxioDB(options)", 24, 32, "call", "user code"),
    n("guard", "Singleton guard", 252, 32, "decor", "throws if _instance exists"),
    n("root", "Resolve root folder", 480, 32, "io", "path.resolve(CustomPath)",
      198),
    n("dbmap", "DatabaseMap", 480, 180, "memory", "Map<dbName, Database>",198),
    n("config", "config DB + admin seed", 24, 180, "auth", "AuthSeeder", 200),
    n("cache", "InMemoryCache", 252, 320, "memory", "random TTL 5-15m", 200),
    n("registry", "txn-meta.jsonl", 520, 320, "store", "in-flight txn registry", 200),
    n("servers", "GUI 27018 · TCP 27019", 760, 180, "process", "boot on demand", 200),
  ],
  edges: [
    e("main-guard", "main", "guard"),
    e("guard-root", "guard", "root"),
    e("root-dbmap", "root", "dbmap"),
    e("root-config", "root", "config"),
    e("root-cache", "root", "cache"),
    e("root-registry", "root", "registry"),
    e("dbmap-servers", "dbmap", "servers"),
  ],
  steps: [
    {
      title: "Constructor + singleton",
      frames: [
        {
          nodes: ["main", "guard"],
          log: [
            { text: "main() constructs a fresh AxioDB instance", tone: "mut" },
            { text: "if (AxioDB._instance) throw new Error('Only one instance allowed')", tone: "warn" },
            { text: "AxioDB._instance = this  — the singleton is fixed forever" },
          ],
        },
      ],
    },
    {
      title: "Root folder",
      frames: [
        {
          nodes: ["root"],
          edges: ["guard-root"],
          token: { edgeId: "guard-root", tone: "success", label: "resolve" },
          log: [
            { text: "this.currentPATH = path.resolve(CustomPath || '.')", tone: "mut" },
            { text: "RootName defaults to 'AxioDB'; every db nests under it", tone: "ok" },
          ],
        },
      ],
    },
    {
      title: "Database registry",
      frames: [
        {
          nodes: ["dbmap"],
          edges: ["root-dbmap"],
          token: { edgeId: "root-dbmap", tone: "net", label: "Map<>" },
          log: [
            { text: "this.DatabaseMap = new Map()  — keeps open databases", tone: "mut" },
            { text: "createDB pushes { name, collectionMap } here" },
          ],
        },
      ],
    },
    {
      title: "Config DB + admin seed",
      frames: [
        {
          nodes: ["config"],
          edges: ["root-config"],
          token: { edgeId: "root-config", tone: "primary", label: "seed" },
          log: [
            { text: "reserved 'config' DB — never reachable via generic routes", tone: "info" },
            { text: "AuthSeeder creates default admin user (hashed password)", tone: "mut" },
            { text: "roles + users persist in config.users", tone: "store" },
          ],
        },
      ],
    },
    {
      title: "Cache + txn registry",
      frames: [
        {
          nodes: ["cache", "registry"],
          edges: ["root-cache", "root-registry"],
          token: { edgeId: "root-cache", tone: "success", label: "TTL 5-15m" },
          log: [
            { text: "InMemoryCache({ enabled: Cache !== false, minTTL: 5, maxTTL: 15 })", tone: "mut" },
            { text: "each entry gets its own random TTL  — prevents cache stampede", tone: "ok" },
          ],
        },
      ],
    },
    {
      title: "Surface servers",
      frames: [
        {
          nodes: ["servers", "dbmap"],
          edges: ["dbmap-servers"],
          token: { edgeId: "dbmap-servers", tone: "net", label: "boot" },
          log: [
            { text: "GUI: true  → Fastify control server on 27018", tone: "net" },
            { text: "TCP: true  → AxioDBCloud TCP server on 27019 (+ TLS option)", tone: "net" },
            { text: "both reuse the same RBAC user store" },
          ],
        },
      ],
    },
  ],
};

/* ── 3. Create Collection ──────────────────────────────────────────── */

const createCollection: Scenario = {
  id: "create-collection",
  title: "Create Collection",
  short: "Folder, registry, eager index warm-up + recovery",
  mode: "local",
  iconKey: "layers",
  description:
    "Creating a collection makes its folder, appends it to `collection.meta.jsonl`, auto-creates the `documentId` index, eagerly streams every index into the `IndexCache`, and triggers WAL recovery for any transaction interrupted by a crash.",
  code: `const users = await database.createCollection('users');
await users.newIndex('email', 'age');   // index.meta.jsonl entries`,
  viewBox: [1000, 540],
  nodes: [
    n("app", "createCollection('users')", 24, 40, "call", "database API"),
    n("db", "Database.createCollection", 252, 40, "process", "validates + sanitizes"),
    n("dir", "Folder + registries", 480, 40, "io", "mkdir + append", 200),
    n("colmeta", "collection.meta.jsonl", 700, 40, "store", "collection registry", 200),
    n("idxdir", "indexes/ folder", 700, 160, "io", "generateIndexMeta", 200),
    n("ididx", "documentId.jsonl", 700, 280, "store", "auto index for every doc", 220),
    n("warm", "IndexCache.loadAllIndexes", 480, 160, "memory", "eager stream from disk", 200),
    n("recover", "Transaction.recover", 220, 190, "process", "redo/undo WAL on startup", 200),
  ],
  edges: [
    e("app-db", "app", "db"),
    e("db-dir", "db", "dir"),
    e("dir-colmeta", "dir", "colmeta"),
    e("dir-idxdir", "dir", "idxdir"),
    e("db-warm", "db", "warm"),
    e("warm-ididx", "warm", "ididx"),
    e("db-recover", "db", "recover"),
    e("idxdir-ididx", "idxdir", "ididx"),
  ],
  steps: [
    {
      title: "Dispatch",
      frames: [
        {
          nodes: ["app", "db"],
          edges: ["app-db"],
          token: { edgeId: "app-db", tone: "primary", label: "createCollection" },
          log: [
            { text: "database.createCollection('users')" },
            { text: "input validated, path sanitized with PathSanitizer" },
          ],
        },
      ],
    },
    {
      title: "Folder + collection registry",
      frames: [
        {
          nodes: ["dir", "colmeta"],
          edges: ["dir-colmeta"],
          token: { edgeId: "dir-colmeta", tone: "store", label: "append" },
          log: [
            { text: "mkdir ./AxioDB/AppDB/users (recursive)", tone: "io" },
            { text: "collection.meta.jsonl gets one appended line", tone: "store" },
          ],
        },
      ],
    },
    {
      title: "documentId auto index",
      frames: [
        {
          nodes: ["idxdir", "ididx"],
          edges: ["idxdir-ididx"],
          token: { edgeId: "idxdir-ididx", tone: "success", label: "bootstrap" },
          log: [
            { text: "generateIndexMeta() creates the indexes/ folder", tone: "ok" },
            { text: "documentId.jsonl index is auto-created and registered", tone: "store" },
            { text: "meta append is O(1) — no read-modify-rewrite" },
          ],
        },
      ],
    },
    {
      title: "Eager index warm-up",
      frames: [
        {
          nodes: ["warm", "ididx"],
          edges: ["warm-ididx"],
          token: { edgeId: "warm-ididx", tone: "mut", label: "stream" },
          log: [
            { text: "new Collection(…) → IndexCache.getInstance(path)", tone: "mut" },
            { text: "loadAllIndexes() streams each *.jsonl index into memory", tone: "ok" },
            { text: "misses fall back to disk (cold-start recovery)" },
          ],
        },
      ],
    },
    {
      title: "Crash recovery hook",
      frames: [
        {
          nodes: ["recover"],
          edges: ["db-recover"],
          token: { edgeId: "db-recover", tone: "warning", label: "WAL replay" },
          log: [
            { text: "Transaction.recoverTransactions(path) runs at startup", tone: "mut" },
            { text: "reads txn-meta.jsonl, redoes or undoes interrupted writes", tone: "warn" },
            { text: "half-written documents are never left behind" },
          ],
        },
      ],
    },
  ],
};

/* ── 4. Insert (single document write path) ────────────────────────── */

const insert: Scenario = {
  id: "insert",
  title: "Insert — the full write path",
  short: "WAL → id → temp+atomic rename → index → cache",
  mode: "local",
  iconKey: "file-plus",
  description:
    "`insert()` is routed through a single-operation Transaction: WAL-append, generate a 30-char unique id, write a temp file and atomically rename it to `<documentId>.axiodb`, dual-write the affected indexes (memory + JSONL), then invalidate the cache scope so list queries re-run.",
  code: `const created = await users.insert({ name: 'Alice', age: 30 });
// 2026-xx: routes through txn → WAL → temp+rename → index → cache
console.log(created.data.documentId);`,
  viewBox: [1000, 520],
  nodes: [
    n("caller", "users.insert({…})", 20, 24, "call", "user code"),
    n("coll", "Collection.insert", 214, 24, "process", "validates object input", 198),
    n("txn", "beginTransaction()", 420, 24, "process", "1-op transaction", 198),
    n("walreg", "txn-meta.jsonl", 654, 24, "store", "in-flight txn registered", 200),
    n("wal", "{txnId}.wal.jsonl", 654, 118, "store", "write-ahead append", 200),
    n("idgen", "generateUniqueDocumentId", 420, 128, "process", "30-char, checks disk", 206),
    n("tmp", "Write temp file .tmp-", 150, 168, "io", "Converter.ToString(data)", 198),
    n("mv", "Atomic rename → .axiodb", 150, 288, "io", "temp renamed in one op", 200),
    n("idxmem", "Index memory Map", 420, 288, "memory", "updateIndex → cache.set", 198),
    n("idxdisk", "indexes/*.jsonl", 654, 288, "store", "serialize + write JSONL", 200),
    n("cacheinv", "invalidateByCollection", 870, 288, "memory", "evict path:: prefix", 200),
    n("done", "Success { documentId }", 654, 420, "data", "ResponseHelper.Success", 210),
  ],
  edges: [
    e("caller-coll", "caller", "coll"),
    e("coll-txn", "coll", "txn"),
    e("txn-walreg", "txn", "walreg"),
    e("txn-wal", "txn", "wal"),
    e("txn-idgen", "txn", "idgen"),
    e("idgen-tmp", "idgen", "tmp"),
    e("tmp-mv", "tmp", "mv"),
    e("mv-idxmem", "mv", "idxmem"),
    e("idxmem-idxdisk", "idxmem", "idxdisk"),
    e("idxmem-cacheinv", "idxmem", "cacheinv"),
    e("cacheinv-done", "cacheinv", "done"),
  ],
  steps: [
    {
      title: "Call & validate",
      frames: [
        {
          nodes: ["caller", "coll"],
          edges: ["caller-coll"],
          token: { edgeId: "caller-coll", tone: "primary", label: "insert" },
          log: [
            { text: "users.insert({ name: 'Alice', age: 30 })" },
            { text: "rejects empty / non-object input", tone: "warn" },
          ],
        },
      ],
    },
    {
      title: "Open a transaction",
      frames: [
        {
          nodes: ["txn"],
          edges: ["coll-txn"],
          token: { edgeId: "coll-txn", tone: "mut", label: "begin" },
          log: [
            { text: "const txn = this.beginTransaction()", tone: "mut" },
            { text: "every insert is WAL-backed: no half-written documents", tone: "ok" },
          ],
        },
      ],
    },
    {
      title: "Write-ahead logging",
      frames: [
        {
          nodes: ["walreg", "wal"],
          edges: ["txn-walreg", "txn-wal"],
          token: { edgeId: "txn-wal", tone: "store", label: "append" },
          log: [
            { text: "txn-meta.jsonl registers the in-flight transaction", tone: "store" },
            { text: "{txnId}.wal.jsonl is appended (fsOpen 'a') before any visible change", tone: "store" },
            { text: "if the process dies here, recovery redoes/undoes from the WAL" },
          ],
        },
      ],
    },
    {
      title: "Unique id",
      frames: [
        {
          nodes: ["idgen", "wal"],
          edges: ["txn-idgen"],
          token: { edgeId: "txn-idgen", tone: "success", label: "docId" },
          log: [
            { text: "UniqueGenerator(30).RandomWord(true, true) — alphanumeric", tone: "mut" },
            { text: "loops while the file already exists on disk", tone: "ok" },
          ],
        },
      ],
    },
    {
      title: "Temp file + atomic rename",
      frames: [
        {
          nodes: ["tmp", "mv"],
          edges: ["idgen-tmp", "tmp-mv"],
          token: { edgeId: "tmp-mv", tone: "warning", label: "rename" },
          log: [
            { text: "WriteFile(temp... {documentId}.axiodb.tmp-<uuid>)", tone: "io" },
            { text: "MoveFile(temp, target) — single atomic fs operation", tone: "ok" },
            { text: "readers always see the old or the new file, never a gap", tone: "ok" },
          ],
        },
      ],
    },
    {
      title: "Index dual-write",
      frames: [
        {
          nodes: ["idxmem", "idxdisk"],
          edges: ["mv-idxmem", "idxmem-idxdisk"],
          token: { edgeId: "idxmem-idxdisk", tone: "success", label: "JSONL" },
          log: [
            { text: "for each indexed field in the doc: read index → append value→[file]", tone: "mut" },
            { text: "write to disk JSONL first (durability), then refresh memory TTL", tone: "store" },
            { text: "sortedValues lazily backfilled for range support" },
          ],
        },
      ],
    },
    {
      title: "Cache invalidation + response",
      frames: [
        {
          nodes: ["cacheinv", "done"],
          edges: ["idxmem-cacheinv", "cacheinv-done"],
          token: { edgeId: "cacheinv-done", tone: "success", label: "ok" },
          log: [
            { text: "invalidateByCollection(users) — a cached list could be stale now", tone: "mut" },
            { text: "commit() finishes → WAL truncated, registry cleaned" },
            { text: "ResponseHelper.Success({ documentId })", tone: "ok" },
          ],
        },
      ],
    },
  ],
};

/* ── 5. Insert Many (batch) ────────────────────────────────────────── */

const insertMany: Scenario = {
  id: "insert-many",
  title: "Insert Many — batched",
  short: "One transaction, one index rewrite",
  mode: "local",
  iconKey: "layers",
  description:
    "`insertMany` stages every document into a single transaction so each indexed field is updated in memory for all documents and written back to disk exactly once — instead of once per document (which used to make indexed batch inserts O(N) full-file rewrites).",
  code: `await users.insertMany([
  { name: 'Bob', age: 24 },
  { name: 'Carol', age: 41 },
  { name: 'Dave', age: 19 },   // 100 docs …
]);`,
  viewBox: [1000, 480],
  nodes: [
    n("caller", "insertMany([…100 docs])", 24, 24, "call", "user code"),
    n("batch", "Transaction covers all", 250, 24, "process", "one atomic unit", 200),
    n("wal", "{txnId}.wal.jsonl", 500, 24, "store", "whole batch logged", 200),
    n("docs", "N × .axiodb files", 750, 24, "io", "temp + atomic rename each", 200),
    n("idxrw", "One index rewrite", 250, 150, "memory", "read+update+write once", 200),
    n("idxdisk", "indexes/*.jsonl", 500, 150, "store", "single serialize/write", 200),
    n("cacheinv", "invalidateByCollection", 750, 150, "memory", "evict stale lists", 200),
    n("done", "Success { total, id[] }", 500, 290, "data", "commit result", 210),
  ],
  edges: [
    e("caller-batch", "caller", "batch"),
    e("batch-wal", "batch", "wal"),
    e("batch-docs", "batch", "docs"),
    e("batch-idxrw", "batch", "idxrw"),
    e("idxrw-idxdisk", "idxrw", "idxdisk"),
    e("idxrw-cacheinv", "idxrw", "cacheinv"),
    e("cacheinv-done", "cacheinv", "done"),
  ],
  steps: [
    {
      title: "Batch call",
      frames: [
        {
          nodes: ["caller", "batch"],
          edges: ["caller-batch"],
          token: { edgeId: "caller-batch", tone: "primary", label: "N docs" },
          log: [
            { text: "insertMany([...]) — array is validated element by element" },
            { text: "single Transaction stages every document", tone: "mut" },
          ],
        },
      ],
    },
    {
      title: "Log the whole batch",
      frames: [
        {
          nodes: ["wal"],
          edges: ["batch-wal"],
          token: { edgeId: "batch-wal", tone: "store", label: "append" },
          log: [
            { text: "all N docs registered in one WAL before any visible write", tone: "store" },
            { text: "crash mid-batch → full redo/undo, no partial commit", tone: "ok" },
          ],
        },
      ],
    },
    {
      title: "Per-document files",
      frames: [
        {
          nodes: ["docs"],
          edges: ["batch-docs"],
          token: { edgeId: "batch-docs", tone: "success", label: "write" },
          log: [
            { text: "each doc: temp write + atomic rename to <documentId>.axiodb", tone: "io" },
            { text: "docs are written concurrently via Promise.all" },
          ],
        },
      ],
    },
    {
      title: "Single index rewrite",
      frames: [
        {
          nodes: ["idxrw", "idxdisk"],
          edges: ["batch-idxrw", "idxrw-idxdisk"],
          token: { edgeId: "idxrw-idxdisk", tone: "store", label: "once" },
          log: [
            { text: "indexed values accumulated across ALL docs in memory", tone: "mut" },
            { text: "each index file rewritten exactly once (O(1) writes instead of O(N))", tone: "ok" },
          ],
        },
      ],
    },
    {
      title: "Invalidate + respond",
      frames: [
        {
          nodes: ["cacheinv", "done"],
          edges: ["idxrw-cacheinv", "cacheinv-done"],
          token: { edgeId: "cacheinv-done", tone: "success", label: "ok" },
          log: [
            { text: "cache scope invalidated so list queries reflect the batch", tone: "mut" },
            { text: "Success { total, id: [...] }", tone: "ok" },
          ],
        },
      ],
    },
  ],
};

/* ── 6. Index structure & dual-write ───────────────────────────────── */

const indexStructure: Scenario = {
  id: "index",
  title: "Index Structure & Dual-write",
  short: "JSONL entries, memory cache, range support",
  mode: "local",
  iconKey: "list-tree",
  description:
    "Each index lives in `indexes/{field}.jsonl` as a header line `{\"h\":1,\"f\":\"email\",\"s\":[]}` followed by one `{\"k\":value,\"v\":[fileNames]}` per distinct value. The `IndexCache` mirrors it in memory with its own 5–15m TTL and updates disk before memory for durability.",
  code: `await users.newIndex('email', 'age');
// indexes/email.jsonl     indexes/age.jsonl
// index.meta.jsonl lists both`,
  viewBox: [1000, 500],
  nodes: [
    n("col", "users.newIndex('email')", 24, 24, "call", "collection API"),
    n("im", "IndexManager.createIndex", 240, 24, "process", "create file + meta", 220),
    n("ifile", "indexes/email.jsonl", 480, 24, "store", '{"h":1,"f":"email","s":[]}', 220),
    n("imeta", "index.meta.jsonl", 760, 24, "io", "append line (O(1))", 220),
    n("ic", "IndexCache.updateIndex", 240, 150, "memory", "per-field lock chain", 220),
    n("disk", "JSONL disk write first", 480, 150, "io", "serializeIndexData", 220),
    n("mem", "In-Memory Map<field, data>", 760, 150, "memory", "refreshed TTL 5-15m", 220),
    n("sorted", "sortedValues[] range index", 480, 290, "decor", "$gt/$gte/$lt/$lte binary search", 230),
    n("auto", "documentId auto-index", 760, 290, "decor", "created at collection init", 230),
  ],
  edges: [
    e("col-im", "col", "im"),
    e("im-ifile", "im", "ifile"),
    e("im-imeta", "im", "imeta"),
    e("im-ic", "im", "ic"),
    e("ic-disk", "ic", "disk"),
    e("disk-mem", "disk", "mem"),
    e("mem-sorted", "mem", "sorted"),
    e("ifile-auto", "ifile", "auto"),
  ],
  steps: [
    {
      title: "Request an index",
      frames: [
        {
          nodes: ["col", "im"],
          edges: ["col-im"],
          token: { edgeId: "col-im", tone: "primary", label: "newIndex" },
          log: [
            { text: "users.newIndex('email') → IndexManager.createIndex" },
          ],
        },
      ],
    },
    {
      title: "Create file + register",
      frames: [
        {
          nodes: ["ifile", "imeta"],
          edges: ["im-ifile", "im-imeta"],
          token: { edgeId: "im-ifile", tone: "store", label: "create" },
          log: [
            { text: "empty index written as JSONL header line", tone: "store" },
            { text: "index.meta.jsonl gets an O(1) append — no read-modify-rewrite", tone: "store" },
          ],
        },
      ],
    },
    {
      title: "Dual-write: disk first",
      frames: [
        {
          nodes: ["ic", "disk"],
          edges: ["im-ic", "ic-disk"],
          token: { edgeId: "ic-disk", tone: "store", label: "disk" },
          log: [
            { text: "updateIndex acquires a per-field mutex", tone: "mut" },
            { text: "serializeIndexData → written to indexes/email.jsonl FIRST (durability)", tone: "store" },
          ],
        },
      ],
    },
    {
      title: "Then refresh memory",
      frames: [
        {
          nodes: ["mem"],
          edges: ["disk-mem"],
          token: { edgeId: "disk-mem", tone: "success", label: "memory" },
          log: [
            { text: "after the disk write succeeds, the in-memory Map entry is refreshed", tone: "ok" },
            { text: "queries hit memory O(1); expired entries stream back from disk" },
          ],
        },
      ],
    },
    {
      title: "Range support",
      frames: [
        {
          nodes: ["sorted"],
          edges: ["mem-sorted"],
          token: { edgeId: "mem-sorted", tone: "warning", label: "$gte/$lt" },
          log: [
            { text: "sortedValues → de-duplicated ascending numbers in header 's'", tone: "mut" },
            { text: "range queries resolve bounds by binary search: O(log U + M)", tone: "ok" },
            { text: "old indexes are lazily backfilled on the first insert/delete" },
          ],
        },
      ],
    },
  ],
};

/* ── 7. Indexed query read path ────────────────────────────────────── */

const queryIndex: Scenario = {
  id: "query-index",
  title: "Indexed Query — read path",
  short: "cache → index → file-per-doc → result",
  mode: "local",
  iconKey: "search",
  description:
    "A query builds a chainable Reader. It asks the `InMemoryCache` first (key `{path}::{query}::{limit}::{skip}::{sort}`); on a miss it resolves the index (memory or disk), narrows to candidate files, reads exactly those `.axiodb` files, applies sort/limit/skip, then stores the result back with a random 5–15m TTL.",
  code: `const result = await users
  .query({ age: { $gte: 30 } })
  .Sort({ age: -1 })
  .Limit(10)
  .exec();
console.log(result.data.documents);`,
  viewBox: [1000, 520],
  nodes: [
    n("caller", "query({age:{$gte:30}})", 20, 20, "call", "chainable API", 200),
    n("reader", "new Reader(...)", 236, 20, "process", "query→sort→limit→skip", 200),
    n("cache", "InMemoryCache.getCache", 460, 20, "memory", "path::query::limit::skip::sort", 210),
    n("hit", "cache hit → return", 720, 20, "decor", "<1 ms, disk untouched", 200),
    n("miss", "cache miss", 720, 120, "decor", "fall through to index", 200),
    n("idxlook", "ReadIndex lookup", 460, 140, "memory", "getIndex(field) memory O(1)", 210),
    n("sorted", "sortedValues range", 460, 260, "process", "$gte/$lte bounds → candidate files", 216),
    n("read", "Read .axiodb files", 220, 200, "io", "one file per candidate", 200),
    n("merge", "Merge + sort + limit", 20, 320, "process", "$in → Set O(1)", 210),
    n("setcache", "setCache(random TTL)", 236, 320, "memory", "registered in reverse index", 210),
    n("result", "Success { documents }", 460, 320, "data", "exec() output", 210),
  ],
  edges: [
    e("caller-reader", "caller", "reader"),
    e("reader-cache", "reader", "cache"),
    e("cache-hit", "cache", "hit"),
    e("cache-miss", "cache", "miss"),
    e("miss-idxlook", "miss", "idxlook"),
    e("idxlook-sorted", "idxlook", "sorted"),
    e("sorted-read", "sorted", "read"),
    e("read-merge", "read", "merge"),
    e("merge-setcache", "merge", "setcache"),
    e("setcache-result", "setcache", "result"),
  ],
  steps: [
    {
      title: "Build the Reader",
      frames: [
        {
          nodes: ["caller", "reader"],
          edges: ["caller-reader"],
          token: { edgeId: "caller-reader", tone: "primary", label: "query" },
          log: [
            { text: "users.query({age:{$gte:30}}).Sort({age:-1}).Limit(10)" },
            { text: "new Reader(name, path, query, sharedCache)", tone: "mut" },
          ],
        },
      ],
    },
    {
      title: "Cache lookup first",
      frames: [
        {
          nodes: ["cache"],
          edges: ["reader-cache"],
          token: { edgeId: "reader-cache", tone: "net", label: "getCache" },
          log: [
            { text: "key format: {collectionPath}::{query}::{limit}::{skip}::{sort}", tone: "mut" },
            { text: "getCache validates expiresAt (O(1)) and can lazy-evict", tone: "ok" },
          ],
        },
      ],
    },
    {
      title: "Cache hit",
      frames: [
        {
          nodes: ["hit", "result"],
          edges: ["cache-hit"],
          token: { edgeId: "cache-hit", tone: "success", label: "hit" },
          log: [
            { text: "same query re-run → in-memory value returned < 1 ms", tone: "ok" },
            { text: "identical searches skip disk AND index entirely" },
          ],
        },
      ],
    },
    {
      title: "Cache miss → index",
      frames: [
        {
          nodes: ["miss", "idxlook"],
          edges: ["miss-idxlook"],
          token: { edgeId: "miss-idxlook", tone: "warning", label: "miss" },
          log: [
            { text: "entry absent or expired → fall through to the index", tone: "mut" },
            { text: "IndexCache.getIndex('age') — memory Map; expiry → stream from disk", tone: "ok" },
          ],
        },
      ],
    },
    {
      title: "Range resolution",
      frames: [
        {
          nodes: ["sorted"],
          edges: ["idxlook-sorted"],
          token: { edgeId: "idxlook-sorted", tone: "net", label: "bounds" },
          log: [
            { text: "$gte/$lte bounds locate the sortedValues slice by binary search", tone: "mut" },
            { text: "candidate files = union of values in that slice", tone: "ok" },
          ],
        },
      ],
    },
    {
      title: "File reads",
      frames: [
        {
          nodes: ["read", "merge"],
          edges: ["sorted-read", "read-merge"],
          token: { edgeId: "read-merge", tone: "store", label: "load" },
          log: [
            { text: "each candidate = one .axiodb JSON file read", tone: "io" },
            { text: "$in builds a Set for O(1) membership checks", tone: "ok" },
            { text: "results merged, sorted, limit/skip applied" },
          ],
        },
      ],
    },
    {
      title: "Cache the result",
      frames: [
        {
          nodes: ["setcache", "result"],
          edges: ["merge-setcache", "setcache-result"],
          token: { edgeId: "setcache-result", tone: "success", label: "docs" },
          log: [
            { text: "setCache(key, docs, collectionPath) — random TTL 5-15m", tone: "mut" },
            { text: "docs registered in the reverse document index for targeted eviction", tone: "ok" },
            { text: "exec() resolves Success { documents }", tone: "ok" },
          ],
        },
      ],
    },
  ],
};

/* ── 8. Cache TTL & invalidation ───────────────────────────────────── */

const cacheFlow: Scenario = {
  id: "cache",
  title: "Cache — TTL & Invalidation",
  short: "random TTL, reverse index, targeted eviction",
  mode: "local",
  iconKey: "zap",
  description:
    "The `InMemoryCache` assigns every entry its own random TTL (5–15 min) so synchronized mass-expiration never happens. A reverse document index (`{path}::{docId}` → cache keys) lets updates/delete evict only the entries that actually contained the changed document.",
  code: `// inside InMemoryCache
const ttl = Math.floor(Math.random()*(maxTTL-minTTL+1))+minTTL;
entry = { value, registeredAt, ttl, expiresAt: now + ttl };
await cache.invalidateByDocuments(path, ids);  // targeted eviction`,
  viewBox: [1000, 500],
  nodes: [
    n("mut", "update({...}) / delete()", 24, 30, "call", "mutation arrives"),
    n("op", "Write operation", 260, 30, "process", "atomic doc rewrite", 200),
    n("docidx", "Reverse doc index", 510, 30, "memory", "{path}::{docId} → cache keys", 210),
    n("evict", "invalidateByDocument(s)", 750, 30, "memory", "evict ONLY affected entries", 220),
    n("sweep", "autoResetCache sweep", 510, 180, "process", "unref'd housekeeping interval", 210),
    n("ttl", "CacheEntry TTL", 260, 180, "decor", "random expiresAt 5-15m", 200),
    n("lazy", "Lazy eviction on read", 24, 180, "decor", "expired → delete + miss", 200),
    n("collect", "invalidateByCollection", 750, 180, "memory", "insert → stale list evicted", 220),
  ],
  edges: [
    e("mut-op", "mut", "op"),
    e("op-docidx", "op", "docidx"),
    e("docidx-evict", "docidx", "evict"),
    e("sweep-ttl", "sweep", "ttl"),
    e("ttl-lazy", "ttl", "lazy"),
    e("op-collect", "op", "collect"),
  ],
  steps: [
    {
      title: "Write arrives",
      frames: [
        {
          nodes: ["mut", "op"],
          edges: ["mut-op"],
          token: { edgeId: "mut-op", tone: "primary", label: "write" },
          log: [
            { text: "update/delete rewrites the document atomically first" },
          ],
        },
      ],
    },
    {
      title: "Reverse-document lookup",
      frames: [
        {
          nodes: ["docidx"],
          edges: ["op-docidx"],
          token: { edgeId: "op-docidx", tone: "mut", label: "docId" },
          log: [
            { text: "documentIndex: 'users::<docId>' → Set of cache keys", tone: "mut" },
            { text: "built at setCache time — O(1) targeted eviction later", tone: "ok" },
          ],
        },
      ],
    },
    {
      title: "Targeted evasion",
      frames: [
        {
          nodes: ["evict"],
          edges: ["docidx-evict"],
          token: { edgeId: "docidx-evict", tone: "success", label: "evict" },
          log: [
            { text: "only entries that CONTAINED this document are evicted", tone: "ok" },
            { text: "cached results for unrelated documents stay warm" },
          ],
        },
      ],
    },
    {
      title: "Random TTL",
      frames: [
        {
          nodes: ["ttl", "sweep"],
          edges: ["sweep-ttl"],
          token: { edgeId: "sweep-ttl", tone: "warning", label: "5–15m" },
          log: [
            { text: "Math.floor(Math.random()*(max-min+1))+min → per-entry TTL", tone: "mut" },
            { text: "prevents cache stampede from synchronized expiry", tone: "ok" },
            { text: "auto sweep runs on an unref'd interval — never blocks exit", tone: "ok" },
          ],
        },
      ],
    },
    {
      title: "Lazy + collection eviction",
      frames: [
        {
          nodes: ["lazy", "collect"],
          edges: ["ttl-lazy", "op-collect"],
          token: { edgeId: "op-collect", tone: "mut", label: "prefix" },
          log: [
            { text: "reading an expired entry lazily evicts it and misses", tone: "mut" },
            { text: "inserts use invalidateByCollection — a list could now be missing the row", tone: "warn" },
            { text: "staleness bounded by the 5–15 min TTL (eventual consistency)" },
          ],
        },
      ],
    },
  ],
};

/* ── 9. Update & Delete ────────────────────────────────────────────── */

const updateDelete: Scenario = {
  id: "update-delete",
  title: "Update & Delete",
  short: "atomic rewrite, index sync, cache eviction",
  mode: "local",
  iconKey: "pencil",
  description:
    "Updates rewrite a document via temp-file + atomic rename (never a transient missing-file window) and maintain every affected index. Deletes remove the file and drop its values from the index entries. Both run through a transaction and evict exactly the affected cache entries.",
  code: `await users.update({ age: { $lt: 20 } }, { $set: { status: 'minor' } });
await users.delete({ status: 'minor' });`,
  viewBox: [1000, 480],
  nodes: [
    n("caller", "update/delete query", 24, 24, "call", "chainable operation"),
    n("op", "Update/Delete operation", 250, 24, "process", "per-collection", 210),
    n("find", "Locate matching docs", 480, 24, "process", "index or scan", 210),
    n("read", "Read doc .axiodb", 24, 130, "io", "one file per match", 210),
    n("atomic", "tmp + rename rewrite", 250, 130, "io", "or FileManager.DeleteFile", 210),
    n("idx", "Maintain index entries", 480, 130, "memory", "value→[files] add/remove", 220),
    n("sorted", "sortedValues backfill", 720, 130, "decor", "legacy indexes", 220),
    n("cache", "Cache eviction", 250, 270, "memory", "invalidateByDocument(s)", 210),
    n("resp", "Success { modified }", 480, 270, "data", "total affected", 210),
  ],
  edges: [
    e("caller-op", "caller", "op"),
    e("op-find", "op", "find"),
    e("find-read", "find", "read"),
    e("read-atomic", "read", "atomic"),
    e("atomic-idx", "atomic", "idx"),
    e("idx-sorted", "idx", "sorted"),
    e("idx-cache", "idx", "cache"),
    e("cache-resp", "cache", "resp"),
  ],
  steps: [
    {
      title: "Dispatch",
      frames: [
        {
          nodes: ["caller", "op", "find"],
          edges: ["caller-op", "op-find"],
          token: { edgeId: "op-find", tone: "primary", label: "locate" },
          log: [
            { text: "update(query, {$set}) or delete(query) instantiated", tone: "mut" },
            { text: "matching docs resolved via index first, else scan" },
          ],
        },
      ],
    },
    {
      title: "Read then rewrite/delete",
      frames: [
        {
          nodes: ["read", "atomic"],
          edges: ["find-read", "read-atomic"],
          token: { edgeId: "read-atomic", tone: "warning", label: "write" },
          log: [
            { text: "each match read from its .axiodb file", tone: "io" },
            { text: "UPDATE: temp write + atomic rename — never a missing-file gap", tone: "ok" },
            { text: "DELETE: FileManager.DeleteFile + registry cleanup", tone: "mut" },
          ],
        },
      ],
    },
    {
      title: "Index maintenance",
      frames: [
        {
          nodes: ["idx", "sorted"],
          edges: ["atomic-idx", "idx-sorted"],
          token: { edgeId: "idx-sorted", tone: "store", label: "sync" },
          log: [
            { text: "index entries updated in memory + JSONL (dual-write)", tone: "store" },
            { text: "rename moves to new value bucket; delete removes; legacy sortedValues backfilled", tone: "ok" },
          ],
        },
      ],
    },
    {
      title: "Cache + response",
      frames: [
        {
          nodes: ["cache", "resp"],
          edges: ["idx-cache", "cache-resp"],
          token: { edgeId: "cache-resp", tone: "success", label: "ok" },
          log: [
            { text: "affected documents evicted from cache by reverse index", tone: "mut" },
            { text: "Success { message, total/modified }", tone: "ok" },
          ],
        },
      ],
    },
  ],
};

/* ── 10. Transactions & WAL ────────────────────────────────────────── */

const transactions: Scenario = {
  id: "txn",
  title: "Transactions & WAL",
  short: "write-ahead, commit, rollback, crash recovery",
  mode: "local",
  iconKey: "shield-check",
  description:
    "Transactions append every change to a WAL (`<txnId>.wal.jsonl`, batched ~10 entries / 50 ms with checksums) before touching documents, then apply changes atomically and truncate the WAL on commit. A crash replays `txn-meta.jsonl` on startup to redo or undo any interrupted transaction.",
  code: `const txn = users.beginTransaction();
txn.insert({ name: 'Eve', age: 37 });
txn.update({ name: 'Eve' }, { $set: { city: 'NY' } });
await txn.commit();         // atomic apply, WAL truncated
await txn.rollback();       // undo via WAL, nothing persists`,
  viewBox: [1000, 520],
  nodes: [
    n("begin", "beginTransaction()", 24, 24, "call", "collection API"),
    n("txn", "Transaction session", 250, 24, "process", "staged in-memory ops", 200),
    n("wal", "<txnId>.wal.jsonl", 480, 24, "store", "append + checksums", 210),
    n("reg", "txn-meta.jsonl", 720, 24, "store", "in-flight registry", 210),
    n("batch", "Batch flush 10 @ 50ms", 720, 140, "process", "flushPendingEntries", 210),
    n("apply", "applyChanges (atomic)", 480, 140, "io", "per-file temp+rename", 210),
    n("commit", "COMMIT → WAL cleared", 250, 140, "process", "commit finish", 210),
    n("rollback", "ROLLBACK → undo", 24, 140, "process", "inverse from WAL", 210),
    n("recover", "Crash: recoverTransactions", 480, 300, "decor", "redo or undo on init", 230),
    n("locks", "LockManager", 720, 300, "memory", "exclusive per-collection", 210),
  ],
  edges: [
    e("begin-txn", "begin", "txn"),
    e("txn-wal", "txn", "wal"),
    e("txn-reg", "txn", "reg"),
    e("wal-batch", "wal", "batch"),
    e("txn-apply", "txn", "apply"),
    e("apply-commit", "apply", "commit"),
    e("txn-rollback", "txn", "rollback"),
    e("reg-recover", "reg", "recover"),
    e("recover-locks", "recover", "locks"),
  ],
  steps: [
    {
      title: "Begin",
      frames: [
        {
          nodes: ["begin", "txn"],
          edges: ["begin-txn"],
          token: { edgeId: "begin-txn", tone: "primary", label: "begin" },
          log: [
            { text: "users.beginTransaction() → new Transaction(path, cache)", tone: "mut" },
            { text: "operations are staged: files untouched until commit" },
          ],
        },
      ],
    },
    {
      title: "Write-ahead log",
      frames: [
        {
          nodes: ["wal", "reg"],
          edges: ["txn-wal", "txn-reg"],
          token: { edgeId: "txn-wal", tone: "store", label: "append" },
          log: [
            { text: "Transaction registered in txn-meta.jsonl", tone: "store" },
            { text: "WAL opened <txnId>.wal.jsonl, entries appended with checksum", tone: "store" },
            { text: "durability BEFORE visibility — crash-safe by design", tone: "ok" },
          ],
        },
      ],
    },
    {
      title: "Batch flush",
      frames: [
        {
          nodes: ["batch"],
          edges: ["wal-batch"],
          token: { edgeId: "wal-batch", tone: "store", label: "flush" },
          log: [
            { text: "queueEntry batches writes; flush on ~10 entries or 50 ms idle", tone: "mut" },
            { text: "checksum per entry validates integrity during recovery" },
          ],
        },
      ],
    },
    {
      title: "Apply + commit",
      frames: [
        {
          nodes: ["apply", "commit"],
          edges: ["txn-apply", "apply-commit"],
          token: { edgeId: "apply-commit", tone: "success", label: "commit" },
          log: [
            { text: "applyChanges writes each document atomically (temp + rename)", tone: "ok" },
            { text: "indexes + cache updated; WAL truncated, registry entry removed", tone: "ok" },
          ],
        },
      ],
    },
    {
      title: "Rollback branch",
      frames: [
        {
          nodes: ["rollback"],
          edges: ["txn-rollback"],
          token: { edgeId: "txn-rollback", tone: "warning", label: "undo" },
          log: [
            { text: "rollback() rebuilds the inverse from logged WAL entries", tone: "mut" },
            { text: "staged changes discarded — nothing persisted", tone: "ok" },
          ],
        },
      ],
    },
    {
      title: "Crash recovery",
      frames: [
        {
          nodes: ["recover", "locks"],
          edges: ["reg-recover", "recover-locks"],
          token: { edgeId: "reg-recover", tone: "warning", label: "replay" },
          log: [
            { text: "startup: recoverTransactions(path) reads txn-meta.jsonl", tone: "warn" },
            { text: "committed-but-unfinished → redo; failed → undo", tone: "ok" },
            { text: "LockManager keeps concurrent writers exclusive" },
          ],
        },
      ],
    },
  ],
};

/* ── 11. Sessions & Savepoints ─────────────────────────────────────── */

const sessions: Scenario = {
  id: "session",
  title: "Sessions & Savepoints",
  short: "withTransaction, retry, SAVEPOINT tree",
  mode: "local",
  iconKey: "book-open",
  description:
    "Sessions wrap a MongoDB-style transaction with automatic retry and timeouts. Within a transaction you can set savepoints and roll back to them (undoing only the later work), then release them, keeping the rest of the transaction intact.",
  code: `const session = users.startSession();
await session.withTransaction(async (txn) => {
  await txn.insert(user);
  await txn.beginTransaction();
  // txn.savepoint('sp');
  // txn.rollbackToSavepoint('sp');
  // txn.releaseSavepoint('sp');
});
await session.endSession();`,
  viewBox: [1000, 480],
  nodes: [
    n("start", "startSession()", 24, 24, "call", "collection API"),
    n("sess", "Session", 210, 24, "process", "retry + timeout", 180),
    n("cb", "withTransaction(fn)", 24, 160, "process", "auto-commit on success", 190),
    n("insert", "txn.insert(A)", 220, 160, "process", "staged", 160),
    n("update", "txn.update(B)", 410, 160, "process", "staged", 160),
    n("sp", "SAVEPOINT sp", 610, 160, "process", "mark a point in time", 170),
    n("more", "later writes", 810, 160, "process", "after the savepoint", 160),
    n("back", "ROLLBACK TO sp", 610, 300, "decor", "later writes undone", 190),
    n("apply", "Atomic apply", 220, 300, "io", "commit or retry", 180),
    n("done", "endSession()", 410, 300, "decor", "resources released", 190),
  ],
  edges: [
    e("start-sess", "start", "sess"),
    e("sess-cb", "sess", "cb"),
    e("cb-insert", "cb", "insert"),
    e("insert-update", "insert", "update"),
    e("update-sp", "update", "sp"),
    e("sp-more", "sp", "more"),
    e("sp-back", "sp", "back"),
    e("more-apply", "more", "apply"),
    e("apply-done", "apply", "done"),
  ],
  steps: [
    {
      title: "Start a session",
      frames: [
        {
          nodes: ["start", "sess"],
          edges: ["start-sess"],
          token: { edgeId: "start-sess", tone: "primary", label: "session" },
          log: [
            { text: "users.startSession(options) — Session(path, options, cache)", tone: "mut" },
            { text: "supports automatic retry + timeouts" },
          ],
        },
      ],
    },
    {
      title: "withTransaction",
      frames: [
        {
          nodes: ["cb", "insert", "update"],
          edges: ["sess-cb", "cb-insert", "insert-update"],
          token: { edgeId: "cb-insert", tone: "success", label: "ops" },
          log: [
            { text: "callback collects txn.insert / txn.update / txn.delete", tone: "mut" },
            { text: "ops are staged in memory, nothing written yet" },
          ],
        },
      ],
    },
    {
      title: "Savepoint",
      frames: [
        {
          nodes: ["sp", "more"],
          edges: ["update-sp", "sp-more"],
          token: { edgeId: "sp-more", tone: "net", label: "sp" },
          log: [
            { text: "transaction.savepoint('sp') marks a point in time", tone: "mut" },
            { text: "writes after the mark are trackable for partial undo" },
          ],
        },
      ],
    },
    {
      title: "Rollback to savepoint",
      frames: [
        {
          nodes: ["back"],
          edges: ["sp-back"],
          token: { edgeId: "sp-back", tone: "warning", label: "undo" },
          log: [
            { text: "rollbackToSavepoint('sp') undoes ONLY the later writes", tone: "mut" },
            { text: "earlier staged operations survive to be committed" },
          ],
        },
      ],
    },
    {
      title: "Auto-commit + end",
      frames: [
        {
          nodes: ["apply", "done"],
          edges: ["more-apply", "apply-done"],
          token: { edgeId: "apply-done", tone: "success", label: "commit" },
          log: [
            { text: "callback resolves → transaction applies atomically", tone: "ok" },
            { text: "failure → rollback + automatic retry", tone: "warn" },
            { text: "endSession() releases resources" },
          ],
        },
      ],
    },
  ],
};

/* ── 12. Aggregation pipeline ──────────────────────────────────────── */

const aggregation: Scenario = {
  id: "aggregate",
  title: "Aggregation Pipeline",
  short: "documents flow stage by stage",
  mode: "local",
  iconKey: "filter",
  description:
    "Collections expose MongoDB-style `aggregate()`. Every document passes through the pipeline stages in order — `$match` filters, `$project` reshapes, `$group` runs accumulators, then `$sort` / `$limit` — with registered operators and accumulators driving each stage.",
  code: `const stats = await users.aggregate([
  { $match: { active: true } },
  { $group: { _id: '$city', count: { $sum: 1 }, avgAge: { $avg: '$age' } } },
  { $sort: { count: -1 } },
  { $limit: 5 },       // 6th stage available: $lookup…
]).exec();`,
  viewBox: [1000, 440],
  nodes: [
    n("coll", "users.aggregate(stages)", 20, 30, "call", "collection API"),
    n("input", "Docs (in memory)", 240, 30, "data", "N documents", 200),
    n("match", "$match · filter", 470, 30, "process", "drops non-matches", 200),
    n("proj", "$project · shape", 700, 30, "process", "reshape each doc", 200),
    n("group", "$group · aggregate", 470, 150, "process", "accumulators", 200),
    n("acc", "accumulator ops", 240, 150, "decor", "sum · avg · first · max", 200),
    n("sort", "$sort · order", 700, 150, "process", "SortData.utils", 200),
    n("limit", "$limit · paginate", 470, 270, "process", "limit", 200),
    n("comp", "OperatorRegistry", 700, 270, "memory", "stage handlers registry", 210),
    n("out", "exec() → result", 240, 270, "data", "final documents", 200),
  ],
  edges: [
    e("coll-input", "coll", "input"),
    e("input-match", "input", "match"),
    e("match-proj", "match", "proj"),
    e("proj-group", "proj", "group"),
    e("group-sort", "group", "sort"),
    e("group-acc", "group", "acc"),
    e("sort-limit", "sort", "limit"),
    e("limit-comp", "limit", "comp"),
    e("limit-out", "limit", "out"),
  ],
  steps: [
    {
      title: "Call & dispatch",
      frames: [
        {
          nodes: ["coll", "input"],
          edges: ["coll-input"],
          token: { edgeId: "coll-input", tone: "primary", label: "docs" },
          log: [
            { text: "users.aggregate([$match, $group, $sort, $limit])" },
            { text: "pipeline steps validated as an array of objects" },
          ],
        },
      ],
    },
    {
      title: "$match (filter)",
      frames: [
        {
          nodes: ["match"],
          edges: ["input-match"],
          token: { edgeId: "input-match", tone: "success", label: "filter" },
          log: [
            { text: "documents not matching the filter are dropped", tone: "mut" },
            { text: "reuses the same query-evaluation engine" },
          ],
        },
      ],
    },
    {
      title: "$project (reshape)",
      frames: [
        {
          nodes: ["proj"],
          edges: ["match-proj"],
          token: { edgeId: "match-proj", tone: "net", label: "shape" },
          log: [
            { text: "$project re-shapes fields of the surviving documents", tone: "mut" },
          ],
        },
      ],
    },
    {
      title: "$group (accumulators)",
      frames: [
        {
          nodes: ["group", "acc"],
          edges: ["proj-group", "group-acc"],
          token: { edgeId: "group-acc", tone: "store", label: "$sum/$avg" },
          log: [
            { text: "documents bucketed by _id; accumulators aggregate", tone: "mut" },
            { text: "sum · avg · first · last · min · max · addToSet", tone: "ok" },
          ],
        },
      ],
    },
    {
      title: "$sort + $limit",
      frames: [
        {
          nodes: ["sort", "limit"],
          edges: ["group-sort", "sort-limit"],
          token: { edgeId: "sort-limit", tone: "warning", label: "order" },
          log: [
            { text: "$sort orders groups; $limit caps output", tone: "mut" },
          ],
        },
      ],
    },
    {
      title: "Registry + result",
      frames: [
        {
          nodes: ["comp", "out"],
          edges: ["limit-comp", "limit-out"],
          token: { edgeId: "limit-out", tone: "success", label: "exec" },
          log: [
            { text: "OperatorRegistry dispatches each stage handler", tone: "ok" },
            { text: "exec() resolves the final document set", tone: "ok" },
          ],
        },
      ],
    },
  ],
};

/* ── 13. Worker threads ────────────────────────────────────────────── */

const workers: Scenario = {
  id: "worker",
  title: "Worker Threads",
  short: "parallel load/parse, off-main search",
  mode: "local",
  iconKey: "cpu",
  description:
    "Worker threads keep heavy file work off the main thread. `WorkerForDataLoad.engine` parses documents in parallel across cores while the main thread merges results and updates indexes; `WorkerForSearch.engine` runs searches away from the event loop.",
  code: `// ReaderWithWorker / BufferLoaderWithWorker.utils
// main thread → queue chunks → worker parse → merge + index
// WorkerForDataLoad.engine · WorkerForSearch.engine`,
  viewBox: [1000, 460],
  nodes: [
    n("main", "Main thread", 30, 30, "process", "Reader / BufferLoader", 190),
    n("queue", "File queue (chunks)", 280, 30, "memory", "buffered slices", 190),
    n("w1", "Worker #1", 250, 150, "worker", "parse JSON", 170),
    n("w2", "Worker #2", 470, 150, "worker", "parse JSON", 170),
    n("wn", "Worker #N", 690, 150, "worker", "multi-core", 170),
    n("parse", "WorkerForDataLoad", 470, 290, "worker", "processFiles()", 210),
    n("merge", "Merge results", 250, 290, "process", "main thread collects", 190),
    n("idxw", "Index + cache", 690, 290, "store", "dual-write", 190),
    n("search", "WorkerForSearch", 870, 290, "worker", "off-main search", 210),
  ],
  edges: [
    e("main-queue", "main", "queue"),
    e("queue-w1", "queue", "w1"),
    e("queue-w2", "queue", "w2"),
    e("queue-wn", "queue", "wn"),
    e("w1-parse", "w1", "parse"),
    e("w2-parse", "w2", "parse"),
    e("wn-parse", "wn", "parse"),
    e("parse-merge", "parse", "merge"),
    e("merge-idxw", "merge", "idxw"),
    e("parse-search", "parse", "search"),
  ],
  steps: [
    {
      title: "Kick off",
      frames: [
        {
          nodes: ["main", "queue"],
          edges: ["main-queue"],
          token: { edgeId: "main-queue", tone: "primary", label: "chunks" },
          log: [
            { text: "ReaderWithWorker slices the workload into buffered chunks", tone: "mut" },
          ],
        },
      ],
    },
    {
      title: "Fan out to workers",
      frames: [
        {
          nodes: ["w1", "w2", "wn"],
          edges: ["queue-w1", "queue-w2", "queue-wn"],
          token: { edgeId: "queue-w2", tone: "net", label: "fan-out" },
          log: [
            { text: "chunks handed to N worker threads", tone: "ok" },
            { text: "parsing runs in parallel across CPU cores" },
          ],
        },
      ],
    },
    {
      title: "Parallel parse",
      frames: [
        {
          nodes: ["parse"],
          edges: ["w1-parse", "w2-parse", "wn-parse"],
          token: { edgeId: "parse-merge", tone: "store", label: "objects" },
          log: [
            { text: "WorkerForDataLoad.engine processFiles() → plain objects", tone: "ok" },
            { text: "main thread stays responsive during the load" },
          ],
        },
      ],
    },
    {
      title: "Merge on main",
      frames: [
        {
          nodes: ["merge", "idxw"],
          edges: ["parse-merge", "merge-idxw"],
          token: { edgeId: "merge-idxw", tone: "success", label: "merge" },
          log: [
            { text: "main thread merges parallel results immediately as they land", tone: "mut" },
            { text: "merged docs feed index + cache dual-write", tone: "ok" },
          ],
        },
      ],
    },
    {
      title: "Off-main search",
      frames: [
        {
          nodes: ["search"],
          edges: ["parse-search"],
          token: { edgeId: "parse-search", tone: "warning", label: "search" },
          log: [
            { text: "WorkerForSearch.engine keeps heavy scans off the event loop", tone: "mut" },
          ],
        },
      ],
    },
  ],
};

export const localScenarios: Scenario[] = [
  storage,
  createDb,
  createCollection,
  insert,
  insertMany,
  indexStructure,
  queryIndex,
  cacheFlow,
  updateDelete,
  transactions,
  sessions,
  aggregation,
  workers,
];