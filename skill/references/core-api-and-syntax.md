# AxioDB Core API and Syntax Guide

## 1. Embedded Initialization

```typescript
import { AxioDB } from "axiodb";

// AxioDB is a singleton per process
const db = new AxioDB({
  RootName: "ProductionDB",    // Root directory name (default: "AxioDB")
  CustomPath: "./data",         // Custom storage path (default: current dir)
  HTTP: false,                  // Start HTTP REST API Server (default: false)
  TCP: false,                   // Start TCP Server (default: false)
  Cache: true,                  // Enable shared InMemoryCache (default: true)
  minTTL: 5,                    // Min cache entry TTL in minutes (default: 5)
  maxTTL: 15,                   // Max cache entry TTL in minutes (default: 15)
  cacheClearUp: 86400,          // Housekeeping cadence in seconds (default: 86400)
});
```

---

## 2. Databases & Collections

```typescript
// Create or get reference to database
const database = await db.createDB("ecommerce");

// Create or get reference to collection
const products = await database.createCollection("products");
```

---

## 3. Insert Operations

```typescript
// Insert single document (returns { status: true, message: "...", data: { id, ... } })
const item = await products.insert({
  title: "Mechanical Keyboard",
  category: "hardware",
  price: 120,
  stock: 45,
  tags: ["electronics", "gaming"],
  active: true,
});

// Insert multiple documents atomically
const batch = await products.insertMany([
  { title: "Wireless Mouse", category: "hardware", price: 50, stock: 100 },
  { title: "USB-C Cable", category: "accessory", price: 15, stock: 250 },
]);
```

---

## 4. Querying & Filter Operators

Queries in AxioDB use the chainable `.query(filter)` builder terminating in `.exec()`:

```typescript
// Chainable query with Limit, Skip, Sort, setProject, hint, and exec()
const result = await products
  .query({
    category: "hardware",
    price: { $gte: 50, $lte: 200 },
    stock: { $gt: 0 },
    tags: { $in: ["gaming", "workstation"] },
    active: { $ne: false },
  })
  .Sort({ price: -1 })                      // 1 ascending, -1 descending
  .Skip(0)
  .Limit(10)
  .setProject({ title: 1, price: 1, stock: 1 }) // 1 include, 0 exclude
  .exec();
```

### Supported Comparison & Evaluation Operators

| Operator | Usage Example | Explanation |
| :--- | :--- | :--- |
| `$eq` | `{ status: { $eq: "active" } }` | Matches exact equality. |
| `$ne` | `{ status: { $ne: "deleted" } }` | Matches values not equal. |
| `$gt` / `$gte` | `{ age: { $gt: 18, $gte: 21 } }` | Greater than / greater than or equal. |
| `$lt` / `$lte` | `{ price: { $lt: 100, $lte: 99.99 } }` | Less than / less than or equal. |
| `$in` | `{ role: { $in: ["admin", "editor"] } }` | Value exists in specified array (Set-optimized). |
| `$nin` | `{ role: { $nin: ["guest", "banned"] } }`| Value does not exist in array. |
| `$regex` | `{ email: { $regex: "@gmail\\.com$", $options: "i" } }` | Regular expression match (guarded against ReDoS). |
| `$exists` | `{ discount: { $exists: true } }` | Checks field presence. |
| `$all` | `{ tags: { $all: ["tech", "ai"] } }` | Array contains all specified values. |
| `$size` | `{ tags: { $size: 2 } }` | Matches array length. |
| `$or` | `{ $or: [{ price: { $lt: 20 } }, { stock: 0 }] }` | Logical OR. |
| `$and` | `{ $and: [{ active: true }, { price: { $gt: 0 } }] }` | Logical AND. |

### Single Document Query

```typescript
// Returns first matching document
const singleItem = await products
  .query({ title: "Wireless Mouse" })
  .findOne()
  .exec();

// Query directly by documentId
const doc = await products
  .query({ documentId: "S4ACDVS6SZ4S6VS" })
  .exec();

// Batch query by document IDs
const docs = await products.findByIds(["ID_1", "ID_2"]);
```

---

## 5. Update Operations

Updates use the builder `.update(filter)` followed by `.UpdateOne(newData)` or `.UpdateMany(newData)`:

> [!IMPORTANT]
> Updates in AxioDB are flat object merges. MongoDB update modifiers like `$set`, `$inc`, or `$push` are **not supported**. Simply pass the object with the replacement or updated key-value pairs.

```typescript
// Update single matching document
await products
  .update({ documentId: "doc_id_12345" })
  .UpdateOne({ price: 110, stock: 40 });

// Update multiple documents matching a query
await products
  .update({ category: "hardware" })
  .UpdateMany({ discountApplied: true });
```

---

## 6. Delete Operations

Deletions use the builder `.delete(filter)` followed by `.deleteOne()` or `.deleteMany()`:

```typescript
// Delete single matching document
await products
  .delete({ documentId: "doc_id_12345" })
  .deleteOne();

// Delete multiple documents matching query
await products
  .delete({ stock: { $lte: 0 } })
  .deleteMany();
```

---

## 7. Dual-Write Secondary Indexes

Indexes maintain in-memory maps (`IndexCache`) alongside append-only JSONL files on disk:

```typescript
// Create index on one or more fields
await products.newIndex("category", "price");

// List all active indexes
// Embedded collection:
const indexes = await products.getIndexes();
// TCP client proxy:
// const indexes = await products.listIndexes();

// Query using index hint for guaranteed O(1) key lookup
const fastLookup = await products
  .query({ category: "hardware" })
  .hint("category")
  .exec();

// Remove index
await products.dropIndex("category");
```

---

## 8. Aggregation Pipelines

AxioDB supports multi-stage aggregation pipelines terminating in `.exec()`:

```typescript
const report = await products.aggregate([
  // Stage 1: Filter active hardware items
  { $match: { category: "hardware", active: true } },

  // Stage 2: Group by category and calculate total inventory value & item count
  {
    $group: {
      _id: "$category",
      totalInventoryValue: { $sum: { $multiply: ["$price", "$stock"] } },
      averagePrice: { $avg: "$price" },
      totalProducts: { $count: {} },
    },
  },

  // Stage 3: Sort descending by total inventory value
  { $sort: { totalInventoryValue: -1 } },
]).exec();
```

---

## 9. ACID Transactions

Transactions provide atomic multi-operation staging with commit and rollback:

```typescript
// Embedded: collection.beginTransaction()
// TCP Client: await collection.beginTransaction()
const txn = products.beginTransaction();

try {
  txn.insert({ title: "New Item", price: 100 });
  txn.update({ title: "Old Item" }, { price: 80 });
  txn.delete({ stock: 0 });

  // Atomic commit of all staged operations
  const commitResult = await txn.commit();
  console.log("Committed:", commitResult);
} catch (err) {
  // Discard all staged changes on failure
  await txn.rollback();
  throw err;
}
```
