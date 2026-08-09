# Architecture

## Directory Structure
```
source/
├── config/              DB.ts (main exports), Keys/, Interfaces/
├── Services/            Indexation.operation.ts (AxioDB singleton), Database/, Collection/,
│                        CRUD Operation/, Index/, Aggregation/, Transaction/
├── engine/Filesystem/   FileManager, FolderManager (low-level)
├── server/              HTTP GUI + REST API (Fastify, 27018)
├── tcp/                 TCP server (AxioDBCloud, 27019)
├── client/              AxioDBCloud TCP client + Proxies
├── Helper/              Converter, Response, PathSanitizer
├── Memory/              InMemoryCache
└── utility/             General utils

lib/                     Compiled output (git-ignored)
Test/modules/            Test suites (separate processes)
Document/                React docs site
```

## Key Patterns

**Singleton** - `AxioDB` throws on a second construction (`Only one instance allowed`).
*Implication*: tests must run in separate processes.

**Dual-write (indexes)** - memory (speed) + disk (durability); reload from disk on cold start.

**Chainable query API** - nothing runs until the terminal call:
```typescript
collection.query({ age: { $gt: 25 } }).Limit(10).Skip(5).Sort({ age: -1 }).exec();
```

## On-Disk Layout

- Database: `{RootPath}/{DatabaseName}/`
- Collection registry: `{DatabasePath}/collection.meta.jsonl`
- Collection: `{DatabasePath}/{CollectionName}/`
- Document: `{CollectionPath}/{documentId}.axiodb`
- Index: `{CollectionPath}/indexes/{indexName}.jsonl`
- Index registry: `{CollectionPath}/indexes/index.meta.jsonl`
- Transaction registry: `{CollectionPath}/.transactions/txn-meta.jsonl`
- WAL: `{CollectionPath}/.transactions/{transactionId}.wal.jsonl`

Documents are the only non-JSONL files. Every registry and log is append-only (one JSON object per
line), folded to current state on read with last-line-wins per key, and truncated when nothing is
left to track. Filenames live in `General` in `source/config/Keys/Keys.ts` - never hardcode them.
WAL files keep the `.wal.jsonl` suffix because recovery scans `.transactions/` by suffix, and a
bare `.jsonl` would also match `txn-meta.jsonl`.

## Core Components

- **AxioDB** - root singleton, manages the DB map, starts GUI/TCP
- **Database** - manages the collections map; `createCollection`, `deleteCollection`
- **Collection** - `insert`, `query`, `update`, `delete`, `aggregate`
- **CRUD Ops** - Reader, Create, Update, Delete in `Services/CRUD Operation/`
- **Index System** - IndexCache (memory, 5-15 min random TTL), InsertIndex, ReadIndex, DeleteIndex
- **Transactions** - Session, Transaction, WAL, LockManager, TransactionRegistry
- **Cache** - random TTL, selective invalidation, collection-scoped keys

## Data Flow

- **Insert**: Collection → Create.operation → FileManager (disk) → InsertIndex (memory + disk) →
  cache invalidation → response
- **Query**: Collection → Reader.operation → cache check → disk read on miss → filter/sort/limit →
  cache update → response
- **Transaction**: startSession → withTransaction → WAL entry → operations →
  commit (apply WAL) | rollback (revert)

## Performance Levers

InMemoryCache (sub-ms lookups) · Worker Threads (parallel reads) · file-per-document (O(1) by ID) ·
index cache with random TTL (no stampede) · lazy loading.

## Where New Code Goes

New service → `Services/{FeatureName}/` · helper → `Helper/{feature}.helper.ts` · engine op →
`engine/{category}/` · API endpoint → `server/router/` + `server/controller/` · TCP command →
`tcp/handler/` · interface → `config/Interfaces/{category}/`.

Organization is feature-based within `Services/`, type-based elsewhere (`Helper/`,
`engine/Filesystem/`). Keep modules cohesive - one responsibility per file.
