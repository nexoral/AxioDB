/* eslint-disable @typescript-eslint/no-explicit-any */
import Collection from "../Collection/collection.operation";
import FileManager from "../../Storage/FileManager";
import FolderManager from "../../Storage/FolderManager";
import path from "path";

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
   * @returns {Promise<AxioDB>} - Returns the instance of AxioDB.
   */
  public async createCollection(collectionName: string): Promise<Collection> {
    console.log(`Creating Collection: ${collectionName}`);
    const collectionPath = path.join(this.path, collectionName);
    await this.folderManager.CreateDirectory(collectionPath);
    console.log(`Collection Created: ${collectionPath}`);
    const collection = new Collection(collectionName, collectionPath);
    return collection;
  }
}
