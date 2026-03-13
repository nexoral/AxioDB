import { AxioDBCloud } from './AxioDBCloud.client';
import { CommandType } from '../tcp/types/command.types';

/**
 * Delete Operation Proxy - Delete builder for remote deletes
 * Mirrors the DeleteOperation class API
 */
export default class DeleteOperationProxy {
  private client: AxioDBCloud;
  private dbName: string;
  private collectionName: string;
  private query: object;

  constructor(client: AxioDBCloud, dbName: string, collectionName: string, query: object) {
    this.client = client;
    this.dbName = dbName;
    this.collectionName = collectionName;
    this.query = query;
  }

  /**
   * Delete one document matching the query
   */
  async deleteOne(): Promise<any> {
    return await this.client.sendCommand(CommandType.DELETE_DOCUMENTS_BY_QUERY, {
      dbName: this.dbName,
      collectionName: this.collectionName,
      query: this.query,
      deleteOne: true,
    });
  }

  /**
   * Delete many documents matching the query
   */
  async deleteMany(): Promise<any> {
    return await this.client.sendCommand(CommandType.DELETE_DOCUMENTS_BY_QUERY, {
      dbName: this.dbName,
      collectionName: this.collectionName,
      query: this.query,
      deleteOne: false,
    });
  }
}
