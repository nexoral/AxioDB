import { AxioDBCloud } from './AxioDBCloud.client';
import { CommandType } from '../tcp/types/command.types';

/** Mirrors the DeleteOperation class API. */
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

  async deleteOne(): Promise<any> {
    return await this.client.sendCommand(CommandType.DELETE_DOCUMENTS_BY_QUERY, {
      dbName: this.dbName,
      collectionName: this.collectionName,
      query: this.query,
      deleteOne: true,
    });
  }

  async deleteMany(): Promise<any> {
    return await this.client.sendCommand(CommandType.DELETE_DOCUMENTS_BY_QUERY, {
      dbName: this.dbName,
      collectionName: this.collectionName,
      query: this.query,
      deleteOne: false,
    });
  }
}
