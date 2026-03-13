import { AxioDB } from '../../../Services/Indexation.operation';
import { TCPResponse } from '../../types/protocol.types';
import { StatusCode } from '../../config/keys';
import CRUDController from '../../../server/controller/Operation/CRUD.controller';

/**
 * Operation Handler - Handles CRUD operation TCP commands
 * Reuses existing CRUDController logic
 */
export default class OperationHandler {
  private controller: CRUDController;
  private axioDB: AxioDB;

  constructor(axioDB: AxioDB) {
    this.axioDB = axioDB;
    this.controller = new CRUDController(axioDB);
  }

  /**
   * Handle INSERT_DOCUMENT command
   */
  async handleInsertDocument(requestId: string, params: any): Promise<TCPResponse> {
    const { dbName, collectionName, data } = params;

    // Create mock request object
    const mockRequest = {
      query: { dbName, collectionName },
      body: data,
    } as any;

    const result = await this.controller.createNewDocument(mockRequest);

    return {
      id: requestId,
      statusCode: result.statusCode,
      message: result.message,
      data: result.data,
    };
  }

  /**
   * Handle INSERT_MANY_DOCUMENTS command
   */
  async handleInsertManyDocuments(requestId: string, params: any): Promise<TCPResponse> {
    const { dbName, collectionName, documents } = params;

    // Create mock request object
    const mockRequest = {
      query: { dbName, collectionName },
      body: documents,
    } as any;

    const result = await this.controller.createManyNewDocument(mockRequest);

    return {
      id: requestId,
      statusCode: result.statusCode,
      message: result.message,
      data: result.data,
    };
  }

  /**
   * Handle QUERY_DOCUMENTS command
   */
  async handleQueryDocuments(requestId: string, params: any): Promise<TCPResponse> {
    const { dbName, collectionName, query = {}, limit, skip, sort, findOne } = params;

    try {
      const databaseInstance = await this.axioDB.createDB(dbName);
      const collection = await databaseInstance.createCollection(collectionName);

      // Build query with options
      let queryBuilder = collection.query(query);

      if (limit !== undefined) {
        queryBuilder = queryBuilder.Limit(limit);
      }

      if (skip !== undefined) {
        queryBuilder = queryBuilder.Skip(skip);
      }

      if (sort) {
        queryBuilder = queryBuilder.Sort(sort);
      }

      if (findOne) {
        queryBuilder = queryBuilder.findOne(findOne);
      }

      const result = await queryBuilder.exec();

      return {
        id: requestId,
        statusCode: StatusCode.OK,
        message: 'Documents retrieved successfully',
        data: result,
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
   * Handle QUERY_BY_ID command
   */
  async handleQueryById(requestId: string, params: any): Promise<TCPResponse> {
    const { dbName, collectionName, id: documentId } = params;

    // Create mock request object
    const mockRequest = {
      query: { dbName, collectionName, documentId },
    } as any;

    const result = await this.controller.getDocumentsById(mockRequest);

    return {
      id: requestId,
      statusCode: result.statusCode,
      message: result.message,
      data: result.data,
    };
  }

  /**
   * Handle UPDATE_DOCUMENT_BY_ID command
   */
  async handleUpdateById(requestId: string, params: any): Promise<TCPResponse> {
    const { dbName, collectionName, id: documentId, updateData } = params;

    // Create mock request object
    const mockRequest = {
      query: { dbName, collectionName, documentId },
      body: updateData,
    } as any;

    const result = await this.controller.updateDocumentById(mockRequest);

    return {
      id: requestId,
      statusCode: result.statusCode,
      message: result.message,
      data: result.data,
    };
  }

  /**
   * Handle UPDATE_DOCUMENTS_BY_QUERY command
   */
  async handleUpdateByQuery(requestId: string, params: any): Promise<TCPResponse> {
    const { dbName, collectionName, query, updateData, updateOne = true } = params;
    const isMany = !updateOne;

    // Create mock request object
    const mockRequest = {
      query: { dbName, collectionName, isMany },
      body: { query, update: updateData },
    } as any;

    const result = await this.controller.updateDocumentByQuery(mockRequest);

    return {
      id: requestId,
      statusCode: result.statusCode,
      message: result.message,
      data: result.data,
    };
  }

  /**
   * Handle DELETE_DOCUMENT_BY_ID command
   */
  async handleDeleteById(requestId: string, params: any): Promise<TCPResponse> {
    const { dbName, collectionName, id: documentId } = params;

    // Create mock request object
    const mockRequest = {
      query: { dbName, collectionName, documentId },
    } as any;

    const result = await this.controller.deleteDocumentById(mockRequest);

    return {
      id: requestId,
      statusCode: result.statusCode,
      message: result.message,
      data: result.data,
    };
  }

  /**
   * Handle DELETE_DOCUMENTS_BY_QUERY command
   */
  async handleDeleteByQuery(requestId: string, params: any): Promise<TCPResponse> {
    const { dbName, collectionName, query, deleteOne = true } = params;
    const isMany = !deleteOne;

    // Create mock request object
    const mockRequest = {
      query: { dbName, collectionName, isMany },
      body: { query },
    } as any;

    const result = await this.controller.deleteDocumentByQuery(mockRequest);

    return {
      id: requestId,
      statusCode: result.statusCode,
      message: result.message,
      data: result.data,
    };
  }

  /**
   * Handle AGGREGATE command
   */
  async handleAggregate(requestId: string, params: any): Promise<TCPResponse> {
    const { dbName, collectionName, pipeline } = params;

    // Create mock request object
    const mockRequest = {
      query: { dbName, collectionName },
      body: { aggregation: pipeline },
    } as any;

    const result = await this.controller.runAggregation(mockRequest);

    return {
      id: requestId,
      statusCode: result.statusCode,
      message: result.message,
      data: result.data,
    };
  }

  /**
   * Handle TOTAL_DOCUMENTS command
   */
  async handleTotalDocuments(requestId: string, params: any): Promise<TCPResponse> {
    const { dbName, collectionName } = params;

    try {
      const databaseInstance = await this.axioDB.createDB(dbName);
      const collection = await databaseInstance.createCollection(collectionName);

      const result = await collection.totalDocuments();

      return {
        id: requestId,
        statusCode: result.statusCode,
        message: 'message' in result ? result.message || 'Total documents retrieved successfully' : 'Total documents retrieved successfully',
        data: result.data,
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
   * Handle CREATE_INDEX command
   */
  async handleCreateIndex(requestId: string, params: any): Promise<TCPResponse> {
    const { dbName, collectionName, fieldNames } = params;

    try {
      const databaseInstance = await this.axioDB.createDB(dbName);
      const collection = await databaseInstance.createCollection(collectionName);

      const result = await collection.newIndex(...fieldNames);

      return {
        id: requestId,
        statusCode: result ? result.statusCode : StatusCode.OK,
        message: result && 'message' in result ? (result.message as string) || 'Index created successfully' : 'Index created successfully',
        data: result ? result.data : undefined,
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
   * Handle DROP_INDEX command
   */
  async handleDropIndex(requestId: string, params: any): Promise<TCPResponse> {
    const { dbName, collectionName, indexName } = params;

    try {
      const databaseInstance = await this.axioDB.createDB(dbName);
      const collection = await databaseInstance.createCollection(collectionName);

      const result = await collection.dropIndex(indexName);

      return {
        id: requestId,
        statusCode: result ? result.statusCode : StatusCode.OK,
        message: result && 'message' in result ? (result.message as string) || 'Index dropped successfully' : 'Index dropped successfully',
        data: result ? result.data : undefined,
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
}
