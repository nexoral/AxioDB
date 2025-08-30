import fs from "fs";
import path from "path";
import zlib from "zlib";
import * as tar from "tar";


/**
 * Compresses a folder into a tar.gz archive.
 * 
 * @param sourceFolder - The path to the folder to be compressed
 * @param outPath - The destination path for the compressed archive
 * @returns A Promise that resolves when compression is complete
 * 
 * @example
 * // Compress a folder to a tar.gz file
 * await tarGzFolder('/path/to/source', '/path/to/archive.tar.gz');
 */
export async function tarGzFolder(sourceFolder: string, outPath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const gzip = zlib.createGzip();
    const dest = fs.createWriteStream(outPath);

    tar.c(
      {
        gzip: false, // let zlib handle gzip
        cwd: path.dirname(sourceFolder),
      },
      [path.basename(sourceFolder)]
    )
      .pipe(gzip)
      .pipe(dest)
      .on("finish", () => {
        console.log(`✅ Compressed to: ${outPath}`);
        resolve(outPath);
      })
      .on("error", reject);
  });
}