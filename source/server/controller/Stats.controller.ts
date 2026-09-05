import { StatusCodes } from "../../config/Keys/StatusCode";
import { AxioDB } from "../../Services/Indexation.operation";
import buildResponse from "../helper/responseBuilder.helper";
import fs from "fs";
import Logger from "../../Helper/Logger.helper";

export default class StatsController {
  private AxioDBInstance: AxioDB;

  constructor(AxioDBInstance: AxioDB) {
    this.AxioDBInstance = AxioDBInstance;
  }

  /** All storage metrics are converted to MB for consistency. */
  public async getDashBoardStat(): Promise<object> {
    try {
      const InstanceInfo = await this.AxioDBInstance.getInstanceInfo();
      let totalCollections = 0;
      let totalDocuments = 0;
      const treeMap = [];

      if (InstanceInfo && InstanceInfo.data) {
        const instanceData = InstanceInfo.data as Record<string, unknown>;
        const listOfDatabases = instanceData.ListOfDatabases as string[] || [];
        for (const db of listOfDatabases) {
          const dbTree = {
            name: db,
            collections: [] as object[],
          };
          const DB_instance = this.AxioDBInstance.createDB(db);
          const Collection_stats = await (
            await DB_instance
          ).getCollectionInfo();
          if (Collection_stats && "data" in Collection_stats) {
            const collData = Collection_stats.data as Record<string, unknown>;
            const listOfCollections = (collData.ListOfCollections as string[]) || [];
            totalCollections += listOfCollections.length || 0;
            for (const collection of listOfCollections) {
              const Collection_Instance = await (
                await this.AxioDBInstance.createDB(db)
              ).createCollection(collection);
              const Document_stats = await Collection_Instance.totalDocuments();
              const docTotal = ("data" in Document_stats && Document_stats.data && typeof Document_stats.data === 'object' && 'total' in Document_stats.data) ? (Document_stats.data as { total: number }).total || 0 : 0;
              totalDocuments += docTotal;
              dbTree.collections.push({
                name: collection,
                documentCount: docTotal,
              });
            }
          }
          treeMap.push(dbTree);
        }
      }

      let totalMachineStorage = 0;
      const instanceInfoData = InstanceInfo?.data as Record<string, unknown> | undefined;
      let totalUsedStorage = (instanceInfoData?.TotalSize as number) || 0;

      try {
        const stats = fs.statfsSync("/");
        const totalBytes = stats.blocks * stats.bsize;

        totalMachineStorage = parseFloat(
          (totalBytes / (1024 * 1024)).toFixed(2),
        );
        totalUsedStorage = parseFloat(
          (totalUsedStorage / (1024 * 1024)).toFixed(2),
        );
      } catch (storageError) {
        Logger.error("Error fetching machine storage:", storageError);
      }

      const MatrixUnitsForUsedStorage = "MB";
      const MatrixUnitsForMachineStorage = "MB";

      const CacheStorageDetails = await this.AxioDBInstance.Cache.getCacheDetails();
      const cacheDetails = CacheStorageDetails as { cacheSizeInBytes: number; availableMemoryInBytes: number } | false;
      const totalCacheSize = parseFloat(
        ((cacheDetails ? cacheDetails.cacheSizeInBytes : 0) / (1024 * 1024)).toFixed(2),
      );
      const maxCacheSize = parseFloat(
        ((cacheDetails ? cacheDetails.availableMemoryInBytes : 0) / (1024 * 1024)).toFixed(2),
      );

      const response = {
        totalDatabases: (instanceInfoData?.ListOfDatabases as unknown[])?.length || 0,
        totalCollections: totalCollections || 0,
        totalDocuments: totalDocuments || 0,
        storageInfo: {
          total: totalUsedStorage || 0,
          matrixUnit: MatrixUnitsForUsedStorage || "MB",
          machine: totalMachineStorage || 0,
          machineUnit: MatrixUnitsForMachineStorage || "B",
        },
        cacheStorage: {
          Storage: totalCacheSize || 0,
          Max: maxCacheSize || 0,
          Unit: "MB",
        },
        nodeTree: treeMap,
      };

      return buildResponse(
        StatusCodes.OK,
        "Dashboard stats fetched successfully",
        response,
      );
    } catch (error) {
      Logger.error("Error fetching dashboard stats:", error);
      return buildResponse(
        StatusCodes.INTERNAL_SERVER_ERROR,
        "Failed to fetch dashboard stats",
      );
    }
  }
}
