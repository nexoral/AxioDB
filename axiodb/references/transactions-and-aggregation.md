# AxioDB Transactions & Aggregation Pipelines

<acid_transactions>
## 1. ACID Write-Ahead Logging (WAL) Transactions

Transactions provide full atomicity, consistency, isolation, and durability. Writes append to a `.wal` file and stay invisible until committed.

```typescript
// 1. Begin atomic transaction on a collection
const txn = collection.beginTransaction();

try {
  // Queue transactional mutation operations
  txn.insert({ orderId: "ORD-9401", customerId: "CUST-10", total: 150 });
  txn.update({ customerId: "CUST-10" }, { balance: 350 });

  // Optional: Set intermediate savepoint
  txn.savepoint("order_processed");

  // Additional mutation
  txn.delete({ cartId: "CART-55" });

  // If a condition fails, revert to savepoint without aborting entire transaction
  // txn.rollbackTo("order_processed");

  // Commit: atomically flushes WAL records to disk and invalidates affected cache keys
  const result = await txn.commit();
} catch (error) {
  // Rollback: discards uncommitted operations and clears WAL lock
  await txn.rollback();
  throw error;
}
```

### WAL Guarantees & Recovery
* **Crash Resilience**: On restart, uncommitted transactions are cleanly rolled back during engine boot.
* **Isolation**: Transactional writes are staged in WAL buffers until `.commit()` is called.
* **Savepoints**: Supports `.savepoint(name)` and `.rollbackTo(name)` for granular failure recovery.
</acid_transactions>

<aggregation_pipelines>
## 2. Aggregation Pipelines

AxioDB provides a memory-efficient multi-stage aggregation pipeline engine:

```typescript
const report = await collection
  .aggregate([
    // Stage 1: Filter documents ($match)
    { $match: { status: "completed", year: 2026 } },

    // Stage 2: Group and compute summary metrics ($group)
    {
      $group: {
        _id: "$category",
        totalRevenue: { $sum: "$amount" },
        averageTicket: { $avg: "$amount" },
        orderCount: { $sum: 1 },
      },
    },

    // Stage 3: Project computed fields ($project)
    {
      $project: {
        category: "$_id",
        totalRevenue: 1,
        averageTicket: { $round: ["$averageTicket", 2] },
        orderCount: 1,
        _id: 0,
      },
    },

    // Stage 4: Sort results by revenue descending ($sort)
    { $sort: { totalRevenue: -1 } },

    // Stage 5: Paginate ($limit)
    { $limit: 10 },
  ])
  .exec();
```

### Supported Pipeline Stages (19 Stages)
* **Filtering & Transforming**: `$match`, `$project`, `$addFields`, `$set`, `$replaceRoot`
* **Grouping & Aggregating**: `$group`, `$bucket`, `$bucketAuto`, `$sortByCount`, `$count`
* **Pagination & Ordering**: `$sort`, `$skip`, `$limit`, `$sample`
* **Relational & Array Processing**: `$lookup`, `$unwind`, `$facet`
* **Output Destinations**: `$out`, `$merge`

### Group Accumulator Operators
`$sum`, `$avg`, `$min`, `$max`, `$first`, `$last`, `$push`, `$addToSet`
</aggregation_pipelines>
