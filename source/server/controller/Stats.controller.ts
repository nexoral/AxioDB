/* eslint-disable no-self-assign */
import { StatusCodes } from "outers";
import { AxioDB } from "../../Services/Indexation.operation";
import buildResponse, {
  // ResponseBuilder,
} from "../helper/responseBuilder.helper";
// import { FastifyRequest } from "fastify";
// import countFilesRecursive from "../../helper/filesCounterInFolder.helper";

import fs from 'fs';

export default class StatsController {
  private AxioDBInstance: AxioDB;

  constructor(AxioDBInstance: AxioDB) {
    this.AxioDBInstance = AxioDBInstance;
  }

  public async getDashBoardStat () {
    try {

      const InstanceInfo = await this.AxioDBInstance.getInstanceInfo();
      let totalCollections = 0;
      let totalDocuments = 0;

      // Extract Total Stats from the InstanceInfo
      if (InstanceInfo && InstanceInfo.data) {
        for (const db of InstanceInfo.data.ListOfDatabases) {
          const  DB_instance = this.AxioDBInstance.createDB(db);
          const Collection_stats = await (await DB_instance).getCollectionInfo();
          if (Collection_stats) {
            totalCollections += Collection_stats.data.ListOfCollections.length || 0;
            for (const collection of Collection_stats.data.ListOfCollections) {
              const Collection_Instance = await (await this.AxioDBInstance.createDB(db)).createCollection(collection);
              const Document_stats = await Collection_Instance.totalDocuments();
              totalDocuments += Document_stats.data?.total || 0;
            }
          }
        }
      }

      // Get storage info and convert to MB
      let totalMachineStorage = 0;
      let totalUsedStorage = InstanceInfo?.data?.TotalSize || 0;
      
      try {
        // Get disk info for the root directory
        const stats = fs.statfsSync('/');
        const totalBytes = stats.blocks * stats.bsize;
        
        // Convert to MB
        totalMachineStorage = parseFloat((totalBytes / (1024 * 1024)).toFixed(2));
        totalUsedStorage = parseFloat((totalUsedStorage / (1024 * 1024)).toFixed(2));
      } catch (storageError) {
        console.error("Error fetching machine storage:", storageError);
      }
      
      const MatrixUnitsForUsedStorage = "MB";
      const MatrixUnitsForMachineStorage = "MB";

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
      };

      return buildResponse(StatusCodes.OK, "Dashboard stats fetched successfully", response);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      return buildResponse(StatusCodes.INTERNAL_SERVER_ERROR, "Failed to fetch dashboard stats");
    }
  }

}
