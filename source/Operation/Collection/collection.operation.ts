/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  ErrorInterface,
  SuccessInterface,
} from "../../config/Interfaces/Helper/response.helper.interface";
import ResponseHelper from "../../Helper/response.helper";
// Operations
import Insertion from "../CRUD Operation/Create.operation";
import Reader from "../CRUD Operation/Reader.operation";
import DeleteOperation from "../CRUD Operation/Delete.operation";
import UpdateOperation from "../CRUD Operation/Update.operation";
import Aggregation from "../Aggregation/Aggregation.Operation";

import { Console } from "outers";
// Validator
import SchemaValidator from "../../Models/validator.models";
import { CryptoHelper } from "../../Helper/Crypto.helper";

// Converter
import Converter from "../../Helper/Converter.helper";
import { SchemaTypes } from "../../Models/DataTypes.models";
import FolderManager from "../../Storage/FolderManager";

/**
 * Represents a collection inside a database.
 */
export default class Collection {
  private readonly name: string;
  private readonly path: string;
  private readonly updatedAt: string;
  private schema: object | any;
  private readonly isEncrypted: boolean;
  private readonly cryptoInstance?: CryptoHelper;
  private Converter: Converter;
  private Insertion: Insertion;
  private readonly encryptionKey: string | undefined;

  constructor(
    name: string,
    path: string,
    schema?: object | any,
    isEncrypted = false,
    cryptoInstance?: CryptoHelper,
    encryptionKey?: string,
  ) {
    this.name = name;
    this.path = path;
    this.schema = schema;
    this.isEncrypted = isEncrypted;
    this.cryptoInstance = cryptoInstance;
    this.Converter = new Converter();
    this.updatedAt = new Date().toISOString();
    this.encryptionKey = encryptionKey;
    // Initialize the Insertion class
    this.Insertion = new Insertion(this.name, this.path);
  }

  /**
   * Get Numbers of Documents in the Collection
   * @returns {Promise<number>} - A promise that resolves with the number of documents in the collection.
   * @throws {Error} - Throws an error if the collection is empty or if there is an issue with the query.
   */
  public async totalDocuments(): Promise<SuccessInterface | ErrorInterface> {
    // Check if the collection is empty
    if (!this.name) {
      throw new Error("Collection name cannot be empty");
    }

    // Check if the path is empty
    if (!this.path) {
      throw new Error("Path cannot be empty");
    }

    try {
      // Check if Directory Locked or not
      const isLocked = await new FolderManager().IsDirectoryLocked(this.path);
      if ("data" in isLocked) {
        if (isLocked.data === false) {
          // List all files in the directory
          const files = await new FolderManager().ListDirectory(this.path);
          return new ResponseHelper().Success({
            message: "Total Documents in the Collection",
            total: files.data.length,
          });
        } else {
          // if Directory is locked then unlock it
          const unlockResponse = await new FolderManager().UnlockDirectory(
            this.path,
          );
          if ("data" in unlockResponse) {
            // List all files in the directory
            const files = await new FolderManager().ListDirectory(this.path);
            // Lock the directory again
            const lockResponse = await new FolderManager().LockDirectory(
              this.path,
            );
            if ("data" in lockResponse) {
              return new ResponseHelper().Success({
                message: "Total Documents in the Collection",
                total: files.data.length,
              });
            } else {
              return new ResponseHelper().Error("Cannot lock the directory");
            }
          } else {
            return new ResponseHelper().Error("Cannot unlock the directory");
          }
        }
      } else {
        return new ResponseHelper().Error("Cannot access the directory");
      }
    } catch (error) {
      return new ResponseHelper().Error(error);
    }
  }

  /**
   * Inserts a document into the collection.
   * @param {object} data - The data to be inserted.
   * @returns {Promise<any>} - A promise that resolves with the response of the insertion operation.
   */
  public async insert(
    data: object | any,
  ): Promise<SuccessInterface | ErrorInterface | undefined> {
    // Check if data is empty or not
    if (!data) {
      throw new Error("Data cannot be empty");
    }

    // Check if data is an object or not
    if (typeof data !== "object") {
      throw new Error("Data must be an object.");
    }

    // Insert the updatedAt field in schema & data
    data.updatedAt = this.updatedAt;

    this.schema.updatedAt = SchemaTypes.date().required();
    // Validate the data
    const validator = await SchemaValidator(this.schema, data, false);

    if (validator?.details) {
      Console.red("Validation Error", validator.details);
      return new ResponseHelper().Error(validator.details);
    }

    // Add the documentId to the data
    const documentId: string = await this.Insertion.generateUniqueDocumentId();
    data.documentId = documentId;

    // Encrypt the data if crypto is enabled
    if (this.cryptoInstance && this.isEncrypted) {
      data = await this.cryptoInstance.encrypt(this.Converter.ToString(data));
    }

    // Save the data
    return await this.Insertion.Save(data, documentId);
  }

  /**
   * Reads a document from the collection.
   * @param {object} query - The query to be executed
   * @returns {Reader} - An instance of the Reader class.
   */
  public query(query: object | any): Reader {
    // Check if documentId is empty or not
    if (!query) {
      throw new Error("Query cannot be empty");
    }
    // Read the data
    return new Reader(
      this.name,
      this.path,
      query,
      this.isEncrypted,
      this.encryptionKey,
    );
  }

  /**
   * Initiates an aggregation operation on the collection with the provided pipeline steps.
   * @param {object[]} PipelineQuerySteps - The pipeline steps to be executed.
   * @returns {Aggregation} - An instance of the Aggregation class.
   * @throws {Error} Throws an error if the pipeline steps are empty.
   * @example
   * ```typescript
   * // Aggregate the collection to get the total count of documents
   * collection.aggregate([{$match: {}}, ${group: {_id: null, count: {$sum: 1}}}]).exec();
   * ```
   */
  public aggregate(PipelineQuerySteps: object[]): Aggregation {
    // Check if Pipeline Steps is valid Array of Object
    if (!PipelineQuerySteps) {
      throw new Error("Please provide valid Pipeline Steps");
    }
    return new Aggregation(
      this.name,
      this.path,
      PipelineQuerySteps,
      this.isEncrypted,
      this.encryptionKey,
    );
  }

  /**
   * Initiates a delete operation on the collection with the provided query.
   *
   * @param query - The query object that specifies which documents to delete.
   * @returns A DeleteOperation instance that can be executed to perform the deletion.
   * @throws {Error} Throws an error if the query is empty.
   *
   * @example
   * ```typescript
   * // Delete all documents where age is greater than 30
   * collection.delete({ age: { $gt: 30 } });
   * ```
   */
  public delete(query: object | any): DeleteOperation {
    // Check if documentId is empty or not
    if (!query) {
      throw new Error("Query cannot be empty");
    }
    // Delete the data
    return new DeleteOperation(
      this.name,
      this.path,
      query,
      this.isEncrypted,
      this.encryptionKey,
    );
  }

  public update(query: object | any): UpdateOperation {
    if (!query) {
      throw new Error("Query cannot be empty");
    }
    return new UpdateOperation(
      this.name,
      this.path,
      query,
      this.schema,
      this.isEncrypted,
      this.encryptionKey,
    );
  }
}
