import { AxioDB } from '../../../Services/Indexation.operation';
import { TCPResponse, TCPRequest } from '../../types/protocol.types';
import { StatusCode } from '../../config/keys';
import CRUDController from '../../../server/controller/Operation/CRUD.controller';
import { Document } from '../../../config/Interfaces/shared.types';
import { FastifyRequest } from 'fastify';

type Params = TCPRequest['params'];

interface MockRequest {
  query: Record<string, string>;
  body?: Document | Document[];
  [key: string]: unknown;
}

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
  async handleInsertDocument(requestId: string, params: Params): Promise<TCPResponse> {
    const { dbName, collectionName, data } = params;

    const mockRequest: MockRequest = {
      query: { dbName: dbName!, collectionName: collectionName! },
      body: data,
    };

    const result = await this.controller.createNewDocument(mockRequest as unknown as FastifyRequest);

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
  async handleInsertManyDocuments(requestId: string, params: Params): Promise<TCPResponse> {
    const { dbName, collectionName, documents } = params;

    const mockRequest: MockRequest = {
      query: { dbName: dbName!, collectionName: collectionName! },
      body: documents as Document[],
    };

    const result = await this.controller.createManyNewDocument(mockRequest as unknown as FastifyRequest);

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
  async handleQueryDocuments(requestId: string, params: Params): Promise<TCPResponse> {
    const { dbName, collectionName, query = {}, limit, skip, sort, findOne, hint } = params;

    try {
      const databaseInstance = await this.axioDB.createDB(dbName!);
      const collection = await databaseInstance.createCollection(collectionName!);

      // Build query with options
      let queryBuilder = collection.query(query as Record<string, unknown>);

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

      if (hint) {
        queryBuilder = queryBuilder.hint(hint);
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
  async handleQueryById(requestId: string, params: Params): Promise<TCPResponse> {
    const { dbName, collectionName, id: documentId } = params;

    const mockRequest: MockRequest = {
      query: { dbName: dbName!, collectionName: collectionName!, documentId: documentId! },
    };

    const result = await this.controller.getDocumentsById(mockRequest as unknown as FastifyRequest);

    return {
      id: requestId,
      statusCode: result.statusCode,
      message: result.message,
      data: result.data,
    };
  }

  /**
   * Handle FIND_BY_IDS command
   */
  async handleFindByIds(requestId: string, params: Params): Promise<TCPResponse> {
    const { dbName, collectionName, ids } = params;

    try {
      const databaseInstance = await this.axioDB.createDB(dbName!);
      const collection = await databaseInstance.createCollection(collectionName!);
      const result = await collection.findByIds(ids!);

      return {
        id: requestId,
        statusCode: result.statusCode,
        message: 'Documents retrieved successfully',
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
   * Handle UPDATE_DOCUMENT_BY_ID command
   */
  async handleUpdateById(requestId: string, params: Params): Promise<TCPResponse> {
    const { dbName, collectionName, id: documentId, updateData } = params;

    const mockRequest: MockRequest = {
      query: { dbName: dbName!, collectionName: collectionName!, documentId: documentId! },
      body: updateData as Document,
    };

    const result = await this.controller.updateDocumentById(mockRequest as unknown as FastifyRequest);

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
  async handleUpdateByQuery(requestId: string, params: Params): Promise<TCPResponse> {
    const { dbName, collectionName, query, updateData, updateOne = true } = params;
    const isMany = !updateOne;

    const mockRequest: MockRequest = {
      query: { dbName: dbName!, collectionName: collectionName!, isMany: String(isMany) },
      body: { query, update: updateData } as unknown as Document,
    };

    const result = await this.controller.updateDocumentByQuery(mockRequest as unknown as FastifyRequest);

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
  async handleDeleteById(requestId: string, params: Params): Promise<TCPResponse> {
    const { dbName, collectionName, id: documentId } = params;

    const mockRequest: MockRequest = {
      query: { dbName: dbName!, collectionName: collectionName!, documentId: documentId! },
    };

    const result = await this.controller.deleteDocumentById(mockRequest as unknown as FastifyRequest);

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
  async handleDeleteByQuery(requestId: string, params: Params): Promise<TCPResponse> {
    const { dbName, collectionName, query, deleteOne = true } = params;
    const isMany = !deleteOne;

    const mockRequest: MockRequest = {
      query: { dbName: dbName!, collectionName: collectionName!, isMany: String(isMany) },
      body: { query } as unknown as Document,
    };

    const result = await this.controller.deleteDocumentByQuery(mockRequest as unknown as FastifyRequest);

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
  async handleAggregate(requestId: string, params: Params): Promise<TCPResponse> {
    const { dbName, collectionName, pipeline } = params;

    const mockRequest: MockRequest = {
      query: { dbName: dbName!, collectionName: collectionName! },
      body: { aggregation: pipeline } as unknown as Document,
    };

    const result = await this.controller.runAggregation(mockRequest as unknown as FastifyRequest);

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
  async handleTotalDocuments(requestId: string, params: Params): Promise<TCPResponse> {
    const { dbName, collectionName } = params;

    try {
      const databaseInstance = await this.axioDB.createDB(dbName!);
      const collection = await databaseInstance.createCollection(collectionName!);

      const result = await collection.totalDocuments();

      return {
        id: requestId,
        statusCode: result.statusCode,
        message: 'message' in result ? (result.message as string) || 'Total documents retrieved successfully' : 'Total documents retrieved successfully',
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
  async handleCreateIndex(requestId: string, params: Params): Promise<TCPResponse> {
    const { dbName, collectionName, fieldNames } = params;

    try {
      const databaseInstance = await this.axioDB.createDB(dbName!);
      const collection = await databaseInstance.createCollection(collectionName!);

      const result = await collection.newIndex(...(fieldNames as string[]));

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
   * Handle LIST_INDEXES command
   */
  async handleListIndexes(requestId: string, params: Params): Promise<TCPResponse> {
    const { dbName, collectionName } = params;

    try {
      const databaseInstance = await this.axioDB.createDB(dbName!);
      const collection = await databaseInstance.createCollection(collectionName!);

      const result = await collection.getIndexes();

      return {
        id: requestId,
        statusCode: result.statusCode,
        message: 'message' in result ? (result.message as string) || 'Indexes retrieved successfully' : 'Indexes retrieved successfully',
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
   * Handle DROP_INDEX command
   */
  async handleDropIndex(requestId: string, params: Params): Promise<TCPResponse> {
    const { dbName, collectionName, indexName } = params;

    try {
      const databaseInstance = await this.axioDB.createDB(dbName!);
      const collection = await databaseInstance.createCollection(collectionName!);

      const result = await collection.dropIndex(indexName!);

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
