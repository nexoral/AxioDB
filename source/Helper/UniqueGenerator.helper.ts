import { randomInt } from "crypto";

const LETTERS = "abcdefghijklmnopqrstuvwxyz";
const DIGITS = "0123456789";

/**
 * Generates random identifiers (document IDs, transaction IDs, session IDs).
 */
export default class UniqueGenerator {
  constructor(private readonly length: number) {}

  /**
   * Generates a random string of the configured length.
   * @param isCapital - Return the result in uppercase when true.
   * @param includeNumbers - Include digits 0-9 in the character set (alphanumeric) when true.
   */
  RandomWord(isCapital = false, includeNumbers = false): string {
    const charset = includeNumbers ? LETTERS + DIGITS : LETTERS;
    let result = "";
    for (let i = 0; i < this.length; i++) {
      result += charset[randomInt(charset.length)];
    }
    return isCapital ? result.toUpperCase() : result;
  }
}
