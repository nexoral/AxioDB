import FileSystem from "fs/promises";
import FileSystemSync from "fs";

// Import Helpers
import ResponseHelper from "../Helper/response.helper";
import {
  ErrorInterface,
  SuccessInterface,
} from "../config/Interfaces/Helper/response.helper.interface";

/**
 * Class responsible for managing file operations.
 */
export default class FileManager {
  /**
   * Reference to the file system module.
   */
  private readonly fileSystem: typeof FileSystem;
  private readonly fileSystemSync: typeof FileSystemSync;
  private readonly responseHelper: ResponseHelper;

  /**
   * Initializes a new instance of the FileManager class.
   */
  constructor() {
    this.fileSystem = FileSystem;
    this.fileSystemSync = FileSystemSync;
    this.responseHelper = new ResponseHelper();
  }

  /**
   * Writes data to a file at the specified path.
   *
   * @param path - The path where the file will be written.
   * @param data - The data to write to the file.
   * @returns A promise that resolves when the file has been written.
   */
  public async WriteFile(
    path: string,
    data: string,
  ): Promise<SuccessInterface | ErrorInterface> {
    try {
      const SuccesResponse = await this.fileSystem.writeFile(path, data);
      return await this.responseHelper.Success(SuccesResponse);
    } catch (error) {
      return await this.responseHelper.Error(error);
    }
  }

  /**
   * Reads data from a file at the specified path.
   *
   * @param path - The path of the file to read.
   * @returns A promise that resolves with the data read from the file.
   */
  public async ReadFile(
    path: string,
  ): Promise<SuccessInterface | ErrorInterface> {
    try {
      const ReadResponse = await this.fileSystem.readFile(path, "utf-8");
      return await this.responseHelper.Success(ReadResponse);
    } catch (error) {
      return await this.responseHelper.Error(error);
    }
  }

  /**
   * Deletes a file at the specified path.
   *
   * @param path - The path of the file to delete.
   * @returns A promise that resolves when the file has been deleted.
   */
  public async DeleteFile(
    path: string,
  ): Promise<SuccessInterface | ErrorInterface> {
    try {
      const DeleteResponse = await this.fileSystem.unlink(path);
      return this.responseHelper.Success(DeleteResponse);
    } catch (error) {
      return this.responseHelper.Error(error);
    }
  }

  /**
   * Checks if a file exists at the specified path.
   *
   * @param path - The path of the file to check.
   * @returns A promise that resolves with a boolean indicating if the file exists.
   */
  public async FileExists(
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
   * Creates a new file at the specified path.
   *
   * @param path - The path of the file to create.
   * @returns A promise that resolves when the file has been created.
   */

  public async CreateFile(
    path: string,
  ): Promise<SuccessInterface | ErrorInterface> {
    try {
      const CreateResponse = await this.fileSystem.writeFile(path, "");
      return this.responseHelper.Success(CreateResponse);
    } catch (error) {
      return this.responseHelper.Error(error);
    }
  }

  // Stream Operations

  /**
   * Creates a read stream for the file at the specified path.
   *
   * @param path - The path of the file to read.
   * @returns A read stream for the file.
   */
  public async CreateReadStream(
    path: string,
  ): Promise<ErrorInterface | FileSystemSync.ReadStream> {
    try {
      return this.fileSystemSync.createReadStream(path);
    } catch (error) {
      return await this.responseHelper.Error(error);
    }
  }

  /**
   * Creates a write stream for the file at the specified path.
   *
   * @param path - The path of the file to write.
   * @returns A write stream for the file.
   */
  public async CreateWriteStream(
    path: string,
  ): Promise<ErrorInterface | FileSystemSync.WriteStream> {
    try {
      return this.fileSystemSync.createWriteStream(path);
    } catch (error) {
      return await this.responseHelper.Error(error);
    }
  }
}
