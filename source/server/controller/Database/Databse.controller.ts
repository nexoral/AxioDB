/* eslint-disable @typescript-eslint/no-explicit-any */
import { StatusCodes } from "outers";
import { AxioDB } from "../../../Services/Indexation.operation";
import buildResponse, {
  ResponseBuilder,
} from "../../helper/responseBuilder.helper";
import { FastifyReply, FastifyRequest } from "fastify";
import GlobalStorageConfig from "../../config/GlobalStorage.config";
import { tarGzFolder } from "../../../utility/ZipUnzip.utils";

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
      GlobalStorageConfig.clear();
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
    try {
      // check if the database exists
      const exists = await this.AxioDBInstance.isDatabaseExists(dbName);
      if (!exists) {
        return buildResponse(StatusCodes.NOT_FOUND, "Database not found");
      }
      // delete the database
      await this.AxioDBInstance.deleteDatabase(dbName);
      GlobalStorageConfig.clear();
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

  /**
   * Exports a database as a compressed tar.gz file and sends it as a downloadable attachment.
   * 
   * @param request - The Fastify request object containing the query parameter 'dbName'
   * @param reply - The Fastify reply object used to send the response
   * @returns A stream of the compressed database file or an error response
   * 
   * @throws Will return an error response if the export process fails
   * 
   * @remarks
   * The method creates a temporary tar.gz file of the specified database directory,
   * streams it to the client as a downloadable file, and then deletes the temporary
   * file once the stream is closed.
   */
  public async exportDatabase(request: FastifyRequest, reply: FastifyReply) {
    const { dbName } = request.query as { dbName: string };

    try {
      // check if name is provided
      if (!dbName) {
        return reply.status(400).send({
          success: false,
          message: "Database name is required"
        });
      }

      // check if the database exists
      const exists = await this.AxioDBInstance.isDatabaseExists(dbName);
      if (!exists) {
        return reply.status(404).send({
          success: false,
          message: "Database not found"
        });
      }

      // Get the current database path
      const currDatabasePathData = `${this.AxioDBInstance.GetPath}/${dbName}`;

      const responseZipTar = await tarGzFolder(currDatabasePathData, `./${dbName}.tar.gz`);

      console.log('Created tar file:', responseZipTar);

      // Check if file was created and get its size
      const fs = await import('fs');
      const stats = await fs.promises.stat(responseZipTar);

      console.log('File size:', stats.size);

      if (stats.size === 0) {
        await fs.promises.unlink(responseZipTar);
        return reply.status(500).send({
          success: false,
          message: "Generated export file is empty"
        });
      }

      // Set headers
      reply.header("Content-Type", "application/gzip");
      reply.header("Content-Disposition", `attachment; filename="${dbName}.tar.gz"`);
      reply.header("Content-Length", stats.size.toString());

      const stream = fs.createReadStream(responseZipTar);

      // Handle stream errors
      stream.on("error", async (error) => {
        console.error("Stream error:", error);
        try {
          await fs.promises.unlink(responseZipTar);
        } catch (unlinkError) {
          console.error("Error cleaning up temp file:", unlinkError);
        }
      });

      // Clean up after stream ends
      stream.on("end", async () => {
        console.log("Stream ended, cleaning up temp file");
        try {
          await fs.promises.unlink(responseZipTar);
        } catch (unlinkError) {
          console.error("Error cleaning up temp file:", unlinkError);
        }
      });

      return reply.send(stream);

    } catch (error: unknown) {
      console.error("Error exporting database:", error);
      return reply.status(500).send({
        success: false,
        message: "Error exporting database",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
}
