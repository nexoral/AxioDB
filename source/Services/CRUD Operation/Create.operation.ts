/* eslint-disable @typescript-eslint/no-explicit-any */
import { randomUUID } from "crypto";
import FileManager from "../../engine/Filesystem/FileManager";

import UniqueGenerator from "../../Helper/UniqueGenerator.helper";
import responseHelper from "../../Helper/response.helper";
import {
  ErrorInterface,
  SuccessInterface,
} from "../../config/Interfaces/Helper/response.helper.interface";
import { General } from "../../config/Keys/Keys";
import Converter from "../../Helper/Converter.helper";
import PathSanitizer from "../../Helper/PathSanitizer.helper";

/**
 * Class representing an insertion operation.
 */
export default class Insertion {
  private readonly collectionName: string;
  private readonly path: string | any;
  private readonly Converter: Converter;

  /**
   * Creates an instance of Insertion.
   * @param {string} collectionName - The name of the collection.
   * @param {string | any} path - The data to be inserted.
   */
  constructor(collectionName: string, path: string | any) {
    this.collectionName = collectionName;
    this.path = path;
    this.Converter = new Converter();
  }

  /**
   * Saves the data to a file.
   * @returns {Promise<any>} A promise that resolves with the response of the save operation.
   */
  public async Save(
    data: object | any,
    ExistingdocumentId?: string,
  ): Promise<SuccessInterface | ErrorInterface> {
    try {
      const documentId: string =
        ExistingdocumentId === undefined
          ? await this.generateUniqueDocumentId()
          : ExistingdocumentId;

      // Sanitize documentId to prevent directory traversal attacks
      const sanitizedDocumentId = PathSanitizer.sanitizePathComponent(documentId);
      const filePath = PathSanitizer.safePath(this.path, `${sanitizedDocumentId}${General.DBMS_File_EXT}`);

      // Write to a temp file, then atomically rename it over the target path.
      // `rename()` replaces an existing destination in a single filesystem operation
      // (same pattern Transaction.applyChanges() already uses), so a concurrent
      // unlocked reader of filePath always sees either the old file or the new one -
      // never a transient "file doesn't exist" gap, which a plain overwrite (or the
      // old delete-then-recreate update path) could expose.
      const fileManager = new FileManager();
      const tempFilePath = `${filePath}.tmp-${randomUUID()}`;
      const WriteResponse = await fileManager.WriteFile(
        tempFilePath,
        this.Converter.ToString(data),
      );

      if (WriteResponse.status) {
        const moveResponse = await fileManager.MoveFile(tempFilePath, filePath);
        if (!moveResponse.status) {
          return new responseHelper().Error("Failed to save data");
        }
        return new responseHelper().Success({
          Message: "Data Inserted Successfully",
          documentId: documentId,
        });
      }

      return new responseHelper().Error("Failed to save data");
    } catch (error) {
      return new responseHelper().Error(error);
    }
  }

  /**
   * Generates a unique document ID.
   * @returns {Promise<string>} A promise that resolves with a unique document ID.
   */
  public async generateUniqueDocumentId(): Promise<string> {
    let isExist = true;
    let ID;
    do {
      ID = new UniqueGenerator(15).RandomWord(true);
      // Sanitize ID to ensure safe file path
      const sanitizedID = PathSanitizer.sanitizePathComponent(ID);
      const response = await new FileManager().FileExists(
        PathSanitizer.safePath(this.path, `${sanitizedID}${General.DBMS_File_EXT}`),
      );
      isExist = response.status;
    } while (isExist);

    return ID;
  }
}
