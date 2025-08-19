/* eslint-disable no-self-assign */
import { StatusCodes } from "outers";
import { AxioDB } from "../../Services/Indexation.operation";
import buildResponse from "../helper/responseBuilder.helper"; // ResponseBuilder,
// import { FastifyRequest } from "fastify";
// import countFilesRecursive from "../../helper/filesCounterInFolder.helper";
import InMemoryCache from "../../Memory/memory.operation";
import fs from "fs";
import GlobalStorageConfig from "../config/GlobalStorage.config";

export default class StatsController {
  private AxioDBInstance: AxioDB;

  constructor(AxioDBInstance: AxioDB) {
    this.AxioDBInstance = AxioDBInstance;
  }

  /**
   * Retrieves dashboard statistics for the AxioDB instance.
   *
   * This method gathers and compiles various statistics about the database system:
   * - Count of databases, collections, and documents
   * - Storage information (used storage and total machine storage)
   * - In-memory cache details
   *
   * All storage metrics are converted to MB for consistency.
   *
   * @returns {Promise<Object>} A formatted response object containing:
   *   - HTTP status code
   *   - Status message
   *   - Data payload with the following statistics:
   *     - totalDatabases: Number of databases in the instance
   *     - totalCollections: Total number of collections across all databases
   *     - totalDocuments: Total number of documents across all collections
   *     - storageInfo: Object containing storage metrics (total used, machine total, and units)
   *     - cacheStorage: Object containing cache storage metrics (current usage, maximum, and units)
   *
   * @throws Will return an error response with status 500 if the operation fails
   */
  public async getDashBoardStat(transactionToken: string): Promise<object> {
    try {
      // check cache
      if (
        transactionToken &&
        GlobalStorageConfig.get(`dashboard_stats_${transactionToken}`) != undefined
      ) {
        return buildResponse(
          StatusCodes.OK,
          "Dashboard stats fetched successfully",
          GlobalStorageConfig.get(`dashboard_stats_${transactionToken}`),
        );
      }

      const InstanceInfo = await this.AxioDBInstance.getInstanceInfo();
      let totalCollections = 0;
      let totalDocuments = 0;
      const treeMap = [];

      // Extract Total Stats from the InstanceInfo
      if (InstanceInfo && InstanceInfo.data) {
        for (const db of InstanceInfo.data.ListOfDatabases) {
          const dbTree = {
            name: db,
            collections: [] as object[],
          };
          const DB_instance = this.AxioDBInstance.createDB(db);
          const Collection_stats = await (
            await DB_instance
          ).getCollectionInfo();
          if (Collection_stats) {
            totalCollections +=
              Collection_stats.data.ListOfCollections.length || 0;
            for (const collection of Collection_stats.data.ListOfCollections) {
              const Collection_Instance = await (
                await this.AxioDBInstance.createDB(db)
              ).createCollection(collection);
              const Document_stats = await Collection_Instance.totalDocuments();
              totalDocuments += Document_stats.data?.total || 0;
              dbTree.collections.push({
                name: collection,
                documentCount: Document_stats.data?.total || 0,
              });
            }
          }
          treeMap.push(dbTree);
        }
      }

      // Get storage info and convert to MB
      let totalMachineStorage = 0;
      let totalUsedStorage = InstanceInfo?.data?.TotalSize || 0;

      try {
        // Get disk info for the root directory
        const stats = fs.statfsSync("/");
        const totalBytes = stats.blocks * stats.bsize;

        // Convert to MB
        totalMachineStorage = parseFloat(
          (totalBytes / (1024 * 1024)).toFixed(2),
        );
        totalUsedStorage = parseFloat(
          (totalUsedStorage / (1024 * 1024)).toFixed(2),
        );
      } catch (storageError) {
        console.error("Error fetching machine storage:", storageError);
      }

      const MatrixUnitsForUsedStorage = "MB";
      const MatrixUnitsForMachineStorage = "MB";

      const CacheStorageDetails = await InMemoryCache.getCacheDetails();
      const totalCacheSize = parseFloat(
        (CacheStorageDetails.cacheSizeInBytes / (1024 * 1024)).toFixed(2),
      );
      const maxCacheSize = parseFloat(
        (CacheStorageDetails.availableMemoryInBytes / (1024 * 1024)).toFixed(2),
      );

      const response = {
        totalDatabases: InstanceInfo?.data?.ListOfDatabases?.length || 0,
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

      // Cache the response
      if (
        transactionToken &&
        GlobalStorageConfig.get(`dashboard_stats_${transactionToken}`) == undefined
      ) {
        GlobalStorageConfig.set(`dashboard_stats_${transactionToken}`, response);
      }
      return buildResponse(
        StatusCodes.OK,
        "Dashboard stats fetched successfully",
        response,
      );
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      return buildResponse(
        StatusCodes.INTERNAL_SERVER_ERROR,
        "Failed to fetch dashboard stats",
      );
    }
  }
}
