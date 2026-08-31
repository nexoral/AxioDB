import UniqueGenerator from "../../Helper/UniqueGenerator.helper";
import {
  ErrorInterface,
  SuccessInterface,
} from "../../config/Interfaces/Helper/response.helper.interface";
import { TransactionMetadata, TransactionOperation, WALEntry, Savepoint } from "../../config/Interfaces/Transaction/transaction.interface";
import { General } from "../../config/Keys/Keys";
import FileManager from "../../engine/Filesystem/FileManager";
import FolderManager from "../../engine/Filesystem/FolderManager";
import Converter from "../../Helper/Converter.helper";
import ResponseHelper from "../../Helper/response.helper";
import InMemoryCache from "../../Memory/memory.operation";
import LockManager from "./LockManager.service";
import TransactionIndexManager from "./TransactionIndexManager.service";
import TransactionRegistry from "./TransactionRegistry.service";
import WriteAheadLog from "./WriteAheadLog.service";

// WAL files are named `${transactionId}.wal.jsonl` (see WriteAheadLog.service.ts). The
// suffix is what keeps this scan from matching the registry's own txn-meta.jsonl.
const WAL_FILE_EXT = General.WAL_File_EXT;

export default class Transaction {
  private readonly collectionPath: string;
  private readonly transactionId: string;
  private operations: TransactionOperation[] = [];
  private readonly WAL: WriteAheadLog;
  private readonly LockManager: LockManager;
  private readonly Registry: TransactionRegistry;
  private readonly IndexManager: TransactionIndexManager;
  private readonly ResponseHelper: ResponseHelper;
  private readonly Converter: Converter;
  private readonly FileManager: FileManager;
  private readonly startTime: number;
  private readonly timeoutMs: number = 30000;
  private lockedDocuments: string[] = [];
  private savepoints: Map<string, Savepoint> = new Map();
  private pendingWALEntries: WALEntry[] = [];
  private resolvedOperations: TransactionOperation[] = [];

  constructor(collectionPath: string) {
    this.transactionId = new UniqueGenerator(15).RandomWord(true);
    this.collectionPath = collectionPath;
    this.startTime = Date.now();

    this.WAL = new WriteAheadLog(collectionPath, this.transactionId);
    this.LockManager = LockManager.getInstance(collectionPath);
    this.Registry = new TransactionRegistry(collectionPath);
    this.IndexManager = new TransactionIndexManager(collectionPath);

    this.ResponseHelper = new ResponseHelper();
    this.Converter = new Converter();
    this.FileManager = new FileManager();
  }

  public getId(): string {
    return this.transactionId;
  }

  public getCollectionPath(): string {
    return this.collectionPath;
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

    const documentId = new UniqueGenerator(General.DocumentId_Length).RandomWord(true, true);
    const operation: TransactionOperation = {
      type: 'INSERT',
      documentId,
      data: { ...data, documentId, updatedAt: new Date().toISOString() },
    };

    this.operations.push(operation);
    return this;
  }

  public update(query: Record<string, unknown>, data: Record<string, unknown>): Transaction {
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

  public delete(query: Record<string, unknown>): Transaction {
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

      // Invalidate cache: an INSERT's new document could match a previously-cached
      // list/filter query that has no existing entry to selectively target, so any
      // transaction containing one must invalidate the whole collection. A
      // transaction of only UPDATE/DELETE ops knows exactly which documents
      // changed, so it only evicts cache entries that actually referenced them -
      // leaving unrelated cached queries (e.g. a disjoint range) untouched.
      const hasInsert = this.resolvedOperations.some((op) => op.type === 'INSERT');
      if (hasInsert) {
        await InMemoryCache.invalidateByCollection(this.collectionPath);
      } else {
        const affectedDocumentIds = this.resolvedOperations
          .map((op) => op.documentId)
          .filter((id): id is string => Boolean(id));
        if (affectedDocumentIds.length > 0) {
          await InMemoryCache.invalidateByDocuments(this.collectionPath, affectedDocumentIds);
        }
      }

      await this.WAL.deleteWAL();
      await this.Registry.removeTransaction(this.transactionId);

      return this.ResponseHelper.Success({
        message: "Transaction committed successfully",
        transactionId: this.transactionId,
        operationsCount: this.operations.length,
        documentIds: this.resolvedOperations
          .filter((op) => op.type === 'INSERT' && op.documentId)
          .map((op) => op.documentId as string),
        // Per-document before/after data for UPDATE/DELETE ops, so callers (e.g.
        // UpdateOperation/DeleteOperation) can build their response without a
        // second disk read - this is already computed internally in executeOperations().
        resolvedOperations: this.resolvedOperations.map((op) => ({
          type: op.type,
          documentId: op.documentId,
          oldData: op.oldData,
          data: op.data,
        })),
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

      // Remove any staged .tmp files an aborted executeOperations may have left
      // behind (e.g. a mid-loop WAL/stage failure throws before applyChanges
      // renames them into place), so aborted commits don't leak temp files.
      for (const op of this.resolvedOperations) {
        if (op.type === 'INSERT' || op.type === 'UPDATE') {
          const fileName = op.fileName || `${op.documentId}${General.DBMS_File_EXT}`;
          const tempFilePath = `${this.collectionPath}/${fileName}.tmp-${this.transactionId}`;
          const tempExists = await this.FileManager.FileExists(tempFilePath);
          if (tempExists.status) {
            await this.FileManager.DeleteFile(tempFilePath);
          }
        }
      }

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
        // Guard against documentId collisions. insert() must stay synchronous to
        // keep the chainable API (txn.insert(a).update(b)...), so it can't await
        // a FileExists check itself - do it here instead, before commit() writes
        // anything to disk.
        let documentId = op.documentId!;
        let filePath = `${this.collectionPath}/${documentId}${General.DBMS_File_EXT}`;
        while ((await this.FileManager.FileExists(filePath)).status) {
          documentId = new UniqueGenerator(General.DocumentId_Length).RandomWord(true, true);
          filePath = `${this.collectionPath}/${documentId}${General.DBMS_File_EXT}`;
        }
        if (documentId !== op.documentId) {
          op.documentId = documentId;
          if (op.data) {
            op.data = { ...op.data, documentId };
          }
        }
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

          const oldData = this.Converter.ToObject(readResult.data as string) as Record<string, unknown>;

          const newData = { ...oldData, ...op.data as Record<string, unknown> };

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

          const oldData = this.Converter.ToObject(readResult.data as string) as Record<string, unknown>;

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

    const walEntries: WALEntry[] = [];

    for (const op of resolvedOperations) {
      const fileName = op.fileName || `${op.documentId}${General.DBMS_File_EXT}`;
      const filePath = `${this.collectionPath}/${fileName}`;

      let beforeData: string | undefined;
      if (op.type === 'UPDATE' || op.type === 'DELETE') {
        const readResult = await this.FileManager.ReadFile(filePath);
        if (readResult.status) {
          beforeData = readResult.data as string;
        }
      }

      let afterData: string | undefined;
      if ((op.type === 'INSERT' || op.type === 'UPDATE') && op.data) {
        afterData = this.Converter.ToString(op.data);
      }

      walEntries.push({
        transactionId: this.transactionId,
        timestamp: new Date().toISOString(),
        operationType: op.type,
        documentId: op.documentId!,
        fileName,
        beforeData,
        afterData,
        checksum: '',
      });

      const tempFilePath = `${filePath}.tmp-${this.transactionId}`;
      if (op.type === 'INSERT' || op.type === 'UPDATE') {
        const tempWrite = await this.FileManager.WriteFile(tempFilePath, afterData!);
        if (!tempWrite.status) {
          throw new Error(
            `Failed to stage document ${op.documentId} - aborting commit`,
          );
        }
      }
    }

    // Persist every WAL entry in a single fsync'd batch instead of one fsync per
    // operation - a 1000-doc insertMany goes from 1000 WAL fsyncs to 1. The WAL is
    // the durable record of intent and only has to be durable before applyChanges()
    // (which runs after this method, post-COMMITTED); the .tmp files staged above are
    // not the live documents, so ordering the batch after staging is still crash-safe:
    // a crash before this append leaves an empty/partial WAL that recovery treats as
    // "nothing committed". appendLogBatch() returns an Error result instead of
    // throwing, so we check it and throw to route into commit()'s rollback.
    const appendResult = await this.WAL.appendLogBatch(walEntries);
    if (!appendResult.status) {
      throw new Error(
        `WAL batch append failed - aborting commit: ${(appendResult as ErrorInterface).message ?? ""}`,
      );
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

      // Snapshot the WAL files present when recovery starts. Recovery runs at
      // collection init, so these all predate any transaction THIS process will
      // create - sweeping orphans from this snapshot (below) can't race a live
      // transaction that creates its WAL after startup.
      const orphanCandidates = await this.listWALFiles(collectionPath);

      const activeTransactions = await registry.getActiveTransactions();
      const handled = new Set<string>();

      for (const txnMeta of activeTransactions) {
        const wal = new WriteAheadLog(collectionPath, txnMeta.transactionId);
        const lockManager = LockManager.getInstance(collectionPath);

        if (txnMeta.status === 'COMMITTED' || txnMeta.status === 'PREPARING') {
          await wal.redo();
        } else {
          await wal.undo();
        }

        await lockManager.releaseAllLocks(txnMeta.lockedDocuments);
        await wal.deleteWAL();
        await registry.removeTransaction(txnMeta.transactionId);
        handled.add(`${txnMeta.transactionId}${WAL_FILE_EXT}`);
      }

      // Sweep orphaned WALs: a crash between createWAL() and registerTransaction()
      // leaves a .wal with no registry entry, which the registry-driven loop above
      // never sees. Such a WAL was created before any document mutation (WAL entries
      // are only appended after registration), so it is empty - or, in the rare case
      // a post-commit deleteWAL() failed, a stale leftover whose changes are already
      // durable on disk. In both cases the correct action is to reclaim the file,
      // never redo/undo it.
      for (const walFile of orphanCandidates) {
        if (handled.has(walFile)) {
          continue;
        }
        const transactionId = walFile.slice(0, -WAL_FILE_EXT.length);
        await new WriteAheadLog(collectionPath, transactionId).deleteWAL();
        await registry.removeTransaction(transactionId);
      }
    } catch {
      return;
    }
  }

  private static async listWALFiles(collectionPath: string): Promise<string[]> {
    const folderManager = new FolderManager();
    const transactionDir = `${collectionPath}/.transactions`;
    const dirExists = await folderManager.DirectoryExists(transactionDir);
    if (!dirExists.status) {
      return [];
    }
    const listing = await folderManager.ListDirectory(transactionDir);
    if (!listing.status || !("data" in listing) || !Array.isArray(listing.data)) {
      return [];
    }
    return (listing.data as string[]).filter((name) => name.endsWith(WAL_FILE_EXT));
  }
}
