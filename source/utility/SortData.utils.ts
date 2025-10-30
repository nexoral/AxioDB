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
   * Optimized for performance using native comparison operators.
   * @param arr - The array to be sorted.
   * @param query - The query object containing the sorting key and order.
   * @returns A promise that resolves to the sorted array.
   */
  public async sort(aditionalField?: string): Promise<any[]> {
    const [key, order] = Object.entries(this.query)[0] as [string, number]; // Extract the field and order (1 for ascending, -1 for descending)

    if (aditionalField) {
      // Optimized sort with direct subtraction for numbers and localeCompare for strings
      return [...this.arr].sort((a, b) => {
        const aVal = a[aditionalField][key];
        const bVal = b[aditionalField][key];

        // Fast path for numbers
        if (typeof aVal === "number" && typeof bVal === "number") {
          return (aVal - bVal) * -order;
        }

        // Fast path for strings
        if (typeof aVal === "string" && typeof bVal === "string") {
          return aVal.localeCompare(bVal) * -order;
        }

        // Fallback for other types
        if (aVal < bVal) return -order;
        if (aVal > bVal) return order;
        return 0;
      });
    } else {
      // Optimized sort with direct subtraction for numbers and localeCompare for strings
      return [...this.arr].sort((a, b) => {
        const aVal = a[key];
        const bVal = b[key];

        // Fast path for numbers
        if (typeof aVal === "number" && typeof bVal === "number") {
          return (aVal - bVal) * -order;
        }

        // Fast path for strings
        if (typeof aVal === "string" && typeof bVal === "string") {
          return aVal.localeCompare(bVal) * -order;
        }

        // Fallback for other types
        if (aVal < bVal) return -order;
        if (aVal > bVal) return order;
        return 0;
      });
    }
  }
}
