/* eslint-disable @typescript-eslint/no-explicit-any */
import { StatusCodes } from "../../../config/Keys/StatusCode";
import { AxioDB } from "../../../Services/Indexation.operation";
import buildResponse, {
  ResponseBuilder,
} from "../../helper/responseBuilder.helper";
import { FastifyReply, FastifyRequest } from "fastify";
import { tarGzFolder, unzipFile } from "../../../utility/ZipUnzip.utils";
import fs from "fs";
import path from "path";
import { isReservedDatabaseName } from "../../../config/Keys/Permissions";

export default class DatabaseController {
  private AxioDBInstance: AxioDB;

  constructor(AxioDBInstance: AxioDB) {
    this.AxioDBInstance = AxioDBInstance;
  }

  public async getDatabases(): Promise<ResponseBuilder> {
    const databases = await this.AxioDBInstance.getInstanceInfo();
    return buildResponse(StatusCodes.OK, "List of Databases", databases?.data);
  }

  public async createDatabase(
    request: FastifyRequest,
  ): Promise<ResponseBuilder> {
    const { name } = request.body as { name: string };

    try {
      const exists = await this.AxioDBInstance.isDatabaseExists(name);
      if (exists) {
        return buildResponse(StatusCodes.CONFLICT, "Database already exists");
      }
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

  public async deleteDatabase(
    request: FastifyRequest,
  ): Promise<ResponseBuilder> {
    const { dbName } = request.query as { dbName: string };
    if (isReservedDatabaseName(dbName)) {
      return buildResponse(StatusCodes.FORBIDDEN, "This is a reserved system database");
    }
    try {
      const exists = await this.AxioDBInstance.isDatabaseExists(dbName);
      if (!exists) {
        return buildResponse(StatusCodes.NOT_FOUND, "Database not found");
      }
      await this.AxioDBInstance.deleteDatabase(dbName);
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
   * Creates a temporary tar.gz of the database directory, streams it to the client, and
   * deletes the temp file once the stream closes (whether it finished or errored).
   */
  public async exportDatabase(request: FastifyRequest, reply: FastifyReply) {
    const { dbName } = request.query as { dbName: string };

    try {
      if (!dbName) {
        return reply.status(400).send({
          success: false,
          message: "Database name is required",
        });
      }
      if (isReservedDatabaseName(dbName)) {
        return reply.status(403).send({
          success: false,
          message: "This is a reserved system database",
        });
      }

      const exists = await this.AxioDBInstance.isDatabaseExists(dbName);
      if (!exists) {
        return reply.status(404).send({
          success: false,
          message: "Database not found",
        });
      }

      const currDatabasePathData = `${this.AxioDBInstance.GetPath}/${dbName}`;

      const responseZipTar = await tarGzFolder(
        currDatabasePathData,
        `./${dbName}.tar.gz`,
      );

      const fs = await import("fs");
      const stats = await fs.promises.stat(responseZipTar);

      if (stats.size === 0) {
        await fs.promises.unlink(responseZipTar);
        return reply.status(500).send({
          success: false,
          message: "Generated export file is empty",
        });
      }

      reply.header("Content-Type", "application/gzip");
      reply.header(
        "Content-Disposition",
        `attachment; filename="${dbName}.tar.gz"`,
      );
      reply.header("Content-Length", stats.size.toString());

      const stream = fs.createReadStream(responseZipTar);

      stream.on("error", async (error) => {
        console.error("Stream error:", error);
        try {
          await fs.promises.unlink(responseZipTar);
        } catch (unlinkError) {
          console.error("Error cleaning up temp file:", unlinkError);
        }
      });

      stream.on("end", async () => {
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
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  public async importDatabase(request: FastifyRequest, reply: FastifyReply) {
    const data = await request.file();

    if (!data) {
      return reply.status(400).send({
        success: false,
        message: "No file uploaded",
      });
    }

    const uploadedArchiveName = path.parse(data.filename).name;
    if (isReservedDatabaseName(uploadedArchiveName)) {
      return reply.status(403).send({
        success: false,
        message: "This is a reserved system database",
      });
    }

    const tempDir = path.join(__dirname, "uploads");

    await fs.promises.mkdir(tempDir, { recursive: true });

    const savePath = path.join(tempDir, data.filename);

    await fs.promises.writeFile(savePath, await data.toBuffer());

    const unzipped = await unzipFile(savePath, this.AxioDBInstance.GetPath);

    if (!unzipped) {
      return reply.status(500).send({
        success: false,
        message: "Error unzipping file",
      });
    }

    await fs.promises.rmdir(tempDir, { recursive: true });

    return { message: "File uploaded successfully", file: data.filename };
  }
}
