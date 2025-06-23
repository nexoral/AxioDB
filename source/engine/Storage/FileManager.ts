import fs from "fs/promises";
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

  /**
   * Writes data to a file at the specified path.
   *
   * @param path - The path where the file will be written.
   * @param data - The data to be written to the file.
   * @returns A promise that resolves to a SuccessInterface if the file is written successfully,
   * or an ErrorInterface if an error occurs.
   */
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
   * Reads the content of a file at the specified path.
   *
   * @param path - The path to the file to be read.
   * @returns A promise that resolves to a SuccessInterface containing the file data if the read operation is successful,
   * or an ErrorInterface if an error occurs.
   */
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
   * Deletes a file at the specified path.
   *
   * @param {string} path - The path to the file to be deleted.
   * @returns {Promise<SuccessInterface | ErrorInterface>} A promise that resolves to a SuccessInterface if the file is deleted successfully, or an ErrorInterface if an error occurs.
   */
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

  /**
   * Checks if a file exists at the given path.
   *
   * @param path - The path to the file.
   * @returns A promise that resolves to a SuccessInterface if the file exists,
   *          or an ErrorInterface if the file does not exist.
   */
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

  /**
   * Creates a new file at the specified path.
   *
   * @param path - The path where the new file will be created.
   * @returns A promise that resolves to a SuccessInterface if the file is created successfully,
   * or an ErrorInterface if there is an error during file creation.
   */
  public async CreateFile(
    path: string,
  ): Promise<SuccessInterface | ErrorInterface> {
    return await this.WriteFile(path, "");
  }

  /**
   * Locks the specified file by changing its permissions to read-only.
   *
   * @param path - The path to the file to be locked.
   * @returns A promise that resolves to a SuccessInterface if the file is locked successfully,
   * or an ErrorInterface if an error occurs.
   */
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

  /**
   * Unlocks the file at the specified path by changing its permissions to 777.
   *
   * @param {string} path - The path to the file to be unlocked.
   * @returns {Promise<SuccessInterface | ErrorInterface>} A promise that resolves to a SuccessInterface if the file is unlocked successfully, or an ErrorInterface if an error occurs.
   */
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

  /**
   * Moves a file from the specified old path to the new path.
   *
   * @param oldPath - The current path of the file to be moved.
   * @param newPath - The destination path where the file should be moved.
   * @returns A promise that resolves to a SuccessInterface if the file is moved successfully,
   * or an ErrorInterface if an error occurs during the file move operation.
   */
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
   * Checks if the file at the given path is locked.
   *
   * A file is considered locked if its permissions are set to read-only for the owner (mode 0o400).
   *
   * @param path - The path to the file to check.
   * @returns A promise that resolves to a SuccessInterface if the file is locked, or an ErrorInterface if an error occurs.
   */
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
        const osType = WorkerProcess.getOS();
        if (osType === "windows") {
            const stdout = await this.WorkerProcess.execCommand(`powershell -command "(Get-Item '${path}').length"`);
            const size = parseInt(stdout, 10);
            return this.responseHelper.Success(size);
        }
        const stdout = await this.WorkerProcess.execCommand(`du -sb ${path}`);
        const size = parseInt(stdout.split("\t")[0], 10);
        return this.responseHelper.Success(size);
    } catch (err) {
      return this.responseHelper.Error(`Failed to get directory size: ${err}`);
    }
  }
}
