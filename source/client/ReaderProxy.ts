import { AxioDBCloud } from './AxioDBCloud.client';
import { CommandType } from '../tcp/types/command.types';

/** Mirrors the Reader class API (chainable query builder). */
export default class ReaderProxy {
  private client: AxioDBCloud;
  private dbName: string;
  private collectionName: string;
  private queryFilter: object;
  private limitValue?: number;
  private skipValue?: number;
  private sortValue?: object;
  private findOneValue: boolean = false;
  private hintValue?: string;

  constructor(client: AxioDBCloud, dbName: string, collectionName: string, query: object) {
    this.client = client;
    this.dbName = dbName;
    this.collectionName = collectionName;
    this.queryFilter = query;
  }

  Limit(limit: number): this {
    this.limitValue = limit;
    return this;
  }

  Skip(skip: number): this {
    this.skipValue = skip;
    return this;
  }

  Sort(sort: object): this {
    this.sortValue = sort;
    return this;
  }

  findOne(value: boolean): this {
    this.findOneValue = value;
    return this;
  }

  hint(indexName: string): this {
    this.hintValue = indexName;
    return this;
  }

  async exec(): Promise<unknown> {
    const params: Record<string, unknown> = {
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

    if (this.hintValue) {
      params.hint = this.hintValue;
    }

    return await this.client.sendCommand(CommandType.QUERY_DOCUMENTS, params);
  }
}
