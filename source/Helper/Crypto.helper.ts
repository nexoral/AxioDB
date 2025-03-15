/* eslint-disable @typescript-eslint/no-explicit-any */
// All Imports
import { hostname, platform } from "node:os";
import ResponseHelper from "./response.helper";
import { SuccessInterface } from "../config/Interfaces/Helper/response.helper.interface";
import { ClassBased } from "outers";
import Converter from "./Converter.helper";

/**
 * Helper class for cryptographic operations such as encryption and decryption.
 */
export class CryptoHelper {
  // properties
  /**
   * The encryption key used for cryptographic operations.
   */
  private encryptionKey: string;

  /**
   * Instance of ResponseHelper to handle responses.
   */
  private readonly responseHelper: ResponseHelper = new ResponseHelper();

  /**
   * Instance of Cryptography class for performing cryptographic operations.
   */
  private readonly Cryptography;

  /**
   * Instance of Converter class for converting data formats.
   */
  private readonly Converter = new Converter();

  /**
   * Constructor to initialize the CryptoHelper class.
   * @param encryptionKey - Optional encryption key. If not provided, a default key based on hostname and platform will be used.
   */
  constructor(encryptionKey?: string) {
    this.encryptionKey = encryptionKey || `${hostname()}-${platform()}`;
    this.responseHelper = new ResponseHelper();
    this.Cryptography = new ClassBased.CryptoGraphy(this.encryptionKey);
    this.Converter = new Converter();
  }

  // methods
  /**
   * Sets a new encryption key.
   * @param encryptionKey - The new encryption key to be set.
   * @returns A promise that resolves to a success response.
   */
  public async setEncryptionKey(
    encryptionKey: string,
  ): Promise<SuccessInterface> {
    this.encryptionKey = encryptionKey;
    return this.responseHelper.Success(
      "Encryption key has been set successfully",
    );
  }

  /**
   * Encrypts data asynchronously.
   * @param data - The data to be encrypted.
   * @returns A promise that resolves to the encrypted data as a string.
   */
  public async encrypt(data: string): Promise<string> {
    return await this.Cryptography.Encrypt(data);
  }

  /**
   * Decrypts data asynchronously.
   * @param data - The data to be decrypted.
   * @returns A promise that resolves to the decrypted data as an object.
   */
  public async decrypt(data: string): Promise<any> {
    return this.Converter.ToObject(await this.Cryptography.Decrypt(data));
  }

  /**
   * Encrypts data synchronously.
   * @param data - The data to be encrypted.
   * @returns The encrypted data as a string.
   */
  public encryptSync(data: string): string {
    return this.Cryptography.EncryptSync(data);
  }

  /**
   * Decrypts data synchronously.
   * @param data - The data to be decrypted.
   * @returns The decrypted data as an object.
   */
  public decryptSync(data: string): object {
    return this.Converter.ToObject(this.Cryptography.DecryptSync(data));
  }
}
