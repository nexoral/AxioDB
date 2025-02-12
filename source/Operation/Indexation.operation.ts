/* eslint-disable @typescript-eslint/no-explicit-any */

// Import Libraries
import FileManager from "../Storage/FileManager";
import FolderManager from "../Storage/FolderManager";
import { General } from "../config/Keys/Keys";
import path from "path";

/**
 * Class representing the AxioDB database.
 */
export class AxioDB {
  // Properties
  private readonly RootName: string;
  private currentPATH: string;
  private DBNamePath: string;
  private MetaFileLocation: string;
  private FileManager: FileManager;
  private FolderManager: FolderManager;

  /**
   * Creates an instance of AxioDB.
   */
  constructor() {
    this.RootName = General.DBMS_Name;
    this.currentPATH = path.resolve(".");
    this.DBNamePath = "./";
    this.MetaFileLocation = "";
    this.FileManager = new FileManager();
    this.FolderManager = new FolderManager();

    // Initialize AxioDB root
    this.initializeRoot();
  }

  /**
   * Initializes the root directory and metadata file.
   */
  private async initializeRoot(): Promise<void> {
    this.currentPATH = path.join(this.currentPATH, this.RootName);
    this.MetaFileLocation = path.join(
      this.currentPATH,
      `${this.RootName}.${General.DBMS_File_EXT}`,
    );

    // Create Root Folder & Metadata File
    await this.FolderManager.CreateDirectory(this.currentPATH);
    const exists = await this.FileManager.FileExists(this.MetaFileLocation);
    if (!exists.status) {
      await this.FileManager.CreateFile(this.MetaFileLocation);
      await this.FileManager.WriteFile(
        this.MetaFileLocation,
        JSON.stringify({ databases: [] }, null, 2),
      );
    }
  }

  /**
   * Creates a new database folder and updates the metadata file.
   * @param {string} DBName - Name of the database.
   * @returns {Promise<AxioDB>} - Returns the instance of AxioDB.
   */
  public async createDB(DBName: string): Promise<AxioDB> {
    const dbPath = path.join(this.currentPATH, DBName);
    await this.FolderManager.CreateDirectory(dbPath);

    // Update metadata
    const metadata = await this.getMetadata();
    metadata.databases.push({
      name: DBName,
      path: dbPath,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    await this.FileManager.WriteFile(
      this.MetaFileLocation,
      JSON.stringify(metadata, null, 2),
    );

    console.log(`Database Created: ${dbPath}`);
    return this;
  }

  /**
   * Creates a new collection inside the database.
   * @param {string} collectionName - Name of the collection.
   * @returns {Promise<AxioDB>} - Returns the instance of AxioDB.
   */
  public async createCollection(collectionName: string): Promise<AxioDB> {
    const collectionPath = path.join(this.currentPATH, collectionName);
    await this.FolderManager.CreateDirectory(collectionPath);

    // Update metadata
    const metadata = await this.getMetadata();
    const db = metadata.databases.find((db: any) => db.path === this.currentPATH);
    if (db) {
      db.collections = db.collections || [];
      db.collections.push({
        name: collectionName,
        path: collectionPath,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      db.updated_at = new Date().toISOString();
    }

    await this.FileManager.WriteFile(
      this.MetaFileLocation,
      JSON.stringify(metadata, null, 2),
    );

    console.log(`Collection Created: ${collectionPath}`);
    return this;
  }

  /**
   * Reads the metadata file.
   * @returns {Promise<any>} - Returns metadata object.
   */
  private async getMetadata(): Promise<any> {
    const metaData = await this.FileManager.ReadFile(this.MetaFileLocation);
    return metaData.status ? metaData.status : { databases: [] };
  }
}
