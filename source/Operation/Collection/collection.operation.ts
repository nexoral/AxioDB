/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  ErrorInterface,
  SuccessInterface,
} from "../../config/Interfaces/Helper/response.helper.interface";
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

/**
 * Represents a collection inside a database.
 */
export default class Collection {
  private readonly name: string;
  private readonly path: string;
  private updatedAt: string;
  private schema: object | any;
  private isEncrypted: boolean;
  private cryptoInstance?: CryptoHelper;
  private Converter: Converter;
  private Insertion: Insertion;
  private encryptionKey: string | undefined;

  constructor(
    name: string,
    path: string,
    scema: object | any,
    isEncrypted = false,
    cryptoInstance?: CryptoHelper,
    encryptionKey?: string,
  ) {
    this.name = name;
    this.path = path;
    this.schema = scema;
    this.isEncrypted = isEncrypted;
    this.cryptoInstance = cryptoInstance;
    this.Converter = new Converter();
    this.updatedAt = new Date().toISOString();
    this.encryptionKey = encryptionKey;
    // Initialize the Insertion class
    this.Insertion = new Insertion(this.name, this.path);
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
      return;
    }

    // Encrypt the data if crypto is enabled
    if (this.cryptoInstance && this.isEncrypted) {
      data = await this.cryptoInstance.encrypt(this.Converter.ToString(data));
    }

    // Save the data
    return await this.Insertion.Save(data);
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

  public aggregate(PipelineQuerySteps: object[]): Aggregation {
    // Check if Pipeline Steps is valid Array of Object
    if (!PipelineQuerySteps) {
      throw new Error("Please provide valid Pipeline Steps");
    }
    return new Aggregation(this.name
      , this.path
      , PipelineQuerySteps
      , this.isEncrypted
      , this.encryptionKey);
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
