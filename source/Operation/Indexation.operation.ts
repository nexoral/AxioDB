/* eslint-disable @typescript-eslint/no-explicit-any */

// Import Libraries
import FileManager from "../Storage/FileManager";
import FolderManager from "../Storage/FolderManager";
import { General } from "../config/Keys/Keys";
import path from "path";
import Database from "./Database/database.operation";
import startWebServer from "../server/Fastify";
import Converter from "../Helper/Converter.helper";
import { StatusCodes } from "outers";

/**
 * Class representing the AxioDB database.
 */
/**
 * Class representing the AxioDB database system.
 */
export class AxioDB {
  private readonly RootName: string;
  private currentPATH: string;
  private MetaFileLocation!: string;
  private fileManager: FileManager;
  private folderManager: FolderManager;
  private Converter: Converter;

  constructor() {
    this.RootName = General.DBMS_Name;
    this.currentPATH = path.resolve("."); // Set the base path

    this.fileManager = new FileManager(); // Initialize the FileManager class
    this.folderManager = new FolderManager(); // Initialize the FolderManager class
    this.Converter = new Converter(); // Initialize the Converter class

    this.initializeRoot(); // Ensure root initialization
  }

  private async initializeRoot(): Promise<void> {
    this.currentPATH = path.join(this.currentPATH, this.RootName); // Correctly set the path

    console.log(`Checking if AxioDB root exists at: ${this.currentPATH}`);

    // Check if the AxioDB folder exists
    const exists = await this.folderManager.DirectoryExists(this.currentPATH);

    if (exists.statusCode !== StatusCodes.OK) {
      console.log("AxioDB folder not found. Creating...");
      const Dir_Status = await this.folderManager.CreateDirectory(this.currentPATH);

      if (Dir_Status.statusCode !== StatusCodes.OK) {
        throw new Error(`Failed to create AxioDB folder: ${Dir_Status.statusCode}`);
      } else {
        console.log(`AxioDB folder created at: ${this.currentPATH}`);
      }
    } else {
      console.log("AxioDB root folder already exists.");
    }

    // Set metadata file path AFTER updating currentPATH
    this.MetaFileLocation = path.join(this.currentPATH, `${this.RootName}.${General.DBMS_File_EXT}`);

    // Create metadata file if it doesn't exist
    const metaExists = await this.fileManager.FileExists(this.MetaFileLocation);
    if (metaExists.statusCode !== StatusCodes.OK) {
      console.log("Creating metadata file...");
      await this.fileManager.CreateFile(this.MetaFileLocation);
      await this.fileManager.WriteFile(this.MetaFileLocation, this.Converter.ToString({ databases: [] }));
      console.log("Metadata file created successfully.");
    } else {
      console.log("Metadata file already exists.");
    }

    startWebServer(); // Start the web server
  }

  /**
   * Creates a new database folder and updates the metadata file.
   */
  public async createDB(DBName: string): Promise<Database> {
    const dbPath = path.join(this.currentPATH, DBName);

    // Check if DB already exists
    const metadata = await this.getMetadata();
    if (metadata.databases.some((db: any) => db.name === DBName)) {
      throw new Error(`Database "${DBName}" already exists.`);
    }

    await this.folderManager.CreateDirectory(dbPath);

    const newDB = new Database(DBName, dbPath, this.MetaFileLocation);
    metadata.databases.push({
      name: DBName,
      path: dbPath,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      collections: [],
    });

    await this.fileManager.WriteFile(this.MetaFileLocation, JSON.stringify(metadata, null, 2));

    console.log(`Database Created: ${dbPath}`);
    return newDB;
  }

  /**
   * Reads the metadata file.
   */
  public async getMetadata(): Promise<any> {
    const metaData = await this.fileManager.ReadFile(this.MetaFileLocation);
    return metaData.status ? metaData : { databases: [] };
  }
}

