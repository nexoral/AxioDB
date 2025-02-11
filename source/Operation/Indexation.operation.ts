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
  private readonly RootName: string; // Private Property
  private readonly Schema: object | any; // Private Property
  private currentPATH: string; // Private Property
  private DBNamePath: string; // Private Property
  private MetaData: object; // Private Property
  private MetaFileLocation: string; // Private Property

  /**
   * Creates an instance of AxioDB.
   * @param {string} DBName - The name of the collection.
   * @param {object | any} [Schema] - The schema object defining the structure of the collection.
   * @param {boolean} [isEncrypted=false] - Indicates if the collection is encrypted.
   */
  constructor() {
    this.RootName = General.DBMS_Name;
    this.currentPATH = path.resolve(".");
    this.DBNamePath = "./";
    this.MetaData = {};
    this.MetaFileLocation = "";
  }

  // Public Functions

  // Internal Functions

  /**
   * Creates the root directory for the tree structure.
   *
   * This method initializes the root directory using the cluster name.
   * It utilizes the FolderManager to create the directory asynchronously.
   *
   * @returns {Promise<void>} A promise that resolves when the directory is created.
   */
  public async CreateTreeRoot(): Promise<AxioDB> {
    await new FolderManager().CreateDirectory(
      (this.currentPATH = `${this.currentPATH}/${this.RootName}`),
    );
    await new FileManager().CreateFile(
      (this.MetaFileLocation = `${this.currentPATH}/${this.RootName}.${General.DBMS_File_EXT}`),
    );
    return this;
  }

  /**
   * Creates the collection directory.
   * @returns {Promise<AxioDB>} A promise that resolves when the collection directory is created.
   */
  public async createDatabase(DBName: string): Promise<AxioDB> {
    if (DBName) {
      await new FolderManager().CreateDirectory(
        `${this.currentPATH}/${DBName}/`,
      );

      this.DBNamePath = `${this.currentPATH}/${DBName}/`;
      this.currentPATH = `${this.currentPATH}/${DBName}/`;

      console.log(`Collection Directory Created: ${this.currentPATH}`);
      return this;
    } else {
      return this;
    }
  }
}
