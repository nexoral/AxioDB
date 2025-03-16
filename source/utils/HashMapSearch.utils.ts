/* eslint-disable @typescript-eslint/no-explicit-any */
export default class HashmapSearch {
  private indexMap: Map<string, number[]>;
  private data: any[];

  constructor(arr: any[]) {
    this.indexMap = new Map();
    this.data = arr;

    // Build index for each field in objects
    arr.forEach((obj, idx) => {
      for (const [key, value] of Object.entries(obj)) {
        const mapKey = `${key}:${value}`;
        if (!this.indexMap.has(mapKey)) {
          this.indexMap.set(mapKey, []);
        }
        this.indexMap.get(mapKey)!.push(idx);
      }
    });
  }

  /**
   * Finds and returns an array of items that match the given query.
   *
   * @param query - An object where the keys are the fields to search by and the values are the values to match.
   * @returns A promise that resolves to an array of items that match the query.
   *
   * The function works by creating a set of result indexes that match the query.
   * It iterates over each key in the query, constructs a map key, and retrieves the indexes from the indexMap.
   * If resultIndexes is null, it initializes it with the current indexes.
   * Otherwise, it performs an intersection to refine the results.
   * Finally, it maps the result indexes to the corresponding items in the data array and returns them.
   */
  public async find(query: { [x: string]: any }): Promise<any[]> {
    const keys = Object.keys(query);
    if (keys.length === 0) return [];

    let resultIndexes: Set<number> | null = null;

    for (const key of keys) {
      const mapKey = `${key}:${query[key]}`;
      const indexes = this.indexMap.get(mapKey) || [];

      if (resultIndexes === null) {
        resultIndexes = new Set(indexes);
      } else {
        // Perform intersection to refine results
        resultIndexes = new Set(
          [...resultIndexes].filter((i: number) => indexes.includes(i)),
        );
      }
    }

    return resultIndexes ? [...resultIndexes].map((i) => this.data[i]) : [];
  }
}
