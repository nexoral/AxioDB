/* eslint-disable @typescript-eslint/no-explicit-any */
export default class Converter {
  static ToObject(): string {
    throw new Error("Method not implemented.");
  }
  constructor() {}

  public ToBoolean(value: string): boolean {
    return value === "true";
  }

  public ToNumber(value: string): number {
    return parseInt(value);
  }

  public ToObject(value: string): any {
    return JSON.parse(value);
  }

  public ToString(value: object): string {
    return JSON.stringify(value);
  }

  public ToStringArray(value: string): string[] {
    return value.split(",");
  }
}
