import { SuccessInterface, ErrorInterface } from '../config/Interfaces/Helper/response.helper.interface';
import FolderManager from '../engine/Filesystem/FolderManager';
import ReaderWithWorker from '../utility/BufferLoaderWithWorker.utils';
import responseHelper from './response.helper';

/**
 * DocumentLoader - Shared utility for loading documents from collection directories
 *
 * Provides a centralized method for loading document files using worker threads,
 * replacing duplicated code in Reader, Update, Delete, and Aggregation operations.
 *
 * @class DocumentLoader
 */
export default class DocumentLoader {
  private static readonly ResponseHelper = new responseHelper();

  /**
   * Loads all documents from a collection directory using worker threads
   *
   * This method consolidates the LoadAllBufferRawData logic that was previously
   * duplicated across multiple CRUD operations. It handles both direct file
   * specification and directory scanning with .axiodb file filtering.
   *
   * @param collectionPath - Full path to collection directory
   * @param encryptionKey - Optional encryption key for encrypted documents
   * @param isEncrypted - Whether documents are encrypted (default: false)
   * @param documentFiles - Optional specific file names to load
   * @param includeFileName - Whether to include fileName in result (default: false)
   * @returns Success with document array or Error
   *
   * @example
   * // Load all documents from a collection
   * const result = await DocumentLoader.loadDocuments(
   *   '/path/to/collection',
   *   undefined,
   *   false
   * );
   *
   * @example
   * // Load specific documents with filenames included
   * const result = await DocumentLoader.loadDocuments(
   *   '/path/to/collection',
   *   'encryption-key',
   *   true,
   *   ['doc1.axiodb', 'doc2.axiodb'],
   *   true
   * );
   */
  static async loadDocuments(
    collectionPath: string,
    encryptionKey?: string,
    isEncrypted: boolean = false,
    documentFiles?: string[],
    includeFileName: boolean = false
  ): Promise<SuccessInterface | ErrorInterface> {
    try {
      const dataFilesList: string[] = [];

      if (documentFiles !== undefined) {
        // Use provided file list
        dataFilesList.push(...documentFiles);
      } else {
        // Scan directory for .axiodb files
        const readResponse = await new FolderManager().ListDirectory(collectionPath);

        if ("data" in readResponse) {
          // Filter for .axiodb files only
          const axiodbFiles = readResponse.data.filter((file: string) =>
            file.endsWith(".axiodb")
          );
          dataFilesList.push(...axiodbFiles);
        } else {
          return this.ResponseHelper.Error("Failed to read directory");
        }
      }

      // Load all files using worker threads (parallel processing)
      const resultData = await ReaderWithWorker(
        dataFilesList,
        encryptionKey,
        collectionPath,
        isEncrypted,
        includeFileName
      );

      return this.ResponseHelper.Success(resultData);
    } catch (error) {
      return this.ResponseHelper.Error(error);
    }
  }
}
