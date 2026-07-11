/* eslint-disable @typescript-eslint/no-explicit-any */
import { hostname, platform } from "node:os";
import ResponseHelper from "./response.helper";
import { SuccessInterface } from "../config/Interfaces/Helper/response.helper.interface";
import CryptoGraphy from "./CryptoGraphy.helper";
import Converter from "./Converter.helper";

export class CryptoHelper {
  private encryptionKey: string;
  private readonly responseHelper: ResponseHelper = new ResponseHelper();
  private readonly Cryptography: CryptoGraphy;
  private readonly Converter = new Converter();

  /** If no encryptionKey is given, falls back to a default key derived from hostname + platform. */
  constructor(encryptionKey?: string) {
    this.encryptionKey = encryptionKey || `${hostname()}-${platform()}`;
    this.responseHelper = new ResponseHelper();
    this.Cryptography = new CryptoGraphy(this.encryptionKey);
    this.Converter = new Converter();
  }

  public async setEncryptionKey(
    encryptionKey: string,
  ): Promise<SuccessInterface> {
    this.encryptionKey = encryptionKey;
    return this.responseHelper.Success(
      "Encryption key has been set successfully",
    );
  }

  public async encrypt(data: string): Promise<string> {
    return await this.Cryptography.Encrypt(data);
  }

  public async decrypt(data: string): Promise<any> {
    return this.Converter.ToObject(await this.Cryptography.Decrypt(data));
  }

  public encryptSync(data: string): string {
    return this.Cryptography.EncryptSync(data);
  }

  public decryptSync(data: string): object {
    return this.Converter.ToObject(this.Cryptography.DecryptSync(data));
  }
}
