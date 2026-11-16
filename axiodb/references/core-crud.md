# AxioDB Core CRUD & Query Operations

<initialization>
## 1. Engine Initialization

```typescript
import { AxioDB } from "axiodb";

// Instantiate singleton database engine
const db = new AxioDB({
  RootName: "AppDB",       // Root storage folder name (default: "AxioDB")
  CustomPath: "./data",    // Directory for disk persistence (default: current dir)
  Cache: true,             // Enable in-memory cache layer (default: true)
  minTTL: 5,               // Cache minimum TTL jitter in minutes (default: 5)
  maxTTL: 15,              // Cache maximum TTL jitter in minutes (default: 15)
});

// Create database and collection
const database = await db.createDB("production");
const users = await database.createCollection("users");
```
</initialization>

<insert_operations>
## 2. Insert Operations

```typescript
// Insert single document (auto-generates documentId)
const singleResult = await users.insert({
  name: "Sarah Chen",
  email: "sarah@example.com",
  role: "engineer",
  age: 29,
  skills: ["TypeScript", "Distributed Systems"],
  active: true,
});

// Insert multiple documents atomically
const batchResult = await users.insertMany([
  { name: "Marcus Brody", role: "lead", age: 38, active: true },
  { name: "Elena Rostova", role: "designer", age: 31, active: false },
]);
```
</insert_operations>

<query_and_filtering>
## 3. Querying & Filter Operators

AxioDB's `Reader` chain supports rich MongoDB-style evaluation and comparison filters:

```typescript
// Query with compound comparison and regex
const results = await users
  .query({
    role: { $in: ["engineer", "lead"] },
    age: { $gte: 25, $lte: 40 },
    name: { $regex: "^sarah", $options: "i" },
    active: { $ne: false },
  })
  .Sort({ age: -1 })       // Sort: 1 (ascending), -1 (descending)
  .Skip(0)                 // Pagination offset
  .Limit(25)               // Page size limit
  .exec();

// Point lookup for a single document
const user = await users
  .query({ email: "sarah@example.com" })
  .findOne(true)
  .exec();

// Query count alongside paginated documents (returns { documents, totalDocuments })
const page = await users
  .query({ active: true })
  .setCount(true)
  .Limit(25)
  .exec();

// Fast collection-level total count without loading document files into memory
const totalCount = await users.totalDocuments();
```

### Supported Comparison & Logical Operators
* **Comparison**: `$eq`, `$ne`, `$gt`, `$gte`, `$lt`, `$lte`, `$in`, `$nin`, `$exists`
* **Pattern Matching**: `$regex` (with `$options: "i"`)
* **Logical**: `$and`, `$or`, `$nor`, `$not`
* **Array / Structure**: `$all`, `$elemMatch`, `$size`, `$type`, `$mod`
</query_and_filtering>

<update_and_delete>
## 4. Updates & Deletions

Mutations invalidate cached records and write through to disk:

```typescript
// Update single matching document
await users
  .update({ email: "sarah@example.com" })
  .UpdateOne({ role: "principal engineer", updatedAt: new Date().toISOString() });

// Update multiple documents matching criteria
await users
  .update({ active: false })
  .UpdateMany({ archived: true });

// Delete single document
await users
  .delete({ email: "sarah@example.com" })
  .deleteOne();

// Delete multiple documents
await users
  .delete({ active: false, archived: true })
  .deleteMany();
```
</update_and_delete>

<indexing_and_hints>
## 5. Secondary Indexes & Hints

Dual-write indexes persist on disk and stay mirrored in memory:

```typescript
// Create secondary index on one or more fields
await users.newIndex("email", "role");

// Enforce index hint for guaranteed O(1) B-tree lookup
const fastUser = await users
  .query({ email: "sarah@example.com" })
  .hint("email")
  .exec();

// List active indexes
const indexList = await users.getIndexes();

// Drop an index
await users.dropIndex("email");
```
</indexing_and_hints>
