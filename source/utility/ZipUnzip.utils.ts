import fs from "fs";
import path from "path";
import zlib from "zlib";
import * as tar from "tar";
import { Transform } from "node:stream";
import { pipeline } from "node:stream/promises";

/** Thrown when an archive breaches a safety limit. Callers should answer 400, not 500. */
export class UnsafeArchiveError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UnsafeArchiveError";
  }
}

/**
 * Extraction limits.
 *
 * What makes 42.zip dangerous is its expansion *ratio*, not its size - so this is a ratio
 * guard, not a size cap. A fixed byte ceiling has to be either low enough to reject a
 * legitimate large export or high enough to let a bomb through; no single value does both.
 * Ratio separates them cleanly: a real export is .axiodb JSON and compresses maybe 5-20:1,
 * while a bomb needs three orders of magnitude more than that to be worth building.
 *
 * A genuine archive therefore imports however large it is, and free disk space - not a
 * constant picked in advance - is what actually bounds the total.
 */
export const ARCHIVE_LIMITS = {
  /**
   * Maximum decompressed:compressed ratio. Gzip's theoretical ceiling is ~1032:1 and bombs
   * sit at the top of that range; 100:1 leaves real text and JSON an ample margin.
   */
  maxCompressionRatio: 100,
  /**
   * Ratio is only judged after this much has decompressed. Early in a stream the figure is
   * meaningless - headers and the first block look extreme on any archive.
   */
  ratioSampleBytes: 8 * 1024 * 1024,
  /** Stop before the filesystem does, leaving this much free. */
  freeSpaceMarginBytes: 256 * 1024 * 1024,
  /** Guards against an archive of millions of tiny files exhausting inodes. */
  maxEntries: 200_000,
  /** Hard ceiling on decompressed bytes. Off by default - disk space is the real bound. */
  maxUncompressedBytes: Infinity,
};

/** Bytes free on the volume holding `target`, or Infinity if it cannot be determined. */
function freeSpaceFor(target: string): number {
  try {
    const stats = fs.statfsSync(target);
    return stats.bavail * stats.bsize;
  } catch {
    return Infinity;
  }
}

/**
 * Rejects entries that would escape the destination directory, and anything that is not a
 * plain file or directory.
 *
 * node-tar strips leading "/" and refuses ".." by default, but relying on a library default
 * for a security boundary is how Zip Slip keeps getting rediscovered - so it is checked
 * here explicitly. Symlinks and hard links are refused outright: a link is the other way an
 * archive reaches outside its own tree, and a database export has no reason to contain one.
 */
function isSafeEntry(entryPath: string, type: string): boolean {
  if (path.isAbsolute(entryPath) || /^[A-Za-z]:/.test(entryPath)) return false;
  if (entryPath.split(/[/\\]/).includes("..")) return false;
  return type === "File" || type === "Directory";
}

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
export async function tarGzFolder(
  sourceFolder: string,
  outPath: string,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const gzip = zlib.createGzip();
    const dest = fs.createWriteStream(outPath);

    tar
      .c(
        {
          gzip: false, // let zlib handle gzip
          cwd: path.dirname(sourceFolder),
        },
        [path.basename(sourceFolder)],
      )
      .pipe(gzip)
      .pipe(dest)
      .on("finish", () => {
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
export async function unzipFile(
  zipFilePath: string,
  destFolder: string,
  limits: Partial<typeof ARCHIVE_LIMITS> = {},
): Promise<string> {
  const {
    maxCompressionRatio,
    ratioSampleBytes,
    freeSpaceMarginBytes,
    maxEntries,
    maxUncompressedBytes,
  } = { ...ARCHIVE_LIMITS, ...limits };

  let compressedBytes = 0;
  let decompressedBytes = 0;
  let entryCount = 0;
  let rejection: string | null = null;

  // Whatever the disk can take, minus a margin, is the practical ceiling.
  const spaceBudget = Math.max(freeSpaceFor(destFolder) - freeSpaceMarginBytes, 0);

  /** Counts the compressed input, giving the denominator for the ratio. */
  const inputMeter = new Transform({
    transform(chunk: Buffer, _encoding, callback) {
      compressedBytes += chunk.length;
      callback(null, chunk);
    },
  });

  /**
   * Meters the decompressed stream between gunzip and tar. Erroring here propagates through
   * `pipeline`, which destroys every stage - so a bomb is cut off partway through
   * decompressing rather than after it has filled the disk.
   *
   * The ratio is what identifies a bomb; size alone cannot, because a large archive is only
   * suspicious if it did not arrive large.
   */
  const meter = new Transform({
    transform(chunk: Buffer, _encoding, callback) {
      decompressedBytes += chunk.length;

      const ratio = compressedBytes > 0 ? decompressedBytes / compressedBytes : 0;
      if (decompressedBytes >= ratioSampleBytes && ratio > maxCompressionRatio) {
        callback(
          new UnsafeArchiveError(
            `Archive expands ${Math.round(ratio)}:1, beyond the ${maxCompressionRatio}:1 limit - refusing it as a decompression bomb.`,
          ),
        );
        return;
      }

      if (decompressedBytes > spaceBudget) {
        callback(
          new UnsafeArchiveError(
            `Archive needs more than the ${Math.round(spaceBudget / 1024 / 1024)} MB of free disk space available.`,
          ),
        );
        return;
      }

      if (decompressedBytes > maxUncompressedBytes) {
        callback(
          new UnsafeArchiveError(
            `Archive expands beyond the ${Math.round(maxUncompressedBytes / 1024 / 1024)} MB extraction limit.`,
          ),
        );
        return;
      }

      callback(null, chunk);
    },
  });

  await pipeline(
    fs.createReadStream(zipFilePath),
    inputMeter,
    zlib.createUnzip(),
    meter,
    tar.x({
      C: destFolder,
      // Never honour absolute paths or ".." held inside the archive.
      preservePaths: false,
      // node-tar types this callback as receiving ReadEntry | Stats; on extraction it is
      // always a ReadEntry, which is the only shape carrying `type`.
      filter: (entryPath: string, entry: tar.ReadEntry | fs.Stats) => {
        entryCount += 1;
        const type = "type" in entry ? String(entry.type) : "File";

        if (entryCount > maxEntries) {
          rejection = `Archive contains more than ${maxEntries} entries.`;
        } else if (!isSafeEntry(entryPath, type)) {
          rejection = `Archive contains an unsafe entry: ${entryPath}`;
        }

        // Returning false skips the entry, so nothing unsafe is ever written. The archive
        // is then failed as a whole below rather than silently importing a partial copy.
        return rejection === null;
      },
    }),
  );

  if (rejection !== null) throw new UnsafeArchiveError(rejection);

  return destFolder;
}
