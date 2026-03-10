/* eslint-disable @typescript-eslint/no-explicit-any */
import { createHash } from 'crypto';
import { open as fsOpen } from 'fs/promises';
import {
  ErrorInterface,
  SuccessInterface,
} from "../../config/Interfaces/Helper/response.helper.interface";
import { WALEntry } from "../../config/Interfaces/Transaction/transaction.interface";
import FileManager from "../../engine/Filesystem/FileManager";
import FolderManager from "../../engine/Filesystem/FolderManager";
import Converter from "../../Helper/Converter.helper";
import ResponseHelper from "../../Helper/response.helper";
import { CryptoHelper } from "../../Helper/Crypto.helper";

export default class WriteAheadLog {
  private readonly walPath: string;
  private readonly transactionDir: string;
  private readonly FileManager: FileManager;
  private readonly FolderManager: FolderManager;
  private readonly Converter: Converter;
  private readonly ResponseHelper: ResponseHelper;
  private readonly isEncrypted: boolean;
  private readonly cryptoInstance?: CryptoHelper;
  private readonly collectionPath: string;
  
  // Batch write buffer for optimized I/O
  private pendingEntries: WALEntry[] = [];
  private batchSize: number = 10;
  private flushTimeout: ReturnType<typeof setTimeout> | null = null;
  private readonly flushDelayMs: number = 50;

  constructor(
    collectionPath: string,
    transactionId: string,
    isEncrypted: boolean = false,
    encryptionKey?: string
  ) {
    this.collectionPath = collectionPath;
    this.transactionDir = `${collectionPath}/.transactions`;
    this.walPath = `${this.transactionDir}/${transactionId}.wal`;
    this.FileManager = new FileManager();
    this.FolderManager = new FolderManager();
    this.Converter = new Converter();
    this.ResponseHelper = new ResponseHelper();
    this.isEncrypted = isEncrypted;
    if (this.isEncrypted && encryptionKey) {
      this.cryptoInstance = new CryptoHelper(encryptionKey);
    }
  }

  public async createWAL(): Promise<SuccessInterface | ErrorInterface> {
    try {
      const dirExists = await this.FolderManager.DirectoryExists(this.transactionDir);
      if (!dirExists.status) {
        await this.FolderManager.CreateDirectory(this.transactionDir);
      }

      const fileExists = await this.FileManager.FileExists(this.walPath);
      if (!fileExists.status) {
        await this.FileManager.WriteFile(this.walPath, '');
      }

      return this.ResponseHelper.Success({ message: "WAL created successfully" });
    } catch (error) {
      return this.ResponseHelper.Error(error);
    }
  }

  /**
   * Appends a single log entry. For better performance, use appendLogBatch.
   */
  public async appendLog(entry: WALEntry): Promise<SuccessInterface | ErrorInterface> {
    try {
      const checksum = this.calculateChecksum(entry);
      const entryWithChecksum = { ...entry, checksum };

      let logLine = this.Converter.ToString(entryWithChecksum) + '\n';

      if (this.isEncrypted && this.cryptoInstance) {
        logLine = await this.cryptoInstance.encrypt(logLine);
        logLine += '\n';
      }

      const fileHandle = await fsOpen(this.walPath, 'a');
      try {
        await fileHandle.write(logLine);
        await fileHandle.sync();
      } finally {
        await fileHandle.close();
      }

      return this.ResponseHelper.Success({ message: "Log entry appended" });
    } catch (error) {
      return this.ResponseHelper.Error(error);
    }
  }

  /**
   * Appends multiple log entries in a single disk write operation.
   * Much more efficient than calling appendLog multiple times.
   * 
   * @param entries - Array of WAL entries to write
   * @returns Success/Error result
   */
  public async appendLogBatch(entries: WALEntry[]): Promise<SuccessInterface | ErrorInterface> {
    if (entries.length === 0) {
      return this.ResponseHelper.Success({ message: "No entries to append" });
    }

    try {
      const lines: string[] = [];

      for (const entry of entries) {
        const checksum = this.calculateChecksum(entry);
        const entryWithChecksum = { ...entry, checksum };

        let logLine = this.Converter.ToString(entryWithChecksum) + '\n';

        if (this.isEncrypted && this.cryptoInstance) {
          logLine = await this.cryptoInstance.encrypt(logLine);
          logLine += '\n';
        }

        lines.push(logLine);
      }

      // Single write operation for all entries
      const batchContent = lines.join('');
      const fileHandle = await fsOpen(this.walPath, 'a');
      try {
        await fileHandle.write(batchContent);
        await fileHandle.sync(); // Single sync for entire batch
      } finally {
        await fileHandle.close();
      }

      return this.ResponseHelper.Success({ 
        message: "Batch log entries appended",
        count: entries.length 
      });
    } catch (error) {
      return this.ResponseHelper.Error(error);
    }
  }

  /**
   * Queues an entry for batched write. Flushes automatically when batch is full
   * or after a short delay.
   * 
   * @param entry - WAL entry to queue
   */
  public queueEntry(entry: WALEntry): void {
    const checksum = this.calculateChecksum(entry);
    this.pendingEntries.push({ ...entry, checksum });

    // Flush if batch is full
    if (this.pendingEntries.length >= this.batchSize) {
      this.flushPendingEntries();
    } else {
      // Schedule flush after delay if not already scheduled
      if (!this.flushTimeout) {
        this.flushTimeout = setTimeout(() => {
          this.flushPendingEntries();
        }, this.flushDelayMs);
      }
    }
  }

  /**
   * Flushes all pending entries to disk immediately.
   */
  public async flushPendingEntries(): Promise<SuccessInterface | ErrorInterface> {
    if (this.flushTimeout) {
      clearTimeout(this.flushTimeout);
      this.flushTimeout = null;
    }

    if (this.pendingEntries.length === 0) {
      return this.ResponseHelper.Success({ message: "No pending entries" });
    }

    const entriesToFlush = [...this.pendingEntries];
    this.pendingEntries = [];

    return this.appendLogBatch(entriesToFlush);
  }

  public async getLogEntries(): Promise<WALEntry[]> {
    try {
      const fileExists = await this.FileManager.FileExists(this.walPath);
      if (!fileExists.status) {
        return [];
      }

      const readResult = await this.FileManager.ReadFile(this.walPath);
      if (!readResult.status) {
        return [];
      }

      const content = readResult.data;
      if (!content || content.trim().length === 0) {
        return [];
      }

      const lines = content.split('\n').filter((line: string) => line.trim().length > 0);
      const entries: WALEntry[] = [];

      for (const line of lines) {
        try {
          let decryptedLine = line;
          if (this.isEncrypted && this.cryptoInstance) {
            decryptedLine = await this.cryptoInstance.decrypt(line);
          }

          const entry = this.Converter.ToObject(decryptedLine) as WALEntry;

          const calculatedChecksum = this.calculateChecksum(entry);
          if (calculatedChecksum === entry.checksum) {
            entries.push(entry);
          }
        } catch {
          continue;
        }
      }

      return entries;
    } catch {
      return [];
    }
  }

  public async deleteWAL(): Promise<SuccessInterface | ErrorInterface> {
    try {
      // Clear any pending entries
      this.pendingEntries = [];
      if (this.flushTimeout) {
        clearTimeout(this.flushTimeout);
        this.flushTimeout = null;
      }

      const fileExists = await this.FileManager.FileExists(this.walPath);
      if (fileExists.status) {
        await this.FileManager.DeleteFile(this.walPath);
      }
      return this.ResponseHelper.Success({ message: "WAL deleted successfully" });
    } catch (error) {
      return this.ResponseHelper.Error(error);
    }
  }

  public async redo(): Promise<SuccessInterface | ErrorInterface> {
    try {
      const entries = await this.getLogEntries();

      for (const entry of entries) {
        if (entry.operationType === 'INSERT' || entry.operationType === 'UPDATE') {
          if (entry.afterData) {
            const filePath = `${this.collectionPath}/${entry.fileName}`;
            await this.FileManager.WriteFile(filePath, entry.afterData);
          }
        } else if (entry.operationType === 'DELETE') {
          const filePath = `${this.collectionPath}/${entry.fileName}`;
          const fileExists = await this.FileManager.FileExists(filePath);
          if (fileExists.status) {
            await this.FileManager.DeleteFile(filePath);
          }
        }
      }

      return this.ResponseHelper.Success({ message: "REDO completed", entriesProcessed: entries.length });
    } catch (error) {
      return this.ResponseHelper.Error(error);
    }
  }

  public async undo(): Promise<SuccessInterface | ErrorInterface> {
    try {
      const entries = await this.getLogEntries();

      for (let i = entries.length - 1; i >= 0; i--) {
        const entry = entries[i];

        if (entry.operationType === 'INSERT') {
          const filePath = `${this.collectionPath}/${entry.fileName}`;
          const fileExists = await this.FileManager.FileExists(filePath);
          if (fileExists.status) {
            await this.FileManager.DeleteFile(filePath);
          }
        } else if (entry.operationType === 'UPDATE' || entry.operationType === 'DELETE') {
          if (entry.beforeData) {
            const filePath = `${this.collectionPath}/${entry.fileName}`;
            await this.FileManager.WriteFile(filePath, entry.beforeData);
          }
        }
      }

      return this.ResponseHelper.Success({ message: "UNDO completed", entriesProcessed: entries.length });
    } catch (error) {
      return this.ResponseHelper.Error(error);
    }
  }

  private calculateChecksum(entry: WALEntry): string {
    const data = {
      transactionId: entry.transactionId,
      timestamp: entry.timestamp,
      operationType: entry.operationType,
      documentId: entry.documentId,
      fileName: entry.fileName,
      beforeData: entry.beforeData,
      afterData: entry.afterData,
      savepointName: entry.savepointName,
    };

    const dataString = this.Converter.ToString(data);
    return createHash('sha256').update(dataString).digest('hex');
  }
}
