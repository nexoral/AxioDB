/* eslint-disable @typescript-eslint/no-explicit-any */
import { ClassBased } from "outers";
import {
  ErrorInterface,
  SuccessInterface,
} from "../../config/Interfaces/Helper/response.helper.interface";
import { SessionOptions } from "../../config/Interfaces/Transaction/transaction.interface";
import ResponseHelper from "../../Helper/response.helper";
import Transaction from "./Transaction.service";

/**
 * Session provides MongoDB-like session management for transactions.
 * Supports automatic retry, timeout handling, and the withTransaction pattern.
 */
export default class Session {
  private readonly sessionId: string;
  private readonly collectionPath: string;
  private readonly isEncrypted: boolean;
  private readonly encryptionKey?: string;
  private readonly options: Required<SessionOptions>;
  private readonly ResponseHelper: ResponseHelper;
  private readonly startTime: number;
  private isActive: boolean = true;
  private currentTransaction: Transaction | null = null;

  constructor(
    collectionPath: string,
    isEncrypted: boolean = false,
    encryptionKey?: string,
    options: SessionOptions = {}
  ) {
    this.sessionId = new ClassBased.UniqueGenerator(20).RandomWord(true);
    this.collectionPath = collectionPath;
    this.isEncrypted = isEncrypted;
    this.encryptionKey = encryptionKey;
    this.startTime = Date.now();
    this.ResponseHelper = new ResponseHelper();

    // Default options
    this.options = {
      defaultTimeout: options.defaultTimeout ?? 60000,
      retryWrites: options.retryWrites ?? true,
      maxRetries: options.maxRetries ?? 3,
    };
  }

  /**
   * Gets the session ID
   */
  public getSessionId(): string {
    return this.sessionId;
  }

  /**
   * Checks if the session is still active
   */
  public isSessionActive(): boolean {
    if (!this.isActive) return false;
    if (Date.now() - this.startTime > this.options.defaultTimeout) {
      this.isActive = false;
      return false;
    }
    return true;
  }

  /**
   * Starts a new transaction within this session.
   * Only one transaction can be active at a time per session.
   * 
   * @returns A new Transaction instance
   * @throws Error if session is inactive or another transaction is active
   */
  public startTransaction(): Transaction {
    if (!this.isSessionActive()) {
      throw new Error("Session has expired or is inactive");
    }

    if (this.currentTransaction) {
      throw new Error("A transaction is already active in this session. Commit or rollback first.");
    }

    this.currentTransaction = new Transaction(
      this.collectionPath,
      this.isEncrypted,
      this.encryptionKey
    );

    return this.currentTransaction;
  }

  /**
   * Executes a callback function within a transaction context.
   * Automatically commits on success or rolls back on error.
   * Supports automatic retry on transient errors.
   * 
   * @param callback - Async function that receives the transaction and performs operations
   * @returns Promise resolving to success/error result
   * 
   * @example
   * ```typescript
   * const session = collection.startSession();
   * await session.withTransaction(async (txn) => {
   *   await txn.insert({ name: 'Alice' });
   *   await txn.update({ name: 'Bob' }, { age: 30 });
   * });
   * ```
   */
  public async withTransaction(
    callback: (txn: Transaction) => Promise<void>
  ): Promise<SuccessInterface | ErrorInterface> {
    if (!this.isSessionActive()) {
      return this.ResponseHelper.Error("Session has expired or is inactive");
    }

    let lastError: any = null;
    let attempts = 0;

    while (attempts < this.options.maxRetries) {
      attempts++;

      try {
        // Create a new transaction
        const txn = this.startTransaction();

        // Execute the callback
        await callback(txn);

        // Commit the transaction
        const result = await txn.commit();
        
        // Clear current transaction reference
        this.currentTransaction = null;

        if ('status' in result && result.status === true) {
          return result;
        }

        // If commit failed but not due to timeout, don't retry
        if ('message' in result && !this.isRetryableError(result.message as string)) {
          return result;
        }

        lastError = result;
      } catch (error: any) {
        // Ensure transaction is rolled back on error
        if (this.currentTransaction) {
          try {
            await this.currentTransaction.rollback();
          } catch {
            // Ignore rollback errors
          }
          this.currentTransaction = null;
        }

        // Check if error is retryable
        if (!this.options.retryWrites || !this.isRetryableError(error.message)) {
          return this.ResponseHelper.Error(error.message || error);
        }

        lastError = error;
      }

      // Wait before retry with exponential backoff
      if (attempts < this.options.maxRetries) {
        await this.sleep(Math.min(100 * Math.pow(2, attempts - 1), 1000));
      }
    }

    return this.ResponseHelper.Error(
      `Transaction failed after ${attempts} attempts: ${lastError?.message || lastError}`
    );
  }

  /**
   * Commits the current transaction if one is active.
   * 
   * @returns Promise resolving to success/error result
   */
  public async commitTransaction(): Promise<SuccessInterface | ErrorInterface> {
    if (!this.currentTransaction) {
      return this.ResponseHelper.Error("No active transaction to commit");
    }

    try {
      const result = await this.currentTransaction.commit();
      this.currentTransaction = null;
      return result;
    } catch (error: any) {
      this.currentTransaction = null;
      return this.ResponseHelper.Error(error.message || error);
    }
  }

  /**
   * Rolls back the current transaction if one is active.
   * 
   * @returns Promise resolving to success/error result
   */
  public async abortTransaction(): Promise<SuccessInterface | ErrorInterface> {
    if (!this.currentTransaction) {
      return this.ResponseHelper.Error("No active transaction to abort");
    }

    try {
      const result = await this.currentTransaction.rollback();
      this.currentTransaction = null;
      return result;
    } catch (error: any) {
      this.currentTransaction = null;
      return this.ResponseHelper.Error(error.message || error);
    }
  }

  /**
   * Ends the session and cleans up resources.
   * Any active transaction will be rolled back.
   */
  public async endSession(): Promise<void> {
    if (this.currentTransaction) {
      try {
        await this.currentTransaction.rollback();
      } catch {
        // Ignore rollback errors during cleanup
      }
      this.currentTransaction = null;
    }
    this.isActive = false;
  }

  /**
   * Determines if an error is retryable (transient)
   */
  private isRetryableError(message: string): boolean {
    if (!message) return false;
    const retryablePatterns = [
      'timeout',
      'lock',
      'deadlock',
      'conflict',
      'busy',
      'temporary',
      'EBUSY',
      'EAGAIN'
    ];
    const lowerMessage = message.toLowerCase();
    return retryablePatterns.some(pattern => lowerMessage.includes(pattern));
  }

  /**
   * Simple sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
