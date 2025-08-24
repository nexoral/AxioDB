/* eslint-disable @typescript-eslint/no-explicit-any */
import { StatusCodes } from "outers";
import { AxioDB } from "../../../Services/Indexation.operation";
import buildResponse, {
  ResponseBuilder,
} from "../../helper/responseBuilder.helper";
import { FastifyRequest } from "fastify";
import GlobalStorageConfig from "../../config/GlobalStorage.config";

/**
 * Controller class for managing databases in AxioDB.
 *
 * This class provides methods for retrieving database information,
 * creating new databases, and other database management operations.
 * It acts as an interface between the API routes and the AxioDB instance.
 */
export default class DatabaseController {
  private AxioDBInstance: AxioDB;

  constructor(AxioDBInstance: AxioDB) {
    this.AxioDBInstance = AxioDBInstance;
  }

  /**
   * Retrieves a list of databases from the AxioDB instance.
   *
   * @returns {Promise<ResponseBuilder>} A Promise that resolves to a ResponseBuilder object
   * containing the list of databases with an OK status code and a success message.
   *
   * @example
   * const response = await databaseController.getDatabases();
   * // Returns a ResponseBuilder with status 200 and database list
   */
  public async getDatabases(
    transactionToken: string,
  ): Promise<ResponseBuilder> {
    // check cache
    if (
      transactionToken &&
      GlobalStorageConfig.get(`database_${transactionToken}`) != undefined
    ) {
      return buildResponse(
        StatusCodes.OK,
        "List of Databases",
        GlobalStorageConfig.get(`database_${transactionToken}`),
      );
    }

    const databases = await this.AxioDBInstance.getInstanceInfo();
    // Cache the response
    if (
      transactionToken &&
      GlobalStorageConfig.get(`database_${transactionToken}`) == undefined
    ) {
      GlobalStorageConfig.set(`database_${transactionToken}`, databases?.data);
    }
    return buildResponse(StatusCodes.OK, "List of Databases", databases?.data);
  }

  /**
   * Creates a new database with the specified name.
   *
   * @param request - The Fastify request object containing the database name in the body
   * @returns A ResponseBuilder object containing the status and message of the operation
   *
   * @throws Will return a conflict response if database already exists
   * @throws Will return a bad request response if name is missing, not a string, or empty
   * @throws Will return an internal server error response if database creation fails
   */
  public async createDatabase(
    request: FastifyRequest,
  ): Promise<ResponseBuilder> {
    const { name } = request.body as { name: string };
    const transactionToken = (request.query as any)?.transactiontoken;

    try {
      // check if the database already exists
      const exists = await this.AxioDBInstance.isDatabaseExists(name);
      if (exists) {
        return buildResponse(StatusCodes.CONFLICT, "Database already exists");
      }
      // create the database
      if (!name) {
        return buildResponse(
          StatusCodes.BAD_REQUEST,
          "Database name is required",
        );
      }

      if (typeof name !== "string" || name.trim() === "") {
        return buildResponse(StatusCodes.BAD_REQUEST, "Invalid database name");
      }
      await this.AxioDBInstance.createDB(name);
      GlobalStorageConfig.delete(`database_${transactionToken}`);
      return buildResponse(StatusCodes.CREATED, "Database Created", {
        Database_Name: name,
      });
    } catch (error) {
      console.error("Error creating database:", error);
      return buildResponse(
        StatusCodes.INTERNAL_SERVER_ERROR,
        "Error creating database",
      );
    }
  }

  /**
   * Deletes a database with the specified name.
   *
   * @param request - The Fastify request object containing the database name in the body
   * @returns A ResponseBuilder object with appropriate status code and message
   *   - 200 OK if the database is successfully deleted
   *   - 404 NOT_FOUND if the database does not exist
   *   - 500 INTERNAL_SERVER_ERROR if an error occurs during deletion
   *
   * @example
   * // Example request body
   * {
   *   "name": "myDatabase"
   * }
   */
  public async deleteDatabase(
    request: FastifyRequest,
  ): Promise<ResponseBuilder> {
    const { dbName } = request.query as { dbName: string };
    const transactionToken = (request.query as any)?.transactiontoken;
    try {
      // check if the database exists
      const exists = await this.AxioDBInstance.isDatabaseExists(dbName);
      if (!exists) {
        return buildResponse(StatusCodes.NOT_FOUND, "Database not found");
      }
      // delete the database
      await this.AxioDBInstance.deleteDatabase(dbName);
      GlobalStorageConfig.delete(`database_${transactionToken}`);
      return buildResponse(StatusCodes.OK, "Database Deleted", {
        Database_Name: dbName,
      });
    } catch (error) {
      console.error("Error deleting database:", error);
      return buildResponse(
        StatusCodes.INTERNAL_SERVER_ERROR,
        "Error deleting database",
      );
    }
  }
}
