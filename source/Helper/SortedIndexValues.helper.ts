/**
 * Maintains a sorted array of unique numeric index values and provides
 * binary-search bounds over it, so range queries ($gt/$gte/$lt/$lte) can
 * resolve against an index instead of falling back to a full collection scan.
 */
export default class SortedIndexValues {
  /**
   * Index of the first element >= target (a.k.a. lower_bound).
   * Returns `sortedValues.length` if every element is smaller than target.
   */
  public static lowerBound(sortedValues: number[], target: number): number {
    let low = 0;
    let high = sortedValues.length;
    while (low < high) {
      const mid = (low + high) >>> 1;
      if (sortedValues[mid] < target) {
        low = mid + 1;
      } else {
        high = mid;
      }
    }
    return low;
  }

  /**
   * Index of the first element > target (a.k.a. upper_bound).
   * Returns `sortedValues.length` if every element is <= target.
   */
  public static upperBound(sortedValues: number[], target: number): number {
    let low = 0;
    let high = sortedValues.length;
    while (low < high) {
      const mid = (low + high) >>> 1;
      if (sortedValues[mid] <= target) {
        low = mid + 1;
      } else {
        high = mid;
      }
    }
    return low;
  }

  /**
   * Inserts `value` keeping the array sorted and free of duplicates.
   * No-op if the value is already present.
   */
  public static insertSorted(sortedValues: number[], value: number): void {
    const pos = this.lowerBound(sortedValues, value);
    if (sortedValues[pos] !== value) {
      sortedValues.splice(pos, 0, value);
    }
  }

  /**
   * Removes `value` from the sorted array, if present.
   */
  public static removeSorted(sortedValues: number[], value: number): void {
    const pos = this.lowerBound(sortedValues, value);
    if (sortedValues[pos] === value) {
      sortedValues.splice(pos, 1);
    }
  }

  /**
   * Builds a sorted, de-duplicated numeric array from existing hash-map keys.
   * Used to lazily backfill indexes created before range support existed.
   * Non-numeric keys are skipped (range queries only ever apply to numbers).
   */
  public static backfillFromKeys(keys: string[]): number[] {
    const numericValues: number[] = [];
    for (const key of keys) {
      const numericValue = Number(key);
      if (!Number.isNaN(numericValue)) {
        numericValues.push(numericValue);
      }
    }
    return numericValues.sort((a, b) => a - b);
  }

  /**
   * Resolves the inclusive [startIndex, endIndex] slice of `sortedValues` that
   * satisfies the given range operators. Returns null if the range is empty.
   */
  public static resolveRange(
    sortedValues: number[],
    range: { $gt?: number; $gte?: number; $lt?: number; $lte?: number },
  ): { startIndex: number; endIndex: number } | null {
    let startIndex = 0;
    if (range.$gte !== undefined) {
      startIndex = Math.max(startIndex, this.lowerBound(sortedValues, range.$gte));
    }
    if (range.$gt !== undefined) {
      startIndex = Math.max(startIndex, this.upperBound(sortedValues, range.$gt));
    }

    let endIndex = sortedValues.length - 1;
    if (range.$lte !== undefined) {
      endIndex = Math.min(endIndex, this.upperBound(sortedValues, range.$lte) - 1);
    }
    if (range.$lt !== undefined) {
      endIndex = Math.min(endIndex, this.lowerBound(sortedValues, range.$lt) - 1);
    }

    if (startIndex > endIndex) {
      return null;
    }
    return { startIndex, endIndex };
  }
}
