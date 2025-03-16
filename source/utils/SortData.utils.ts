/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Class representing a sorting utility.
 */
export default class Sorting {
  // Properties
  private readonly arr: any[];
  private readonly query: { [s: string]: unknown } | ArrayLike<unknown>;

  /**
   * Create a Sorting instance.
   * @param arr - The array to be sorted.
   * @param query - The query object containing the sorting key and order.
   */
  constructor(
    arr: any[],
    query: { [s: string]: unknown } | ArrayLike<unknown>,
  ) {
    this.arr = arr;
    this.query = query;
  }

  /**
   * Sort the array based on the query.
   * @param arr - The array to be sorted.
   * @param query - The query object containing the sorting key and order.
   * @returns A promise that resolves to the sorted array.
   */
  public async sort(): Promise<any[]> {
    const [key, order] = Object.entries(this.query)[0] as [string, number]; // Extract the field and order (1 for ascending, -1 for descending)
    return [...this.arr].sort((a, b) => {
      if (a[key] < b[key]) return order;
      if (a[key] > b[key]) return -order;
      return 0;
    });
  }
}
