/* eslint-disable @typescript-eslint/no-explicit-any */
import Collection from "../Collection/collection.operation";
import FileManager from "../../engine/Filesystem/FileManager";
import FolderManager from "../../engine/Filesystem/FolderManager";
import path from "path";
import ResponseHelper from "../../Helper/response.helper";
import PathSanitizer from "../../Helper/PathSanitizer.helper";
import { StatusCodes } from "../../config/Keys/StatusCode";
import {
  ErrorInterface,
  SuccessInterface,
} from "../../config/Interfaces/Helper/response.helper.interface";
import { FinalCollectionsInfo } from "../../config/Interfaces/Operation/database.operation.interface";
import { CollectionResolver } from "../../config/Interfaces/Operation/aggregation.interface";
import { IndexManager } from "../Index/Index.service";
import { IndexCache } from "../Index/IndexCache.service";
import { General } from "../../config/Keys/Keys";
import DocumentLoader from "../../Helper/DocumentLoader.helper";

// Types
type CollectionMetadata = {
  name: string;
  path: string;
};

/**
 * Represents a database instance.
 * This class provides methods to create, delete, and manage collections within a database.
 */
export default class Database {
  private name: string;
  private readonly path: string;
  private readonly collectionMetaPath: string;
  private fileManager: FileManager;
  private folderManager: FolderManager;
  private ResponseHelper: ResponseHelper;

  constructor(name: string, path: string) {
    this.name = name;
    this.path = path;
    this.collectionMetaPath = `${path}/${General.Collection_Meta_File}`;
    this.fileManager = new FileManager();
    this.folderManager = new FolderManager();
    this.ResponseHelper = new ResponseHelper();
  }

  /**
   * Creates a new collection inside the specified database.
   * @param {string} collectionName - Name of the collection.
   * @returns {Promise<AxioDB>} - Returns the instance of AxioDB.
   */
  public async createCollection(
    collectionName: string,
  ): Promise<Collection> {
    // Sanitize collection name to prevent directory traversal attacks
    const sanitizedCollectionName = PathSanitizer.sanitizePathComponent(collectionName);

    // Check if the collection already exists
    const collectionExists = await this.folderManager.DirectoryExists(
      PathSanitizer.safePath(this.path, sanitizedCollectionName),
    );
    const collectionPath = PathSanitizer.safePath(this.path, sanitizedCollectionName);

    // If the collection does not exist, create it
    if (collectionExists.statusCode !== StatusCodes.OK) {
      await this.folderManager.CreateDirectory(collectionPath);
      console.log(`Collection Created: ${collectionPath}`);
    }

    // Create AutoIndex meta for the collection
    const Index = new IndexManager(collectionPath);
    await Index.generateIndexMeta();

    const resolver = this.createCollectionResolver();
    const collection = new Collection(collectionName, collectionPath, resolver);
    // Store collection metadata in the collectionMap
    await this.AddCollectionMetadata({
      name: collectionName,
      path: collectionPath,
    });
    return collection;
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
      // Drop the shared index cache for this path - otherwise its cleanup timer
      // keeps running and the registry keeps a stale entry for a deleted collection.
      IndexCache.releaseInstance(collectionPath);
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
    // The registry file lives alongside the collection folders - it is not a collection.
    collections.data = collections.data.filter(
      (collection: string) => collection !== General.Collection_Meta_File,
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
   * Replays `collection.meta.jsonl`, drops any entry whose `name` matches the provided
   * `collectionName`, and rewrites the surviving entries as JSONL. This is the one path
   * that rewrites the registry - additions are plain appends.
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
    const isFileExist = await FileManagement.FileExists(this.collectionMetaPath);
    if (isFileExist.status == false) {
      return this.ResponseHelper.Error("Collection metadata file does not exist");
    }

    const remaining = (await this.readCollectionMetadata()).filter(
      (data: CollectionMetadata) => data.name !== collectionName,
    );
    await FileManagement.WriteFile(
      this.collectionMetaPath,
      remaining.map((entry) => JSON.stringify(entry)).join("\n") +
        (remaining.length > 0 ? "\n" : ""),
    );
    return this.ResponseHelper.Success(
      `Collection metadata for ${collectionName} dropped successfully`,
    );
  }

  /**
   * Reads the JSONL collection registry, one entry per line, last-write-wins per name.
   *
   * Streams the file rather than parsing it whole, and tolerates a torn final line from a
   * crash mid-append - every complete line before it still loads.
   */
  private async readCollectionMetadata(): Promise<CollectionMetadata[]> {
    const lines = await new FileManager().ReadLines(this.collectionMetaPath);
    const byName = new Map<string, CollectionMetadata>();
    for (const line of lines) {
      try {
        const entry = JSON.parse(line) as CollectionMetadata;
        if (entry?.name) {
          byName.set(entry.name, entry);
        }
      } catch {
        continue;
      }
    }
    return [...byName.values()];
  }

  /**
   * Adds metadata for a collection to the collection metadata file.
   *
   * @param collectionData - The metadata of the collection to add
   * @returns A Promise that resolves when the operation is complete, or rejects with an error if the collection metadata format is invalid
   * @private
   *
   * Appends one JSONL line for a collection that isn't registered yet - the entries already
   * on disk are never rewritten. The existence check keeps `createCollection()` on an
   * existing collection (which is idempotent) from growing the file on every call.
   */
  private async AddCollectionMetadata(collectionData: CollectionMetadata) {
    const existing = await this.readCollectionMetadata();
    if (existing.some((data) => data.name === collectionData.name)) {
      return;
    }
    await new FileManager().AppendFile(
      this.collectionMetaPath,
      `${JSON.stringify(collectionData)}\n`,
    );
  }

  /**
   * Retrieves metadata details for a specific collection.
   *
   * @param collectionName - The name of the collection to retrieve metadata for
   * @returns A Promise that resolves to the collection's metadata if found, or undefined if not found
   * @private
   *
   * Returns undefined when the registry has no line for that collection.
   */
  private async getCollectionMetaDetails(
    collectionName: string,
  ): Promise<CollectionMetadata | undefined> {
    return (await this.readCollectionMetadata()).find(
      (data: CollectionMetadata) => data.name === collectionName,
    );
  }

  /**
   * Creates a collection resolver function for cross-collection data access.
   * Used by $lookup to load documents from sibling collections within the same database.
   *
   * @returns A CollectionResolver function that loads all documents from a named collection
   * @private
   */
  private createCollectionResolver(): CollectionResolver {
    return async (targetCollectionName: string, query?: Record<string, any>): Promise<any[]> => {
      const sanitizedTarget = PathSanitizer.sanitizePathComponent(targetCollectionName);
      const targetPath = PathSanitizer.safePath(this.path, sanitizedTarget);

      const exists = await this.folderManager.DirectoryExists(targetPath);
      if (exists.statusCode !== StatusCodes.OK) {
        throw new Error(
          `Collection "${targetCollectionName}" does not exist in database "${this.name}"`,
        );
      }

      // Try index-optimized load when query is provided
      if (query && Object.keys(query).length > 0) {
        try {
          const { ReadIndex } = await import("../Index/ReadIndex.service");
          const fileNames = await new ReadIndex(targetPath).getFileFromIndex(query);
          if (fileNames.length > 0) {
            const result = await DocumentLoader.loadDocuments(targetPath, fileNames, false);
            if ("data" in result) return result.data;
          }
        } catch {
          // Index miss — fall through to full scan
        }
      }

      const result = await DocumentLoader.loadDocuments(targetPath);
      if ("data" in result) return result.data;
      throw new Error(`Failed to load documents from collection "${targetCollectionName}"`);
    };
  }
}
