import FileSystem from "fs/promises";
import FileSystemSync from "fs";

// Import Helpers
import ResponseHelper from "../Helper/response.helper";
import {
  ErrorInterface,
  SuccessInterface,
} from "../config/Interfaces/Helper/response.helper.interface";

export default class FolderManager {
  private readonly fileSystem: typeof FileSystem;
  private readonly fileSystemSync: typeof FileSystemSync;
  private readonly responseHelper: ResponseHelper;

  constructor() {
    this.fileSystem = FileSystem;
    this.fileSystemSync = FileSystemSync;
    this.responseHelper = new ResponseHelper();
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
      await this.fileSystem.chmod(path, 0o400);
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
      const isLocked = (stats.mode & 0o400) === 0o400;
      return this.responseHelper.Success(isLocked);
    } catch (error) {
      return this.responseHelper.Error(`Failed to check lock status: ${error}`);
    }
  }
}
