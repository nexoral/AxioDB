/* eslint-disable @typescript-eslint/no-explicit-any */
import { ClassBased, StatusCodes } from 'outers';
import buildResponse from '../../helper/responseBuilder.helper';
import { ServerKeys } from '../../config/keys';

export default class KeyController {
  private readonly Generationkey: string;

  constructor(Generationkey: string){
    this.Generationkey = Generationkey;
  }

  public async generateKey(): Promise<string | any> {
    const originSessionKey = new ClassBased.JWT_Manager(this.Generationkey).generateLoginToken({
      issuer: ServerKeys.DEFAULT_KEY_ISSUER,
      Reason: ServerKeys.DEFAULT_KEY_REASON,
      audience: ServerKeys.DEFAULT_KEY_AUDIENCE,
      expiringIn: ServerKeys.DEFAULT_KEY_EXPIRE,
      Timestamp: ServerKeys.DEFAULT_KEY_TIMESTAMP,
    }, ServerKeys.DEFAULT_KEY_ROUNDS, ServerKeys.DEFAULT_KEY_EXPIRE).toKen;

    return buildResponse(StatusCodes.OK, "Key Generated Successfully", { originSessionKey });
  }

  public async verifyKey(key: string): Promise<string | any> {
    const isValid = new ClassBased.JWT_Manager(this.Generationkey).decode(key);
    console.log(isValid);
    if (!isValid) {
      return buildResponse(StatusCodes.UNAUTHORIZED, "Invalid Key", null);
    }
    return buildResponse(StatusCodes.OK, "Key Verified Successfully", null);
  }
}