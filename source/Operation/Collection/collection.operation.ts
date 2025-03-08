/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  ErrorInterface,
  SuccessInterface,
} from "../../config/Interfaces/Helper/response.helper.interface";
import Insertion from "../CRUD Operation/Create.operation";
import Reader from "../CRUD Operation/Reader.operation";
import { Console } from "outers";
// Validator
import SchemaValidator from "../../Models/validator.models";
import { CryptoHelper } from "../../Helper/Crypto.helper";

// Converter
import Converter from "../../Helper/Converter.helper";

/**
 * Represents a collection inside a database.
 */
export default class Collection {
  name: string;
  path: string;
  createdAt: string;
  updatedAt: string;
  private schema: object | any;
  private isEncrypted: boolean;
  private cryptoInstance?: CryptoHelper;
  private Converter: Converter;
  private Insertion: Insertion;

  constructor(
    name: string,
    path: string,
    scema: object | any,
    isEncrypted = false,
    cryptoInstance?: CryptoHelper,
  ) {
    this.name = name;
    this.path = path;
    this.schema = scema;
    this.isEncrypted = isEncrypted;
    this.cryptoInstance = cryptoInstance;
    this.Converter = new Converter();
    this.createdAt = new Date().toISOString();
    this.updatedAt = new Date().toISOString();
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

    // Validate the data
    const validator = await SchemaValidator(this.schema, data);

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
  public query(
    query: object | any,
  ): Reader {
    // Check if documentId is empty or not
    if (!query) {
      throw new Error("Query cannot be empty");
    }

    // Read the data
    return new Reader(this.name, this.path, query, this.isEncrypted);
  }
}
