/* eslint-disable @typescript-eslint/no-explicit-any */

// Import Libraries
import FileManager from "../engine/Filesystem/FileManager";
import FolderManager from "../engine/Filesystem/FolderManager";
import { General } from "../config/Keys/Keys";
import path from "path";
import Database from "./Database/database.operation";
// import startWebServer from "../server/Fastify";

// Helper Classes
import Converter from "../Helper/Converter.helper";
import { Console, StatusCodes } from "outers";
import ResponseHelper from "../Helper/response.helper";

// Interfaces
import {
  ErrorInterface,
  SuccessInterface,
} from "../config/Interfaces/Helper/response.helper.interface";
import { FinalDatabaseInfo } from "../config/Interfaces/Operation/Indexation.operation.interface";
import createAxioDBControlServer from "../server/config/server";
import { DatabaseMap } from "../config/Interfaces/Operation/database.operation.interface";

/**
 * Class representing the AxioDB database.
 * @param {string} RootName - The name of the root folder.
 * @returns {AxioDB} - Returns the instance of AxioDB.
 */
export class AxioDB {
  private readonly RootName: string;
  private currentPATH: string;
  private fileManager: FileManager;
  private folderManager: FolderManager;
  private Converter: Converter;
  private ResponseHelper: ResponseHelper;
  private static _instance: AxioDB;
  private DatabaseMap: Map<string, DatabaseMap>;
  private GUI: boolean = General.DBMS_GUI_Enable;

  constructor(GUI?: boolean, RootName?: string, CustomPath?: string) {
    if (AxioDB._instance) {
      throw new Error("Only one instance of AxioDB is allowed.");
    }
    AxioDB._instance = this;
    this.RootName = RootName || General.DBMS_Name; // Set the root name
    this.currentPATH = path.resolve(CustomPath || "."); // Set the current path
    this.fileManager = new FileManager(); // Initialize the FileManager class
    this.folderManager = new FolderManager(); // Initialize the FolderManager class
    this.Converter = new Converter(); // Initialize the Converter class
    this.ResponseHelper = new ResponseHelper(); // Initialize the ResponseHelper class
    this.initializeRoot(); // Ensure root initialization
    this.DatabaseMap = new Map<string, DatabaseMap>(); // Initialize the DatabaseMap
    this.GUI = GUI !== undefined ? GUI : General.DBMS_GUI_Enable; // Set GUI option
  }

  /**
   * Initializes the root directory for the AxioDB.
   *
   * This method sets the `currentPATH` to include the `RootName` and checks if the AxioDB folder exists.
   * If the folder does not exist, it attempts to create it. If the creation fails, an error is thrown.
   *
   * @throws {Error} If the AxioDB folder cannot be created.
   * @returns {Promise<void>} A promise that resolves when the initialization is complete.
   */
  private async initializeRoot(): Promise<void> {
    this.currentPATH = path.join(this.currentPATH, this.RootName); // Correctly set the path

    // Check if the AxioDB folder exists
    const exists = await this.folderManager.DirectoryExists(this.currentPATH);

    if (exists.statusCode !== StatusCodes.OK) {
      const Dir_Status = await this.folderManager.CreateDirectory(
        this.currentPATH,
      );

      if (Dir_Status.statusCode !== StatusCodes.OK) {
        throw new Error(
          `Failed to create AxioDB folder: ${Dir_Status.statusCode}`,
        );
      } else {
        console.log(`AxioDB folder created at: ${this.currentPATH}`);
      }
    }
    if (this.GUI){
      Console.green("Starting AxioDB Control Server...");
      createAxioDBControlServer(this); // Start the web Control Server with the AxioDB instance
    }
  }

  /**
   * Gets the current path of the indexation operation.
   * @returns {string} The current path.
   */
  public get GetPath(): string {
    return this.currentPATH;
  }

  /**
   * Creates a new database folder and updates the metadata file.
   * @param DBName - The name of the database to create.
   * @returns The newly created database object.
   */
  public async createDB(DBName: string): Promise<Database> {
    const dbPath = path.join(this.currentPATH, DBName);

    // Check if the database already exists
    const exists = await this.folderManager.DirectoryExists(dbPath);
    if (exists.statusCode !== StatusCodes.OK) {
      await this.folderManager.CreateDirectory(dbPath);
      console.log(`Database Created: ${dbPath}`);
    }
    const newDB = new Database(DBName, dbPath);
    // Store database metadata in the DatabaseMap
    // Note: The DatabaseMap is now storing an object instead of a Database instance
    this.DatabaseMap.set(DBName, { DatabaseName: DBName, path: dbPath });
    return newDB;
  }

  // Information about the AxioDB instance
  /**
   * Retrieves information about the databases in the current directory.
   *
   * This method performs the following operations:
   * 1. Lists all directories (databases) in the current path.
   * 2. Calculates the total size of the current directory.
   * 3. Checks if the data from both operations is returned.
   * 4. Logs the number of databases.
   * 5. Constructs an object containing the total size, total number of databases, and the list of databases.
   * 6. Sends a success response with the constructed object.
   *
   * @returns {Promise<SuccessInterface | undefined>} A promise that resolves when the database information is successfully retrieved and the response is sent.
   */
  public async getInstanceInfo(): Promise<SuccessInterface | undefined> {
    const totalDatabases = await this.folderManager.ListDirectory(
      path.resolve(this.currentPATH),
    );

    // First

    const totalSize = await this.folderManager.GetDirectorySize(
      path.resolve(this.currentPATH),
    );
    // check if all data is returned
    if ("data" in totalDatabases && "data" in totalSize) {
      const FinalDatabaseInfo: FinalDatabaseInfo = {
        CurrentPath: this.currentPATH,
        RootName: this.RootName,
        TotalSize: parseFloat(totalSize.data),
        TotalDatabases: `${totalDatabases.data.length} Databases`,
        ListOfDatabases: totalDatabases.data,
        DatabaseMap: this.DatabaseMap,
        AllDatabasesPaths: totalDatabases.data.map((db: string) =>
          path.join(this.currentPATH, db),
        ),
      };
      return this.ResponseHelper.Success(FinalDatabaseInfo);
    } else {
      return this.ResponseHelper.Error("Failed to get database info");
    }
  }

  /**
   * Checks if a database with the given name exists
   *
   * @param DBName - The name of the database to check for existence
   * @returns A Promise that resolves to a boolean indicating whether the database exists
   *
   * @example
   * ```typescript
   * const exists = await indexation.isDatabaseExists('myDatabase');
   * if (exists) {
   *   console.log('Database exists');
   * }
   * ```
   */
  public async isDatabaseExists(DBName: string): Promise<boolean> {
    const dbPath = path.join(this.currentPATH, DBName);
    const exists = await this.folderManager.DirectoryExists(dbPath);
    return exists.statusCode === StatusCodes.OK;
  }

  // Delete Database
  /**
   * Deletes a database from the current directory.
   *
   * This method performs the following operations:
   * 1. Checks if the database exists.
   * 2. Deletes the database if it exists.
   * 3. Sends a success response if the database is deleted.
   *
   * @param {string} DBName - The name of the database to delete.
   * @returns {Promise<SuccessInterface>} A promise that resolves when the database is successfully deleted and the response is sent.
   */
  public async deleteDatabase(
    DBName: string,
  ): Promise<SuccessInterface | ErrorInterface | undefined> {
    const dbPath = path.join(this.currentPATH, DBName);
    const exists = await this.folderManager.DirectoryExists(dbPath);

    if (exists.statusCode === StatusCodes.OK) {
      await this.folderManager.DeleteDirectory(dbPath);
      this.DatabaseMap.delete(DBName); // Remove from DatabaseMap
      return this.ResponseHelper.Success(
        `Database: ${DBName} deleted successfully`,
      );
    } else {
      return this.ResponseHelper.Error(`Database: ${DBName} does not exist`);
    }
  }
}
