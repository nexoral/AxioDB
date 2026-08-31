import Transaction from '../../Services/Transaction/Transaction.service';
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

  private constructor() {}

  static getInstance(): TransactionManager {
    if (!TransactionManager.instance) {
      TransactionManager.instance = new TransactionManager();
    }
    return TransactionManager.instance;
  }

  beginTransaction(connectionId: string, collectionPath: string): Transaction {
    const txn = new Transaction(collectionPath);
    const transactionId = txn.getId();

    let connTxns = this.activeTransactions.get(connectionId);
    if (!connTxns) {
      connTxns = new Map();
      this.activeTransactions.set(connectionId, connTxns);
    }

    connTxns.set(transactionId, txn);
    this.transactionPaths.set(transactionId, collectionPath);

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
    return this.activeTransactions.get(connectionId)?.get(transactionId);
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

    const connCollections = this.connectionCollections.get(connectionId);
    if (connCollections) {
      connCollections.delete(transactionId);
      if (connCollections.size === 0) {
        this.connectionCollections.delete(connectionId);
      }
    }
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
