import fs from "node:fs/promises";
import { General } from "../../config/Keys/Keys";

/**
 * Counts the real documents stored directly in a collection folder.
 *
 * Documents are flat `.axiodb` files in the collection root. Everything else
 * that lives there - the `indexes/` folder, `.transactions/` WAL staging, meta
 * files - is internal bookkeeping and must not be counted, which is why this is
 * neither recursive nor extension-agnostic.
 *
 * @param folderPath - Absolute path to the collection folder.
 * @returns Number of documents in that collection.
 */
export default async function countDocumentsInFolder(
  folderPath: string,
): Promise<number> {
  const items = await fs.readdir(folderPath, { withFileTypes: true });
  return items.filter(
    (item) => item.isFile() && item.name.endsWith(General.DBMS_File_EXT),
  ).length;
}
