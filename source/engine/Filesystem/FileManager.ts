import fs, { open as fsOpen } from "fs/promises";
import { createReadStream } from "fs";
import { createInterface } from "readline";
import ResponseHelper from "../../Helper/response.helper";
import {
  ErrorInterface,
  SuccessInterface,
} from "../../config/Interfaces/Helper/response.helper.interface";

export default class FileManager {
  private readonly responseHelper: ResponseHelper;

  constructor() {
    this.responseHelper = new ResponseHelper();
  }

  public async WriteFile(
    path: string,
    data: string,
  ): Promise<SuccessInterface | ErrorInterface> {
    try {
      await fs.writeFile(path, data, "utf-8");
      return this.responseHelper.Success("File written successfully.");
    } catch (error) {
      return this.responseHelper.Error(error);
    }
  }

  /**
   * Writes a file and fsyncs it before returning, so the write is guaranteed on disk
   * (not just sitting in the OS page cache) once this resolves. Use for anything a
   * crash-recovery path depends on finding - e.g. transaction registry state - where
   * a plain `WriteFile` can silently vanish on power loss even though the call succeeded.
   */
  public async WriteFileDurable(
    path: string,
    data: string,
  ): Promise<SuccessInterface | ErrorInterface> {
    try {
      const fileHandle = await fsOpen(path, "w");
      try {
        await fileHandle.write(data, 0, "utf-8");
        await fileHandle.sync();
      } finally {
        await fileHandle.close();
      }
      return this.responseHelper.Success("File written successfully.");
    } catch (error) {
      return this.responseHelper.Error(error);
    }
  }

  /** Atomically creates a file only if absent (OS-level 'wx' flag) - safe for lock files. */
  public async WriteFileExclusive(
    path: string,
    data: string,
  ): Promise<SuccessInterface | ErrorInterface> {
    try {
      await fs.writeFile(path, data, { encoding: "utf-8", flag: "wx" });
      return this.responseHelper.Success("File created exclusively.");
    } catch (error) {
      return this.responseHelper.Error(error);
    }
  }

  public async ReadFile(
    path: string,
  ): Promise<SuccessInterface | ErrorInterface> {
    try {
      const data = await fs.readFile(path, "utf-8");
      return this.responseHelper.Success(data);
    } catch (error) {
      return this.responseHelper.Error(error);
    }
  }

  /**
   * Streams a file line-by-line — memory-efficient for large files.
   * Returns each non-empty line as a string element in the resolved array.
   *
   * @param path - Absolute path to the file.
   * @returns Array of trimmed non-empty lines, or empty array on error.
   */
  public async ReadLines(path: string): Promise<string[]> {
    const lines: string[] = [];
    try {
      const stream = createReadStream(path, { encoding: "utf-8" });
      const rl = createInterface({ input: stream, crlfDelay: Infinity });
      for await (const line of rl) {
        const trimmed = line.trim();
        if (trimmed) {
          lines.push(trimmed);
        }
      }
      rl.close();
    } catch {
      return []; // Return empty array on error (e.g., file not found)
    }
    return lines;
  }

  /**
   * Appends data to a file without reading or rewriting existing content (O(1)).
   * Creates the file and parent directories if they don't already exist.
   *
   * @param path - Absolute path to the file.
   * @param data - String to append (caller should include trailing newline if needed).
   */
  public async AppendFile(
    path: string,
    data: string,
  ): Promise<SuccessInterface | ErrorInterface> {
    try {
      await fs.appendFile(path, data, "utf-8");
      return this.responseHelper.Success("File appended successfully.");
    } catch (error) {
      return this.responseHelper.Error(error);
    }
  }

  /**
   * Appends data and fsyncs before returning, so the appended line is guaranteed on disk
   * even if the process dies immediately after. O(1) durable counterpart to
   * {@link WriteFileDurable} - use it for append-only journals whose loss would break
   * crash recovery.
   *
   * @param path - Absolute path to the file.
   * @param data - String to append (caller should include trailing newline if needed).
   */
  public async AppendFileDurable(
    path: string,
    data: string,
  ): Promise<SuccessInterface | ErrorInterface> {
    try {
      const fileHandle = await fsOpen(path, "a");
      try {
        await fileHandle.write(data, null, "utf-8");
        await fileHandle.sync();
      } finally {
        await fileHandle.close();
      }
      return this.responseHelper.Success("File appended successfully.");
    } catch (error) {
      return this.responseHelper.Error(error);
    }
  }

  public async DeleteFile(
    path: string,
  ): Promise<SuccessInterface | ErrorInterface> {
    try {
      await fs.unlink(path);
      return this.responseHelper.Success("File deleted successfully.");
    } catch (error) {
      return this.responseHelper.Error(error);
    }
  }

  public async FileExists(
    path: string,
  ): Promise<SuccessInterface | ErrorInterface> {
    try {
      await fs.access(path);
      return this.responseHelper.Success(true);
    } catch {
      return this.responseHelper.Error(false);
    }
  }

  public async CreateFile(
    path: string,
  ): Promise<SuccessInterface | ErrorInterface> {
    return await this.WriteFile(path, "");
  }

  public async MoveFile(
    oldPath: string,
    newPath: string,
  ): Promise<SuccessInterface | ErrorInterface> {
    try {
      await fs.rename(oldPath, newPath);
      return this.responseHelper.Success("File moved successfully.");
    } catch (error) {
      return this.responseHelper.Error(error);
    }
  }

  /**
   * Retrieves the size of a file in bytes.
   *
   * @param path - The path to the file.
   * @returns A promise that resolves to a SuccessInterface containing the file size in bytes,
   * or an ErrorInterface if an error occurs.
   */
  public async GetFileSize(
    path: string,
  ): Promise<SuccessInterface | ErrorInterface> {
    try {
      const stats = await fs.stat(path);
      return this.responseHelper.Success(stats.size);
    } catch (err) {
      return this.responseHelper.Error(`Failed to get file size: ${err}`);
    }
  }

  public async DeleteFileWithLock(
    collectionPath: string,
    fileName: string,
  ): Promise<SuccessInterface | ErrorInterface> {
    const filePath = `${collectionPath}/${fileName}`;
    const deleteResponse = await this.DeleteFile(filePath);
    return "data" in deleteResponse
      ? this.responseHelper.Success("File deleted successfully")
      : this.responseHelper.Error("Failed to delete file");
  }
}
