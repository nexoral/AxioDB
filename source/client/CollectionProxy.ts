import { AxioDBCloud } from './AxioDBCloud.client';
import { CommandType } from '../tcp/types/command.types';
import ReaderProxy from './ReaderProxy';
import UpdateOperationProxy from './UpdateOperationProxy';
import DeleteOperationProxy from './DeleteOperationProxy';
import AggregationProxy from './AggregationProxy';

/** Mirrors the Collection class API. */
export default class CollectionProxy {
  private client: AxioDBCloud;
  private dbName: string;
  private collectionName: string;

  constructor(client: AxioDBCloud, dbName: string, collectionName: string) {
    this.client = client;
    this.dbName = dbName;
    this.collectionName = collectionName;
  }

  async insert(data: object): Promise<any> {
    return await this.client.sendCommand(CommandType.INSERT_DOCUMENT, {
      dbName: this.dbName,
      collectionName: this.collectionName,
      data,
    });
  }

  async insertMany(documents: object[]): Promise<any> {
    return await this.client.sendCommand(CommandType.INSERT_MANY_DOCUMENTS, {
      dbName: this.dbName,
      collectionName: this.collectionName,
      documents,
    });
  }

  query(query: object): ReaderProxy {
    return new ReaderProxy(this.client, this.dbName, this.collectionName, query);
  }

  update(query: object): UpdateOperationProxy {
    return new UpdateOperationProxy(this.client, this.dbName, this.collectionName, query);
  }

  delete(query: object): DeleteOperationProxy {
    return new DeleteOperationProxy(this.client, this.dbName, this.collectionName, query);
  }

  aggregate(pipeline: object[]): AggregationProxy {
    return new AggregationProxy(this.client, this.dbName, this.collectionName, pipeline);
  }

  async totalDocuments(): Promise<any> {
    return await this.client.sendCommand(CommandType.TOTAL_DOCUMENTS, {
      dbName: this.dbName,
      collectionName: this.collectionName,
    });
  }

  async newIndex(...fieldNames: string[]): Promise<any> {
    return await this.client.sendCommand(CommandType.CREATE_INDEX, {
      dbName: this.dbName,
      collectionName: this.collectionName,
      fieldNames,
    });
  }

  async dropIndex(indexName: string): Promise<any> {
    return await this.client.sendCommand(CommandType.DROP_INDEX, {
      dbName: this.dbName,
      collectionName: this.collectionName,
      indexName,
    });
  }

  async listIndexes(): Promise<any> {
    return await this.client.sendCommand(CommandType.LIST_INDEXES, {
      dbName: this.dbName,
      collectionName: this.collectionName,
    });
  }

  get name(): string {
    return this.collectionName;
  }
}
