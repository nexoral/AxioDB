/* eslint-disable @typescript-eslint/no-explicit-any */
export default class HashmapSearch {
  private data: any[];

  constructor(arr: any[]) {
    this.data = arr;
  }

  /**
   * Finds and returns an array of items that match the given query.
   * Supports MongoDB-like operators such as $regex, $gt, $lt, and $in.
   *
   * @param query - An object where the keys are the fields to search by, and the values can be exact values or operators.
   * @returns A promise that resolves to an array of items that match the query.
   */
  public async find(query: { [key: string]: any }, aditionalFiled?: string | number | undefined): Promise<any[]> {
    if (aditionalFiled) {
      return this.data.filter((item) => this.matchesQuery(item[aditionalFiled], query));
    }
    return this.data.filter((item) => this.matchesQuery(item, query));
  }

  /**
   * Checks if an object matches the given query.
   *
   * @param item - The object to check.
   * @param query - The query object containing search criteria.
   * @returns A boolean indicating if the object matches the query.
   */
  private matchesQuery(item: any, query: { [key: string]: any }): boolean {
    return Object.keys(query).every((key) => {
      const queryValue = query[key];
      const itemValue = item[key];

      if (typeof queryValue === "object" && queryValue !== null) {
        // Handle MongoDB-like operators
        if ("$regex" in queryValue && typeof queryValue["$regex"] === "string") {
          const regex = new RegExp(queryValue["$regex"], queryValue["$options"] || "i");
          return regex.test(itemValue);
        }

        if ("$gt" in queryValue && typeof itemValue === "number") {
          return itemValue > queryValue["$gt"];
        }

        if ("$lt" in queryValue && typeof itemValue === "number") {
          return itemValue < queryValue["$lt"];
        }

        if("$gte" in queryValue && typeof itemValue === "number") {
          return itemValue >= queryValue["$gte"];
        }

        if("$lte" in queryValue && typeof itemValue === "number") {
          return itemValue <= queryValue["$lte"];
        }

        if ("$in" in queryValue && Array.isArray(queryValue["$in"])) {
          return queryValue["$in"].includes(itemValue);
        }

        if ("$eq" in queryValue) {
          return itemValue === queryValue["$eq"];
        }
      }

      // Direct equality check for simple queries
      return itemValue === queryValue;
    });
  }
}
