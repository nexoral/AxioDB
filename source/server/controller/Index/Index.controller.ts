import { StatusCodes } from "../../../config/Keys/StatusCode";
import { AxioDB } from "../../../Services/Indexation.operation";
import buildResponse, {
  ResponseBuilder,
} from "../../helper/responseBuilder.helper";
import { FastifyRequest } from "fastify";
import { isReservedDatabaseName } from "../../../config/Keys/Permissions";

/**
 * Controller class for managing indexes on a collection in AxioDB.
 *
 * This class provides methods for listing, creating, and deleting indexes on a
 * collection within the AxioDB instance. It acts as an interface between the API
 * routes and the AxioDB instance.
 */
export default class IndexController {
  private AxioDBInstance: AxioDB;

  constructor(AxioDBInstance: AxioDB) {
    this.AxioDBInstance = AxioDBInstance;
  }

  /**
   * Lists all indexes registered on the specified collection.
   *
   * @param request - The Fastify request object containing `dbName`/`collectionName` query parameters
   * @returns A ResponseBuilder object containing the list of index metadata entries
   */
  public async getIndexes(request: FastifyRequest): Promise<ResponseBuilder> {
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
    const isCollectionExists = await databaseInstance.isCollectionExists(collectionName);
    if (!isCollectionExists) {
      return buildResponse(StatusCodes.NOT_FOUND, "Collection not found");
    }

    try {
      const collection = await databaseInstance.createCollection(collectionName);
      const result = await collection.getIndexes();
      if ("message" in result && result.message) {
        return buildResponse(StatusCodes.INTERNAL_SERVER_ERROR, result.message);
      }
      return buildResponse(StatusCodes.OK, "Indexes retrieved successfully", result.data);
    } catch (error) {
      console.error("Error retrieving indexes:", error);
      return buildResponse(
        StatusCodes.INTERNAL_SERVER_ERROR,
        "Failed to retrieve indexes",
      );
    }
  }

  /**
   * Creates one or more indexes on the specified collection.
   *
   * @param request - The Fastify request object containing `dbName`/`collectionName`/`fieldNames` in the body
   * @returns A ResponseBuilder object with appropriate status code and message
   */
  public async createIndex(request: FastifyRequest): Promise<ResponseBuilder> {
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
    if (isReservedDatabaseName(dbName)) {
      return buildResponse(StatusCodes.FORBIDDEN, "This is a reserved system database");
    }

    const databaseInstance = await this.AxioDBInstance.createDB(dbName);
    const isCollectionExists = await databaseInstance.isCollectionExists(collectionName);
    if (!isCollectionExists) {
      return buildResponse(StatusCodes.NOT_FOUND, "Collection not found");
    }

    try {
      const collection = await databaseInstance.createCollection(collectionName);
      const result = await collection.newIndex(...fieldNames);
      const message =
        result && "message" in result && result.message
          ? (result.message as string)
          : "Index created successfully";
      return buildResponse(StatusCodes.CREATED, message, result?.data);
    } catch (error) {
      console.error("Error creating index:", error);
      return buildResponse(
        StatusCodes.INTERNAL_SERVER_ERROR,
        "Failed to create index",
      );
    }
  }

  /**
   * Deletes an index from the specified collection.
   *
   * @param request - The Fastify request object containing `dbName`/`collectionName`/`indexName` query parameters
   * @returns A ResponseBuilder object with appropriate status code and message
   */
  public async deleteIndex(request: FastifyRequest): Promise<ResponseBuilder> {
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
    if (!indexName || typeof indexName !== "string") {
      return buildResponse(StatusCodes.BAD_REQUEST, "Invalid index name");
    }
    if (isReservedDatabaseName(dbName)) {
      return buildResponse(StatusCodes.FORBIDDEN, "This is a reserved system database");
    }

    const databaseInstance = await this.AxioDBInstance.createDB(dbName);
    const isCollectionExists = await databaseInstance.isCollectionExists(collectionName);
    if (!isCollectionExists) {
      return buildResponse(StatusCodes.NOT_FOUND, "Collection not found");
    }

    try {
      const collection = await databaseInstance.createCollection(collectionName);
      const result = await collection.dropIndex(indexName);
      if ("message" in result && result.message) {
        return buildResponse(StatusCodes.NOT_FOUND, result.message);
      }
      return buildResponse(StatusCodes.OK, "Index deleted successfully", result.data);
    } catch (error) {
      console.error("Error deleting index:", error);
      return buildResponse(
        StatusCodes.INTERNAL_SERVER_ERROR,
        "Failed to delete index",
      );
    }
  }
}
