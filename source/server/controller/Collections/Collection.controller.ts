/* eslint-disable @typescript-eslint/no-explicit-any */
import { StatusCodes } from "../../../config/Keys/StatusCode";
import { AxioDB } from "../../../Services/Indexation.operation";
import buildResponse, {
  ResponseBuilder,
} from "../../helper/responseBuilder.helper";
import { FastifyRequest } from "fastify";
import countFilesRecursive from "../../helper/filesCounterInFolder.helper";
import { isReservedDatabaseName } from "../../../config/Keys/Permissions";
export default class CollectionController {
  private AxioDBInstance: AxioDB;

  constructor(AxioDBInstance: AxioDB) {
    this.AxioDBInstance = AxioDBInstance;
  }

  public async createCollection(
    request: FastifyRequest,
  ): Promise<ResponseBuilder> {
    const { dbName, collectionName, crypto, key } = request.body as {
      dbName: string;
      collectionName: string;
      crypto?: boolean;
      key?: string;
    };

    if (!dbName || typeof dbName !== "string") {
      return buildResponse(StatusCodes.BAD_REQUEST, "Invalid database name");
    }
    if (!collectionName || typeof collectionName !== "string") {
      return buildResponse(StatusCodes.BAD_REQUEST, "Invalid collection name");
    }
    if (isReservedDatabaseName(dbName)) {
      return buildResponse(StatusCodes.FORBIDDEN, "This is a reserved system database");
    }

    const databaseInstance = await this.AxioDBInstance.createDB(dbName);

    const isCollectionExists =
      await databaseInstance.isCollectionExists(collectionName);
    if (isCollectionExists) {
      return buildResponse(StatusCodes.CONFLICT, "Collection already exists");
    }
    try {
      await databaseInstance.createCollection(collectionName, crypto, key);
      return buildResponse(
        StatusCodes.CREATED,
        "Collection created successfully",
        {
          dbName,
          collectionName,
        },
      );
    } catch (error) {
      console.error("Error creating collection:", error);
      return buildResponse(
        StatusCodes.INTERNAL_SERVER_ERROR,
        "Failed to create collection",
      );
    }
  }

  public async getCollections(
    request: FastifyRequest,
  ): Promise<ResponseBuilder> {
    const { databaseName } = request.query as { databaseName: string };

    if (!databaseName) {
      return buildResponse(
        StatusCodes.BAD_REQUEST,
        "Database name is required",
      );
    }
    if (isReservedDatabaseName(databaseName)) {
      return buildResponse(StatusCodes.FORBIDDEN, "This is a reserved system database");
    }

    try {
      const collections = await (
        await this.AxioDBInstance.createDB(databaseName)
      ).getCollectionInfo();

      let FolderPaths = collections?.data?.AllCollectionsPaths;
      FolderPaths = FolderPaths.filter( // exclude .meta files
        (path: string) => !path.endsWith(".meta"),
      );
      const mainData = collections?.data;
      mainData.CollectionSizeMap = [];

      await Promise.all([
        ...FolderPaths.map(async (folderPath: string) => {
          const fileCount = await countFilesRecursive(folderPath);
          mainData.CollectionSizeMap.push({ folderPath, fileCount });
        }),
      ]);

      return buildResponse(
        StatusCodes.OK,
        "Collections retrieved successfully",
        mainData,
      );
    } catch (error) {
      console.error("Error retrieving collections:", error);
      return buildResponse(
        StatusCodes.INTERNAL_SERVER_ERROR,
        "Failed to retrieve collections",
      );
    }
  }

  public async deleteCollection(
    request: FastifyRequest,
  ): Promise<ResponseBuilder> {
    const { dbName, collectionName } = request.query as {
      dbName: string;
      collectionName: string;
    };

    if (!dbName || typeof dbName !== "string") {
      return buildResponse(StatusCodes.BAD_REQUEST, "Invalid database name");
    }
    if (!collectionName || typeof collectionName !== "string") {
      return buildResponse(StatusCodes.BAD_REQUEST, "Invalid collection name");
    }
    if (isReservedDatabaseName(dbName)) {
      return buildResponse(StatusCodes.FORBIDDEN, "This is a reserved system database");
    }

    const databaseInstance = await this.AxioDBInstance.createDB(dbName);

    const isCollectionExists =
      await databaseInstance.isCollectionExists(collectionName);
    if (!isCollectionExists) {
      return buildResponse(StatusCodes.NOT_FOUND, "Collection not found");
    }

    try {
      await databaseInstance.deleteCollection(collectionName);
      return buildResponse(StatusCodes.OK, "Collection deleted successfully");
    } catch (error) {
      console.error("Error deleting collection:", error);
      return buildResponse(
        StatusCodes.INTERNAL_SERVER_ERROR,
        "Failed to delete collection",
      );
    }
  }
}