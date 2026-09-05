import { AxioDB } from '../../../Services/Indexation.operation';
import { TCPResponse } from '../../types/protocol.types';
import { StatusCode } from '../../config/keys';
import TransactionManager from '../../connection/TransactionManager';
import { isReservedDatabaseName } from '../../../config/Keys/Permissions';
import SafeErrorMessage from '../../../Helper/SafeErrorMessage.helper';

type Params = Record<string, unknown>;

export default class TransactionHandler {
  private axioDB: AxioDB;
  private txnManager: TransactionManager;

  constructor(axioDB: AxioDB) {
    this.axioDB = axioDB;
    this.txnManager = TransactionManager.getInstance();
  }

  async handleBegin(requestId: string, params: Params, connectionId: string): Promise<TCPResponse> {
    const { dbName, collectionName } = params;

    if (!dbName || typeof dbName !== 'string') {
      return this.error(requestId, StatusCode.BAD_REQUEST, 'dbName is required');
    }
    if (!collectionName || typeof collectionName !== 'string') {
      return this.error(requestId, StatusCode.BAD_REQUEST, 'collectionName is required');
    }
    if (isReservedDatabaseName(dbName)) {
      return this.error(requestId, StatusCode.FORBIDDEN, 'This is a reserved system database');
    }

    try {
      const databaseInstance = await this.axioDB.createDB(dbName);
      const collection = await databaseInstance.createCollection(collectionName);
      const collectionPath = (collection as unknown as { getCollectionPath(): string }).getCollectionPath();

      const txn = this.txnManager.beginTransaction(connectionId, collectionPath, this.axioDB.Cache);
      const transactionId = txn.getId();

      return {
        id: requestId,
        statusCode: StatusCode.OK,
        message: 'Transaction started',
        data: { transactionId },
      };
    } catch (error) {
      return this.error(requestId, StatusCode.INTERNAL_SERVER_ERROR, error instanceof Error ? error.message : String(error));
    }
  }

  async handleCommit(requestId: string, params: Params, connectionId: string): Promise<TCPResponse> {
    const { transactionId } = params;

    if (!transactionId || typeof transactionId !== 'string') {
      return this.error(requestId, StatusCode.BAD_REQUEST, 'transactionId is required');
    }

    const txn = this.txnManager.getTransaction(connectionId, transactionId);
    if (!txn) {
      return this.error(requestId, StatusCode.BAD_REQUEST, 'No active transaction with this ID on this connection');
    }

    try {
      const result = await txn.commit();
      this.txnManager.removeTransaction(connectionId, transactionId);

      if ('status' in result && result.status === true) {
        return {
          id: requestId,
          statusCode: StatusCode.OK,
          message: result.data && typeof result.data === 'object' && 'message' in (result.data as Record<string, unknown>)
            ? (result.data as Record<string, unknown>).message as string
            : 'Transaction committed successfully',
          data: result.data,
        };
      }

      return this.error(requestId, StatusCode.INTERNAL_SERVER_ERROR,
        'message' in result ? (result.message as string) : 'Transaction commit failed');
    } catch (error) {
      this.txnManager.removeTransaction(connectionId, transactionId);
      return this.error(requestId, StatusCode.INTERNAL_SERVER_ERROR, error instanceof Error ? error.message : String(error));
    }
  }

  async handleRollback(requestId: string, params: Params, connectionId: string): Promise<TCPResponse> {
    const { transactionId } = params;

    if (!transactionId || typeof transactionId !== 'string') {
      return this.error(requestId, StatusCode.BAD_REQUEST, 'transactionId is required');
    }

    const txn = this.txnManager.getTransaction(connectionId, transactionId);
    if (!txn) {
      return this.error(requestId, StatusCode.BAD_REQUEST, 'No active transaction with this ID on this connection');
    }

    try {
      const result = await txn.rollback();
      this.txnManager.removeTransaction(connectionId, transactionId);

      return {
        id: requestId,
        statusCode: StatusCode.OK,
        message: 'Transaction rolled back successfully',
        data: result,
      };
    } catch (error) {
      this.txnManager.removeTransaction(connectionId, transactionId);
      return this.error(requestId, StatusCode.INTERNAL_SERVER_ERROR, error instanceof Error ? error.message : String(error));
    }
  }

  async handleSavepoint(requestId: string, params: Params, connectionId: string): Promise<TCPResponse> {
    const { transactionId, savepointName } = params;

    if (!transactionId || typeof transactionId !== 'string') {
      return this.error(requestId, StatusCode.BAD_REQUEST, 'transactionId is required');
    }
    if (!savepointName || typeof savepointName !== 'string') {
      return this.error(requestId, StatusCode.BAD_REQUEST, 'savepointName is required');
    }

    const txn = this.txnManager.getTransaction(connectionId, transactionId);
    if (!txn) {
      return this.error(requestId, StatusCode.BAD_REQUEST, 'No active transaction with this ID on this connection');
    }

    try {
      txn.savepoint(savepointName as string);
      return {
        id: requestId,
        statusCode: StatusCode.OK,
        message: `Savepoint '${savepointName}' created`,
        data: { transactionId, savepointName },
      };
    } catch (error) {
      return this.error(requestId, StatusCode.BAD_REQUEST, error instanceof Error ? error.message : String(error));
    }
  }

  async handleRollbackToSavepoint(requestId: string, params: Params, connectionId: string): Promise<TCPResponse> {
    const { transactionId, savepointName } = params;

    if (!transactionId || typeof transactionId !== 'string') {
      return this.error(requestId, StatusCode.BAD_REQUEST, 'transactionId is required');
    }
    if (!savepointName || typeof savepointName !== 'string') {
      return this.error(requestId, StatusCode.BAD_REQUEST, 'savepointName is required');
    }

    const txn = this.txnManager.getTransaction(connectionId, transactionId);
    if (!txn) {
      return this.error(requestId, StatusCode.BAD_REQUEST, 'No active transaction with this ID on this connection');
    }

    try {
      txn.rollbackTo(savepointName as string);
      return {
        id: requestId,
        statusCode: StatusCode.OK,
        message: `Rolled back to savepoint '${savepointName}'`,
        data: { transactionId, savepointName },
      };
    } catch (error) {
      return this.error(requestId, StatusCode.BAD_REQUEST, error instanceof Error ? error.message : String(error));
    }
  }

  async handleReleaseSavepoint(requestId: string, params: Params, connectionId: string): Promise<TCPResponse> {
    const { transactionId, savepointName } = params;

    if (!transactionId || typeof transactionId !== 'string') {
      return this.error(requestId, StatusCode.BAD_REQUEST, 'transactionId is required');
    }
    if (!savepointName || typeof savepointName !== 'string') {
      return this.error(requestId, StatusCode.BAD_REQUEST, 'savepointName is required');
    }

    const txn = this.txnManager.getTransaction(connectionId, transactionId);
    if (!txn) {
      return this.error(requestId, StatusCode.BAD_REQUEST, 'No active transaction with this ID on this connection');
    }

    try {
      txn.releaseSavepoint(savepointName as string);
      return {
        id: requestId,
        statusCode: StatusCode.OK,
        message: `Savepoint '${savepointName}' released`,
        data: { transactionId, savepointName },
      };
    } catch (error) {
      return this.error(requestId, StatusCode.BAD_REQUEST, error instanceof Error ? error.message : String(error));
    }
  }

  getTransactionManager(): TransactionManager {
    return this.txnManager;
  }

  private error(id: string, statusCode: number, message: string): TCPResponse {
    const safeMessage = SafeErrorMessage.sanitize(message);
    return { id, statusCode, message: safeMessage, error: safeMessage };
  }
}
