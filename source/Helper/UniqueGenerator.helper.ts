import { randomInt } from "crypto";

const LETTERS = "abcdefghijklmnopqrstuvwxyz";

/**
 * Generates random alphabetic identifiers (document IDs, transaction IDs, session IDs).
 */
export default class UniqueGenerator {
  constructor(private readonly length: number) {}

  /**
   * Generates a random alphabetic string of the configured length.
   * @param isCapital - Return the result in uppercase when true.
   */
  RandomWord(isCapital = false): string {
    let result = "";
    for (let i = 0; i < this.length; i++) {
      result += LETTERS[randomInt(LETTERS.length)];
    }
    return isCapital ? result.toUpperCase() : result;
  }
}
