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

/**
 * Unzips a .tar.gz file to a specified destination folder
 * 
 * @param zipFilePath - The path to the compressed file to be unzipped
 * @param destFolder - The destination folder where the contents will be extracted
 * @returns A promise that resolves with the destination folder path when unzipping is complete
 * @throws Will reject the promise with an error if unzipping fails
 * 
 * @example
 * ```typescript
 * try {
 *   const extractedPath = await unzipFile('/path/to/archive.tar.gz', '/path/to/destination');
 *   console.log(`Files extracted to ${extractedPath}`);
 * } catch (error) {
 *   console.error('Failed to unzip file:', error);
 * }
 * ```
 */
export async function unzipFile(zipFilePath: string, destFolder: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const unzip = zlib.createUnzip();
    const source = fs.createReadStream(zipFilePath);

    source
      .pipe(unzip)
      .pipe(tar.x({ C: destFolder }))
      .on("finish", () => {
        console.log(`✅ Unzipped to: ${destFolder}`);
        resolve(destFolder);
      })
      .on("error", reject);
  });
}