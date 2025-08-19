/* eslint-disable @typescript-eslint/no-explicit-any */
import { ClassBased, StatusCodes } from "outers";
import buildResponse from "../../helper/responseBuilder.helper";
import { ServerKeys } from "../../config/keys";

/**
 * Controller class for handling key generation and verification operations.
 *
 * This class provides functionality for generating session keys using JWT (JSON Web Token)
 * and verifying those keys for authentication purposes.
 *
 * @class KeyController
 */
export default class KeyController {
  private readonly Generationkey: string;

  constructor(Generationkey: string) {
    this.Generationkey = Generationkey;
  }

  /**
   * Generates a session key using JWT for authentication purposes.
   *
   * This method creates a new JWT token with default server key parameters
   * including issuer, reason, audience, expiration time, and timestamp.
   * The token is encrypted using the specified rounds of encryption.
   *
   * @returns {Promise<string | any>} A promise that resolves to a response object containing
   * the generated session key or an error object in case of failure.
   * The response includes status code, message, and the originSessionKey.
   *
   * @example
   * const keyController = new KeyController();
   * const response = await keyController.generateKey();
   * // response = { statusCode: 200, message: "Key Generated Successfully", data: { originSessionKey: "jwt-token" } }
   */
  public async generateKey(): Promise<string | any> {
    const originSessionKey = new ClassBased.JWT_Manager(
      this.Generationkey,
    ).generate(
      {
        issuer: ServerKeys.DEFAULT_KEY_ISSUER,
        Reason: ServerKeys.DEFAULT_KEY_REASON,
        audience: ServerKeys.DEFAULT_KEY_AUDIENCE,
        expiringIn: ServerKeys.DEFAULT_KEY_EXPIRE,
        Timestamp: ServerKeys.DEFAULT_KEY_TIMESTAMP,
      },
      ServerKeys.DEFAULT_KEY_EXPIRE,
    ).toKen;

    return buildResponse(StatusCodes.OK, "Key Generated Successfully", {
      originSessionKey,
      expiresIn: ServerKeys.DEFAULT_KEY_TIMESTAMP,
      expiryTime: ServerKeys.DEFAULT_KEY_EXPIRE
    });
  }

  /**
   * Verifies the provided API key.
   *
   * @param {string} key - The API key to verify
   * @returns {Promise<string | any>} A response object containing status code and message
   *   - If key is valid: Status 200 with success message
   *   - If key is invalid: Status 401 with error message
   */
  public async verifyKey(key: string): Promise<string | any> {
    const isValid = new ClassBased.JWT_Manager(this.Generationkey).decode(key);
    if (!isValid || isValid.status == "Invalid") {
      return buildResponse(StatusCodes.UNAUTHORIZED, "Invalid Key", null);
    }
    return buildResponse(StatusCodes.OK, "Key Verified Successfully", null);
  }
}
