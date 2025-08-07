/* eslint-disable @typescript-eslint/no-explicit-any */
import Collection from "../Collection/collection.operation";
import FileManager from "../../engine/Filesystem/FileManager";
import FolderManager from "../../engine/Filesystem/FolderManager";
import path from "path";

// Crypto for hashing
import { CryptoHelper } from "../../Helper/Crypto.helper";
import ResponseHelper from "../../Helper/response.helper";
import { StatusCodes } from "outers";
import {
  ErrorInterface,
  SuccessInterface,
} from "../../config/Interfaces/Helper/response.helper.interface";
import { CollectionMap, FinalCollectionsInfo } from "../../config/Interfaces/Operation/database.operation.interface";

/**
 * Represents a database instance.
 */
export default class Database {
  private name: string;
  private readonly path: string;
  private fileManager: FileManager;
  private folderManager: FolderManager;
  private ResponseHelper: ResponseHelper;
  private collectionMap: Map<string, CollectionMap>;

  constructor(name: string, path: string) {
    this.name = name;
    this.path = path;
    this.fileManager = new FileManager();
    this.folderManager = new FolderManager();
    this.ResponseHelper = new ResponseHelper();
    this.collectionMap = new Map<string, CollectionMap>();
  }

  /**
   * Creates a new collection inside the specified database.
   * @param {string} collectionName - Name of the collection.
   * @param {boolean} crypto - Enable crypto for the collection.
   * @param {string} key - Key for crypto.
   * @param {boolean} isSchemaNeeded - Whether the collection requires a schema.
   * @param {object} schema - Schema of the collection.
   * @returns {Promise<AxioDB>} - Returns the instance of AxioDB.
   */
  public async createCollection(
    collectionName: string,
    crypto: boolean = false,
    key?: string | undefined,
    isSchemaNeeded: boolean = false,
    schema?: object | any
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
      // Store collection metadata in the collectionMap
      // Note: The collectionMap is now storing an object instead of a Collection instance
      this.collectionMap.set(collectionName, {
        isCryptoEnabled: crypto,
        cryptoKey: key,
        path: collectionPath,
        schema: schema,
        isSchema: isSchemaNeeded,
      })
      return collection;
    } else {
      const collection = new Collection(
        collectionName,
        collectionPath,
        isSchemaNeeded,
        schema,
      );
      // Store collection metadata in the collectionMap
      this.collectionMap.set(collectionName, {
        isCryptoEnabled: crypto,
        cryptoKey: key,
        path: collectionPath,
        schema: schema,
        isSchema: isSchemaNeeded,
      })
      return collection;
    }
  }

  /**
   * Checks if a collection exists in the database.
   * @param {string} collectionName - Name of the collection to check.
   * @returns {Promise<boolean>} - Returns true if the collection exists, false otherwise.
   **/
    public async isCollectionExists(collectionName: string): Promise<boolean> {
      const collectionPath = path.join(this.path, collectionName);
      const exists = await this.folderManager.DirectoryExists(collectionPath);
      return exists.statusCode === StatusCodes.OK;
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
      this.collectionMap.delete(collectionName); // Remove from collectionMap
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
        CollectionMap: this.collectionMap,
        AllCollectionsPaths: collections.data.map((collection: string) =>
          path.join(this.path, collection),
        ),
      };
      return this.ResponseHelper.Success(FinalCollections);
    }
  }
}
