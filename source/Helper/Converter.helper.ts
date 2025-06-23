/* eslint-disable @typescript-eslint/no-explicit-any */
export default class Converter {
  static ToObject(data: any): string {
    throw new Error("Method not implemented.");
  }
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
  public ToObject(value: string): any {
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
