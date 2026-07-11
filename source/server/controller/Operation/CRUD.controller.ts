/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable prefer-const */
import { StatusCodes } from "../../../config/Keys/StatusCode";
import { AxioDB } from "../../../Services/Indexation.operation";
import buildResponse from "../../helper/responseBuilder.helper";
import { FastifyRequest } from "fastify";
import Database from "../../../Services/Database/database.operation";
import { isReservedDatabaseName } from "../../../config/Keys/Permissions";

export default class CRUDController {
  private AxioDBInstance: AxioDB;

  constructor(AxioDBInstance: AxioDB) {
    this.AxioDBInstance = AxioDBInstance;
  }

  public async getAllDocuments(request: FastifyRequest) {
    let { dbName, collectionName, page } = request.query as {
      dbName: string;
      collectionName: string;
      page: number;
    };

    page = parseInt(String(page));

    if (!dbName || typeof dbName !== "string") {
      return buildResponse(StatusCodes.BAD_REQUEST, "Invalid database name");
    }
    if (!collectionName || typeof collectionName !== "string") {
      return buildResponse(StatusCodes.BAD_REQUEST, "Invalid collection name");
    }

    if (typeof page !== "number" || page < 1) {
      return buildResponse(StatusCodes.BAD_REQUEST, "Invalid page number");
    }
    if (isReservedDatabaseName(dbName)) {
      return buildResponse(StatusCodes.FORBIDDEN, "This is a reserved system database");
    }

    const skip = (page - 1) * 10;
    const databaseInstance = await this.AxioDBInstance.createDB(dbName);

    const DB_Collection =
      await databaseInstance.createCollection(collectionName);

    const allDocuments = await DB_Collection.query({})
      .Limit(10)
      .Sort({ updatedAt: -1 })
      .Skip(skip)
      .exec();
    if (!allDocuments.data) {
      return buildResponse(StatusCodes.NOT_FOUND, "No documents found");
    }

    return buildResponse(
      StatusCodes.OK,
      "Documents retrieved successfully",
      allDocuments,
    );
  }

  public async getDocumentsByQuery(request: FastifyRequest) {
    let { dbName, collectionName, page } = request.query as {
      dbName: string;
      collectionName: string;
      page: number;
    };
    let { query } = request.body as {
      query: object;
    };

    let PageNumber = parseInt(String(page));

    if (!dbName || typeof dbName !== "string") {
      return buildResponse(StatusCodes.BAD_REQUEST, "Invalid database name");
    }
    if (!collectionName || typeof collectionName !== "string") {
      return buildResponse(StatusCodes.BAD_REQUEST, "Invalid collection name");
    }

    if (typeof PageNumber !== "number" || PageNumber < 1) {
      return buildResponse(StatusCodes.BAD_REQUEST, "Invalid page number");
    }

    if (!query || typeof query !== "object") {
      return buildResponse(StatusCodes.BAD_REQUEST, "Invalid query");
    }
    if (isReservedDatabaseName(dbName)) {
      return buildResponse(StatusCodes.FORBIDDEN, "This is a reserved system database");
    }

    const skip: number = (PageNumber - 1) * 10;
    const databaseInstance: Database =
      await this.AxioDBInstance.createDB(dbName);

    const DB_Collection =
      await databaseInstance.createCollection(collectionName);

    const allDocuments = await DB_Collection.query({ ...query })
      .Limit(10)
      .Sort({ updatedAt: -1 })
      .Skip(skip)
      .exec();
    if (!allDocuments.data) {
      return buildResponse(StatusCodes.NOT_FOUND, "No documents found");
    }

    return buildResponse(
      StatusCodes.OK,
      "Documents retrieved successfully",
      allDocuments,
    );
  }

  public async getDocumentsById(request: FastifyRequest) {
    let { dbName, collectionName, documentId } = request.query as {
      dbName: string;
      collectionName: string;
      documentId: string;
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

    const databaseInstance: Database =
      await this.AxioDBInstance.createDB(dbName);

    const DB_Collection =
      await databaseInstance.createCollection(collectionName);

    const allDocuments = await DB_Collection.query({ documentId: documentId })
      .findOne(true)
      .exec();
    if (!allDocuments.data) {
      return buildResponse(StatusCodes.NOT_FOUND, "No documents found");
    }

    return buildResponse(
      StatusCodes.OK,
      "Documents retrieved successfully",
      allDocuments,
    );
  }

  public async createNewDocument(request: FastifyRequest) {
    let { dbName, collectionName } = request.query as {
      dbName: string;
      collectionName: string;
    };
    const documentData = request.body as Record<string, any>;

    if (!dbName || typeof dbName !== "string") {
      return buildResponse(StatusCodes.BAD_REQUEST, "Invalid database name");
    }
    if (!collectionName || typeof collectionName !== "string") {
      return buildResponse(StatusCodes.BAD_REQUEST, "Invalid collection name");
    }
    if (!documentData || typeof documentData !== "object") {
      return buildResponse(StatusCodes.BAD_REQUEST, "Invalid document data");
    }
    if (isReservedDatabaseName(dbName)) {
      return buildResponse(StatusCodes.FORBIDDEN, "This is a reserved system database");
    }

    const databaseInstance = await this.AxioDBInstance.createDB(dbName);
    const DB_Collection =
      await databaseInstance.createCollection(collectionName);

    const insertResult = await DB_Collection.insert(documentData);
    if (!insertResult || insertResult.statusCode !== StatusCodes.OK) {
      return buildResponse(
        StatusCodes.INTERNAL_SERVER_ERROR,
        "Failed to insert document",
      );
    }
    return buildResponse(
      StatusCodes.CREATED,
      "Document created successfully",
      insertResult.data,
    );
  }

  public async createManyNewDocument(request: FastifyRequest) {
    let { dbName, collectionName } = request.query as {
      dbName: string;
      collectionName: string;
    };
    const documentData = request.body as Record<string, any>;

    if (!dbName || typeof dbName !== "string") {
      return buildResponse(StatusCodes.BAD_REQUEST, "Invalid database name");
    }
    if (!collectionName || typeof collectionName !== "string") {
      return buildResponse(StatusCodes.BAD_REQUEST, "Invalid collection name");
    }
    if (!documentData || typeof documentData !== "object") {
      return buildResponse(StatusCodes.BAD_REQUEST, "Invalid document data");
    }
    if (isReservedDatabaseName(dbName)) {
      return buildResponse(StatusCodes.FORBIDDEN, "This is a reserved system database");
    }

    const databaseInstance = await this.AxioDBInstance.createDB(dbName);
    const DB_Collection =
      await databaseInstance.createCollection(collectionName);

    const insertResult = await DB_Collection.insertMany(documentData);
    if (!insertResult || insertResult.statusCode !== StatusCodes.OK) {
      return buildResponse(
        StatusCodes.INTERNAL_SERVER_ERROR,
        "Failed to insert document",
      );
    }
    return buildResponse(
      StatusCodes.CREATED,
      "Document created successfully",
      insertResult.data,
    );
  }

  public async updateDocumentById(request: FastifyRequest) {
    let { dbName, collectionName, documentId } = request.query as {
      dbName: string;
      collectionName: string;
      documentId: string;
    };
    const updatedData = request.body as Record<string, any>;

    if (!dbName || typeof dbName !== "string") {
      return buildResponse(StatusCodes.BAD_REQUEST, "Invalid database name");
    }
    if (!collectionName || typeof collectionName !== "string") {
      return buildResponse(StatusCodes.BAD_REQUEST, "Invalid collection name");
    }
    if (!documentId || typeof documentId !== "string") {
      return buildResponse(StatusCodes.BAD_REQUEST, "Invalid document ID");
    }
    if (!updatedData || typeof updatedData !== "object") {
      return buildResponse(StatusCodes.BAD_REQUEST, "Invalid updated data");
    }
    if (isReservedDatabaseName(dbName)) {
      return buildResponse(StatusCodes.FORBIDDEN, "This is a reserved system database");
    }

    const databaseInstance = await this.AxioDBInstance.createDB(dbName);
    const DB_Collection =
      await databaseInstance.createCollection(collectionName);

    const updateResult = await DB_Collection.update({
      documentId: documentId,
    }).UpdateOne(updatedData);
    if (!updateResult || updateResult.statusCode !== StatusCodes.OK) {
      return buildResponse(
        StatusCodes.INTERNAL_SERVER_ERROR,
        "Failed to update document",
      );
    }
    return buildResponse(
      StatusCodes.OK,
      "Document updated successfully",
      updateResult.data,
    );
  }

  public async updateDocumentByQuery(request: FastifyRequest) {
    let { dbName, collectionName, isMany } = request.query as {
      dbName: string;
      collectionName: string;
      isMany: boolean;
    };
    const { query, update: updatedData } = request.body as {
      query: Record<string, any>;
      update: Record<string, any>;
    };

    if (!dbName || typeof dbName !== "string") {
      return buildResponse(StatusCodes.BAD_REQUEST, "Invalid database name");
    }
    if (!collectionName || typeof collectionName !== "string") {
      return buildResponse(StatusCodes.BAD_REQUEST, "Invalid collection name");
    }
    if (!query || typeof query !== "object") {
      return buildResponse(StatusCodes.BAD_REQUEST, "Invalid query");
    }
    if (!updatedData || typeof updatedData !== "object") {
      return buildResponse(StatusCodes.BAD_REQUEST, "Invalid updated data");
    }
    if (isReservedDatabaseName(dbName)) {
      return buildResponse(StatusCodes.FORBIDDEN, "This is a reserved system database");
    }

    const databaseInstance = await this.AxioDBInstance.createDB(dbName);
    const DB_Collection =
      await databaseInstance.createCollection(collectionName);

    if (isMany) {
      const updateResult =
        await DB_Collection.update(query).UpdateMany(updatedData);
      if (!updateResult || updateResult.statusCode !== StatusCodes.OK) {
        return buildResponse(
          StatusCodes.INTERNAL_SERVER_ERROR,
          "Failed to update document",
        );
      }
    } else {
      const updateResult =
        await DB_Collection.update(query).UpdateOne(updatedData);
      if (!updateResult || updateResult.statusCode !== StatusCodes.OK) {
        return buildResponse(
          StatusCodes.INTERNAL_SERVER_ERROR,
          "Failed to update document",
        );
      }
    }
    return buildResponse(StatusCodes.OK, "Document updated successfully");
  }

  public async deleteDocumentById(request: FastifyRequest) {
    let { dbName, collectionName, documentId } = request.query as {
      dbName: string;
      collectionName: string;
      documentId: string;
    };

    if (!dbName || typeof dbName !== "string") {
      return buildResponse(StatusCodes.BAD_REQUEST, "Invalid database name");
    }
    if (!collectionName || typeof collectionName !== "string") {
      return buildResponse(StatusCodes.BAD_REQUEST, "Invalid collection name");
    }
    if (!documentId || typeof documentId !== "string") {
      return buildResponse(StatusCodes.BAD_REQUEST, "Invalid document ID");
    }
    if (isReservedDatabaseName(dbName)) {
      return buildResponse(StatusCodes.FORBIDDEN, "This is a reserved system database");
    }

    const databaseInstance = await this.AxioDBInstance.createDB(dbName);
    const DB_Collection =
      await databaseInstance.createCollection(collectionName);

    const deleteResult = await DB_Collection.delete({
      documentId: documentId,
    }).deleteOne();
    console.log(deleteResult);
    if (!deleteResult || deleteResult.statusCode !== StatusCodes.OK) {
      return buildResponse(
        StatusCodes.INTERNAL_SERVER_ERROR,
        "Failed to delete document",
      );
    }

    return buildResponse(StatusCodes.OK, "Document deleted successfully");
  }

  public async deleteDocumentByQuery(request: FastifyRequest) {
    let { dbName, collectionName, isMany } = request.query as {
      dbName: string;
      collectionName: string;
      isMany: boolean;
    };

    let { query } = request.body as {
      query: object;
    };

    if (!dbName || typeof dbName !== "string") {
      return buildResponse(StatusCodes.BAD_REQUEST, "Invalid database name");
    }
    if (!collectionName || typeof collectionName !== "string") {
      return buildResponse(StatusCodes.BAD_REQUEST, "Invalid collection name");
    }
    if (!query || typeof query !== "object") {
      return buildResponse(StatusCodes.BAD_REQUEST, "Invalid query");
    }
    if (isReservedDatabaseName(dbName)) {
      return buildResponse(StatusCodes.FORBIDDEN, "This is a reserved system database");
    }

    const databaseInstance = await this.AxioDBInstance.createDB(dbName);
    const DB_Collection =
      await databaseInstance.createCollection(collectionName);

    const deleteResult = isMany
      ? await DB_Collection.delete(query).deleteMany()
      : await DB_Collection.delete(query).deleteOne();

    if (!deleteResult || deleteResult.statusCode !== StatusCodes.OK) {
      return buildResponse(
        StatusCodes.INTERNAL_SERVER_ERROR,
        "Failed to delete document",
      );
    }

    return buildResponse(StatusCodes.OK, "Document deleted successfully");
  }

  /**
   * @example
   * {
   *   dbName: "myDatabase",
   *   collectionName: "users",
   *   aggregation: [
   *     { $match: { age: { $gt: 21 } } },
   *     { $group: { _id: "$status", count: { $sum: 1 } } }
   *   ]
   * }
   */
  public async runAggregation(request: FastifyRequest) {
    let { dbName, collectionName } = request.query as {
      dbName: string;
      collectionName: string;
    };

    let { aggregation } = request.body as {
      aggregation: object[];
    };

    if (!Array.isArray(aggregation) || aggregation.length === 0) {
      return buildResponse(
        StatusCodes.BAD_REQUEST,
        "Invalid aggregation pipeline",
      );
    }
    if (isReservedDatabaseName(dbName)) {
      return buildResponse(StatusCodes.FORBIDDEN, "This is a reserved system database");
    }

    const databaseInstance = await this.AxioDBInstance.createDB(dbName);
    const DB_Collection =
      await databaseInstance.createCollection(collectionName);

    const aggregationResult = await DB_Collection.aggregate(aggregation).exec();
    if (!aggregationResult || aggregationResult.statusCode !== StatusCodes.OK) {
      return buildResponse(
        StatusCodes.INTERNAL_SERVER_ERROR,
        "Failed to run aggregation",
      );
    }

    return buildResponse(
      StatusCodes.OK,
      "Aggregation run successfully",
      aggregationResult.data,
    );
  }
}
