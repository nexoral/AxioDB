import { Document } from "../config/Interfaces/shared.types";

/**
 * Class representing a sorting utility.
 */
export default class Sorting {
  // Properties
  private readonly arr: Document[];
  private readonly query: { [s: string]: unknown } | ArrayLike<unknown>;

  /**
   * Create a Sorting instance.
   * @param arr - The array to be sorted.
   * @param query - The query object containing the sorting key and order.
   */
  constructor(
    arr: Document[],
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
  public async sort(aditionalField?: string): Promise<Document[]> {
    const [key, order] = Object.entries(this.query)[0] as [string, number]; // Extract the field and order (1 for ascending, -1 for descending)

    if (aditionalField) {
      return [...this.arr].sort((a, b) => {
        const aVal = (a[aditionalField] as Record<string, unknown>)?.[key];
        const bVal = (b[aditionalField] as Record<string, unknown>)?.[key];

        if (typeof aVal === "number" && typeof bVal === "number") {
          return (aVal - bVal) * order;
        }

        if (typeof aVal === "string" && typeof bVal === "string") {
          return aVal.localeCompare(bVal) * order;
        }

        return 0;
      });
    } else {
      return [...this.arr].sort((a, b) => {
        const aVal = a[key];
        const bVal = b[key];

        if (typeof aVal === "number" && typeof bVal === "number") {
          return (aVal - bVal) * order;
        }

        if (typeof aVal === "string" && typeof bVal === "string") {
          return aVal.localeCompare(bVal) * order;
        }

        return 0;
      });
    }
  }
}
