import { AxioDBCloud } from './AxioDBCloud.client';
import { CommandType } from '../tcp/types/command.types';

/**
 * Reader Proxy - Query builder for remote queries
 * Mirrors the Reader class API (chainable query builder)
 */
export default class ReaderProxy {
  private client: AxioDBCloud;
  private dbName: string;
  private collectionName: string;
  private queryFilter: object;
  private limitValue?: number;
  private skipValue?: number;
  private sortValue?: object;
  private findOneValue: boolean = false;

  constructor(client: AxioDBCloud, dbName: string, collectionName: string, query: object) {
    this.client = client;
    this.dbName = dbName;
    this.collectionName = collectionName;
    this.queryFilter = query;
  }

  /**
   * Set limit for query results
   */
  Limit(limit: number): this {
    this.limitValue = limit;
    return this;
  }

  /**
   * Set skip for pagination
   */
  Skip(skip: number): this {
    this.skipValue = skip;
    return this;
  }

  /**
   * Set sort order
   */
  Sort(sort: object): this {
    this.sortValue = sort;
    return this;
  }

  /**
   * Set findOne flag to return single document
   */
  findOne(value: boolean): this {
    this.findOneValue = value;
    return this;
  }

  /**
   * Execute the query
   */
  async exec(): Promise<any> {
    const params: any = {
      dbName: this.dbName,
      collectionName: this.collectionName,
      query: this.queryFilter,
    };

    if (this.limitValue !== undefined) {
      params.limit = this.limitValue;
    }

    if (this.skipValue !== undefined) {
      params.skip = this.skipValue;
    }

    if (this.sortValue) {
      params.sort = this.sortValue;
    }

    if (this.findOneValue) {
      params.findOne = this.findOneValue;
    }

    return await this.client.sendCommand(CommandType.QUERY_DOCUMENTS, params);
  }
}
