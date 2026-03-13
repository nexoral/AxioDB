import { AxioDBCloud } from './AxioDBCloud.client';
import { CommandType } from '../tcp/types/command.types';
import CollectionProxy from './CollectionProxy';

/**
 * Database Proxy - Remote proxy for Database operations
 * Mirrors the Database class API
 */
export default class DatabaseProxy {
  private client: AxioDBCloud;
  private dbName: string;

  constructor(client: AxioDBCloud, dbName: string) {
    this.client = client;
    this.dbName = dbName;
  }

  /**
   * Create a collection in the database
   */
  async createCollection(name: string, crypto?: boolean, key?: string): Promise<CollectionProxy> {
    await this.client.sendCommand(CommandType.CREATE_COLLECTION, {
      dbName: this.dbName,
      collectionName: name,
      crypto,
      key,
    });

    return new CollectionProxy(this.client, this.dbName, name);
  }

  /**
   * Delete a collection from the database
   */
  async deleteCollection(name: string): Promise<void> {
    await this.client.sendCommand(CommandType.DELETE_COLLECTION, {
      dbName: this.dbName,
      collectionName: name,
    });
  }

  /**
   * Check if collection exists
   */
  async isCollectionExists(name: string): Promise<boolean> {
    const result = await this.client.sendCommand(CommandType.COLLECTION_EXISTS, {
      dbName: this.dbName,
      collectionName: name,
    });
    return result.exists;
  }

  /**
   * Get collection information
   */
  async getCollectionInfo(): Promise<any> {
    return await this.client.sendCommand(CommandType.GET_COLLECTION_INFO, {
      dbName: this.dbName,
    });
  }

  /**
   * Get database name
   */
  get name(): string {
    return this.dbName;
  }
}
