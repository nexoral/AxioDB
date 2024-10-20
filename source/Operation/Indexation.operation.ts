/* eslint-disable @typescript-eslint/no-explicit-any */

// Import Libraries
import { DBMS_Name } from "../config/DB";
export default class Configure {
  // Properties
  private readonly Sheema: object | any; // Private Property
  private isEncrypted: boolean; // Private Property
  #encryptionKey: string; // Private Property

  constructor(Sheema: object | any, isEncrypted: boolean = false) {
    this.Sheema = Sheema;
    this.isEncrypted = isEncrypted;
    this.#encryptionKey = DBMS_Name;
  }

  // Configure Methos
  public getSchema(): object | any {
    return this.Sheema;
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
}
