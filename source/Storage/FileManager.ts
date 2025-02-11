import fs from "fs/promises";
import ResponseHelper from "../Helper/response.helper";
import {
  ErrorInterface,
  SuccessInterface,
} from "../config/Interfaces/Helper/response.helper.interface";

export default class FileManager {
  private readonly responseHelper: ResponseHelper;

  constructor() {
    this.responseHelper = new ResponseHelper();
  }

  public async WriteFile(path: string, data: string): Promise<SuccessInterface | ErrorInterface> {
    try {
      await fs.writeFile(path, data, "utf-8");
      return this.responseHelper.Success("File written successfully.");
    } catch (error) {
      return this.responseHelper.Error(error);
    }
  }

  public async ReadFile(path: string): Promise<SuccessInterface | ErrorInterface> {
    try {
      const data = await fs.readFile(path, "utf-8");
      return this.responseHelper.Success(data);
    } catch (error) {
      return this.responseHelper.Error(error);
    }
  }

  public async DeleteFile(path: string): Promise<SuccessInterface | ErrorInterface> {
    try {
      await fs.unlink(path);
      return this.responseHelper.Success("File deleted successfully.");
    } catch (error) {
      return this.responseHelper.Error(error);
    }
  }

  public async FileExists(path: string): Promise<SuccessInterface | ErrorInterface> {
    try {
      await fs.access(path);
      return this.responseHelper.Success(true);
    } catch {
      return this.responseHelper.Success(false);
    }
  }

  public async CreateFile(path: string): Promise<SuccessInterface | ErrorInterface> {
    return this.WriteFile(path, "");
  }

  public async LockFile(path: string): Promise<SuccessInterface | ErrorInterface> {
    try {
      await fs.chmod(path, 0o400);
      return this.responseHelper.Success("File locked successfully.");
    } catch (error) {
      return this.responseHelper.Error(error);
    }
  }

  public async UnlockFile(path: string): Promise<SuccessInterface | ErrorInterface> {
    try {
      await fs.chmod(path, 0o777);
      return this.responseHelper.Success("File unlocked successfully.");
    } catch (error) {
      return this.responseHelper.Error(error);
    }
  }

  public async MoveFile(oldPath: string, newPath: string): Promise<SuccessInterface | ErrorInterface> {
    try {
      await fs.rename(oldPath, newPath);
      return this.responseHelper.Success("File moved successfully.");
    } catch (error) {
      return this.responseHelper.Error(error);
    }
  }

  public async IsFileLocked(path: string): Promise<SuccessInterface | ErrorInterface> {
    try {
      const stats = await fs.stat(path);
      return this.responseHelper.Success((stats.mode & 0o777) === 0o400);
    } catch (error) {
      return this.responseHelper.Error(error);
    }
  }
}
