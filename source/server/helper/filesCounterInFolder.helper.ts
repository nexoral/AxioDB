import fs from "node:fs/promises";
import path from "node:path";

/**
 * Recursively counts the number of files in a folder and its subfolders.
 *
 * This function traverses through the directory structure starting from the provided folder path
 * and counts all files encountered during the traversal. It does not count directories themselves.
 *
 * @param folderPath - The path to the folder to count files in
 * @returns A promise that resolves to the total number of files found
 *
 * @example
 * ```typescript
 * const count = await countFilesRecursive('/path/to/folder');
 * console.log(`Total files: ${count}`);
 * ```
 */
export default async function countFilesRecursive(folderPath: string) {
  let count = 0;
  const items = await fs.readdir(folderPath, { withFileTypes: true });

  for (const item of items) {
    const fullPath = path.join(folderPath, item.name);
    if (item.isFile()) {
      count++;
    } else if (item.isDirectory()) {
      count += await countFilesRecursive(fullPath);
    }
  }
  return count;
}
