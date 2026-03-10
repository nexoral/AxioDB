/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  ErrorInterface,
  SuccessInterface,
} from "../../config/Interfaces/Helper/response.helper.interface";
import { TransactionOperation } from "../../config/Interfaces/Transaction/transaction.interface";
import { General } from "../../config/Keys/Keys";
import FileManager from "../../engine/Filesystem/FileManager";
import Converter from "../../Helper/Converter.helper";
import ResponseHelper from "../../Helper/response.helper";
import { ReadIndex } from "../Index/ReadIndex.service";
import Searcher from "../../utility/Searcher.utils";
import ReaderWithWorker from "../../utility/BufferLoaderWithWorker.utils";

export default class TransactionIndexManager {
  private readonly collectionPath: string;
  private readonly indexFolderPath: string;
  private readonly indexMetaPath: string;
  private readonly FileManager: FileManager;
  private readonly Converter: Converter;
  private readonly ResponseHelper: ResponseHelper;
  private readonly ReadIndexService: ReadIndex;
  private readonly transactionId: string;
  private stagedIndexUpdates: Map<string, any> = new Map();
  private readonly isEncrypted: boolean;
  private readonly encryptionKey?: string;

  constructor(
    collectionPath: string,
    transactionId: string,
    isEncrypted: boolean = false,
    encryptionKey?: string
  ) {
    this.collectionPath = collectionPath;
    this.transactionId = transactionId;
    this.indexFolderPath = `${collectionPath}/indexes`;
    this.indexMetaPath = `${this.indexFolderPath}/index.meta.json`;
    this.FileManager = new FileManager();
    this.Converter = new Converter();
    this.ResponseHelper = new ResponseHelper();
    this.ReadIndexService = new ReadIndex(collectionPath);
    this.isEncrypted = isEncrypted;
    this.encryptionKey = encryptionKey;
  }

  public async resolveQueryToDocumentIds(query: object): Promise<string[]> {
    try {
      const fileNames = await this.ReadIndexService.getFileFromIndex(query);

      if (fileNames && fileNames.length > 0) {
        const dataList = await ReaderWithWorker(
          fileNames,
          this.encryptionKey,
          this.collectionPath,
          this.isEncrypted,
          true
        );

        const searchedData = await new Searcher(dataList, true).find(query, "data");
        return searchedData.map((item: any) => item.data.documentId);
      }

      const allFiles = await this.getAllDocumentFiles();
      const allData = await ReaderWithWorker(
        allFiles,
        this.encryptionKey,
        this.collectionPath,
        this.isEncrypted,
        true
      );

      const searchedData = await new Searcher(allData, true).find(query, "data");
      return searchedData.map((item: any) => item.data.documentId);
    } catch {
      return [];
    }
  }

  public async stageIndexUpdates(operations: TransactionOperation[]): Promise<void> {
    try {
      const indexMetaContent = await this.FileManager.ReadFile(this.indexMetaPath);
      if (!indexMetaContent.status) {
        return;
      }

      const indexMeta = this.Converter.ToObject(indexMetaContent.data);

      for (const indexMetaEntry of indexMeta) {
        const indexFilePath = indexMetaEntry.path;
        const fieldName = indexMetaEntry.indexFieldName;

        const indexContent = await this.FileManager.ReadFile(indexFilePath);
        if (!indexContent.status) {
          continue;
        }

        const indexData = this.Converter.ToObject(indexContent.data);
        const indexEntries = indexData.indexEntries || {};

        for (const op of operations) {
          if (op.type === 'INSERT' && op.data && op.documentId) {
            if (Object.prototype.hasOwnProperty.call(op.data, fieldName)) {
              const fieldValue = (op.data as any)[fieldName];
              const fileName = `${op.documentId}${General.DBMS_File_EXT}`;

              if (!indexEntries[fieldValue]) {
                indexEntries[fieldValue] = [];
              }
              if (!indexEntries[fieldValue].includes(fileName)) {
                indexEntries[fieldValue].push(fileName);
              }
            }
          } else if (op.type === 'UPDATE' && op.data && op.documentId && op.oldData) {
            const oldFieldValue = (op.oldData as any)[fieldName];
            const newFieldValue = (op.data as any)[fieldName];
            const fileName = `${op.documentId}${General.DBMS_File_EXT}`;

            if (oldFieldValue !== undefined && indexEntries[oldFieldValue]) {
              indexEntries[oldFieldValue] = indexEntries[oldFieldValue].filter(
                (f: string) => f !== fileName
              );
              if (indexEntries[oldFieldValue].length === 0) {
                delete indexEntries[oldFieldValue];
              }
            }

            if (newFieldValue !== undefined) {
              if (!indexEntries[newFieldValue]) {
                indexEntries[newFieldValue] = [];
              }
              if (!indexEntries[newFieldValue].includes(fileName)) {
                indexEntries[newFieldValue].push(fileName);
              }
            }
          } else if (op.type === 'DELETE' && op.documentId && op.oldData) {
            if (Object.prototype.hasOwnProperty.call(op.oldData, fieldName)) {
              const fieldValue = (op.oldData as any)[fieldName];
              const fileName = `${op.documentId}${General.DBMS_File_EXT}`;

              if (indexEntries[fieldValue]) {
                indexEntries[fieldValue] = indexEntries[fieldValue].filter(
                  (f: string) => f !== fileName
                );
                if (indexEntries[fieldValue].length === 0) {
                  delete indexEntries[fieldValue];
                }
              }
            }
          }
        }

        indexData.indexEntries = indexEntries;
        this.stagedIndexUpdates.set(indexFilePath, indexData);
      }
    } catch {
      return;
    }
  }

  public async commitIndexUpdates(): Promise<SuccessInterface | ErrorInterface> {
    try {
      for (const [indexFilePath, indexData] of this.stagedIndexUpdates) {
        const tempFilePath = `${indexFilePath}.tmp-${this.transactionId}`;

        await this.FileManager.WriteFile(tempFilePath, this.Converter.ToString(indexData));

        const readResult = await this.FileManager.ReadFile(tempFilePath);
        if (!readResult.status) {
          return this.ResponseHelper.Error("Failed to verify temp index file");
        }

        const fs = await import('fs/promises');
        await fs.rename(tempFilePath, indexFilePath);
      }

      this.stagedIndexUpdates.clear();
      return this.ResponseHelper.Success({ message: "Index updates committed" });
    } catch (error) {
      return this.ResponseHelper.Error(error);
    }
  }

  public async rollbackIndexUpdates(): Promise<void> {
    try {
      for (const [indexFilePath] of this.stagedIndexUpdates) {
        const tempFilePath = `${indexFilePath}.tmp-${this.transactionId}`;
        const fileExists = await this.FileManager.FileExists(tempFilePath);
        if (fileExists.status) {
          await this.FileManager.DeleteFile(tempFilePath);
        }
      }

      this.stagedIndexUpdates.clear();
    } catch {
      return;
    }
  }

  private async getAllDocumentFiles(): Promise<string[]> {
    try {
      const fs = await import('fs/promises');
      const files = await fs.readdir(this.collectionPath);
      return files.filter((file) => file.endsWith(General.DBMS_File_EXT));
    } catch {
      return [];
    }
  }
}
