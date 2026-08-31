import { StatusCodes } from "../../../config/Keys/StatusCode";
import { AxioDB } from "../../../Services/Indexation.operation";
import buildResponse, {
  ResponseBuilder,
} from "../../helper/responseBuilder.helper";
import { FastifyReply, FastifyRequest } from "fastify";
import {
  tarGzFolder,
  unzipFile,
  UnsafeArchiveError,
} from "../../../utility/ZipUnzip.utils";
import fs from "fs";
import os from "os";
import path from "path";
import { pipeline } from "node:stream/promises";
import { isReservedDatabaseName } from "../../../config/Keys/Permissions";
import Logger from "../../../Helper/Logger.helper";
import {
  claimImport,
  ImportConflictError,
  InvalidExportError,
  readExportedDatabaseName,
  releaseImport,
} from "../../helper/databaseImport.helper";

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
      Logger.error("Error creating database:", error);
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
      Logger.error("Error deleting database:", error);
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
        Logger.error("Stream error:", error);
        try {
          await fs.promises.unlink(responseZipTar);
        } catch (unlinkError) {
          Logger.error("Error cleaning up temp file:", unlinkError);
        }
      });

      stream.on("end", async () => {
        try {
          await fs.promises.unlink(responseZipTar);
        } catch (unlinkError) {
          Logger.error("Error cleaning up temp file:", unlinkError);
        }
      });

      return reply.send(stream);
    } catch (error: unknown) {
      Logger.error("Error exporting database:", error);
      return reply.status(500).send({
        success: false,
        message: "Error exporting database",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Imports a database from an uploaded .tar.gz.
   *
   * Everything is staged outside the data directory and proven to be a genuine AxioDB
   * export before a single byte is promoted into place. That ordering is what lets a bad
   * upload be discarded completely: an archive that fails validation never existed as far
   * as the live data directory is concerned, so there is no partial database to clean up.
   */
  public async importDatabase(request: FastifyRequest, reply: FastifyReply) {
    const username = request.authUser?.username ?? "another user";
    const data = await request.file();

    if (!data) {
      return reply.status(400).send({ success: false, message: "No file uploaded" });
    }

    // A cheap pre-check on the filename. The authoritative check is on the archive's
    // contents further down - a file can be named anything.
    const uploadedArchiveName = path
      .basename(data.filename)
      .replace(/\.(tar\.gz|tgz|tar|gz|zip)$/i, "");

    if (isReservedDatabaseName(uploadedArchiveName)) {
      return reply.status(403).send({
        success: false,
        message: "This is a reserved system database",
      });
    }

    // Every import gets its own staging directory, so two people importing different
    // databases at the same time never share state.
    const workDir = await fs.promises.mkdtemp(
      path.join(os.tmpdir(), "axiodb-import-"),
    );
    const stagingDir = path.join(workDir, "extracted");
    await fs.promises.mkdir(stagingDir);

    let claimed: string | null = null;

    try {
      // Only the basename is used, so a crafted "../../" filename cannot escape workDir.
      const savePath = path.join(workDir, path.basename(data.filename));
      await pipeline(data.file, fs.createWriteStream(savePath));

      if (data.file.truncated) {
        return reply.status(413).send({
          success: false,
          message: "Upload was truncated before it finished.",
        });
      }

      try {
        // Extracted into staging, never straight into the data directory.
        await unzipFile(savePath, stagingDir);
      } catch (error: unknown) {
        Logger.error("Error unzipping uploaded database:", error);
        return reply.status(400).send({
          success: false,
          message:
            error instanceof UnsafeArchiveError
              ? error.message
              : "Could not read that file as a .tar.gz archive. Upload the file produced by Export.",
        });
      }

      // The database name comes from the archive's contents, not its filename: the same
      // export can arrive under any name, and two names can hold the same database.
      let databaseName: string;
      try {
        databaseName = readExportedDatabaseName(stagingDir);
      } catch (error: unknown) {
        Logger.error("Rejected upload that is not an AxioDB export:", error);
        return reply.status(400).send({
          success: false,
          message:
            error instanceof InvalidExportError
              ? error.message
              : "That file is not an AxioDB database export.",
        });
      }

      if (isReservedDatabaseName(databaseName)) {
        return reply.status(403).send({
          success: false,
          message: `"${databaseName}" is a reserved system database`,
        });
      }

      // Claim before touching the destination, so a second importer of the same database is
      // turned away rather than racing this one into the same directory.
      try {
        claimImport(databaseName, username);
        claimed = databaseName;
      } catch (error: unknown) {
        return reply.status(409).send({
          success: false,
          message:
            error instanceof ImportConflictError
              ? error.message
              : "That database is already being imported.",
        });
      }

      const destination = path.join(this.AxioDBInstance.GetPath, databaseName);

      if (fs.existsSync(destination)) {
        return reply.status(409).send({
          success: false,
          message: `"${databaseName}" already exists on this instance. Delete it first if you want to replace it.`,
        });
      }

      const source = path.join(stagingDir, databaseName);
      try {
        await fs.promises.rename(source, destination);
      } catch (error: unknown) {
        // Staging lives in the OS temp directory, which is frequently a different
        // filesystem - rename cannot cross one, so fall back to a copy.
        if ((error as NodeJS.ErrnoException)?.code !== "EXDEV") throw error;
        await fs.promises.cp(source, destination, { recursive: true });
      }

      return {
        message: "Database imported successfully",
        database: databaseName,
        file: data.filename,
      };
    } catch (error: unknown) {
      Logger.error("Error importing database:", error);
      return reply.status(500).send({
        success: false,
        message: "Error importing database",
      });
    } finally {
      if (claimed !== null) releaseImport(claimed);

      // Discards the upload and everything extracted from it, on every path - success,
      // rejection, or crash. Nothing an invalid archive produced survives this.
      await fs.promises
        .rm(workDir, { recursive: true, force: true })
        .catch((cleanupError) => {
          Logger.error("Error cleaning up import staging directory:", cleanupError);
        });
    }
  }
}
