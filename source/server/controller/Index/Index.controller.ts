import { StatusCodes } from "../../../config/Keys/StatusCode";
import { AxioDB } from "../../../Services/Indexation.operation";
import buildResponse, {
  ResponseBuilder,
} from "../../helper/responseBuilder.helper";
import { AxioHttpRequest } from "../../../Helper/http/HttpTypes";
import { isReservedDatabaseName } from "../../../config/Keys/Permissions";
import Logger from "../../../Helper/Logger.helper";

export default class IndexController {
  private AxioDBInstance: AxioDB;

  constructor(AxioDBInstance: AxioDB) {
    this.AxioDBInstance = AxioDBInstance;
  }

  /** Reads `dbName`/`collectionName` from the query string. */
  public async getIndexes(request: AxioHttpRequest): Promise<ResponseBuilder> {
    try {
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

      const dbExists = await this.AxioDBInstance.isDatabaseExists(dbName);
      if (!dbExists) {
        return buildResponse(StatusCodes.NOT_FOUND, "Database not found");
      }

      const databaseInstance = await this.AxioDBInstance.createDB(dbName);
      const isCollectionExists = await databaseInstance.isCollectionExists(collectionName);
      if (!isCollectionExists) {
        return buildResponse(StatusCodes.NOT_FOUND, "Collection not found");
      }

      const collection = await databaseInstance.createCollection(collectionName);
      const result = await collection.getIndexes();
      if ("message" in result && result.message) {
        return buildResponse(StatusCodes.INTERNAL_SERVER_ERROR, result.message);
      }
      return buildResponse(StatusCodes.OK, "Indexes retrieved successfully", result.data);
    } catch (error: unknown) {
      Logger.error("Error retrieving indexes:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to retrieve indexes";
      if (errorMessage.toLowerCase().includes("invalid") || errorMessage.toLowerCase().includes("path traversal")) {
        return buildResponse(StatusCodes.BAD_REQUEST, errorMessage);
      }
      return buildResponse(
        StatusCodes.INTERNAL_SERVER_ERROR,
        "Failed to retrieve indexes",
      );
    }
  }

  /** Reads `dbName`/`collectionName`/`fieldNames` from the request body. */
  public async createIndex(request: AxioHttpRequest): Promise<ResponseBuilder> {
    try {
      const { dbName, collectionName, fieldNames } = request.body as {
        dbName: string;
        collectionName: string;
        fieldNames: string[];
      };

      if (!dbName || typeof dbName !== "string") {
        return buildResponse(StatusCodes.BAD_REQUEST, "Invalid database name");
      }
      if (!collectionName || typeof collectionName !== "string") {
        return buildResponse(StatusCodes.BAD_REQUEST, "Invalid collection name");
      }
      if (!Array.isArray(fieldNames) || fieldNames.length === 0) {
        return buildResponse(StatusCodes.BAD_REQUEST, "fieldNames must be a non-empty array");
      }
      for (const field of fieldNames) {
        if (typeof field !== "string" || field.trim() === "" || field.includes("..")) {
          return buildResponse(
            StatusCodes.BAD_REQUEST,
            "Invalid fieldName: must be a non-empty string and cannot contain '..'",
          );
        }
      }
      if (isReservedDatabaseName(dbName)) {
        return buildResponse(StatusCodes.FORBIDDEN, "This is a reserved system database");
      }

      const dbExists = await this.AxioDBInstance.isDatabaseExists(dbName);
      if (!dbExists) {
        return buildResponse(StatusCodes.NOT_FOUND, "Database not found");
      }

      const databaseInstance = await this.AxioDBInstance.createDB(dbName);
      const isCollectionExists = await databaseInstance.isCollectionExists(collectionName);
      if (!isCollectionExists) {
        return buildResponse(StatusCodes.NOT_FOUND, "Collection not found");
      }

      const collection = await databaseInstance.createCollection(collectionName);
      const result = await collection.newIndex(...fieldNames);
      const message =
        result && "message" in result && result.message
          ? (result.message as string)
          : "Index created successfully";
      return buildResponse(StatusCodes.CREATED, message, result?.data);
    } catch (error: unknown) {
      Logger.error("Error creating index:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to create index";
      if (errorMessage.toLowerCase().includes("invalid") || errorMessage.toLowerCase().includes("path traversal")) {
        return buildResponse(StatusCodes.BAD_REQUEST, errorMessage);
      }
      return buildResponse(
        StatusCodes.INTERNAL_SERVER_ERROR,
        "Failed to create index",
      );
    }
  }

  /** Reads `dbName`/`collectionName`/`indexName` from the query string. */
  public async deleteIndex(request: AxioHttpRequest): Promise<ResponseBuilder> {
    try {
      const { dbName, collectionName, indexName } = request.query as {
        dbName: string;
        collectionName: string;
        indexName: string;
      };

      if (!dbName || typeof dbName !== "string") {
        return buildResponse(StatusCodes.BAD_REQUEST, "Invalid database name");
      }
      if (!collectionName || typeof collectionName !== "string") {
        return buildResponse(StatusCodes.BAD_REQUEST, "Invalid collection name");
      }
      if (!indexName || typeof indexName !== "string" || indexName.trim() === "" || indexName.includes("..")) {
        return buildResponse(
          StatusCodes.BAD_REQUEST,
          "Invalid index name: must be a non-empty string and cannot contain '..'",
        );
      }
      if (isReservedDatabaseName(dbName)) {
        return buildResponse(StatusCodes.FORBIDDEN, "This is a reserved system database");
      }

      const dbExists = await this.AxioDBInstance.isDatabaseExists(dbName);
      if (!dbExists) {
        return buildResponse(StatusCodes.NOT_FOUND, "Database not found");
      }

      const databaseInstance = await this.AxioDBInstance.createDB(dbName);
      const isCollectionExists = await databaseInstance.isCollectionExists(collectionName);
      if (!isCollectionExists) {
        return buildResponse(StatusCodes.NOT_FOUND, "Collection not found");
      }

      const collection = await databaseInstance.createCollection(collectionName);
      const result = await collection.dropIndex(indexName);
      if ("message" in result && result.message) {
        return buildResponse(StatusCodes.NOT_FOUND, result.message);
      }
      return buildResponse(StatusCodes.OK, "Index deleted successfully", result.data);
    } catch (error: unknown) {
      Logger.error("Error deleting index:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to delete index";
      if (errorMessage.toLowerCase().includes("invalid") || errorMessage.toLowerCase().includes("path traversal")) {
        return buildResponse(StatusCodes.BAD_REQUEST, errorMessage);
      }
      return buildResponse(
        StatusCodes.INTERNAL_SERVER_ERROR,
        "Failed to delete index",
      );
    }
  }

  /** Alias for deleteIndex */
  public async dropIndex(request: AxioHttpRequest): Promise<ResponseBuilder> {
    return this.deleteIndex(request);
  }
}
