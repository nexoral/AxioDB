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
   *
   * @param path - The path of the directory to create.
   * @returns A promise that resolves when the directory has been created.
   */
  public async CreateDirectory(
    path: string,
  ): Promise<SuccessInterface | ErrorInterface> {
    try {
      const CreateResponse = await this.fileSystem.mkdir(path);
      return this.responseHelper.Success(CreateResponse);
    } catch (error) {
      return this.responseHelper.Error(error);
    }
  }

  /**
   * Deletes a directory at the specified path.
   *
   * @param path - The path of the directory to delete.
   * @returns A promise that resolves when the directory has been deleted.
   */
  public async DeleteDirectory(
    path: string,
  ): Promise<SuccessInterface | ErrorInterface> {
    try {
      const DeleteResponse = await this.fileSystem.rmdir(path);
      return this.responseHelper.Success(DeleteResponse);
    } catch (error) {
      return this.responseHelper.Error(error);
    }
  }

  /**
   * Checks if a directory exists at the specified path.
   *
   * @param path - The path of the directory to check.
   * @returns A promise that resolves with a boolean indicating if the directory exists.
   */
  public async DirectoryExists(
    path: string,
  ): Promise<SuccessInterface | ErrorInterface> {
    try {
      const ExistsResponse = await this.fileSystem.access(path);
      return this.responseHelper.Success(ExistsResponse);
    } catch (error) {
      return this.responseHelper.Error(error);
    }
  }

  /**
   * Lists the contents of a directory at the specified path.
   *
   * @param path - The path of the directory to list.
   * @returns A promise that resolves with an array of directory contents.
   */

  public async ListDirectory(
    path: string,
  ): Promise<SuccessInterface | ErrorInterface> {
    try {
      const ListResponse = await this.fileSystem.readdir(path);
      return this.responseHelper.Success(ListResponse);
    } catch (error) {
      return this.responseHelper.Error(error);
    }
  }

  /**
   * Moves a directory from the old path to the new path.
   *
   * @param oldPath - The current path of the directory to be moved.
   * @param newPath - The new path where the directory should be moved.
   * @returns A promise that resolves to a SuccessInterface if the operation is successful,
   * or an ErrorInterface if an error occurs.
   */
  public async MoveDirectory(
    oldPath: string,
    newPath: string,
  ): Promise<SuccessInterface | ErrorInterface> {
    try {
      const MoveResponse = await this.fileSystem.rename(oldPath, newPath);
      return this.responseHelper.Success(MoveResponse);
    } catch (error) {
      return this.responseHelper.Error(error);
    }
  }

  /**
   * Locks a directory at the specified path.
   *
   * @param path - The path of the directory to lock.
   * @returns A promise that resolves when the directory has been locked.
   */
  public async LockDirectory(
    path: string,
  ): Promise<SuccessInterface | ErrorInterface> {
    try {
      const LockResponse = await this.fileSystem.chmod(path, 0o400);
      return this.responseHelper.Success(LockResponse);
    } catch (error) {
      return this.responseHelper.Error(error);
    }
  }

  /**
   * Unlocks a directory at the specified path.
   *
   * @param path - The path of the directory to unlock.
   * @returns A promise that resolves when the directory has been unlocked.
   */
  public async UnlockDirectory(
    path: string,
  ): Promise<SuccessInterface | ErrorInterface> {
    try {
      const UnlockResponse = await this.fileSystem.chmod(path, 0o777);
      return this.responseHelper.Success(UnlockResponse);
    } catch (error) {
      return this.responseHelper.Error(error);
    }
  }

  /**
   * Checks if a directory is locked at the specified path.
   *
   * @param path - The path of the directory to check.
   * @returns A promise that resolves with a boolean indicating if the directory is locked.
   */
  public async IsDirectoryLocked(
    path: string,
  ): Promise<SuccessInterface | ErrorInterface> {
    try {
      const Stats = await this.fileSystem.stat(path);
      const IsLocked = Stats.mode.toString(8).slice(-3) === "400";
      return this.responseHelper.Success(IsLocked);
    } catch (error) {
      return this.responseHelper.Error(error);
    }
  }
}
