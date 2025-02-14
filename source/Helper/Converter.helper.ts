export default class Converter {
  constructor() {} // Empty constructor

  /**
   * Converts a string to a boolean.
   * @param value The string to convert.
   * @returns The boolean value.
   */
  public ToBoolean(value: string): boolean {
    return value === "true";
  }

  /**
   * Converts a string to a number.
   * @param value The string to convert.
   * @returns The number value.
   */

  public ToNumber(value: string): number {
    return parseInt(value);
  }

  /**
   * Converts a string to a JSON object.
   * @param value The string to convert.
   * @returns The JSON object.
   */
  public ToObject(value: string): object {
    return JSON.parse(value);
  }

  /**
   * Converts a JSON object to a string.
   * @param value The JSON object to convert.
   * @returns The string.
   */
  public ToString(value: object): string {
    return JSON.stringify(value);
  }

  /**
   * Converts a string to a string array.
   * @param value The string to convert.
   * @returns The string array.
   */

  public ToStringArray(value: string): string[] {
    return value.split(",");
  }
}
