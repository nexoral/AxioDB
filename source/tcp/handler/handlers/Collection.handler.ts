import { AxioDB } from '../../../Services/Indexation.operation';
import { TCPResponse, TCPRequest } from '../../types/protocol.types';
import { StatusCode } from '../../config/keys';
import CollectionController from '../../../server/controller/Collections/Collection.controller';
import { FastifyRequest } from 'fastify';
import SafeErrorMessage from '../../../Helper/SafeErrorMessage.helper';

type Params = TCPRequest['params'];

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
  async handleCreateCollection(requestId: string, params: Params): Promise<TCPResponse> {
    const { dbName, collectionName } = params;

    try {
      // Use AxioDB instance directly for idempotent behavior
      const databaseInstance = await this.axioDB.createDB(dbName!);
      await databaseInstance.createCollection(collectionName!);

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
        message: SafeErrorMessage.sanitize(error),
        error: SafeErrorMessage.sanitize(error),
      };
    }
  }

  /**
   * Handle DELETE_COLLECTION command
   */
  async handleDeleteCollection(requestId: string, params: Params): Promise<TCPResponse> {
    const { dbName, collectionName } = params;

    const mockRequest = {
      query: { dbName: dbName!, collectionName: collectionName! },
    };

    const result = await this.controller.deleteCollection(mockRequest as unknown as FastifyRequest);

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
  async handleCollectionExists(requestId: string, params: Params): Promise<TCPResponse> {
    const { dbName, collectionName } = params;

    try {
      const databaseInstance = await this.axioDB.createDB(dbName!);
      const exists = await databaseInstance.isCollectionExists(collectionName!);

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
        message: SafeErrorMessage.sanitize(error),
        error: SafeErrorMessage.sanitize(error),
      };
    }
  }

  /**
   * Handle COLLECTION_EXISTS command
   */
  async handleGetCollectionInfo(requestId: string, params: Params): Promise<TCPResponse> {
    const { dbName } = params;

    const mockRequest = {
      query: { databaseName: dbName! },
    };

    const result = await this.controller.getCollections(mockRequest as unknown as FastifyRequest);

    return {
      id: requestId,
      statusCode: result.statusCode,
      message: result.message,
      data: result.data,
    };
  }
}
