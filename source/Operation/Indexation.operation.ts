/* eslint-disable @typescript-eslint/no-explicit-any */

// Import Libraries
import FileManager from "../Storage/FileManager";
import FolderManager from "../Storage/FolderManager";
import { General } from "../config/Keys/Keys";
import path from "path";
import Database from "./Database/database.operation";
// import startWebServer from "../server/Fastify";

// Helper Classes
import Converter from "../Helper/Converter.helper";
import { StatusCodes } from "outers";
import ResponseHelper from "../Helper/response.helper";

// Interfaces
import {
  ErrorInterface,
  SuccessInterface,
} from "../config/Interfaces/Helper/response.helper.interface";
import { FinalDatabaseInfo } from "../config/Interfaces/Operation/Indexation.operation.interface";

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

  constructor(RootName?: string) {
    this.RootName = RootName || General.DBMS_Name; // Set the root name
    this.currentPATH = path.resolve("."); // Set the base path
    this.fileManager = new FileManager(); // Initialize the FileManager class
    this.folderManager = new FolderManager(); // Initialize the FolderManager class
    this.Converter = new Converter(); // Initialize the Converter class
    this.ResponseHelper = new ResponseHelper(); // Initialize the ResponseHelper class
    this.initializeRoot(); // Ensure root initialization
  }

  private async initializeRoot(): Promise<void> {
    this.currentPATH = path.join(this.currentPATH, this.RootName); // Correctly set the path

    console.log(`Checking if ${this.RootName} root exists at: ${this.currentPATH}`);

    // Check if the AxioDB folder exists
    const exists = await this.folderManager.DirectoryExists(this.currentPATH);

    if (exists.statusCode !== StatusCodes.OK) {
      console.log("AxioDB folder not found. Creating...");
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
    // startWebServer(); // Start the web server
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
  public async getDatabaseInfo(): Promise<SuccessInterface | undefined> {
    const totalDatabases = await this.folderManager.ListDirectory(
      path.resolve(this.currentPATH),
    );
    const totalSize = await this.folderManager.GetDirectorySize(
      path.resolve(this.currentPATH),
    );

    // check if all data is returned
    if ("data" in totalDatabases && "data" in totalSize) {
      const FinalDatabaseInfo: FinalDatabaseInfo = {
        TotalSize: `${(totalSize.data / 1024 / 1024).toFixed(4)} MB`,
        TotalDatabases: `${totalDatabases.data.length} Databases`,
        ListOfDatabases: totalDatabases.data,
        AllDatabasesPaths: totalDatabases.data.map((db: string) =>
          path.join(this.currentPATH, db),
        ),
      };
      return this.ResponseHelper.Success(FinalDatabaseInfo);
    }
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
      return this.ResponseHelper.Success(
        `Database: ${DBName} deleted successfully`,
      );
    } else {
      return this.ResponseHelper.Error(`Database: ${DBName} does not exist`);
    }
  }
}
