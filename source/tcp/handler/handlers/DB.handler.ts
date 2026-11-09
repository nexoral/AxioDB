import fs from 'fs';
import path from 'path';
import os from 'os';
import { AxioDB } from '../../../Services/Indexation.operation';
import { TCPResponse, TCPRequest } from '../../types/protocol.types';
import { StatusCode, SuccessMessage } from '../../config/keys';
import DatabaseController from '../../../server/controller/Database/Databse.controller';
import StatsController from '../../../server/controller/Stats.controller';
import { getSystemInfo } from '../../../Helper/SystemInfo.helper';
import { AxioHttpRequest } from '../../../Helper/http/HttpTypes';
import SafeErrorMessage from '../../../Helper/SafeErrorMessage.helper';
import { tarGzFolder, unzipFile } from '../../../utility/ZipUnzip.utils';
import { readExportedDatabaseName } from '../../../server/helper/databaseImport.helper';
import { isReservedDatabaseName } from '../../../config/Keys/Permissions';
import PathSanitizer from '../../../Helper/PathSanitizer.helper';

type Params = TCPRequest['params'];

interface ActiveExportEntry {
  filePath: string;
  totalSize: number;
  totalChunks: number;
  chunkSize: number;
  createdAt: number;
}

interface ActiveImportEntry {
  workDir: string;
  archivePath: string;
  stagingDir: string;
  createdAt: number;
}

export default class DBHandler {
  private controller: DatabaseController;
  private axioDB: AxioDB;
  private activeExports = new Map<string, ActiveExportEntry>();
  private activeImports = new Map<string, ActiveImportEntry>();

  constructor(axioDB: AxioDB) {
    this.axioDB = axioDB;
    this.controller = new DatabaseController(axioDB);
  }

  /**
   * Handle CREATE_DB command
   * Note: This is idempotent - returns database whether it exists or not
   */
  async handleCreateDB(requestId: string, params: Params): Promise<TCPResponse> {
    const { dbName } = params;

    try {
      // Use AxioDB instance directly for idempotent behavior
      await this.axioDB.createDB(dbName!);

      return {
        id: requestId,
        statusCode: StatusCode.OK,
        message: SuccessMessage.DB_CREATED,
        data: { Database_Name: dbName },
      };
    } catch (error) {
      return {
        id: requestId,
        statusCode: StatusCode.INTERNAL_SERVER_ERROR,
        message: SafeErrorMessage.sanitize(error),
        error: SafeErrorMessage.sanitize(error),
      };
    }
  }

  /**
   * Handle DELETE_DB command
   */
  async handleDeleteDB(requestId: string, params: Params): Promise<TCPResponse> {
    const { dbName } = params;

    const mockRequest = {
      query: { dbName: dbName! },
    };

    const result = await this.controller.deleteDatabase(mockRequest as unknown as AxioHttpRequest);

    return {
      id: requestId,
      statusCode: result.statusCode,
      message: result.message,
      data: result.data,
    };
  }

  /**
   * Handle DB_EXISTS command
   */
  async handleDBExists(requestId: string, params: Params): Promise<TCPResponse> {
    const { dbName } = params;

    try {
      const exists = await this.axioDB.isDatabaseExists(dbName!);

      return {
        id: requestId,
        statusCode: StatusCode.OK,
        message: exists ? 'Database exists' : 'Database does not exist',
        data: { exists },
      };
    } catch (error) {
      return {
        id: requestId,
        statusCode: StatusCode.INTERNAL_SERVER_ERROR,
        message: SafeErrorMessage.sanitize(error),
        error: SafeErrorMessage.sanitize(error),
      };
    }
  }

  /**
   * Handle GET_INSTANCE_INFO command
   */
  async handleGetInstanceInfo(requestId: string): Promise<TCPResponse> {
    const result = await this.controller.getDatabases();

    return {
      id: requestId,
      statusCode: result.statusCode,
      message: result.message,
      data: result.data,
    };
  }

  /**
   * Handle GET_SYSTEM_INFO command
   */
  async handleGetSystemInfo(requestId: string): Promise<TCPResponse> {
    try {
      const data = await getSystemInfo(this.axioDB);
      return {
        id: requestId,
        statusCode: StatusCode.OK,
        message: 'System information',
        data,
      };
    } catch (error) {
      return {
        id: requestId,
        statusCode: StatusCode.INTERNAL_SERVER_ERROR,
        message: SafeErrorMessage.sanitize(error),
        error: SafeErrorMessage.sanitize(error),
      };
    }
  }

  /**
   * Handle GET_DASHBOARD_STATS command
   */
  async handleGetDashboardStats(requestId: string): Promise<TCPResponse> {
    try {
      const result = await new StatsController(this.axioDB).getDashBoardStat() as { statusCode?: number; message?: string; data?: unknown };
      return {
        id: requestId,
        statusCode: result.statusCode || StatusCode.OK,
        message: result.message || 'Dashboard stats fetched successfully',
        data: result.data,
      };
    } catch (error) {
      return {
        id: requestId,
        statusCode: StatusCode.INTERNAL_SERVER_ERROR,
        message: SafeErrorMessage.sanitize(error),
        error: SafeErrorMessage.sanitize(error),
      };
    }
  }

  async handleExportDatabase(requestId: string, params: Params, connectionId: string): Promise<TCPResponse> {
    const dbName = typeof params.dbName === 'string' ? params.dbName.trim() : '';
    const chunkIndex = typeof params.chunkIndex === 'number' ? params.chunkIndex : 0;
    const requestedChunkSize = typeof params.chunkSize === 'number' && params.chunkSize > 0 ? params.chunkSize : 2 * 1024 * 1024;

    if (!dbName) {
      return { id: requestId, statusCode: StatusCode.BAD_REQUEST, message: 'dbName is required', error: 'dbName is required' };
    }
    if (isReservedDatabaseName(dbName)) {
      return { id: requestId, statusCode: StatusCode.FORBIDDEN, message: 'This is a reserved system database', error: 'This is a reserved system database' };
    }

    const exportKey = `${connectionId}:${dbName}`;

    try {
      let exportEntry = this.activeExports.get(exportKey);

      if (chunkIndex === 0 || !exportEntry) {
        const exists = await this.axioDB.isDatabaseExists(dbName);
        if (!exists) {
          return { id: requestId, statusCode: StatusCode.NOT_FOUND, message: 'Database not found', error: 'Database not found' };
        }

        const sanitizedDbName = PathSanitizer.sanitizePathComponent(dbName);
        const currDatabasePathData = PathSanitizer.safePath(this.axioDB.GetPath, sanitizedDbName);
        const tempArchive = path.join(os.tmpdir(), `axiodb-export-${Date.now()}-${Math.random().toString(36).slice(2)}.tar.gz`);

        await tarGzFolder(currDatabasePathData, tempArchive);
        const stats = await fs.promises.stat(tempArchive);

        if (stats.size === 0) {
          await fs.promises.unlink(tempArchive).catch(() => {});
          return { id: requestId, statusCode: StatusCode.INTERNAL_SERVER_ERROR, message: 'Generated export file is empty', error: 'Generated export file is empty' };
        }

        const totalChunks = Math.ceil(stats.size / requestedChunkSize) || 1;
        exportEntry = {
          filePath: tempArchive,
          totalSize: stats.size,
          totalChunks,
          chunkSize: requestedChunkSize,
          createdAt: Date.now(),
        };
        this.activeExports.set(exportKey, exportEntry);
      }

      const { filePath, totalSize, totalChunks, chunkSize } = exportEntry;
      if (chunkIndex < 0 || chunkIndex >= totalChunks) {
        return { id: requestId, statusCode: StatusCode.BAD_REQUEST, message: `Invalid chunkIndex ${chunkIndex}. Total chunks: ${totalChunks}`, error: 'Invalid chunkIndex' };
      }

      const start = chunkIndex * chunkSize;
      const end = Math.min(start + chunkSize, totalSize);
      const length = end - start;

      const fd = await fs.promises.open(filePath, 'r');
      const buffer = Buffer.alloc(length);
      await fd.read(buffer, 0, length, start);
      await fd.close();

      const chunkBase64 = buffer.toString('base64');
      const isLast = chunkIndex === totalChunks - 1;

      if (isLast) {
        this.activeExports.delete(exportKey);
        await fs.promises.unlink(filePath).catch(() => {});
      }

      return {
        id: requestId,
        statusCode: StatusCode.OK,
        message: isLast ? 'Export completed' : 'Export chunk retrieved',
        data: {
          dbName,
          chunkIndex,
          totalChunks,
          totalSize,
          data: chunkBase64,
          isLast,
        },
      };
    } catch (error) {
      const exportEntry = this.activeExports.get(exportKey);
      if (exportEntry) {
        this.activeExports.delete(exportKey);
        await fs.promises.unlink(exportEntry.filePath).catch(() => {});
      }
      const safeError = SafeErrorMessage.sanitize(error);
      return { id: requestId, statusCode: StatusCode.INTERNAL_SERVER_ERROR, message: safeError, error: safeError };
    }
  }

  async handleImportDatabase(requestId: string, params: Params, connectionId: string): Promise<TCPResponse> {
    const chunkIndex = typeof params.chunkIndex === 'number' ? params.chunkIndex : 0;
    const totalChunks = typeof params.totalChunks === 'number' ? params.totalChunks : 1;
    const chunkBase64 = typeof params.data === 'string' ? params.data : '';
    const transferId = typeof params.transferId === 'string' && params.transferId ? params.transferId : connectionId;
    const importKey = `${transferId}:import`;

    if (chunkBase64 === '') {
      return { id: requestId, statusCode: StatusCode.BAD_REQUEST, message: 'data is required', error: 'data is required' };
    }

    try {
      let importEntry = this.activeImports.get(importKey);

      if (chunkIndex === 0 || !importEntry) {
        const workDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'axiodb-tcp-import-'));
        const archivePath = path.join(workDir, 'archive.tar.gz');
        const stagingDir = path.join(workDir, 'extracted');
        await fs.promises.mkdir(stagingDir, { recursive: true });

        importEntry = { workDir, archivePath, stagingDir, createdAt: Date.now() };
        this.activeImports.set(importKey, importEntry);
      }

      const chunkBuffer = Buffer.from(chunkBase64, 'base64');
      await fs.promises.appendFile(importEntry.archivePath, chunkBuffer);

      const isLast = chunkIndex >= totalChunks - 1;
      if (!isLast) {
        return {
          id: requestId,
          statusCode: StatusCode.OK,
          message: `Chunk ${chunkIndex + 1}/${totalChunks} received`,
          data: { chunkIndex, totalChunks, isLast: false },
        };
      }

      this.activeImports.delete(importKey);
      const { workDir, archivePath, stagingDir } = importEntry;

      try {
        await unzipFile(archivePath, stagingDir);
      } catch (err: unknown) {
        await fs.promises.rm(workDir, { recursive: true, force: true }).catch(() => {});
        return {
          id: requestId,
          statusCode: StatusCode.BAD_REQUEST,
          message: 'Could not read that file as a valid .tar.gz archive',
          error: SafeErrorMessage.sanitize(err),
        };
      }

      let databaseName: string;
      try {
        databaseName = readExportedDatabaseName(stagingDir);
      } catch (err: unknown) {
        await fs.promises.rm(workDir, { recursive: true, force: true }).catch(() => {});
        return {
          id: requestId,
          statusCode: StatusCode.BAD_REQUEST,
          message: 'That archive is not a valid AxioDB database export',
          error: SafeErrorMessage.sanitize(err),
        };
      }

      if (isReservedDatabaseName(databaseName)) {
        await fs.promises.rm(workDir, { recursive: true, force: true }).catch(() => {});
        return {
          id: requestId,
          statusCode: StatusCode.FORBIDDEN,
          message: `"${databaseName}" is a reserved system database`,
          error: 'Reserved database',
        };
      }

      const destination = path.join(this.axioDB.GetPath, databaseName);
      if (fs.existsSync(destination)) {
        await fs.promises.rm(workDir, { recursive: true, force: true }).catch(() => {});
        return {
          id: requestId,
          statusCode: StatusCode.CONFLICT,
          message: `"${databaseName}" already exists on this instance. Delete it first if you want to replace it.`,
          error: 'Database already exists',
        };
      }

      const source = path.join(stagingDir, databaseName);
      try {
        await fs.promises.rename(source, destination);
      } catch (err: unknown) {
        if ((err as { code?: string })?.code !== 'EXDEV') throw err;
        await fs.promises.cp(source, destination, { recursive: true });
      }

      await fs.promises.rm(workDir, { recursive: true, force: true }).catch(() => {});

      return {
        id: requestId,
        statusCode: StatusCode.OK,
        message: 'Database imported successfully',
        data: {
          database: databaseName,
          totalChunks,
        },
      };
    } catch (error) {
      const entry = this.activeImports.get(importKey);
      if (entry) {
        this.activeImports.delete(importKey);
        await fs.promises.rm(entry.workDir, { recursive: true, force: true }).catch(() => {});
      }
      const safeError = SafeErrorMessage.sanitize(error);
      return { id: requestId, statusCode: StatusCode.INTERNAL_SERVER_ERROR, message: safeError, error: safeError };
    }
  }

  cleanupConnection(connectionId: string): void {
    for (const [key, entry] of this.activeExports) {
      if (key.startsWith(`${connectionId}:`)) {
        this.activeExports.delete(key);
        fs.promises.unlink(entry.filePath).catch(() => {});
      }
    }
    for (const [key, entry] of this.activeImports) {
      if (key.startsWith(`${connectionId}:`)) {
        this.activeImports.delete(key);
        fs.promises.rm(entry.workDir, { recursive: true, force: true }).catch(() => {});
      }
    }
  }
}
