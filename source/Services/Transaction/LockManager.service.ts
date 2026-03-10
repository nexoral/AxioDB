/* eslint-disable @typescript-eslint/no-explicit-any */
import { createHash } from 'crypto';
import {
  ErrorInterface,
  SuccessInterface,
} from "../../config/Interfaces/Helper/response.helper.interface";
import { LockInfo } from "../../config/Interfaces/Transaction/transaction.interface";
import FileManager from "../../engine/Filesystem/FileManager";
import FolderManager from "../../engine/Filesystem/FolderManager";
import Converter from "../../Helper/Converter.helper";
import ResponseHelper from "../../Helper/response.helper";

export default class LockManager {
  private readonly collectionPath: string;
  private readonly lockDir: string;
  private readonly FileManager: FileManager;
  private readonly FolderManager: FolderManager;
  private readonly Converter: Converter;
  private readonly ResponseHelper: ResponseHelper;
  private readonly maxWaitTime: number = 30000;
  private readonly pollInterval: number = 100;

  constructor(collectionPath: string) {
    this.collectionPath = collectionPath;
    this.lockDir = `${collectionPath}/.transactions/locks`;
    this.FileManager = new FileManager();
    this.FolderManager = new FolderManager();
    this.Converter = new Converter();
    this.ResponseHelper = new ResponseHelper();
  }

  public async acquireLock(
    documentId: string,
    transactionId: string,
    transactionTimestamp: number
  ): Promise<SuccessInterface | ErrorInterface> {
    try {
      const dirExists = await this.FolderManager.DirectoryExists(this.lockDir);
      if (!dirExists.status) {
        await this.FolderManager.CreateDirectory(this.lockDir);
      }

      const lockFilePath = `${this.lockDir}/${documentId}.lock`;
      const startTime = Date.now();

      while (Date.now() - startTime < this.maxWaitTime) {
        const fileExists = await this.FileManager.FileExists(lockFilePath);

        if (!fileExists.status) {
          const lockInfo: LockInfo = {
            documentId,
            transactionId,
            lockType: 'WRITE',
            timestamp: transactionTimestamp,
          };

          const lockData = this.Converter.ToString(lockInfo);
          const checksum = createHash('sha256').update(lockData).digest('hex');
          const lockContent = this.Converter.ToString({ lockInfo, checksum });

          const writeResult = await this.FileManager.WriteFile(lockFilePath, lockContent);
          if (writeResult.status) {
            return this.ResponseHelper.Success({ message: "Lock acquired", documentId });
          }
        } else {
          const lockOwner = await this.getLockOwner(documentId);
          if (lockOwner) {
            const ownerTimestamp = lockOwner.timestamp;

            if (transactionTimestamp < ownerTimestamp) {
              await this.sleep(this.pollInterval);
              continue;
            } else {
              return this.ResponseHelper.Error(
                `Deadlock detected: Transaction ${transactionId} aborted (Wait-Die)`
              );
            }
          }
        }

        await this.sleep(this.pollInterval);
      }

      return this.ResponseHelper.Error("Lock acquisition timeout");
    } catch (error) {
      return this.ResponseHelper.Error(error);
    }
  }

  public async releaseLock(documentId: string): Promise<SuccessInterface | ErrorInterface> {
    try {
      const lockFilePath = `${this.lockDir}/${documentId}.lock`;
      const fileExists = await this.FileManager.FileExists(lockFilePath);

      if (fileExists.status) {
        await this.FileManager.DeleteFile(lockFilePath);
      }

      return this.ResponseHelper.Success({ message: "Lock released", documentId });
    } catch (error) {
      return this.ResponseHelper.Error(error);
    }
  }

  public async releaseAllLocks(documentIds: string[]): Promise<void> {
    for (const documentId of documentIds) {
      try {
        await this.releaseLock(documentId);
      } catch (error) {
        continue;
      }
    }
  }

  public async isLocked(documentId: string): Promise<boolean> {
    try {
      const lockFilePath = `${this.lockDir}/${documentId}.lock`;
      const fileExists = await this.FileManager.FileExists(lockFilePath);
      return fileExists.status;
    } catch (error) {
      return false;
    }
  }

  public async getLockOwner(documentId: string): Promise<LockInfo | null> {
    try {
      const lockFilePath = `${this.lockDir}/${documentId}.lock`;
      const fileExists = await this.FileManager.FileExists(lockFilePath);

      if (!fileExists.status) {
        return null;
      }

      const readResult = await this.FileManager.ReadFile(lockFilePath);
      if (!readResult.status) {
        return null;
      }

      const lockData = this.Converter.ToObject(readResult.data);
      const { lockInfo, checksum } = lockData;

      const calculatedChecksum = createHash('sha256')
        .update(this.Converter.ToString(lockInfo))
        .digest('hex');

      if (calculatedChecksum === checksum) {
        return lockInfo as LockInfo;
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
