import Transaction from '../../Services/Transaction/Transaction.service';
import type { InMemoryCache } from '../../Memory/memory.operation';
import Logger from '../../Helper/Logger.helper';

/**
 * Tracks active in-flight Transaction objects keyed by connection ID and transaction ID.
 * One AxioDB singleton per process means one TransactionManager singleton too.
 *
 * Lifecycle:
 *  1. BEGIN_TRANSACTION -> create Transaction, store under (connectionId, transactionId)
 *  2. CRUD with transactionId -> retrieve Transaction, call insert/update/delete
 *  3. COMMIT / ROLLBACK -> call commit()/rollback(), remove from store
 *  4. Connection drop -> rollbackAllForConnection() cleans up orphaned transactions
 */
export default class TransactionManager {
  private static instance: TransactionManager;
  private activeTransactions: Map<string, Map<string, Transaction>> = new Map();
  private transactionPaths: Map<string, string> = new Map();
  private connectionCollections: Map<string, Map<string, string>> = new Map();
  private lastActive: Map<string, number> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  private constructor() {}

  static getInstance(): TransactionManager {
    if (!TransactionManager.instance) {
      TransactionManager.instance = new TransactionManager();
    }
    return TransactionManager.instance;
  }

  public startCleanupSweep(intervalMs: number = 10000, timeoutMs: number = 30000): void {
    if (this.cleanupInterval) return;
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpired(timeoutMs).catch((err: unknown) => {
        Logger.error('[TransactionManager] Cleanup sweep error:', err);
      });
    }, intervalMs);
    if (typeof this.cleanupInterval.unref === 'function') {
      this.cleanupInterval.unref();
    }
  }

  public stopCleanupSweep(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  beginTransaction(connectionId: string, collectionPath: string, cache: InMemoryCache): Transaction {
    const txn = new Transaction(collectionPath, cache);
    const transactionId = txn.getId();

    let connTxns = this.activeTransactions.get(connectionId);
    if (!connTxns) {
      connTxns = new Map();
      this.activeTransactions.set(connectionId, connTxns);
    }

    connTxns.set(transactionId, txn);
    this.transactionPaths.set(transactionId, collectionPath);
    this.lastActive.set(transactionId, Date.now());

    let connCollections = this.connectionCollections.get(connectionId);
    if (!connCollections) {
      connCollections = new Map();
      this.connectionCollections.set(connectionId, connCollections);
    }
    connCollections.set(transactionId, collectionPath);

    Logger.info(`[TransactionManager] BEGIN ${transactionId} on ${connectionId} for ${collectionPath}`);
    return txn;
  }

  getTransaction(connectionId: string, transactionId: string): Transaction | undefined {
    const txn = this.activeTransactions.get(connectionId)?.get(transactionId);
    if (txn) {
      this.lastActive.set(transactionId, Date.now());
    }
    return txn;
  }

  removeTransaction(connectionId: string, transactionId: string): void {
    const connTxns = this.activeTransactions.get(connectionId);
    if (connTxns) {
      connTxns.delete(transactionId);
      if (connTxns.size === 0) {
        this.activeTransactions.delete(connectionId);
      }
    }
    this.transactionPaths.delete(transactionId);
    this.lastActive.delete(transactionId);

    const connCollections = this.connectionCollections.get(connectionId);
    if (connCollections) {
      connCollections.delete(transactionId);
      if (connCollections.size === 0) {
        this.connectionCollections.delete(connectionId);
      }
    }
  }

  public async cleanupExpired(timeoutMs: number = 30000): Promise<number> {
    const now = Date.now();
    const expired: { connectionId: string; transactionId: string; txn: Transaction }[] = [];

    for (const [connId, connTxns] of this.activeTransactions) {
      for (const [txnId, txn] of connTxns) {
        const last = this.lastActive.get(txnId) ?? 0;
        if (now - last > timeoutMs) {
          expired.push({ connectionId: connId, transactionId: txnId, txn });
        }
      }
    }

    let rolledBackCount = 0;
    for (const { connectionId, transactionId, txn } of expired) {
      this.removeTransaction(connectionId, transactionId);
      try {
        Logger.warn(
          `[TransactionManager] Auto-rolled-back expired transaction ${transactionId} on connection ${connectionId} (idle > ${timeoutMs}ms)`,
        );
        await txn.rollback();
        rolledBackCount++;
      } catch (err: unknown) {
        Logger.error(
          `[TransactionManager] Failed to rollback expired transaction ${transactionId}:`,
          err,
        );
      }
    }

    return rolledBackCount;
  }

  getCollectionPath(transactionId: string): string | undefined {
    return this.transactionPaths.get(transactionId);
  }

  async rollbackAllForConnection(connectionId: string): Promise<void> {
    const connTxns = this.activeTransactions.get(connectionId);
    if (!connTxns || connTxns.size === 0) return;

    Logger.info(`[TransactionManager] Rolling back ${connTxns.size} transaction(s) for disconnected connection ${connectionId}`);

    for (const [txnId, txn] of connTxns) {
      try {
        await txn.rollback();
        Logger.info(`[TransactionManager] Auto-rolled-back ${txnId}`);
      } catch (error) {
        Logger.error(`[TransactionManager] Failed to rollback ${txnId}:`, error);
      }
      this.transactionPaths.delete(txnId);
      this.lastActive.delete(txnId);
    }

    this.activeTransactions.delete(connectionId);
    this.connectionCollections.delete(connectionId);
  }

  getActiveTransactionCount(): number {
    let count = 0;
    for (const connTxns of this.activeTransactions.values()) {
      count += connTxns.size;
    }
    return count;
  }

  hasTransaction(connectionId: string, transactionId: string): boolean {
    return this.activeTransactions.get(connectionId)?.has(transactionId) ?? false;
  }
}
