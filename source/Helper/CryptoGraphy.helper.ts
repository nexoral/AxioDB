import CryptoJS from "crypto-js";

/**
 * AES encryption/decryption wrapper backed by crypto-js.
 *
 * The exact call shape (JSON.stringify before encrypt, Utf8 decode after decrypt)
 * is preserved intentionally so collections encrypted by earlier AxioDB versions
 * remain decryptable.
 */
export default class CryptoGraphy {
  constructor(private readonly key: string) {}

  async Encrypt(data: unknown): Promise<string> {
    return this.EncryptSync(data);
  }

  async Decrypt(data: string): Promise<string> {
    return this.DecryptSync(data);
  }

  EncryptSync(data: unknown): string {
    if (!this.key) {
      throw new Error("Missing key");
    }
    return CryptoJS.AES.encrypt(JSON.stringify(data), this.key).toString();
  }

  DecryptSync(data: string): string {
    if (!this.key) {
      throw new Error("Missing key");
    }
    const bytes = CryptoJS.AES.decrypt(data, this.key);
    return bytes.toString(CryptoJS.enc.Utf8);
  }
}
