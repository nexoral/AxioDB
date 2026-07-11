import { AxioDBCloud } from './AxioDBCloud.client';
import { CommandType } from '../tcp/types/command.types';

/** Mirrors the UpdateOperation class API. */
export default class UpdateOperationProxy {
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

  async UpdateOne(data: object): Promise<any> {
    return await this.client.sendCommand(CommandType.UPDATE_DOCUMENTS_BY_QUERY, {
      dbName: this.dbName,
      collectionName: this.collectionName,
      query: this.query,
      updateData: data,
      updateOne: true,
    });
  }

  async UpdateMany(data: object): Promise<any> {
    return await this.client.sendCommand(CommandType.UPDATE_DOCUMENTS_BY_QUERY, {
      dbName: this.dbName,
      collectionName: this.collectionName,
      query: this.query,
      updateData: data,
      updateOne: false,
    });
  }
}
