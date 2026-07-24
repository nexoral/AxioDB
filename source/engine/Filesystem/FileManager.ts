/* eslint-disable @typescript-eslint/no-unused-vars */
import fs, { open as fsOpen } from "fs/promises";
import ResponseHelper from "../../Helper/response.helper";
import {
  ErrorInterface,
  SuccessInterface,
} from "../../config/Interfaces/Helper/response.helper.interface";
import WorkerProcess from "../cli/worker_process";

export default class FileManager {
  private readonly responseHelper: ResponseHelper;
  private readonly WorkerProcess: WorkerProcess;

  constructor() {
    this.responseHelper = new ResponseHelper();
    this.WorkerProcess = new WorkerProcess();
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
      // Try using native Node.js first (most reliable)
      try {
        // Check file permissions before reading
        let originalMode: number | null = null;
        try {
          const stats = await fs.stat(path);
          originalMode = stats.mode;

          // If file isn't readable, temporarily make it readable
          if ((stats.mode & 0o444) !== 0o444) {
            await fs.chmod(path, 0o644);
          }
        } catch (permError) {
          // Continue with attempt to read the file even if we couldn't modify permissions
        }

        try {
          const stats = await fs.stat(path);

          // Restore original permissions if they were modified
          if (originalMode !== null && (originalMode & 0o444) !== 0o444) {
            await fs.chmod(path, originalMode);
          }

          return this.responseHelper.Success(stats.size);
        } catch (statError) {
          // Fall back to system commands if native method fails
          const osType = WorkerProcess.getOS();
          if (osType === "windows") {
            const stdout = await this.WorkerProcess.execCommand(
              `powershell -command "(Get-Item '${path}').length"`,
            );
            const size = parseInt(stdout, 10) || 0;

            // Restore original permissions if they were modified
            if (originalMode !== null && (originalMode & 0o444) !== 0o444) {
              await fs.chmod(path, originalMode);
            }

            return this.responseHelper.Success(size);
          } else {
            const stdout = await this.WorkerProcess.execCommand(
              `wc -c < "${path}" 2>/dev/null || echo 0`,
            );
            const size = parseInt(stdout, 10) || 0;

            // Restore original permissions if they were modified
            if (originalMode !== null && (originalMode & 0o444) !== 0o444) {
              await fs.chmod(path, originalMode);
            }

            return this.responseHelper.Success(size);
          }
        }
      } catch (err) {
        // Try to restore original permissions if they were saved, even if an error occurred
        try {
          const stats = await fs.stat(path);
          const originalMode = stats.mode;
          if ((originalMode & 0o444) !== 0o444) {
            await fs.chmod(path, originalMode);
          }
        } catch {
          // Ignore errors in the final cleanup attempt
        }

        return this.responseHelper.Error(`Failed to get file size: ${err}`);
      }
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
