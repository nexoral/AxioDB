/* eslint-disable @typescript-eslint/no-explicit-any */

// Import Libraries
import FolderManager from "../Storage/FolderManager";
import { General } from "../config/Keys/Keys";
import path from "path";
import Insertion from "./Create.operation";

export default class AxioDB {
  // Properties
  private readonly collectionName: string; // Private Property
  private readonly Schema: object | any; // Private Property
  private isEncrypted: boolean; // Private Property
  #encryptionKey: string; // Private Property
  private readonly clusterName: string; // Private Property
  private readonly currentPATH: string; // Private Property
  private collectionPath: string; // Private Property

  constructor(
    collectionName: string,
    Schema?: object | any,
    isEncrypted = false,
    ClusterName: string = General.DBMS_Name,
  ) {
    this.collectionName = collectionName;
    this.Schema = Schema;
    this.isEncrypted = isEncrypted;
    this.#encryptionKey = General.DBMS_Name;
    this.clusterName = ClusterName;
    this.currentPATH = path.resolve(".");
    this.collectionPath = `${this.currentPATH}/${this.clusterName}/${this.collectionName}`;
  }

  // Configure Method
  public getSchema(): object | any {
    return this.Schema;
  }

  public EncryptionStatus(): boolean {
    return this.isEncrypted;
  }

  public getEncryptionKey(): string {
    return this.#encryptionKey;
  }

  public setEncryptionKey(key: string): void {
    this.#encryptionKey = key;
  }

  public setEncryptionStatus(status: boolean): void {
    this.isEncrypted = status;
  }

  public getConfiguration(): object | any {
    return {
      Schema: this.getSchema(),
      Encryption: {
        Status: this.EncryptionStatus(),
        Key: this.getEncryptionKey(),
      },
    };
  }

  // Public Functions
  public async Insert(data: object | any): Promise<void> {
    await new Insertion(this.collectionName, data).Save();
  }

  // Internal Functions
  /**
   * Creates the root directory for the tree structure.
   *
   * This method initializes the root directory using the cluster name.
   * It utilizes the FolderManager to create the directory asynchronously.
   *
   * @returns {Promise<void>} A promise that resolves when the directory is created.
   */
  public async CreateTreeRoot(): Promise<void> {
    await new FolderManager().CreateDirectory(
      `${this.currentPATH}/${this.clusterName}`,
    );
  }

  private async createCollection(): Promise<void> {
    if (this.isEncrypted) {
      await new FolderManager().CreateDirectory(
        `${this.currentPATH}/${this.clusterName}/${this.collectionName}/Encrypted`,
      );
      this.collectionPath = `${this.currentPATH}/${this.clusterName}/${this.collectionName}/Encrypted`;
    } else {
      await new FolderManager().CreateDirectory(
        `${this.currentPATH}/${this.clusterName}/${this.collectionName}`,
      );
      this.collectionPath = `${this.currentPATH}/${this.clusterName}/${this.collectionName}`;
    }
  }
}
