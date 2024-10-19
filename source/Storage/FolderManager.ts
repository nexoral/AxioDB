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
    path: string
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
    path: string
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
    path: string
  ): Promise<SuccessInterface | ErrorInterface> {
    try {
      const ExistsResponse = await this.fileSystem.access(path);
      return this.responseHelper.Success(ExistsResponse);
    } catch (error) {
      return this.responseHelper.Error(error);
    }
  }
}
