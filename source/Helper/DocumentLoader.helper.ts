import { SuccessInterface, ErrorInterface } from '../config/Interfaces/Helper/response.helper.interface';
import FolderManager from '../engine/Filesystem/FolderManager';
import ReaderWithWorker from '../utility/BufferLoaderWithWorker.utils';
import responseHelper from './response.helper';

/**
 * Centralizes document-loading logic that used to be duplicated across the Reader,
 * Update, Delete, and Aggregation operations - handles both a direct file list and
 * full directory scanning (filtered to `.axiodb` files), loaded via worker threads.
 */
export default class DocumentLoader {
  private static readonly ResponseHelper = new responseHelper();

  static async loadDocuments(
    collectionPath: string,
    documentFiles?: string[],
    includeFileName: boolean = false
  ): Promise<SuccessInterface | ErrorInterface> {
    try {
      const dataFilesList: string[] = [];

      if (documentFiles !== undefined) {
        dataFilesList.push(...documentFiles);
      } else {
        const readResponse = await new FolderManager().ListDirectory(collectionPath);

        if ("data" in readResponse) {
          const axiodbFiles = readResponse.data.filter((file: string) =>
            file.endsWith(".axiodb")
          );
          dataFilesList.push(...axiodbFiles);
        } else {
          return this.ResponseHelper.Error("Failed to read directory");
        }
      }

      // Loaded via worker threads for parallelism
      const resultData = await ReaderWithWorker(
        dataFilesList,
        collectionPath,
        includeFileName
      );

      return this.ResponseHelper.Success(resultData);
    } catch (error) {
      return this.ResponseHelper.Error(error);
    }
  }
}
