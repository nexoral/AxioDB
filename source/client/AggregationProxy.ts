import { AxioDBCloud } from './AxioDBCloud.client';
import { CommandType } from '../tcp/types/command.types';

/** Mirrors the Aggregation class API. */
export default class AggregationProxy {
  private client: AxioDBCloud;
  private dbName: string;
  private collectionName: string;
  private pipeline: object[];

  constructor(client: AxioDBCloud, dbName: string, collectionName: string, pipeline: object[]) {
    this.client = client;
    this.dbName = dbName;
    this.collectionName = collectionName;
    this.pipeline = pipeline;
  }

  async exec(): Promise<any> {
    return await this.client.sendCommand(CommandType.AGGREGATE, {
      dbName: this.dbName,
      collectionName: this.collectionName,
      pipeline: this.pipeline,
    });
  }
}
