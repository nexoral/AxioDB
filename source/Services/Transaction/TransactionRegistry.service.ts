import {
  ErrorInterface,
  SuccessInterface,
} from "../../config/Interfaces/Helper/response.helper.interface";
import { TransactionMetadata } from "../../config/Interfaces/Transaction/transaction.interface";
import FileManager from "../../engine/Filesystem/FileManager";
import FolderManager from "../../engine/Filesystem/FolderManager";
import Converter from "../../Helper/Converter.helper";
import ResponseHelper from "../../Helper/response.helper";
import { General } from "../../config/Keys/Keys";

/**
 * Marks a transaction as gone. Appended instead of rewriting the file, and folded away by
 * {@link TransactionRegistry.getAllTransactions} - never surfaces to callers.
 */
const REMOVED_STATUS = "REMOVED";

/**
 * Append-only JSONL registry of in-flight transactions.
 *
 * Every mutation is one appended line; the live set is derived by replaying the file with
 * last-write-wins per `transactionId`. This replaces a read-parse-rewrite-fsync of the whole
 * registry on every register/status-change/remove - three full rewrites per transaction, each
 * growing with the number of concurrent transactions.
 *
 * The file is truncated whenever the replay leaves nothing live, so an append-only log of a
 * workload that always finishes its transactions stays at zero bytes.
 */
export default class TransactionRegistry {
  private readonly collectionPath: string;
  private readonly registryPath: string;
  private readonly transactionDir: string;
  private readonly FileManager: FileManager;
  private readonly FolderManager: FolderManager;
  private readonly Converter: Converter;
  private readonly ResponseHelper: ResponseHelper;

  constructor(collectionPath: string) {
    this.collectionPath = collectionPath;
    this.transactionDir = `${collectionPath}/.transactions`;
    this.registryPath = `${this.transactionDir}/${General.Transaction_Registry_File}`;
    this.FileManager = new FileManager();
    this.FolderManager = new FolderManager();
    this.Converter = new Converter();
    this.ResponseHelper = new ResponseHelper();
  }

  public async registerTransaction(
    metadata: TransactionMetadata
  ): Promise<SuccessInterface | ErrorInterface> {
    try {
      const dirExists = await this.FolderManager.DirectoryExists(this.transactionDir);
      if (!dirExists.status) {
        await this.FolderManager.CreateDirectory(this.transactionDir);
      }

      const writeResult = await this.appendRecord(metadata);

      if (writeResult.status) {
        return this.ResponseHelper.Success({
          message: "Transaction registered",
          transactionId: metadata.transactionId,
        });
      }

      return this.ResponseHelper.Error("Failed to register transaction");
    } catch (error) {
      return this.ResponseHelper.Error(error);
    }
  }

  public async updateTransactionStatus(
    txnId: string,
    status: 'ACTIVE' | 'PREPARING' | 'COMMITTED' | 'ABORTED'
  ): Promise<SuccessInterface | ErrorInterface> {
    try {
      const transactions = await this.getAllTransactions();
      const current = transactions.find((t) => t.transactionId === txnId);

      if (!current) {
        return this.ResponseHelper.Error("Transaction not found");
      }

      const writeResult = await this.appendRecord({ ...current, status });

      if (writeResult.status) {
        return this.ResponseHelper.Success({
          message: "Transaction status updated",
          transactionId: txnId,
          status,
        });
      }

      return this.ResponseHelper.Error("Failed to update transaction status");
    } catch (error) {
      return this.ResponseHelper.Error(error);
    }
  }

  public async getActiveTransactions(): Promise<TransactionMetadata[]> {
    try {
      const transactions = await this.getAllTransactions();
      return transactions.filter(
        (t) => t.status === 'ACTIVE' || t.status === 'PREPARING' || t.status === 'COMMITTED'
      );
    } catch {
      return [];
    }
  }

  public async removeTransaction(txnId: string): Promise<SuccessInterface | ErrorInterface> {
    try {
      const remaining = (await this.getAllTransactions()).filter(
        (t) => t.transactionId !== txnId,
      );
      const writeResult =
        remaining.length === 0
          ? await this.FileManager.WriteFileDurable(this.registryPath, "")
          : await this.appendRecord({
              transactionId: txnId,
              status: REMOVED_STATUS,
            } as unknown as TransactionMetadata);

      if (writeResult.status) {
        return this.ResponseHelper.Success({
          message: "Transaction removed",
          transactionId: txnId,
        });
      }

      return this.ResponseHelper.Error("Failed to remove transaction");
    } catch (error) {
      return this.ResponseHelper.Error(error);
    }
  }

  /** Appends one durable JSONL record - O(1), no read and no rewrite of what came before. */
  private async appendRecord(
    record: TransactionMetadata,
  ): Promise<SuccessInterface | ErrorInterface> {
    return this.FileManager.AppendFileDurable(
      this.registryPath,
      `${this.Converter.ToString(record)}\n`,
    );
  }

  /**
   * Replays the JSONL log into the current transaction set: last record wins per
   * `transactionId`, and anything whose last record is a REMOVED tombstone is dropped.
   * Streams line-by-line, so a long log never lands in memory whole.
   */
  private async getAllTransactions(): Promise<TransactionMetadata[]> {
    try {
      const lines = await this.FileManager.ReadLines(this.registryPath);
      const latest = new Map<string, TransactionMetadata>();

      for (const line of lines) {
        try {
          const record = this.Converter.ToObject(line) as TransactionMetadata;
          if (record?.transactionId) {
            latest.set(record.transactionId, record);
          }
        } catch {
          // A torn final line from a crash mid-append - every earlier record is intact.
          continue;
        }
      }

      return [...latest.values()].filter(
        (record) => (record.status as string) !== REMOVED_STATUS,
      );
    } catch {
      return [];
    }
  }
}
