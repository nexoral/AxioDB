/* eslint-disable @typescript-eslint/no-explicit-any */
import Collection from "../Collection/collection.operation";
import FileManager from "../../Storage/FileManager";
import FolderManager from "../../Storage/FolderManager";
import path from "path";

// Crypto for hashing
import { CryptoHelper } from "../../Helper/Crypto.helper";
import ResponseHelper from "../../Helper/response.helper";
import { StatusCodes } from "outers";
import {
  ErrorInterface,
  SuccessInterface,
} from "../../config/Interfaces/Helper/response.helper.interface";
import { FinalCollectionsInfo } from "../../config/Interfaces/Operation/database.operation.interface";

/**
 * Represents a database instance.
 */
export default class Database {
  private name: string;
  private readonly path: string;
  private fileManager: FileManager;
  private folderManager: FolderManager;
  private ResponseHelper: ResponseHelper;

  constructor(name: string, path: string) {
    this.name = name;
    this.path = path;
    this.fileManager = new FileManager();
    this.folderManager = new FolderManager();
    this.ResponseHelper = new ResponseHelper();
  }

  /**
   * Creates a new collection inside the specified database.
   * @param {string} collectionName - Name of the collection.
   * @param {boolean} isSchemaNeeded - Whether the collection requires a schema.
   * @param {object} schema - Schema of the collection.
   * @param {boolean} crypto - Enable crypto for the collection.
   * @param {string} key - Key for crypto.
   * @returns {Promise<AxioDB>} - Returns the instance of AxioDB.
   */
  public async createCollection(
    collectionName: string,
    isSchemaNeeded: boolean = false,
    schema: object | any,
    crypto: boolean = false,
    key?: string | undefined,
  ): Promise<Collection> {
    // Check if the collection already exists
    const collectionExists = await this.folderManager.DirectoryExists(
      path.join(this.path, collectionName),
    );
    const collectionPath = path.join(this.path, collectionName);

    // If the collection does not exist, create it
    if (collectionExists.statusCode !== StatusCodes.OK) {
      await this.folderManager.CreateDirectory(collectionPath);
      console.log(`Collection Created: ${collectionPath}`);
    }

    // if crypto is enabled, hash the collection name
    if (crypto === true) {
      const newCryptoInstance = new CryptoHelper(key);
      const collection = new Collection(
        collectionName,
        collectionPath,
        isSchemaNeeded,
        schema,
        crypto,
        newCryptoInstance,
        key,
      );
      return collection;
    } else {
      const collection = new Collection(
        collectionName,
        collectionPath,
        isSchemaNeeded,
        schema,
      );
      return collection;
    }
  }

  /**
   * Deletes a collection from the database.
   * @param {string} collectionName - Name of the collection to delete.
   * @returns {Promise<void>} - Returns a promise.
   * @throws {Error} - Throws an error if the collection does not exist.
   */
  public async deleteCollection(
    collectionName: string,
  ): Promise<SuccessInterface | ErrorInterface | undefined> {
    const collectionPath = path.join(this.path, collectionName);
    const exists = await this.folderManager.DirectoryExists(collectionPath);
    if (exists.statusCode === StatusCodes.OK) {
      await this.folderManager.DeleteDirectory(collectionPath);
      return this.ResponseHelper.Success(
        `Collection: ${collectionName} deleted successfully`,
      );
    } else {
      return this.ResponseHelper.Error(
        `Collection: ${collectionName} does not exist`,
      );
    }
  }

  /**
   * Lists all collections in the database.
   * @returns {Promise<FinalCollectionsInfo>} - Returns a promise with the list of collections data.
   * @throws {Error} - Throws an error if the database does not exist.
   */
  public async getCollectionInfo(): Promise<SuccessInterface | undefined> {
    const collections = await this.folderManager.ListDirectory(this.path);
    const totalSize = await this.folderManager.GetDirectorySize(
      path.resolve(this.path),
    );
    if ("data" in collections && "data" in totalSize) {
      const FinalCollections: FinalCollectionsInfo = {
        CurrentPath: this.path,
        RootName: this.name,
        MatrixUnits: "MB",
        TotalCollections: `${collections.data.length} Collections`,
        TotalSize: parseInt((totalSize.data / 1024 / 1024).toFixed(4)),
        ListOfCollections: collections.data,
        AllCollectionsPaths: collections.data.map((collection: string) =>
          path.join(this.path, collection),
        ),
      };
      return this.ResponseHelper.Success(FinalCollections);
    }
  }
}
