import { StatusCodes } from "outers";
import { AxioDB } from "../../../Services/Indexation.operation";
import buildResponse, {
  ResponseBuilder,
} from "../../helper/responseBuilder.helper";
import { FastifyRequest } from "fastify";

/**
 * Controller class for managing collections in AxioDB.
 *
 * This class provides methods for creating, retrieving, and managing collections
 * within the AxioDB instance. It acts as an interface between the API routes and
 * the AxioDB instance.
 */
export default class CollectionController {
  private AxioDBInstance: AxioDB;

  constructor(AxioDBInstance: AxioDB) {
    this.AxioDBInstance = AxioDBInstance;
  }

  /**
   * Creates a new collection in the specified database.
   *
   * @param request - The Fastify request object containing the collection details in the body
   * @returns A ResponseBuilder object containing the status and message of the operation
   *
   * @throws Will return a conflict response if collection already exists
   * @throws Will return a bad request response if name is missing, not a string, or empty
   * @throws Will return an internal server error response if collection creation fails
   */
  public async createCollection(
    request: FastifyRequest,
  ): Promise<ResponseBuilder> {
    
    // Extracting parameters from the request body
    const { dbName, collectionName, crypto, key } = request.body as {
      dbName: string;
      collectionName: string;
      crypto?: boolean;
      key?: string;
    };

    // Validating extracted parameters
    if (!dbName || typeof dbName !== "string") {
      return buildResponse(StatusCodes.BAD_REQUEST, "Invalid database name");
    }
    if (!collectionName || typeof collectionName !== "string") {
      return buildResponse(StatusCodes.BAD_REQUEST, "Invalid collection name");
    }

    const databaseInstance = await this.AxioDBInstance.createDB(dbName);

    const isCollectionExists =
      await databaseInstance.isCollectionExists(collectionName);
    if (isCollectionExists) {
      return buildResponse(StatusCodes.CONFLICT, "Collection already exists");
    }
    // Creating the collection
    try {
      await databaseInstance.createCollection(collectionName, crypto, key);
      return buildResponse(
        StatusCodes.CREATED,
        "Collection created successfully",
        {
          dbName,
          collectionName
        }
      );
    } catch (error) {
      console.error("Error creating collection:", error);
      return buildResponse(
        StatusCodes.INTERNAL_SERVER_ERROR,
        "Failed to create collection",
      );
    }
  }

  public async getCollections(request: FastifyRequest): Promise<ResponseBuilder> {
    // extract databaseName from url query
    const { databaseName } = request.query as { databaseName: string };

    if (!databaseName) {
      return buildResponse(StatusCodes.BAD_REQUEST, "Database name is required");
    }

    try {
      const collections = await (await this.AxioDBInstance.createDB(databaseName)).getCollectionInfo();
      console.log("Collections retrieved:", collections);
      return buildResponse(StatusCodes.OK, "Collections retrieved successfully", collections?.data);
    } catch (error) {
      console.error("Error retrieving collections:", error);
      return buildResponse(StatusCodes.INTERNAL_SERVER_ERROR, "Failed to retrieve collections");
    }
  }
}
