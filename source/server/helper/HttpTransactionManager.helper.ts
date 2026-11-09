import Transaction from "../../Services/Transaction/Transaction.service";
import type { InMemoryCache } from "../../Memory/memory.operation";
import Logger from "../../Helper/Logger.helper";

interface HttpTransactionEntry {
  transaction: Transaction;
  transactionId: string;
  username: string;
  collectionPath: string;
  createdAt: number;
  lastActive: number;
}

/**
 * Manages active in-flight ACID transactions initiated over HTTP REST (:27018).
 * Tracks transactions keyed by transactionId, scoped to authenticated user,
 * and automatically rolls back idle transactions (> 30s) to prevent lock/WAL leaks.
 */
export default class HttpTransactionManager {
  private static instance: HttpTransactionManager;
  private activeTransactions: Map<string, HttpTransactionEntry> = new Map();
  private userTransactions: Map<string, Set<string>> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;
  private readonly defaultTimeoutMs: number = 30000;

  private constructor() {}

  static getInstance(): HttpTransactionManager {
    if (!HttpTransactionManager.instance) {
      HttpTransactionManager.instance = new HttpTransactionManager();
    }
    return HttpTransactionManager.instance;
  }

  startCleanupSweep(intervalMs: number = 10000): void {
    if (this.cleanupInterval) return;
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpired().catch((err: unknown) => {
        Logger.error("[HttpTransactionManager] Cleanup sweep error:", err);
      });
    }, intervalMs);
    if (typeof this.cleanupInterval.unref === "function") {
      this.cleanupInterval.unref();
    }
  }

  stopCleanupSweep(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  beginTransaction(
    username: string,
    collectionPath: string,
    cache: InMemoryCache,
  ): Transaction {
    const txn = new Transaction(collectionPath, cache);
    const transactionId = txn.getId();
    const now = Date.now();

    const entry: HttpTransactionEntry = {
      transaction: txn,
      transactionId,
      username,
      collectionPath,
      createdAt: now,
      lastActive: now,
    };

    this.activeTransactions.set(transactionId, entry);

    let userTxns = this.userTransactions.get(username);
    if (!userTxns) {
      userTxns = new Set();
      this.userTransactions.set(username, userTxns);
    }
    userTxns.add(transactionId);

    Logger.info(
      `[HttpTransactionManager] BEGIN ${transactionId} by ${username} on ${collectionPath}`,
    );
    return txn;
  }

  getTransaction(transactionId: string, username?: string): Transaction | undefined {
    const entry = this.activeTransactions.get(transactionId);
    if (!entry) return undefined;

    // Enforce user ownership if authenticated
    if (username && entry.username !== username) {
      return undefined;
    }

    entry.lastActive = Date.now();
    return entry.transaction;
  }

  getEntry(transactionId: string): HttpTransactionEntry | undefined {
    return this.activeTransactions.get(transactionId);
  }

  removeTransaction(transactionId: string): void {
    const entry = this.activeTransactions.get(transactionId);
    if (entry) {
      const userTxns = this.userTransactions.get(entry.username);
      if (userTxns) {
        userTxns.delete(transactionId);
        if (userTxns.size === 0) {
          this.userTransactions.delete(entry.username);
        }
      }
    }
    this.activeTransactions.delete(transactionId);
  }

  async cleanupExpired(): Promise<void> {
    const now = Date.now();
    const expired: string[] = [];

    for (const [id, entry] of this.activeTransactions.entries()) {
      if (now - entry.lastActive > this.defaultTimeoutMs) {
        expired.push(id);
      }
    }

    for (const id of expired) {
      const entry = this.activeTransactions.get(id);
      if (!entry) continue;
      this.removeTransaction(id);
      try {
        await entry.transaction.rollback();
        Logger.info(
          `[HttpTransactionManager] Auto-rolled-back expired transaction ${id} (idle > 30s)`,
        );
      } catch (err: unknown) {
        Logger.error(
          `[HttpTransactionManager] Failed to rollback expired transaction ${id}:`,
          err,
        );
      }
    }
  }

  async rollbackAll(): Promise<void> {
    for (const [id, entry] of this.activeTransactions.entries()) {
      try {
        await entry.transaction.rollback();
      } catch (err: unknown) {
        Logger.error(`[HttpTransactionManager] Error rolling back ${id}:`, err);
      }
    }
    this.activeTransactions.clear();
    this.userTransactions.clear();
  }

  getActiveCount(): number {
    return this.activeTransactions.size;
  }
}
