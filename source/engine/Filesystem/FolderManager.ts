/* eslint-disable @typescript-eslint/no-unused-vars */
import FileSystem from "fs/promises";
import FileSystemSync from "fs";
import WorkerProcess from "../cli/worker_process";

// Import Helpers
import ResponseHelper from "../../Helper/response.helper";
import {
  ErrorInterface,
  SuccessInterface,
} from "../../config/Interfaces/Helper/response.helper.interface";

export default class FolderManager {
  private readonly fileSystem: typeof FileSystem;
  private readonly fileSystemSync: typeof FileSystemSync;
  private readonly responseHelper: ResponseHelper;
  private readonly WorkerProcess: WorkerProcess;

  constructor() {
    this.fileSystem = FileSystem;
    this.fileSystemSync = FileSystemSync;
    this.responseHelper = new ResponseHelper();
    this.WorkerProcess = new WorkerProcess();
  }

  /**
   * Creates a new directory at the specified path.
   */
  public async CreateDirectory(
    path: string,
  ): Promise<SuccessInterface | ErrorInterface> {
    try {
      await this.fileSystem.mkdir(path, { recursive: true });
      return this.responseHelper.Success(`Directory created at: ${path}`);
    } catch (error) {
      return this.responseHelper.Error(`Failed to create directory: ${error}`);
    }
  }

  /**
   * Deletes a directory at the specified path.
   */
  public async DeleteDirectory(
    path: string,
  ): Promise<SuccessInterface | ErrorInterface> {
    try {
      await this.fileSystem.rm(path, { recursive: true, force: true });
      return this.responseHelper.Success(`Directory deleted: ${path}`);
    } catch (error) {
      return this.responseHelper.Error(`Failed to delete directory: ${error}`);
    }
  }

  /**
   * Checks if a directory exists at the specified path.
   */
  public async DirectoryExists(
    path: string,
  ): Promise<SuccessInterface | ErrorInterface> {
    try {
      await this.fileSystem.access(path);
      return this.responseHelper.Success(false);
    } catch {
      return this.responseHelper.Error(true);
    }
  }

  /**
   * Lists the contents of a directory at the specified path.
   */
  public async ListDirectory(
    path: string,
  ): Promise<SuccessInterface | ErrorInterface> {
    try {
      const contents = await this.fileSystem.readdir(path);
      return this.responseHelper.Success(contents);
    } catch (error) {
      return this.responseHelper.Error(`Failed to list directory: ${error}`);
    }
  }

  /**
   * Moves a directory from the old path to the new path.
   */
  public async MoveDirectory(
    oldPath: string,
    newPath: string,
  ): Promise<SuccessInterface | ErrorInterface> {
    try {
      await this.fileSystem.rename(oldPath, newPath);
      return this.responseHelper.Success(`Moved directory to: ${newPath}`);
    } catch (error) {
      return this.responseHelper.Error(`Failed to move directory: ${error}`);
    }
  }

  /**
   * Locks a directory at the specified path.
   */
  public async LockDirectory(
    path: string,
  ): Promise<SuccessInterface | ErrorInterface> {
    try {
      await this.fileSystem.chmod(path, 0o000);
      return this.responseHelper.Success(`Directory locked: ${path}`);
    } catch (error) {
      return this.responseHelper.Error(`Failed to lock directory: ${error}`);
    }
  }

  /**
   * Unlocks a directory at the specified path.
   */
  public async UnlockDirectory(
    path: string,
  ): Promise<SuccessInterface | ErrorInterface> {
    try {
      await this.fileSystem.chmod(path, 0o777);
      return this.responseHelper.Success(`Directory unlocked: ${path}`);
    } catch (error) {
      return this.responseHelper.Error(`Failed to unlock directory: ${error}`);
    }
  }

  /**
   * Checks if a directory is locked at the specified path.
   */
  public async IsDirectoryLocked(
    path: string,
  ): Promise<SuccessInterface | ErrorInterface> {
    try {
      const stats = await this.fileSystem.stat(path);
      const isLocked = (stats.mode & 0o200) === 0; // Check if the directory is locked (no write permission for owner)
      return this.responseHelper.Success(isLocked);
    } catch (error) {
      return this.responseHelper.Error(`Failed to check lock status: ${error}`);
    }
  }

  /**
   * get the size of a directory at the specified path.
   * Handles permission issues by temporarily modifying permissions if needed.
   */
  public async GetDirectorySize(
    path: string,
  ): Promise<SuccessInterface | ErrorInterface> {
    // Store original permissions to restore later
    const permissionsMap = new Map<string, number>();

    try {
      // Check if directory exists
      try {
        await this.fileSystem.access(path);
      } catch (error) {
        return this.responseHelper.Error(
          `Directory does not exist or is inaccessible: ${error}`,
        );
      }

      // Collect and store original permissions, unlock files/folders as needed
      await this.prepareDirectoryForSizeCalculation(path, permissionsMap);

      // Now perform the size calculation
      const osType = WorkerProcess.getOS();
      let size: number;

      if (osType === "windows") {
        try {
          // More comprehensive PowerShell command that handles directories better
          const stdout = await this.WorkerProcess.execCommand(
            `powershell -command "(Get-ChildItem '${path}' -Recurse -Force | Measure-Object -Property Length -Sum).Sum"`,
          );
          size = parseInt(stdout, 10) || 0;
        } catch (cmdError) {
          console.warn(
            `Windows command failed: ${cmdError}, using fallback method`,
          );
          size = await this.calculateDirectorySizeRecursively(path);
        }
      } else {
        try {
          // Try du with error redirection
          const stdout = await this.WorkerProcess.execCommand(
            `du -sb "${path}" 2>/dev/null`,
          );
          size = parseInt(stdout.split("\t")[0], 10) || 0;
        } catch (cmdError) {
          console.warn(
            `Unix command failed: ${cmdError}, using fallback method`,
          );
          size = await this.calculateDirectorySizeRecursively(path);
        }
      }
      return this.responseHelper.Success(size);
    } catch (err) {
      console.error(`Error getting directory size: ${err}`);
      return this.responseHelper.Error(`Failed to get directory size: ${err}`);
    } finally {
      // Restore original permissions
      await this.restoreDirectoryPermissions(permissionsMap);
    }
  }

  /**
   * Recursively prepares a directory and its contents for size calculation
   * by temporarily modifying permissions if needed.
   */
  private async prepareDirectoryForSizeCalculation(
    dirPath: string,
    permissionsMap: Map<string, number>,
  ): Promise<void> {
    try {
      // Store original directory permissions
      try {
        const stats = await this.fileSystem.stat(dirPath);
        permissionsMap.set(dirPath, stats.mode);

        // If directory isn't readable, make it readable
        if ((stats.mode & 0o444) !== 0o444) {
          await this.fileSystem.chmod(dirPath, 0o755);
        }
      } catch (error) {
        console.warn(
          `Could not check/modify permissions for ${dirPath}: ${error}`,
        );
        return;
      }

      // Process directory contents
      let items: string[];
      try {
        items = await this.fileSystem.readdir(dirPath);
      } catch (error) {
        console.warn(`Could not read directory ${dirPath}: ${error}`);
        return;
      }

      // Process each item recursively
      for (const item of items) {
        const itemPath = `${dirPath}/${item}`;

        try {
          const stats = await this.fileSystem.stat(itemPath);

          // Store original permissions
          permissionsMap.set(itemPath, stats.mode);

          if (stats.isDirectory()) {
            // If subdirectory isn't readable, make it readable
            if ((stats.mode & 0o444) !== 0o444) {
              await this.fileSystem.chmod(itemPath, 0o755);
            }

            // Recursively process subdirectory
            await this.prepareDirectoryForSizeCalculation(
              itemPath,
              permissionsMap,
            );
          } else if (stats.isFile()) {
            // If file isn't readable, make it readable
            if ((stats.mode & 0o444) !== 0o444) {
              await this.fileSystem.chmod(itemPath, 0o644);
            }
          }
        } catch (itemError) {
          // Continue with other items
        }
      }
    } catch (error) {
      console.warn(`Error preparing directory ${dirPath}: ${error}`);
    }
  }

  /**
   * Restores original permissions for all modified files and directories
   */
  private async restoreDirectoryPermissions(
    permissionsMap: Map<string, number>,
  ): Promise<void> {
    // Convert to array and reverse to handle deepest paths first
    const paths = Array.from(permissionsMap.keys()).reverse();

    for (const path of paths) {
      const originalMode = permissionsMap.get(path);
      if (originalMode !== undefined) {
        try {
          await this.fileSystem.chmod(path, originalMode);
        } catch (error) {
          console.warn(`Failed to restore permissions for ${path}: ${error}`);
        }
      }
    }
  }

  /**
   * Calculates directory size recursively using Node.js native functions.
   * This is a fallback method for when command-line tools fail.
   */
  private async calculateDirectorySizeRecursively(
    dirPath: string,
  ): Promise<number> {
    let totalSize = 0;

    try {
      const items = await this.fileSystem.readdir(dirPath);

      for (const item of items) {
        const itemPath = `${dirPath}/${item}`;

        try {
          const stats = await this.fileSystem.stat(itemPath);

          if (stats.isDirectory()) {
            totalSize += await this.calculateDirectorySizeRecursively(itemPath);
          } else if (stats.isFile()) {
            totalSize += stats.size;
          }
        } catch (itemError) {
          console.warn(
            `Skipping item during size calculation: ${itemPath}: ${itemError}`,
          );
        }
      }
    } catch (error) {
      console.warn(
        `Error reading directory during size calculation: ${dirPath}: ${error}`,
      );
    }

    return totalSize;
  }
}
