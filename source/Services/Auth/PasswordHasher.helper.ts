import { randomBytes, scrypt, timingSafeEqual } from "crypto";

const KEY_LENGTH = 64;
const SALT_LENGTH = 16;

/**
 * Hashes and verifies passwords using Node's built-in scrypt KDF.
 * Stored format is `${saltHex}:${hashHex}` - no external dependency required.
 */
export default class PasswordHasher {
  public static async hashPassword(plainPassword: string): Promise<string> {
    const salt = randomBytes(SALT_LENGTH).toString("hex");
    const derivedKey = await PasswordHasher.deriveKey(plainPassword, salt);
    return `${salt}:${derivedKey.toString("hex")}`;
  }

  public static async verifyPassword(
    plainPassword: string,
    storedHash: string,
  ): Promise<boolean> {
    const [salt, hashHex] = storedHash.split(":");
    if (!salt || !hashHex) {
      return false;
    }

    const derivedKey = await PasswordHasher.deriveKey(plainPassword, salt);
    const storedKey = Buffer.from(hashHex, "hex");

    if (derivedKey.length !== storedKey.length) {
      return false;
    }

    return timingSafeEqual(derivedKey, storedKey);
  }

  private static deriveKey(plainPassword: string, salt: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      scrypt(plainPassword, salt, KEY_LENGTH, (error, derivedKey) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(derivedKey);
      });
    });
  }
}
