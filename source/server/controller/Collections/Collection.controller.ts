import { StatusCodes } from "../../../config/Keys/StatusCode";
import { AxioDB } from "../../../Services/Indexation.operation";
import buildResponse, {
  ResponseBuilder,
} from "../../helper/responseBuilder.helper";
import { FastifyRequest } from "fastify";
import countDocumentsInFolder from "../../helper/documentCounterInFolder.helper";
import { isReservedDatabaseName } from "../../../config/Keys/Permissions";
import Logger from "../../../Helper/Logger.helper";
export default class CollectionController {
  private AxioDBInstance: AxioDB;

  constructor(AxioDBInstance: AxioDB) {
    this.AxioDBInstance = AxioDBInstance;
  }

  public async createCollection(
    request: FastifyRequest,
  ): Promise<ResponseBuilder> {
    const { dbName, collectionName } = request.body as {
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
    if (isCollectionExists) {
      return buildResponse(StatusCodes.CONFLICT, "Collection already exists");
    }
    try {
      await databaseInstance.createCollection(collectionName);
      return buildResponse(
        StatusCodes.CREATED,
        "Collection created successfully",
        {
          dbName,
          collectionName,
        },
      );
    } catch (error) {
      Logger.error("Error creating collection:", error);
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
      
      if (!collections || !("data" in collections)) {
        return buildResponse(
          StatusCodes.INTERNAL_SERVER_ERROR,
          "Failed to retrieve collections",
        );
      }

      const mainData = collections.data as Record<string, unknown>;
      const FolderPaths = (mainData.AllCollectionsPaths as string[]) || [];
      mainData.CollectionSizeMap = [];

      await Promise.all([
        ...FolderPaths.map(async (folderPath: string) => {
          const fileCount = await countDocumentsInFolder(folderPath);
          (mainData.CollectionSizeMap as Array<{ folderPath: string; fileCount: number }>).push({ folderPath, fileCount });
        }),
      ]);

      return buildResponse(
        StatusCodes.OK,
        "Collections retrieved successfully",
        mainData,
      );
    } catch (error) {
      Logger.error("Error retrieving collections:", error);
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
      Logger.error("Error deleting collection:", error);
      return buildResponse(
        StatusCodes.INTERNAL_SERVER_ERROR,
        "Failed to delete collection",
      );
    }
  }
}