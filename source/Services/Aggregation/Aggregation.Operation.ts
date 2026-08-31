import ResponseHelper from "../../Helper/response.helper";
import {
  ErrorInterface,
  SuccessInterface,
} from "../../config/Interfaces/Helper/response.helper.interface";
import DocumentLoader from "../../Helper/DocumentLoader.helper";
import Console from "../../Helper/Console.helper";
import { ReadIndex } from "../Index/ReadIndex.service";
import { CollectionResolver } from "../../config/Interfaces/Operation/aggregation.interface";
import { OperatorRegistry } from "./OperatorRegistry";
import {
  BUILT_IN_STAGE_OPERATORS,
  executeLookup,
  executeFacet,
  executeBucket,
  executeBucketAuto,
  extractMatchFromPipeline,
} from "./operators/stageOperators";

export default class Aggregation {
  private AllData: Record<string, unknown>[] = [];
  private readonly Pipeline: Record<string, unknown>[];
  private readonly path: string;
  private readonly collectionName: string;
  private readonly ResponseHelper: ResponseHelper;
  private readonly collectionResolver?: CollectionResolver;

  constructor(
    collectionName: string,
    path: string,
    Pipeline: Record<string, unknown>[],
    collectionResolver?: CollectionResolver,
  ) {
    this.collectionName = collectionName;
    this.path = path;
    this.AllData = [];
    this.Pipeline = Pipeline;
    this.ResponseHelper = new ResponseHelper();
    this.collectionResolver = collectionResolver;
  }

  public async exec(): Promise<SuccessInterface | ErrorInterface> {
    if (!Array.isArray(this.Pipeline)) {
      throw new Error("Pipeline must be an array of aggregation stages.");
    }

    await this.loadSourceData();

    let result = [...this.AllData];

    for (const stage of this.Pipeline) {
      if (!stage || typeof stage !== "object") continue;

      const opName = Object.keys(stage)[0];
      if (!opName) continue;

      const opExpr = stage[opName] as Record<string, unknown>;

      if (opName === "$lookup") {
        result = await executeLookup(result, opExpr, this.collectionResolver);
        continue;
      }
      if (opName === "$facet") {
        result = [executeFacet(result, opExpr as Record<string, unknown[]>)] as unknown as Record<string, unknown>[];
        continue;
      }
      if (opName === "$bucket") {
        result = executeBucket(result, opExpr as { groupBy: unknown; boundaries: unknown[]; default?: string; output?: Record<string, unknown> });
        continue;
      }
      if (opName === "$bucketAuto") {
        result = executeBucketAuto(result, opExpr as { groupBy: unknown; buckets: number; output?: Record<string, unknown> });
        continue;
      }

      const builtInOp = BUILT_IN_STAGE_OPERATORS[opName];
      if (builtInOp) {
        result = builtInOp(result, opExpr);
        continue;
      }

      const registered = OperatorRegistry.getOperator(opName);
      if (registered && registered.type === "stage") {
        const customResult = (registered.fn as (data: Record<string, unknown>[], expr: Record<string, unknown>, resolver?: CollectionResolver) => Record<string, unknown>[] | Promise<Record<string, unknown>[]>)(result, opExpr, this.collectionResolver);
        result = customResult instanceof Promise ? await customResult : customResult;
        continue;
      }

      Console.red(`Unknown aggregation stage operator: ${opName}`);
    }

    return this.ResponseHelper.Success(result);
  }

  private async loadSourceData(): Promise<void> {
    const matchExpr = extractMatchFromPipeline(this.Pipeline);
    if (matchExpr) {
      try {
        const fileNames = await new ReadIndex(this.path).getFileFromIndex(matchExpr);
        if (fileNames.length > 0) {
          const result = await DocumentLoader.loadDocuments(this.path, fileNames, false);
          if ("data" in result) {
            this.AllData = result.data as Record<string, unknown>[];
            Console.green(`${this.AllData.length} Documents Loaded for Aggregation (index-optimized)`);
            return;
          }
        }
      } catch {
        // Index miss - fall through to full scan
      }
    }

    const result = await DocumentLoader.loadDocuments(this.path, undefined, false);
    if ("data" in result) {
      this.AllData = result.data as Record<string, unknown>[];
      Console.green(`${this.AllData.length} Documents Loaded for Aggregation`);
    }
  }
}
