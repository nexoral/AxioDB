import { AxioDB } from '../../../Services/Indexation.operation';
import Collection from '../../../Services/Collection/collection.operation';
import { TCPResponse, TCPRequest } from '../../types/protocol.types';
import { StatusCode } from '../../config/keys';
import CRUDController from '../../../server/controller/Operation/CRUD.controller';
import { Document } from '../../../config/Interfaces/shared.types';
import { AxioHttpRequest } from '../../../Helper/http/HttpTypes';
import TransactionManager from '../../connection/TransactionManager';
import SafeErrorMessage from '../../../Helper/SafeErrorMessage.helper';

type Params = TCPRequest['params'];

interface MockRequest {
  query: Record<string, string>;
  body?: Document | Document[];
  [key: string]: unknown;
}

export default class OperationHandler {
  private controller: CRUDController;
  private axioDB: AxioDB;
  private txnManager: TransactionManager;

  constructor(axioDB: AxioDB) {
    this.axioDB = axioDB;
    this.controller = new CRUDController(axioDB);
    this.txnManager = TransactionManager.getInstance();
  }

  private error(id: string, statusCode: number, message: string): TCPResponse {
    const safeMessage = SafeErrorMessage.sanitize(message);
    return { id, statusCode, message: safeMessage, error: safeMessage };
  }

  private async getExistingCollection(
    dbName?: string,
    collectionName?: string,
  ): Promise<{ collection?: Collection; error?: { statusCode: number; message: string } }> {
    if (!dbName) {
      return { error: { statusCode: StatusCode.BAD_REQUEST, message: 'Database name is required' } };
    }
    if (!collectionName) {
      return { error: { statusCode: StatusCode.BAD_REQUEST, message: 'Collection name is required' } };
    }
    const dbExists = await this.axioDB.isDatabaseExists(dbName);
    if (!dbExists) {
      return { error: { statusCode: StatusCode.NOT_FOUND, message: 'Database does not exist' } };
    }
    const databaseInstance = await this.axioDB.createDB(dbName);
    const colExists = await databaseInstance.isCollectionExists(collectionName);
    if (!colExists) {
      return { error: { statusCode: StatusCode.NOT_FOUND, message: 'Collection does not exist' } };
    }
    const collection = await databaseInstance.createCollection(collectionName);
    return { collection };
  }

  async handleInsertDocument(requestId: string, params: Params, connectionId: string): Promise<TCPResponse> {
    const { dbName, collectionName, data, transactionId } = params;

    if (transactionId) {
      const txn = this.txnManager.getTransaction(connectionId, transactionId);
      if (!txn) return this.error(requestId, StatusCode.BAD_REQUEST, 'No active transaction with this ID on this connection');
      try {
        txn.insert(data as Record<string, unknown>);
        return { id: requestId, statusCode: StatusCode.OK, message: 'Document buffered in transaction', data: { documentId: (data as Record<string, unknown>)?.documentId } };
      } catch (error) {
        return this.error(requestId, StatusCode.BAD_REQUEST, error instanceof Error ? error.message : String(error));
      }
    }

    const mockRequest: MockRequest = {
      query: { dbName: dbName!, collectionName: collectionName! },
      body: data as Document,
    };
    const result = await this.controller.createNewDocument(mockRequest as unknown as AxioHttpRequest);
    return { id: requestId, statusCode: result.statusCode, message: result.message, data: result.data };
  }

  async handleInsertManyDocuments(requestId: string, params: Params, connectionId: string): Promise<TCPResponse> {
    const { dbName, collectionName, documents, transactionId } = params;

    if (transactionId) {
      const txn = this.txnManager.getTransaction(connectionId, transactionId);
      if (!txn) return this.error(requestId, StatusCode.BAD_REQUEST, 'No active transaction with this ID on this connection');
      try {
        for (const doc of documents as Record<string, unknown>[]) {
          txn.insert(doc);
        }
        return { id: requestId, statusCode: StatusCode.OK, message: 'Documents buffered in transaction', data: { count: (documents as unknown[]).length } };
      } catch (error) {
        return this.error(requestId, StatusCode.BAD_REQUEST, error instanceof Error ? error.message : String(error));
      }
    }

    const mockRequest: MockRequest = {
      query: { dbName: dbName!, collectionName: collectionName! },
      body: documents as Document[],
    };
    const result = await this.controller.createManyNewDocument(mockRequest as unknown as AxioHttpRequest);
    return { id: requestId, statusCode: result.statusCode, message: result.message, data: result.data };
  }

  async handleQueryDocuments(requestId: string, params: Params): Promise<TCPResponse> {
    const { dbName, collectionName, query = {}, limit, skip, sort, findOne, hint } = params;

    try {
      const dbExists = await this.axioDB.isDatabaseExists(dbName!);
      if (!dbExists) {
        return { id: requestId, statusCode: StatusCode.NOT_FOUND, message: 'Database does not exist', error: 'Database does not exist' };
      }
      const databaseInstance = await this.axioDB.createDB(dbName!);
      const colExists = await databaseInstance.isCollectionExists(collectionName!);
      if (!colExists) {
        return { id: requestId, statusCode: StatusCode.NOT_FOUND, message: 'Collection does not exist', error: 'Collection does not exist' };
      }
      const collection = await databaseInstance.createCollection(collectionName!);

      let queryBuilder = collection.query(query as Record<string, unknown>);
      if (limit !== undefined) queryBuilder = queryBuilder.Limit(limit);
      if (skip !== undefined) queryBuilder = queryBuilder.Skip(skip);
      if (sort) queryBuilder = queryBuilder.Sort(sort);
      if (findOne) queryBuilder = queryBuilder.findOne(findOne);
      if (hint) queryBuilder = queryBuilder.hint(hint);

      const result = await queryBuilder.exec();
      return { id: requestId, statusCode: StatusCode.OK, message: 'Documents retrieved successfully', data: result };
    } catch (error) {
      return this.error(requestId, StatusCode.INTERNAL_SERVER_ERROR, error instanceof Error ? error.message : String(error));
    }
  }

  async handleQueryById(requestId: string, params: Params): Promise<TCPResponse> {
    const { dbName, collectionName, id: documentId } = params;
    const mockRequest: MockRequest = {
      query: { dbName: dbName!, collectionName: collectionName!, documentId: documentId! },
    };
    const result = await this.controller.getDocumentsById(mockRequest as unknown as AxioHttpRequest);
    return { id: requestId, statusCode: result.statusCode, message: result.message, data: result.data };
  }

  async handleFindByIds(requestId: string, params: Params): Promise<TCPResponse> {
    const { dbName, collectionName, ids } = params;
    try {
      const dbExists = await this.axioDB.isDatabaseExists(dbName!);
      if (!dbExists) {
        return { id: requestId, statusCode: StatusCode.NOT_FOUND, message: 'Database does not exist', error: 'Database does not exist' };
      }
      const databaseInstance = await this.axioDB.createDB(dbName!);
      const colExists = await databaseInstance.isCollectionExists(collectionName!);
      if (!colExists) {
        return { id: requestId, statusCode: StatusCode.NOT_FOUND, message: 'Collection does not exist', error: 'Collection does not exist' };
      }
      const collection = await databaseInstance.createCollection(collectionName!);
      const result = await collection.findByIds(ids!);
      return { id: requestId, statusCode: result.statusCode, message: 'Documents retrieved successfully', data: result.data };
    } catch (error) {
      return this.error(requestId, StatusCode.INTERNAL_SERVER_ERROR, error instanceof Error ? error.message : String(error));
    }
  }

  async handleUpdateById(requestId: string, params: Params, connectionId: string): Promise<TCPResponse> {
    const { dbName, collectionName, id: documentId, updateData, transactionId } = params;

    if (transactionId) {
      const txn = this.txnManager.getTransaction(connectionId, transactionId);
      if (!txn) return this.error(requestId, StatusCode.BAD_REQUEST, 'No active transaction with this ID on this connection');
      try {
        txn.update({ documentId } as Record<string, unknown>, updateData as Record<string, unknown>);
        return { id: requestId, statusCode: StatusCode.OK, message: 'Update buffered in transaction' };
      } catch (error) {
        return this.error(requestId, StatusCode.BAD_REQUEST, error instanceof Error ? error.message : String(error));
      }
    }

    const mockRequest: MockRequest = {
      query: { dbName: dbName!, collectionName: collectionName!, documentId: documentId! },
      body: updateData as Document,
    };
    const result = await this.controller.updateDocumentById(mockRequest as unknown as AxioHttpRequest);
    return { id: requestId, statusCode: result.statusCode, message: result.message, data: result.data };
  }

  async handleUpdateByQuery(requestId: string, params: Params, connectionId: string): Promise<TCPResponse> {
    const { dbName, collectionName, query, updateData, transactionId } = params;

    if (transactionId) {
      const txn = this.txnManager.getTransaction(connectionId, transactionId);
      if (!txn) return this.error(requestId, StatusCode.BAD_REQUEST, 'No active transaction with this ID on this connection');
      try {
        txn.update(query as Record<string, unknown>, updateData as Record<string, unknown>);
        return { id: requestId, statusCode: StatusCode.OK, message: 'Update buffered in transaction' };
      } catch (error) {
        return this.error(requestId, StatusCode.BAD_REQUEST, error instanceof Error ? error.message : String(error));
      }
    }

    const isMany = !(params.updateOne ?? true);
    const mockRequest: MockRequest = {
      query: { dbName: dbName!, collectionName: collectionName!, isMany: String(isMany) },
      body: { query, update: updateData } as unknown as Document,
    };
    const result = await this.controller.updateDocumentByQuery(mockRequest as unknown as AxioHttpRequest);
    return { id: requestId, statusCode: result.statusCode, message: result.message, data: result.data };
  }

  async handleDeleteById(requestId: string, params: Params, connectionId: string): Promise<TCPResponse> {
    const { dbName, collectionName, id: documentId, transactionId } = params;

    if (transactionId) {
      const txn = this.txnManager.getTransaction(connectionId, transactionId);
      if (!txn) return this.error(requestId, StatusCode.BAD_REQUEST, 'No active transaction with this ID on this connection');
      try {
        txn.delete({ documentId } as Record<string, unknown>);
        return { id: requestId, statusCode: StatusCode.OK, message: 'Delete buffered in transaction' };
      } catch (error) {
        return this.error(requestId, StatusCode.BAD_REQUEST, error instanceof Error ? error.message : String(error));
      }
    }

    const mockRequest: MockRequest = {
      query: { dbName: dbName!, collectionName: collectionName!, documentId: documentId! },
    };
    const result = await this.controller.deleteDocumentById(mockRequest as unknown as AxioHttpRequest);
    return { id: requestId, statusCode: result.statusCode, message: result.message, data: result.data };
  }

  async handleDeleteByQuery(requestId: string, params: Params, connectionId: string): Promise<TCPResponse> {
    const { dbName, collectionName, query, transactionId } = params;

    if (transactionId) {
      const txn = this.txnManager.getTransaction(connectionId, transactionId);
      if (!txn) return this.error(requestId, StatusCode.BAD_REQUEST, 'No active transaction with this ID on this connection');
      try {
        txn.delete(query as Record<string, unknown>);
        return { id: requestId, statusCode: StatusCode.OK, message: 'Delete buffered in transaction' };
      } catch (error) {
        return this.error(requestId, StatusCode.BAD_REQUEST, error instanceof Error ? error.message : String(error));
      }
    }

    const isMany = !(params.deleteOne ?? true);
    const mockRequest: MockRequest = {
      query: { dbName: dbName!, collectionName: collectionName!, isMany: String(isMany) },
      body: { query } as unknown as Document,
    };
    const result = await this.controller.deleteDocumentByQuery(mockRequest as unknown as AxioHttpRequest);
    return { id: requestId, statusCode: result.statusCode, message: result.message, data: result.data };
  }

  async handleAggregate(requestId: string, params: Params): Promise<TCPResponse> {
    const { dbName, collectionName, pipeline } = params;
    const mockRequest: MockRequest = {
      query: { dbName: dbName!, collectionName: collectionName! },
      body: { aggregation: pipeline } as unknown as Document,
    };
    const result = await this.controller.runAggregation(mockRequest as unknown as AxioHttpRequest);
    return { id: requestId, statusCode: result.statusCode, message: result.message, data: result.data };
  }

  async handleTotalDocuments(requestId: string, params: Params): Promise<TCPResponse> {
    const { dbName, collectionName } = params;
    try {
      const { collection, error } = await this.getExistingCollection(dbName, collectionName);
      if (error) {
        return { id: requestId, statusCode: error.statusCode, message: error.message, error: error.message };
      }
      const result = await collection!.totalDocuments();
      return {
        id: requestId,
        statusCode: result.statusCode,
        message: 'message' in result ? (result.message as string) || 'Total documents retrieved successfully' : 'Total documents retrieved successfully',
        data: result.data,
      };
    } catch (error) {
      return this.error(requestId, StatusCode.INTERNAL_SERVER_ERROR, error instanceof Error ? error.message : String(error));
    }
  }

  async handleCreateIndex(requestId: string, params: Params): Promise<TCPResponse> {
    const { dbName, collectionName, fieldNames } = params;
    try {
      const { collection, error } = await this.getExistingCollection(dbName, collectionName);
      if (error) {
        return { id: requestId, statusCode: error.statusCode, message: error.message, error: error.message };
      }
      const result = await collection!.newIndex(...(fieldNames as string[]));
      return {
        id: requestId,
        statusCode: result ? result.statusCode : StatusCode.OK,
        message: result && 'message' in result ? (result.message as string) || 'Index created successfully' : 'Index created successfully',
        data: result ? result.data : undefined,
      };
    } catch (error) {
      return this.error(requestId, StatusCode.INTERNAL_SERVER_ERROR, error instanceof Error ? error.message : String(error));
    }
  }

  async handleListIndexes(requestId: string, params: Params): Promise<TCPResponse> {
    const { dbName, collectionName } = params;
    try {
      const { collection, error } = await this.getExistingCollection(dbName, collectionName);
      if (error) {
        return { id: requestId, statusCode: error.statusCode, message: error.message, error: error.message };
      }
      const result = await collection!.getIndexes();
      return {
        id: requestId,
        statusCode: result.statusCode,
        message: 'message' in result ? (result.message as string) || 'Indexes retrieved successfully' : 'Indexes retrieved successfully',
        data: result.data,
      };
    } catch (error) {
      return this.error(requestId, StatusCode.INTERNAL_SERVER_ERROR, error instanceof Error ? error.message : String(error));
    }
  }

  async handleDropIndex(requestId: string, params: Params): Promise<TCPResponse> {
    const { dbName, collectionName, indexName } = params;
    try {
      const { collection, error } = await this.getExistingCollection(dbName, collectionName);
      if (error) {
        return { id: requestId, statusCode: error.statusCode, message: error.message, error: error.message };
      }
      const result = await collection!.dropIndex(indexName!);
      return {
        id: requestId,
        statusCode: result ? result.statusCode : StatusCode.OK,
        message: result && 'message' in result ? (result.message as string) || 'Index dropped successfully' : 'Index dropped successfully',
        data: result ? result.data : undefined,
      };
    } catch (error) {
      return this.error(requestId, StatusCode.INTERNAL_SERVER_ERROR, error instanceof Error ? error.message : String(error));
    }
  }
}
