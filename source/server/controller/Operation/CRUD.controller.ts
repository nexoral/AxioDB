/* eslint-disable prefer-const */
import { StatusCodes } from "outers";
import { AxioDB } from "../../../Services/Indexation.operation";
import buildResponse, {
} from "../../helper/responseBuilder.helper";
import { FastifyRequest } from "fastify";

/**
 * CRUD Controller class for handling database operations
 */
export default class CRUDController {
  private AxioDBInstance: AxioDB;

  constructor(AxioDBInstance: AxioDB) {
    this.AxioDBInstance = AxioDBInstance;
  }

  /**
   * Retrieves all documents from a specified collection with pagination.
   * 
   * @param request - The Fastify request object containing query parameters
   * @param request.query.dbName - The name of the database to query
   * @param request.query.collectionName - The name of the collection to query
   * @param request.query.page - The page number for pagination (starts from 1)
   * 
   * @returns A response object with:
   *   - Status code 200 and documents data if successful
   *   - Status code 400 if database name, collection name, or page number is invalid
   *   - Status code 404 if no documents are found
   * 
   * @example
   * // GET /documents?dbName=users&collectionName=profiles&page=1
   */
  public async getAllDocuments(request: FastifyRequest) {
    // Extracting parameters from the request body
    let { dbName, collectionName, page } = request.query as {
      dbName: string;
      collectionName: string;
      page: number;
    };

    page = parseInt(String(page)) 

    // Validating extracted parameters
    if (!dbName || typeof dbName !== "string") {
      return buildResponse(StatusCodes.BAD_REQUEST, "Invalid database name");
    }
    if (!collectionName || typeof collectionName !== "string") {
      return buildResponse(StatusCodes.BAD_REQUEST, "Invalid collection name");
    }

    if (typeof page !== "number" || page < 1) {
      return buildResponse(StatusCodes.BAD_REQUEST, "Invalid page number");
    }
    
    const skip = (page - 1) * 10;
    const databaseInstance = await this.AxioDBInstance.createDB(dbName);

    const DB_Collection = await databaseInstance.createCollection(collectionName);

    // Find All Data
    const allDocuments = await DB_Collection.query({}).Limit(10).Skip(skip).exec();
    if (!allDocuments.data) {
      return buildResponse(StatusCodes.NOT_FOUND, "No documents found");
    }

    return buildResponse(StatusCodes.OK, "Documents retrieved successfully", allDocuments);
  }
}
