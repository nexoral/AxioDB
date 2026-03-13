import { AxioDBCloud } from './AxioDBCloud.client';
import { CommandType } from '../tcp/types/command.types';
import ReaderProxy from './ReaderProxy';
import UpdateOperationProxy from './UpdateOperationProxy';
import DeleteOperationProxy from './DeleteOperationProxy';
import AggregationProxy from './AggregationProxy';

/**
 * Collection Proxy - Remote proxy for Collection operations
 * Mirrors the Collection class API
 */
export default class CollectionProxy {
  private client: AxioDBCloud;
  private dbName: string;
  private collectionName: string;

  constructor(client: AxioDBCloud, dbName: string, collectionName: string) {
    this.client = client;
    this.dbName = dbName;
    this.collectionName = collectionName;
  }

  /**
   * Insert a single document
   */
  async insert(data: object): Promise<any> {
    return await this.client.sendCommand(CommandType.INSERT_DOCUMENT, {
      dbName: this.dbName,
      collectionName: this.collectionName,
      data,
    });
  }

  /**
   * Insert many documents
   */
  async insertMany(documents: object[]): Promise<any> {
    return await this.client.sendCommand(CommandType.INSERT_MANY_DOCUMENTS, {
      dbName: this.dbName,
      collectionName: this.collectionName,
      documents,
    });
  }

  /**
   * Query documents - returns a query builder
   */
  query(query: object): ReaderProxy {
    return new ReaderProxy(this.client, this.dbName, this.collectionName, query);
  }

  /**
   * Update documents - returns an update operation builder
   */
  update(query: object): UpdateOperationProxy {
    return new UpdateOperationProxy(this.client, this.dbName, this.collectionName, query);
  }

  /**
   * Delete documents - returns a delete operation builder
   */
  delete(query: object): DeleteOperationProxy {
    return new DeleteOperationProxy(this.client, this.dbName, this.collectionName, query);
  }

  /**
   * Aggregate - returns an aggregation builder
   */
  aggregate(pipeline: object[]): AggregationProxy {
    return new AggregationProxy(this.client, this.dbName, this.collectionName, pipeline);
  }

  /**
   * Get total document count
   */
  async totalDocuments(): Promise<any> {
    return await this.client.sendCommand(CommandType.TOTAL_DOCUMENTS, {
      dbName: this.dbName,
      collectionName: this.collectionName,
    });
  }

  /**
   * Create index on fields
   */
  async newIndex(...fieldNames: string[]): Promise<any> {
    return await this.client.sendCommand(CommandType.CREATE_INDEX, {
      dbName: this.dbName,
      collectionName: this.collectionName,
      fieldNames,
    });
  }

  /**
   * Drop an index
   */
  async dropIndex(indexName: string): Promise<any> {
    return await this.client.sendCommand(CommandType.DROP_INDEX, {
      dbName: this.dbName,
      collectionName: this.collectionName,
      indexName,
    });
  }

  /**
   * Get collection name
   */
  get name(): string {
    return this.collectionName;
  }
}
