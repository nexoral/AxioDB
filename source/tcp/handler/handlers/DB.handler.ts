import { AxioDB } from '../../../Services/Indexation.operation';
import { TCPResponse } from '../../types/protocol.types';
import { StatusCode, SuccessMessage } from '../../config/keys';
import DatabaseController from '../../../server/controller/Database/Databse.controller';

/**
 * Database Handler - Handles database-related TCP commands
 * Uses AxioDB instance directly for idempotent operations
 */
export default class DBHandler {
  private controller: DatabaseController;
  private axioDB: AxioDB;

  constructor(axioDB: AxioDB) {
    this.axioDB = axioDB;
    this.controller = new DatabaseController(axioDB);
  }

  /**
   * Handle CREATE_DB command
   * Note: This is idempotent - returns database whether it exists or not
   */
  async handleCreateDB(requestId: string, params: any): Promise<TCPResponse> {
    const { dbName } = params;

    try {
      // Use AxioDB instance directly for idempotent behavior
      await this.axioDB.createDB(dbName);

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
        message: error instanceof Error ? error.message : String(error),
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Handle DELETE_DB command
   */
  async handleDeleteDB(requestId: string, params: any): Promise<TCPResponse> {
    const { dbName } = params;

    // Create mock request object
    const mockRequest = {
      query: { dbName },
    } as any;

    const result = await this.controller.deleteDatabase(mockRequest);

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
  async handleDBExists(requestId: string, params: any): Promise<TCPResponse> {
    const { dbName } = params;

    try {
      const exists = await this.axioDB.isDatabaseExists(dbName);

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
        message: error instanceof Error ? error.message : String(error),
        error: error instanceof Error ? error.message : String(error),
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
}
