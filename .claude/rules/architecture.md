# Architecture

## Directory Structure
```
source/
├── config/              # DB.ts (main exports), Keys/, Interfaces/
├── Services/            # Core operations
│   ├── Indexation.operation.ts    # AxioDB main class (singleton)
│   ├── Database/                  # Database ops
│   ├── Collection/                # Collection ops
│   ├── CRUD Operation/            # Create, Reader, Update, Delete
│   ├── Index/                     # Index management (cache + disk)
│   ├── Aggregation/               # MongoDB-style pipelines
│   └── Transaction/               # ACID, WAL, sessions
├── engine/Filesystem/   # FileManager, FolderManager (low-level)
├── server/              # HTTP GUI (Fastify, port 27018)
├── tcp/                 # TCP server (AxioDBCloud, port 27019)
├── client/              # AxioDBCloud TCP client + Proxies
├── Helper/              # Converter, Crypto, Response
├── Memory/              # InMemoryCache
└── utility/             # General utils

lib/                     # Compiled output (git-ignored)
Test/modules/            # crud.test.js, transaction.test.js, read.test.js
Document/                # React docs site
```

## Key Patterns

### Singleton
```typescript
export class AxioDB {
  private static _instance: AxioDB;
  constructor() {
    if (AxioDB._instance) throw new Error("Only one instance allowed");
    AxioDB._instance = this;
  }
}
```
**Implication**: Tests must run in separate processes.

### File Structure
- Database: `{RootPath}/{DatabaseName}/`
- Collection: `{DatabasePath}/{CollectionName}/`
- Document: `{CollectionPath}/{documentId}.axiodb`
- Index: `{CollectionPath}/indexes/{indexName}.json`

### Dual-Write (Indexes)
- Write to memory (speed) + disk (durability)
- Cold start: reload from disk on restart

### Chainable Query API
```typescript
collection.query({ age: { $gt: 25 } })
  .Limit(10).Skip(5).Sort({ age: -1 }).exec();
```

## Core Components

- **AxioDB**: Root singleton, manages DB map, starts GUI/TCP
- **Database**: Manages collections map, methods: createCollection, deleteCollection
- **Collection**: Document collection, encryption support, methods: insert, query, update, delete, aggregate
- **CRUD Ops**: Reader, Create, Update, Delete in `Services/CRUD Operation/`
- **Index System**: IndexCache (memory, TTL 5-15min), InsertIndex, ReadIndex, DeleteIndex
- **Transactions**: Session, Transaction, WAL, LockManager, TransactionRegistry
- **Cache**: Random TTL, selective invalidation, collection-scoped keys

## Data Flow Examples

**Insert**: Collection → Create.operation → FileManager (disk) → InsertIndex (memory+disk) → Cache invalidation → Response

**Query**: Collection → Reader.operation → Check cache → Read disk (if miss) → Filter/sort/limit → Update cache → Response

**Transaction**: startSession → withTransaction → WAL entry → operations → commit (apply WAL) | rollback (revert)

## Module Organization

- **Feature-based**: All DB ops in `Services/Database/`, all Collection ops in `Services/Collection/`
- **Type-based**: All helpers in `Helper/`, all file ops in `engine/Filesystem/`
- **Operation-based**: All index ops in `Services/Index/`, all CRUD in `Services/CRUD Operation/`

## Performance Optimizations
1. InMemoryCache: Sub-ms lookups
2. Worker Threads: Parallel reads
3. File-per-document: O(1) access by ID
4. Index cache: Random TTL prevents stampede
5. Lazy loading: Load only when needed
6. Two-pointer search: Efficient ranges

## When Adding Features
- New service → `Services/{FeatureName}/`
- New helper → `Helper/{feature}.helper.ts`
- New engine op → `engine/{category}/`
- New API endpoint → `server/router/` + `server/controller/`
- New TCP command → `tcp/handler/`
- New interface → `config/Interfaces/{category}/`

Keep modules cohesive - one responsibility per file.
