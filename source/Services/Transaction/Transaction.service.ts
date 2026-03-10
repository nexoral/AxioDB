/* eslint-disable @typescript-eslint/no-explicit-any */
import { ClassBased } from "outers";
import {
  ErrorInterface,
  SuccessInterface,
} from "../../config/Interfaces/Helper/response.helper.interface";
import { TransactionMetadata, TransactionOperation, WALEntry, Savepoint } from "../../config/Interfaces/Transaction/transaction.interface";
import { General } from "../../config/Keys/Keys";
import FileManager from "../../engine/Filesystem/FileManager";
import Converter from "../../Helper/Converter.helper";
import { CryptoHelper } from "../../Helper/Crypto.helper";
import ResponseHelper from "../../Helper/response.helper";
import InMemoryCache from "../../Memory/memory.operation";
import LockManager from "./LockManager.service";
import TransactionIndexManager from "./TransactionIndexManager.service";
import TransactionRegistry from "./TransactionRegistry.service";
import WriteAheadLog from "./WriteAheadLog.service";

export default class Transaction {
  private readonly collectionPath: string;
  private readonly transactionId: string;
  private operations: TransactionOperation[] = [];
  private readonly WAL: WriteAheadLog;
  private readonly LockManager: LockManager;
  private readonly Registry: TransactionRegistry;
  private readonly IndexManager: TransactionIndexManager;
  private readonly isEncrypted: boolean;
  private readonly ResponseHelper: ResponseHelper;
  private readonly Converter: Converter;
  private readonly FileManager: FileManager;
  private readonly cryptoInstance?: CryptoHelper;
  private readonly encryptionKey?: string;
  private readonly startTime: number;
  private readonly timeoutMs: number = 30000;
  private lockedDocuments: string[] = [];
  private savepoints: Map<string, Savepoint> = new Map();
  private pendingWALEntries: WALEntry[] = [];
  private resolvedOperations: TransactionOperation[] = [];

  constructor(
    collectionPath: string,
    isEncrypted: boolean = false,
    encryptionKey?: string
  ) {
    this.transactionId = new ClassBased.UniqueGenerator(15).RandomWord(true);
    this.collectionPath = collectionPath;
    this.isEncrypted = isEncrypted;
    this.encryptionKey = encryptionKey;
    this.startTime = Date.now();

    this.WAL = new WriteAheadLog(collectionPath, this.transactionId, isEncrypted, encryptionKey);
    this.LockManager = new LockManager(collectionPath);
    this.Registry = new TransactionRegistry(collectionPath);
    this.IndexManager = new TransactionIndexManager(
      collectionPath,
      this.transactionId,
      isEncrypted,
      encryptionKey
    );

    this.ResponseHelper = new ResponseHelper();
    this.Converter = new Converter();
    this.FileManager = new FileManager();

    if (this.isEncrypted && encryptionKey) {
      this.cryptoInstance = new CryptoHelper(encryptionKey);
    }
  }

  /**
   * Creates a savepoint at the current state of the transaction.
   * Allows partial rollback to this point using rollbackTo().
   * 
   * @param name - Unique name for the savepoint
   * @returns The Transaction instance for chaining
   * @throws Error if savepoint name already exists
   */
  public savepoint(name: string): Transaction {
    if (!name || typeof name !== 'string') {
      throw new Error("Savepoint name must be a non-empty string");
    }
    
    if (this.savepoints.has(name)) {
      throw new Error(`Savepoint '${name}' already exists`);
    }

    const sp: Savepoint = {
      name,
      operationIndex: this.operations.length,
      timestamp: new Date().toISOString(),
      lockedDocumentsSnapshot: [...this.lockedDocuments]
    };

    this.savepoints.set(name, sp);
    return this;
  }

  /**
   * Rolls back the transaction to a specific savepoint.
   * All operations after the savepoint are discarded.
   * 
   * @param name - Name of the savepoint to rollback to
   * @returns The Transaction instance for chaining
   * @throws Error if savepoint doesn't exist
   */
  public rollbackTo(name: string): Transaction {
    const sp = this.savepoints.get(name);
    if (!sp) {
      throw new Error(`Savepoint '${name}' not found`);
    }

    // Truncate operations to savepoint
    this.operations = this.operations.slice(0, sp.operationIndex);
    
    // Remove savepoints created after this one
    const savepointsToRemove: string[] = [];
    for (const [spName, savepoint] of this.savepoints) {
      if (savepoint.operationIndex > sp.operationIndex) {
        savepointsToRemove.push(spName);
      }
    }
    savepointsToRemove.forEach(spName => this.savepoints.delete(spName));

    return this;
  }

  /**
   * Releases a savepoint without rolling back.
   * The savepoint is removed but operations remain.
   * 
   * @param name - Name of the savepoint to release
   * @returns The Transaction instance for chaining
   */
  public releaseSavepoint(name: string): Transaction {
    if (!this.savepoints.has(name)) {
      throw new Error(`Savepoint '${name}' not found`);
    }
    this.savepoints.delete(name);
    return this;
  }

  public insert(data: object): Transaction {
    if (!data || typeof data !== 'object') {
      throw new Error("Data must be a valid object");
    }

    const documentId = new ClassBased.UniqueGenerator(15).RandomWord(true);
    const operation: TransactionOperation = {
      type: 'INSERT',
      documentId,
      data: { ...data, documentId, updatedAt: new Date().toISOString() },
    };

    this.operations.push(operation);
    return this;
  }

  public update(query: object, data: object): Transaction {
    if (!query || typeof query !== 'object') {
      throw new Error("Query must be a valid object");
    }
    if (!data || typeof data !== 'object') {
      throw new Error("Data must be a valid object");
    }

    const operation: TransactionOperation = {
      type: 'UPDATE',
      query,
      data: { ...data, updatedAt: new Date().toISOString() },
    };

    this.operations.push(operation);
    return this;
  }

  public delete(query: object): Transaction {
    if (!query || typeof query !== 'object') {
      throw new Error("Query must be a valid object");
    }

    const operation: TransactionOperation = {
      type: 'DELETE',
      query,
    };

    this.operations.push(operation);
    return this;
  }

  public async commit(): Promise<SuccessInterface | ErrorInterface> {
    try {
      if (Date.now() - this.startTime > this.timeoutMs) {
        await this.rollback();
        return this.ResponseHelper.Error("Transaction timeout - automatically rolled back");
      }

      if (this.operations.length === 0) {
        return this.ResponseHelper.Error("No operations to commit");
      }

      await this.WAL.createWAL();

      const metadata: TransactionMetadata = {
        transactionId: this.transactionId,
        collectionPath: this.collectionPath,
        status: 'ACTIVE',
        startTime: new Date(this.startTime).toISOString(),
        lockedDocuments: [],
        isolationLevel: 'READ_COMMITTED',
      };
      await this.Registry.registerTransaction(metadata);

      await this.resolveAndLockDocuments();

      await this.Registry.updateTransactionStatus(this.transactionId, 'PREPARING');

      await this.executeOperations();

      await this.Registry.updateTransactionStatus(this.transactionId, 'COMMITTED');

      await this.applyChanges();

      await this.IndexManager.commitIndexUpdates();

      await this.LockManager.releaseAllLocks(this.lockedDocuments);

      await InMemoryCache.clearAllCache();

      await this.WAL.deleteWAL();
      await this.Registry.removeTransaction(this.transactionId);

      return this.ResponseHelper.Success({
        message: "Transaction committed successfully",
        transactionId: this.transactionId,
        operationsCount: this.operations.length,
      });
    } catch (error) {
      await this.rollback();
      return this.ResponseHelper.Error(error);
    }
  }

  public async rollback(): Promise<SuccessInterface | ErrorInterface> {
    try {
      await this.WAL.undo();

      await this.IndexManager.rollbackIndexUpdates();

      await this.LockManager.releaseAllLocks(this.lockedDocuments);

      await this.WAL.deleteWAL();
      await this.Registry.removeTransaction(this.transactionId);

      return this.ResponseHelper.Success({
        message: "Transaction rolled back successfully",
        transactionId: this.transactionId,
      });
    } catch (error) {
      return this.ResponseHelper.Error(error);
    }
  }

  private async resolveAndLockDocuments(): Promise<void> {
    const documentsToLock: Set<string> = new Set();

    for (const op of this.operations) {
      if (op.type === 'INSERT' && op.documentId) {
        documentsToLock.add(op.documentId);
      } else if ((op.type === 'UPDATE' || op.type === 'DELETE') && op.query) {
        const documentIds = await this.IndexManager.resolveQueryToDocumentIds(op.query);
        documentIds.forEach((id) => documentsToLock.add(id));
      }
    }

    for (const documentId of documentsToLock) {
      const lockResult = await this.LockManager.acquireLock(
        documentId,
        this.transactionId,
        this.startTime
      );

      if (!lockResult.status) {
        const errorMsg = 'message' in lockResult ? lockResult.message : "Failed to acquire lock";
        throw new Error(errorMsg);
      }

      this.lockedDocuments.push(documentId);
    }
  }

  private async executeOperations(): Promise<void> {
    const resolvedOperations: TransactionOperation[] = [];

    for (const op of this.operations) {
      if (op.type === 'INSERT') {
        resolvedOperations.push(op);
      } else if (op.type === 'UPDATE' && op.query && op.data) {
        const documentIds = await this.IndexManager.resolveQueryToDocumentIds(op.query);

        for (const documentId of documentIds) {
          const fileName = `${documentId}${General.DBMS_File_EXT}`;
          const filePath = `${this.collectionPath}/${fileName}`;

          const fileExists = await this.FileManager.FileExists(filePath);
          if (!fileExists.status) {
            continue;
          }

          const readResult = await this.FileManager.ReadFile(filePath);
          if (!readResult.status) {
            continue;
          }

          let oldDataStr = readResult.data;
          if (this.isEncrypted && this.cryptoInstance) {
            oldDataStr = await this.cryptoInstance.decrypt(oldDataStr);
          }

          const oldData = this.Converter.ToObject(oldDataStr);

          const newData = { ...oldData, ...op.data };

          resolvedOperations.push({
            type: 'UPDATE',
            documentId,
            fileName,
            oldData,
            data: newData,
          });
        }
      } else if (op.type === 'DELETE' && op.query) {
        const documentIds = await this.IndexManager.resolveQueryToDocumentIds(op.query);

        for (const documentId of documentIds) {
          const fileName = `${documentId}${General.DBMS_File_EXT}`;
          const filePath = `${this.collectionPath}/${fileName}`;

          const fileExists = await this.FileManager.FileExists(filePath);
          if (!fileExists.status) {
            continue;
          }

          const readResult = await this.FileManager.ReadFile(filePath);
          if (!readResult.status) {
            continue;
          }

          let oldDataStr = readResult.data;
          if (this.isEncrypted && this.cryptoInstance) {
            oldDataStr = await this.cryptoInstance.decrypt(oldDataStr);
          }

          const oldData = this.Converter.ToObject(oldDataStr);

          resolvedOperations.push({
            type: 'DELETE',
            documentId,
            fileName,
            oldData,
          });
        }
      }
    }

    await this.IndexManager.stageIndexUpdates(resolvedOperations);
    
    // Store resolved operations for use in applyChanges
    this.resolvedOperations = resolvedOperations;

    for (const op of resolvedOperations) {
      const fileName = op.fileName || `${op.documentId}${General.DBMS_File_EXT}`;
      const filePath = `${this.collectionPath}/${fileName}`;

      let beforeData: string | undefined;
      if (op.type === 'UPDATE' || op.type === 'DELETE') {
        const readResult = await this.FileManager.ReadFile(filePath);
        if (readResult.status) {
          beforeData = readResult.data;
        }
      }

      let afterData: string | undefined;
      if ((op.type === 'INSERT' || op.type === 'UPDATE') && op.data) {
        afterData = this.Converter.ToString(op.data);
        if (this.isEncrypted && this.cryptoInstance) {
          afterData = await this.cryptoInstance.encrypt(afterData);
        }
      }

      const walEntry: WALEntry = {
        transactionId: this.transactionId,
        timestamp: new Date().toISOString(),
        operationType: op.type,
        documentId: op.documentId!,
        fileName,
        beforeData,
        afterData,
        checksum: '',
      };

      await this.WAL.appendLog(walEntry);

      const tempFilePath = `${filePath}.tmp-${this.transactionId}`;
      if (op.type === 'INSERT' || op.type === 'UPDATE') {
        await this.FileManager.WriteFile(tempFilePath, afterData!);
      }
    }
  }

  private async applyChanges(): Promise<void> {
    const fs = await import('fs/promises');

    for (const op of this.resolvedOperations) {
      const documentId = op.documentId || '';
      const fileName = `${documentId}${General.DBMS_File_EXT}`;
      const filePath = `${this.collectionPath}/${fileName}`;
      const tempFilePath = `${filePath}.tmp-${this.transactionId}`;

      if (op.type === 'INSERT' || op.type === 'UPDATE') {
        const tempExists = await this.FileManager.FileExists(tempFilePath);
        if (tempExists.status) {
          await fs.rename(tempFilePath, filePath);
        }
      } else if (op.type === 'DELETE') {
        const fileExists = await this.FileManager.FileExists(filePath);
        if (fileExists.status) {
          await this.FileManager.DeleteFile(filePath);
        }
      }
    }
  }

  public static async recoverTransactions(collectionPath: string): Promise<void> {
    try {
      const registry = new TransactionRegistry(collectionPath);
      const activeTransactions = await registry.getActiveTransactions();

      for (const txnMeta of activeTransactions) {
        const wal = new WriteAheadLog(collectionPath, txnMeta.transactionId);
        const lockManager = new LockManager(collectionPath);

        if (txnMeta.status === 'COMMITTED' || txnMeta.status === 'PREPARING') {
          await wal.redo();
        } else {
          await wal.undo();
        }

        await lockManager.releaseAllLocks(txnMeta.lockedDocuments);
        await wal.deleteWAL();
        await registry.removeTransaction(txnMeta.transactionId);
      }
    } catch {
      return;
    }
  }
}
