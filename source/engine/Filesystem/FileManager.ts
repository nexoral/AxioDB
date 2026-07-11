/* eslint-disable @typescript-eslint/no-unused-vars */
import fs from "fs/promises";
import ResponseHelper from "../../Helper/response.helper";
import {
  ErrorInterface,
  SuccessInterface,
} from "../../config/Interfaces/Helper/response.helper.interface";
import WorkerProcess from "../cli/worker_process";
import FolderManager from "./FolderManager";

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

  /** "Locked" means chmod 0o400 (read-only for the owner). */
  public async LockFile(
    path: string,
  ): Promise<SuccessInterface | ErrorInterface> {
    try {
      await fs.chmod(path, 0o400);
      return this.responseHelper.Success("File locked successfully.");
    } catch (error) {
      return this.responseHelper.Error(error);
    }
  }

  public async UnlockFile(
    path: string,
  ): Promise<SuccessInterface | ErrorInterface> {
    try {
      await fs.chmod(path, 0o777);
      return this.responseHelper.Success("File unlocked successfully.");
    } catch (error) {
      return this.responseHelper.Error(error);
    }
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

  /** A file is considered locked if its permissions are read-only for the owner (mode 0o400). */
  public async IsFileLocked(
    path: string,
  ): Promise<SuccessInterface | ErrorInterface> {
    try {
      const stats = await fs.stat(path);
      return this.responseHelper.Success((stats.mode & 0o777) === 0o400);
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

  /**
   * Handles file deletion with proper directory lock/unlock sequences: if the directory is
   * unlocked, deletes the file directly; if locked, unlocks, deletes, then relocks it.
   */
  public async DeleteFileWithLock(
    collectionPath: string,
    fileName: string,
  ): Promise<SuccessInterface | ErrorInterface> {
    const folderManager = new FolderManager();
    const filePath = `${collectionPath}/${fileName}`;

    const isLocked = await folderManager.IsDirectoryLocked(collectionPath);

    if (!("data" in isLocked)) {
      return this.responseHelper.Error("Failed to check directory lock status");
    }

    if (isLocked.data === false) {
      // Directory not locked - delete directly
      const deleteResponse = await this.DeleteFile(filePath);
      return "data" in deleteResponse
        ? this.responseHelper.Success("File deleted successfully")
        : this.responseHelper.Error("Failed to delete file");
    } else {
      // Directory locked - unlock, delete, relock
      const unlockResponse = await folderManager.UnlockDirectory(collectionPath);

      if (!("data" in unlockResponse)) {
        return this.responseHelper.Error("Failed to unlock directory");
      }

      const deleteResponse = await this.DeleteFile(filePath);

      if (!("data" in deleteResponse)) {
        // Attempt to relock even if delete failed
        await folderManager.LockDirectory(collectionPath);
        return this.responseHelper.Error("Failed to delete file");
      }

      const lockResponse = await folderManager.LockDirectory(collectionPath);

      if (!("data" in lockResponse)) {
        return this.responseHelper.Error("File deleted but failed to relock directory");
      }

      return this.responseHelper.Success("File deleted successfully");
    }
  }
}
