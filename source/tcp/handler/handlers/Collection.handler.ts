import { AxioDB } from '../../../Services/Indexation.operation';
import { TCPResponse } from '../../types/protocol.types';
import { StatusCode } from '../../config/keys';
import CollectionController from '../../../server/controller/Collections/Collection.controller';

/**
 * Collection Handler - Handles collection-related TCP commands
 * Uses AxioDB instance directly for idempotent operations
 */
export default class CollectionHandler {
  private controller: CollectionController;
  private axioDB: AxioDB;

  constructor(axioDB: AxioDB) {
    this.axioDB = axioDB;
    this.controller = new CollectionController(axioDB);
  }

  /**
   * Handle CREATE_COLLECTION command
   * Note: This is idempotent - returns collection whether it exists or not
   */
  async handleCreateCollection(requestId: string, params: any): Promise<TCPResponse> {
    const { dbName, collectionName, crypto, key } = params;

    try {
      // Use AxioDB instance directly for idempotent behavior
      const databaseInstance = await this.axioDB.createDB(dbName);
      await databaseInstance.createCollection(collectionName, crypto, key);

      return {
        id: requestId,
        statusCode: StatusCode.OK,
        message: 'Collection created successfully',
        data: { dbName, collectionName },
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
   * Handle DELETE_COLLECTION command
   */
  async handleDeleteCollection(requestId: string, params: any): Promise<TCPResponse> {
    const { dbName, collectionName } = params;

    // Create mock request object
    const mockRequest = {
      query: { dbName, collectionName },
    } as any;

    const result = await this.controller.deleteCollection(mockRequest);

    return {
      id: requestId,
      statusCode: result.statusCode,
      message: result.message,
      data: result.data,
    };
  }

  /**
   * Handle COLLECTION_EXISTS command
   */
  async handleCollectionExists(requestId: string, params: any): Promise<TCPResponse> {
    const { dbName, collectionName } = params;

    try {
      const databaseInstance = await this.axioDB.createDB(dbName);
      const exists = await databaseInstance.isCollectionExists(collectionName);

      return {
        id: requestId,
        statusCode: StatusCode.OK,
        message: exists ? 'Collection exists' : 'Collection does not exist',
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
   * Handle GET_COLLECTION_INFO command
   */
  async handleGetCollectionInfo(requestId: string, params: any): Promise<TCPResponse> {
    const { dbName } = params;

    // Create mock request object
    const mockRequest = {
      query: { databaseName: dbName },
    } as any;

    const result = await this.controller.getCollections(mockRequest);

    return {
      id: requestId,
      statusCode: result.statusCode,
      message: result.message,
      data: result.data,
    };
  }
}
