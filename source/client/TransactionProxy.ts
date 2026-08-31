import { AxioDBCloud } from './AxioDBCloud.client';
import { CommandType } from '../tcp/types/command.types';
import PooledConnection from './PooledConnection';

/**
 * TransactionProxy - client-side transactional API over TCP.
 *
 * All operations are pinned to the same underlying TCP connection so that
 * in-flight writes are visible to subsequent reads within the same transaction.
 * Created via `collection.beginTransaction()`.
 */
export default class TransactionProxy {
  private client: AxioDBCloud;
  private transactionId: string;
  private dbName: string;
  private collectionName: string;
  private pinnedConnection: PooledConnection;

  constructor(
    client: AxioDBCloud,
    transactionId: string,
    dbName: string,
    collectionName: string,
    pinnedConnection: PooledConnection,
  ) {
    this.client = client;
    this.transactionId = transactionId;
    this.dbName = dbName;
    this.collectionName = collectionName;
    this.pinnedConnection = pinnedConnection;
  }

  get id(): string {
    return this.transactionId;
  }

  private params(extra?: Record<string, unknown>): Record<string, unknown> {
    return {
      dbName: this.dbName,
      collectionName: this.collectionName,
      transactionId: this.transactionId,
      ...extra,
    };
  }

  async insert(data: object): Promise<unknown> {
    return this.client.sendPinnedCommand(CommandType.INSERT_DOCUMENT, this.params({ data }), this.pinnedConnection);
  }

  async insertMany(documents: object[]): Promise<unknown> {
    return this.client.sendPinnedCommand(CommandType.INSERT_MANY_DOCUMENTS, this.params({ documents }), this.pinnedConnection);
  }

  async findByIds(ids: string[]): Promise<unknown> {
    return this.client.sendPinnedCommand(CommandType.FIND_BY_IDS, this.params({ ids }), this.pinnedConnection);
  }

  async query(query: object, options?: { limit?: number; skip?: number; sort?: Record<string, 1 | -1>; findOne?: boolean }): Promise<unknown> {
    return this.client.sendPinnedCommand(CommandType.QUERY_DOCUMENTS, this.params({ query, ...options }), this.pinnedConnection);
  }

  async updateById(documentId: string, updateData: object): Promise<unknown> {
    return this.client.sendPinnedCommand(CommandType.UPDATE_DOCUMENT_BY_ID, this.params({ id: documentId, updateData }), this.pinnedConnection);
  }

  async updateByQuery(query: object, updateData: object, updateOne = true): Promise<unknown> {
    return this.client.sendPinnedCommand(CommandType.UPDATE_DOCUMENTS_BY_QUERY, this.params({ query, updateData, updateOne }), this.pinnedConnection);
  }

  async deleteById(documentId: string): Promise<unknown> {
    return this.client.sendPinnedCommand(CommandType.DELETE_DOCUMENT_BY_ID, this.params({ id: documentId }), this.pinnedConnection);
  }

  async deleteByQuery(query: object, deleteOne = true): Promise<unknown> {
    return this.client.sendPinnedCommand(CommandType.DELETE_DOCUMENTS_BY_QUERY, this.params({ query, deleteOne }), this.pinnedConnection);
  }

  async commit(): Promise<unknown> {
    return this.client.sendPinnedCommand(CommandType.COMMIT_TRANSACTION, { transactionId: this.transactionId }, this.pinnedConnection);
  }

  async rollback(): Promise<unknown> {
    return this.client.sendPinnedCommand(CommandType.ROLLBACK_TRANSACTION, { transactionId: this.transactionId }, this.pinnedConnection);
  }

  async savepoint(name: string): Promise<unknown> {
    return this.client.sendPinnedCommand(CommandType.SAVEPOINT, { transactionId: this.transactionId, savepointName: name }, this.pinnedConnection);
  }

  async rollbackToSavepoint(name: string): Promise<unknown> {
    return this.client.sendPinnedCommand(CommandType.ROLLBACK_TO_SAVEPOINT, { transactionId: this.transactionId, savepointName: name }, this.pinnedConnection);
  }

  async releaseSavepoint(name: string): Promise<unknown> {
    return this.client.sendPinnedCommand(CommandType.RELEASE_SAVEPOINT, { transactionId: this.transactionId, savepointName: name }, this.pinnedConnection);
  }
}
