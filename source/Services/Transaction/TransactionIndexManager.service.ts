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
import { IndexCache } from "../Index/IndexCache.service";
import SortedIndexValues from "../../Helper/SortedIndexValues.helper";
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
  private readonly indexCache: IndexCache;
  // Keyed by fieldName (not file path) - IndexCache.updateIndex() takes the field name
  private stagedIndexUpdates: Map<string, any> = new Map();
  private readonly isEncrypted: boolean;
  private readonly encryptionKey?: string;

  constructor(
    collectionPath: string,
    isEncrypted: boolean = false,
    encryptionKey?: string
  ) {
    this.collectionPath = collectionPath;
    this.indexFolderPath = `${collectionPath}/indexes`;
    this.indexMetaPath = `${this.indexFolderPath}/index.meta.json`;
    this.FileManager = new FileManager();
    this.Converter = new Converter();
    this.ResponseHelper = new ResponseHelper();
    this.ReadIndexService = new ReadIndex(collectionPath);
    // Same shared cache InsertIndex/DeleteIndex/ReadIndex use - staging reads and
    // committing writes through it (instead of raw file I/O) keeps transactional
    // index changes visible to every other index consumer instead of leaving the
    // cache holding a stale pre-transaction copy.
    this.indexCache = IndexCache.getInstance(collectionPath);
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
        const fieldName = indexMetaEntry.indexFieldName;

        // Read through the shared cache (memory hit, or disk on cold start) so
        // staging sees the same up-to-date state every other index consumer does.
        const indexData = await this.indexCache.getIndex(fieldName);
        if (!indexData) {
          continue;
        }

        const indexEntries = indexData.indexEntries || {};

        // Lazily backfill sortedValues for indexes written before range support existed
        if (!indexData.sortedValues) {
          indexData.sortedValues = SortedIndexValues.backfillFromKeys(Object.keys(indexEntries));
        }
        const sortedValues = indexData.sortedValues;

        for (const op of operations) {
          if (op.type === 'INSERT' && op.data && op.documentId) {
            if (Object.prototype.hasOwnProperty.call(op.data, fieldName)) {
              const fieldValue = (op.data as any)[fieldName];
              const fileName = `${op.documentId}${General.DBMS_File_EXT}`;

              if (!indexEntries[fieldValue]) {
                indexEntries[fieldValue] = [];
                const numericValue = Number(fieldValue);
                if (!Number.isNaN(numericValue)) {
                  SortedIndexValues.insertSorted(sortedValues, numericValue);
                }
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
                const numericValue = Number(oldFieldValue);
                if (!Number.isNaN(numericValue)) {
                  SortedIndexValues.removeSorted(sortedValues, numericValue);
                }
              }
            }

            if (newFieldValue !== undefined) {
              if (!indexEntries[newFieldValue]) {
                indexEntries[newFieldValue] = [];
                const numericValue = Number(newFieldValue);
                if (!Number.isNaN(numericValue)) {
                  SortedIndexValues.insertSorted(sortedValues, numericValue);
                }
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
                  const numericValue = Number(fieldValue);
                  if (!Number.isNaN(numericValue)) {
                    SortedIndexValues.removeSorted(sortedValues, numericValue);
                  }
                }
              }
            }
          }
        }

        indexData.indexEntries = indexEntries;
        indexData.sortedValues = sortedValues;
        this.stagedIndexUpdates.set(fieldName, indexData);
      }
    } catch {
      return;
    }
  }

  public async commitIndexUpdates(): Promise<SuccessInterface | ErrorInterface> {
    try {
      for (const [fieldName, indexData] of this.stagedIndexUpdates) {
        // updateIndex() writes disk + refreshes the shared in-memory cache under
        // its per-field lock, so every other index consumer sees this immediately.
        const updated = await this.indexCache.updateIndex(fieldName, indexData);
        if (!updated) {
          return this.ResponseHelper.Error(`Failed to commit index update for field: ${fieldName}`);
        }
      }

      this.stagedIndexUpdates.clear();
      return this.ResponseHelper.Success({ message: "Index updates committed" });
    } catch (error) {
      return this.ResponseHelper.Error(error);
    }
  }

  public async rollbackIndexUpdates(): Promise<void> {
    // Staged updates only ever lived in memory (this.stagedIndexUpdates) until
    // commitIndexUpdates() wrote them - nothing was persisted, so rolling back is
    // just discarding the staged map.
    this.stagedIndexUpdates.clear();
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
