/* eslint-disable @typescript-eslint/no-explicit-any */
import Collection from "../Collection/collection.operation";
import FileManager from "../../Storage/FileManager";
import FolderManager from "../../Storage/FolderManager";
import path from "path";

// Crypto for hashing
import { CryptoHelper } from "../../Helper/Crypto.helper";

/**
 * Represents a database instance.
 */
export default class Database {
  name: string;
  path: string;
  collections: Collection[];
  private fileManager: FileManager;
  private folderManager: FolderManager;

  constructor(name: string, path: string) {
    this.name = name;
    this.path = path;
    this.collections = [];
    this.fileManager = new FileManager();
    this.folderManager = new FolderManager();
  }

  /**
   * Creates a new collection inside the specified database.
   * @param {string} collectionName - Name of the collection.
   * @param {object} schema - Schema of the collection.
   * @param {boolean} crypto - Enable crypto for the collection.
   * @param {string} key - Key for crypto.
   * @returns {Promise<AxioDB>} - Returns the instance of AxioDB.
   */
  public async createCollection(
    collectionName: string,
    schema: object | any,
    crypto: boolean = false,
    key?: string | undefined,
  ): Promise<Collection> {
    // Check if the collection already exists
    const collectionExists = await this.folderManager.DirectoryExists(
      path.join(this.path, collectionName),
    );
    if (collectionExists.status === true) {
      throw new Error(`Collection ${collectionName} already exists.`);
    }

    console.log(`Creating Collection: ${collectionName}`);
    const collectionPath = path.join(this.path, collectionName);
    await this.folderManager.CreateDirectory(collectionPath);
    console.log(`Collection Created: ${collectionPath}`);

    // if crypto is enabled, hash the collection name
    if (crypto) {
      const newCryptoInstance = new CryptoHelper(key);
      const collection = new Collection(
        collectionName,
        collectionPath,
        schema,
        crypto,
        newCryptoInstance,
      );
      return collection;
    } else {
      const collection = new Collection(collectionName, collectionPath, schema);
      return collection;
    }
  }
}
