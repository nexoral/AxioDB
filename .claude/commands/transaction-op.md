Add transaction support to operation: $ARGUMENTS

Location: `source/Services/Transaction/`

**Transaction System Components:**
- `Session.service.ts` - Session management
- `Transaction.service.ts` - ACID operations
- `WriteAheadLog.service.ts` - WAL for crash recovery
- `LockManager.service.ts` - Resource locking
- `TransactionRegistry.service.ts` - Track active transactions

**Pattern: ACID with WAL**
```typescript
// 1. Start transaction
const session = collection.startSession();
const tx = session.startTransaction();

// 2. Write to WAL before operation
await this.wal.append({
  transactionId: tx.id,
  operation: 'insert',
  data: document,
  timestamp: Date.now()
});

// 3. Acquire locks
await this.lockManager.acquire(resourceId, tx.id);

// 4. Execute operation
const result = await this.executeOperation(document);

// 5. Commit: Apply WAL, release locks
await tx.commit();

// Or rollback: Revert from WAL, release locks
await tx.rollback();
```

**Savepoint Support:**
```typescript
await tx.savepoint('checkpoint1');
await tx.insert({ data: 'value' });
// If error, rollback to savepoint
await tx.rollbackToSavepoint('checkpoint1');
```

**Steps:**
1. Add transaction awareness to operation
2. Implement WAL logging
3. Add lock management
4. Support savepoints
5. Implement rollback logic
6. Add tests in Test/modules/transaction.test.js
7. Document transaction behavior

**Error Handling:**
```typescript
try {
  await session.withTransaction(async (tx) => {
    await tx.operation(data);
    // Auto-commits on success
  });
} catch (error) {
  // Auto-rollbacks on error
  logger.error('Transaction failed', error);
}
```

**Build & Verify:**
```bash
npm run build && npm test transaction
```
