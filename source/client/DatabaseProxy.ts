import { AxioDBCloud } from './AxioDBCloud.client';
import { CommandType } from '../tcp/types/command.types';
import CollectionProxy from './CollectionProxy';

/** Mirrors the Database class API. */
export default class DatabaseProxy {
  private client: AxioDBCloud;
  private dbName: string;

  constructor(client: AxioDBCloud, dbName: string) {
    this.client = client;
    this.dbName = dbName;
  }

  async createCollection(name: string): Promise<CollectionProxy> {
    await this.client.sendCommand(CommandType.CREATE_COLLECTION, {
      dbName: this.dbName,
      collectionName: name,
    });

    return new CollectionProxy(this.client, this.dbName, name);
  }

  async deleteCollection(name: string): Promise<void> {
    await this.client.sendCommand(CommandType.DELETE_COLLECTION, {
      dbName: this.dbName,
      collectionName: name,
    });
  }

  async isCollectionExists(name: string): Promise<boolean> {
    const result = await this.client.sendCommand(CommandType.COLLECTION_EXISTS, {
      dbName: this.dbName,
      collectionName: name,
    });
    return result.exists;
  }

  async getCollectionInfo(): Promise<any> {
    return await this.client.sendCommand(CommandType.GET_COLLECTION_INFO, {
      dbName: this.dbName,
    });
  }

  get name(): string {
    return this.dbName;
  }
}
