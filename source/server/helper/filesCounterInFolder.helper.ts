import fs from "node:fs/promises";
import path from "node:path";

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
