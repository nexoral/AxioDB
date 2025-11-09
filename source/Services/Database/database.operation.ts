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
import { FinalCollectionsInfo } from "../../config/Interfaces/Operation/database.operation.interface";
import { IndexManager } from "../Index/Index.service";

// Types
type CollectionMetadata = {
  name: string;
  path: string;
  isEncrypted?: boolean;
  encryptionKey?: string;
};

/**
 * Represents a database instance.
 * This class provides methods to create, delete, and manage collections within a database.
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
   * @param {boolean} crypto - Enable crypto for the collection.
   * @param {string} key - Key for crypto.
   * @returns {Promise<AxioDB>} - Returns the instance of AxioDB.
   */
  public async createCollection(
    collectionName: string,
    crypto: boolean = false,
    key?: string | undefined,
  ): Promise<Collection> {
    // Check if the collection already exists
    const collectionExists = await this.folderManager.DirectoryExists(
      path.join(this.path, collectionName),
    );
    const collectionPath = path.join(this.path, collectionName);

    const CollectionMeta = await this.getCollectionMetaDetails(collectionName);

    if (CollectionMeta) {
      crypto = CollectionMeta.isEncrypted
        ? Boolean(CollectionMeta.isEncrypted)
        : false;
      key = CollectionMeta.encryptionKey ? CollectionMeta.encryptionKey : key;
    }

    // If the collection does not exist, create it
    if (collectionExists.statusCode !== StatusCodes.OK) {
      await this.folderManager.CreateDirectory(collectionPath);
      console.log(`Collection Created: ${collectionPath}`);
    }

    // Create AutoIndex meta for the collection
    const Index = new IndexManager(collectionPath);
    await Index.generateIndexMeta();

    // if crypto is enabled, hash the collection name
    if (crypto === true) {
      const newCryptoInstance = new CryptoHelper(key);
      const collection = new Collection(
        collectionName,
        collectionPath,
        crypto,
        newCryptoInstance,
        key,
      );
      // Store collection metadata in the collectionMap
      await this.AddCollectionMetadata({
        name: collectionName,
        path: collectionPath,
        encryptionKey: key === undefined ? "" : key,
        isEncrypted: crypto === undefined ? false : crypto,
      });
      return collection;
    } else {
      const collection = new Collection(
        collectionName,
        collectionPath,
      );
      // Store collection metadata in the collectionMap
      await this.AddCollectionMetadata({
        name: collectionName,
        path: collectionPath,
        encryptionKey: key === undefined ? "" : key,
        isEncrypted: crypto === undefined ? false : crypto,
      });
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
      // Remove collection metadata
      const status = await this.dropCollectionMetadata(collectionName);
      if (status && "statusCode" in status && status.statusCode !== 200) {
        return status;
      }
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
    // Remove All .meta related things
    collections.data = collections.data.filter(
      (collection: string) => !collection.endsWith(".meta"),
    );
    const totalSize = await this.folderManager.GetDirectorySize(
      path.resolve(this.path),
    );

    // Get collection Status
    const CollectionStatus = await Promise.all(
      collections.data.map((collection: string) =>
        this.getCollectionMetaDetails(collection),
      ),
    );

    if ("data" in collections && "data" in totalSize) {
      const FinalCollections: FinalCollectionsInfo = {
        CurrentPath: this.path,
        RootName: this.name,
        MatrixUnits: "MB",
        TotalCollections: `${collections.data.length} Collections`,
        TotalSize: parseInt((totalSize.data / 1024 / 1024).toFixed(4)),
        ListOfCollections: collections.data,
        collectionMetaStatus: CollectionStatus,
        AllCollectionsPaths: collections.data.map((collection: string) =>
          path.join(this.path, collection),
        ),
      };
      return this.ResponseHelper.Success(FinalCollections);
    }
  }

  /**
   * Removes the metadata entry for a collection from the collection metadata file.
   *
   * Reads the JSON file located at `${this.path}/collection.meta`, validates that the
   * file exists and contains an array of collection metadata objects, removes any entry
   * whose `name` matches the provided `collectionName`, and writes the updated array
   * back to the same file.
   *
   * The method returns a SuccessInterface on successful removal (even if no matching
   * collection was found) or an ErrorInterface describing the failure.
   *
   * @param collectionName - The name of the collection whose metadata should be removed.
   * @returns A promise that resolves to SuccessInterface on success or ErrorInterface on failure.
   *
   * @remarks
   * - If the metadata file does not exist, an ErrorInterface is returned.
   * - If the metadata file cannot be parsed as a JSON array, an ErrorInterface is returned.
   * - This method performs I/O using a FileManager instance and uses this.ResponseHelper
   *   to construct success/error responses. It does not throw; failures are reported via
   *   the returned ErrorInterface.
   *
   * @example
   * // Remove the "users" collection metadata
   * await db.dropCollectionMetadata("users");
   */
  public async dropCollectionMetadata(
    collectionName: string,
  ): Promise<SuccessInterface | ErrorInterface> {
    const FileManagement: FileManager = new FileManager();
    const isFileExist = await FileManagement.FileExists(
      `${this.path}/collection.meta`,
    );
    if (isFileExist.status == false) {
      return this.ResponseHelper.Error("Collection metadata file does not exist");
    } else {
      const FullData = JSON.parse(
        (await FileManagement.ReadFile(`${this.path}/collection.meta`)).data,
      );
      if (!Array.isArray(FullData)) {
        return this.ResponseHelper.Error("Invalid collection metadata format");
      }
      const UpdatedData = FullData.filter(
        (data: CollectionMetadata) => data.name !== collectionName,
      );
      await FileManagement.WriteFile(
        `${this.path}/collection.meta`,
        JSON.stringify(UpdatedData),
      );
      return this.ResponseHelper.Success(
        `Collection metadata for ${collectionName} dropped successfully`,
      );
    }
  }

  /**
   * Adds metadata for a collection to the collection metadata file.
   *
   * @param collectionData - The metadata of the collection to add
   * @returns A Promise that resolves when the operation is complete, or rejects with an error if the collection metadata format is invalid
   * @private
   *
   * This method performs the following operations:
   * 1. Checks if the collection metadata file exists
   * 2. If the file doesn't exist, creates it with the provided collection metadata
   * 3. If the file exists, reads the existing metadata, adds the new collection metadata (if not already present), and writes back to the file
   *
   * @throws {Error} If the collection metadata format is invalid
   */
  private async AddCollectionMetadata(collectionData: CollectionMetadata) {
    const FileManagement: FileManager = new FileManager();
    const isFileExist = await FileManagement.FileExists(
      `${this.path}/collection.meta`,
    );
    if (isFileExist.status == false) {
      await FileManagement.WriteFile(
        `${this.path}/collection.meta`,
        JSON.stringify([collectionData]),
      );
    } else {
      const FullData = JSON.parse(
        (await FileManagement.ReadFile(`${this.path}/collection.meta`)).data,
      );
      if (!Array.isArray(FullData)) {
        return new ResponseHelper().Error("Invalid collection metadata format");
      }
      const isSameExist = FullData.filter(
        (data: CollectionMetadata) => data.name === collectionData.name,
      );
      if (isSameExist.length == 0) {
        FullData.push(collectionData);
        await FileManagement.WriteFile(
          `${this.path}/collection.meta`,
          JSON.stringify(FullData),
        );
      }
    }
  }

  /**
   * Retrieves metadata details for a specific collection.
   *
   * @param collectionName - The name of the collection to retrieve metadata for
   * @returns A Promise that resolves to the collection's metadata if found, or undefined if not found
   * @private
   *
   * This method:
   * 1. Checks if the collection.meta file exists
   * 2. Reads and parses the metadata file if it exists
   * 3. Validates that the data is an array
   * 4. Finds and returns the metadata for the specified collection
   */
  private async getCollectionMetaDetails(
    collectionName: string,
  ): Promise<CollectionMetadata | undefined> {
    const FileManagement: FileManager = new FileManager();
    const isFileExist = await FileManagement.FileExists(
      `${this.path}/collection.meta`,
    );
    if (isFileExist.status == false) {
      return undefined;
    }
    const FullData = JSON.parse(
      (await FileManagement.ReadFile(`${this.path}/collection.meta`)).data,
    );
    if (!Array.isArray(FullData)) {
      return undefined;
    }
    const collectionMeta = FullData.find(
      (data: CollectionMetadata) => data.name === collectionName,
    );
    return collectionMeta;
  }
}
