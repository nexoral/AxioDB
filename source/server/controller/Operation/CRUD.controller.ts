import { StatusCodes } from "../../../config/Keys/StatusCode";
import { AxioDB } from "../../../Services/Indexation.operation";
import buildResponse from "../../helper/responseBuilder.helper";
import { AxioHttpRequest } from "../../../Helper/http/HttpTypes";
import Collection from "../../../Services/Collection/collection.operation";
import { isReservedDatabaseName } from "../../../config/Keys/Permissions";
import Logger from "../../../Helper/Logger.helper";

export default class CRUDController {
  private AxioDBInstance: AxioDB;

  constructor(AxioDBInstance: AxioDB) {
    this.AxioDBInstance = AxioDBInstance;
  }

  private async getExistingCollection(
    dbName: string,
    collectionName: string,
  ): Promise<Collection | ReturnType<typeof buildResponse>> {
    const dbExists = await this.AxioDBInstance.isDatabaseExists(dbName);
    if (!dbExists) {
      return buildResponse(StatusCodes.NOT_FOUND, "Database does not exist");
    }
    const databaseInstance = await this.AxioDBInstance.createDB(dbName);
    const colExists = await databaseInstance.isCollectionExists(collectionName);
    if (!colExists) {
      return buildResponse(StatusCodes.NOT_FOUND, "Collection does not exist");
    }
    return await databaseInstance.createCollection(collectionName);
  }

  public async getAllDocuments(request: AxioHttpRequest) {
    const { dbName, collectionName, page: rawPage } = request.query as unknown as {
      dbName: string;
      collectionName: string;
      page: number;
    };

    const page = parseInt(String(rawPage));

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

    const skip = (page - 1) * 25;
    const colOrError = await this.getExistingCollection(dbName, collectionName);
    if ("statusCode" in colOrError) return colOrError;
    const DB_Collection = colOrError;

    const allDocuments = await DB_Collection.query({})
      .Limit(25)
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

  public async getDocumentsByQuery(request: AxioHttpRequest) {
    const { dbName, collectionName, page, limit, skip: explicitSkip } = request.query as unknown as {
      dbName: string;
      collectionName: string;
      page?: number;
      limit?: number;
      skip?: number;
    };
    const bodyLimit = (request.body as Record<string, unknown>)?.limit as number | undefined;
    const bodySkip = (request.body as Record<string, unknown>)?.skip as number | undefined;
    const bodySort = (request.body as Record<string, unknown>)?.sort as Record<string, 1 | -1> | undefined;

    const { query } = (request.body as { query?: Record<string, unknown> } | undefined) ?? {};

    const PageNumber = page ? parseInt(String(page)) : 1;
    const effectiveLimit = limit !== undefined ? parseInt(String(limit)) : (bodyLimit !== undefined ? parseInt(String(bodyLimit)) : 25);
    const effectiveSkip = explicitSkip !== undefined
      ? parseInt(String(explicitSkip))
      : (bodySkip !== undefined ? parseInt(String(bodySkip)) : (PageNumber - 1) * effectiveLimit);

    if (!dbName || typeof dbName !== "string") {
      return buildResponse(StatusCodes.BAD_REQUEST, "Invalid database name");
    }
    if (!collectionName || typeof collectionName !== "string") {
      return buildResponse(StatusCodes.BAD_REQUEST, "Invalid collection name");
    }

    if (isNaN(PageNumber) || PageNumber < 1) {
      return buildResponse(StatusCodes.BAD_REQUEST, "Invalid page number");
    }

    if (!query || typeof query !== "object" || Array.isArray(query)) {
      return buildResponse(StatusCodes.BAD_REQUEST, "Invalid query");
    }
    if (isReservedDatabaseName(dbName)) {
      return buildResponse(StatusCodes.FORBIDDEN, "This is a reserved system database");
    }

    const colOrError = await this.getExistingCollection(dbName, collectionName);
    if ("statusCode" in colOrError) return colOrError;
    const DB_Collection = colOrError;

    let queryBuilder = DB_Collection.query({ ...query });
    if (!isNaN(effectiveLimit) && effectiveLimit > 0) {
      queryBuilder = queryBuilder.Limit(effectiveLimit);
    }
    if (bodySort && typeof bodySort === "object") {
      queryBuilder = queryBuilder.Sort(bodySort);
    } else {
      queryBuilder = queryBuilder.Sort({ updatedAt: -1 });
    }
    if (!isNaN(effectiveSkip) && effectiveSkip >= 0) {
      queryBuilder = queryBuilder.Skip(effectiveSkip);
    }

    try {
      const allDocuments = await queryBuilder.exec();
      if (!allDocuments.data) {
        return buildResponse(StatusCodes.NOT_FOUND, "No documents found");
      }

      return buildResponse(
        StatusCodes.OK,
        "Documents retrieved successfully",
        allDocuments,
      );
    } catch (error) {
      return buildResponse(
        StatusCodes.BAD_REQUEST,
        error instanceof Error ? error.message : "Failed to query documents",
      );
    }
  }

  public async getDocumentsById(request: AxioHttpRequest) {
    const { dbName, collectionName, documentId } = request.query as {
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

    const colOrError = await this.getExistingCollection(dbName, collectionName);
    if ("statusCode" in colOrError) return colOrError;
    const DB_Collection = colOrError;

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

  public async getDocumentsByIds(request: AxioHttpRequest) {
    const { dbName, collectionName } = request.query as {
      dbName: string;
      collectionName: string;
    };
    const { ids } = request.body as { ids: string[] };

    if (!dbName || typeof dbName !== "string") {
      return buildResponse(StatusCodes.BAD_REQUEST, "Invalid database name");
    }
    if (!collectionName || typeof collectionName !== "string") {
      return buildResponse(StatusCodes.BAD_REQUEST, "Invalid collection name");
    }
    if (!Array.isArray(ids) || ids.length === 0 || !ids.every(id => typeof id === "string")) {
      return buildResponse(StatusCodes.BAD_REQUEST, "ids must be a non-empty array of strings");
    }
    if (isReservedDatabaseName(dbName)) {
      return buildResponse(StatusCodes.FORBIDDEN, "This is a reserved system database");
    }

    const colOrError = await this.getExistingCollection(dbName, collectionName);
    if ("statusCode" in colOrError) return colOrError;
    const DB_Collection = colOrError;

    const result = await DB_Collection.findByIds(ids);
    if (!result.data) {
      return buildResponse(StatusCodes.NOT_FOUND, "No documents found");
    }

    return buildResponse(
      StatusCodes.OK,
      "Documents retrieved successfully",
      result.data,
    );
  }

  public async createNewDocument(request: AxioHttpRequest) {
    const { dbName, collectionName } = request.query as {
      dbName: string;
      collectionName: string;
    };
    const documentData = request.body as Record<string, unknown>;

    if (!dbName || typeof dbName !== "string") {
      return buildResponse(StatusCodes.BAD_REQUEST, "Invalid database name");
    }
    if (!collectionName || typeof collectionName !== "string") {
      return buildResponse(StatusCodes.BAD_REQUEST, "Invalid collection name");
    }
    if (!documentData || typeof documentData !== "object" || Array.isArray(documentData)) {
      return buildResponse(StatusCodes.BAD_REQUEST, "Invalid document data");
    }
    if (isReservedDatabaseName(dbName)) {
      return buildResponse(StatusCodes.FORBIDDEN, "This is a reserved system database");
    }

    try {
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
    } catch (error) {
      return buildResponse(
        StatusCodes.BAD_REQUEST,
        error instanceof Error ? error.message : "Failed to insert document",
      );
    }
  }

  public async createManyNewDocument(request: AxioHttpRequest) {
    const { dbName, collectionName } = request.query as {
      dbName: string;
      collectionName: string;
    };
    const documentData = request.body as Record<string, unknown>[];

    if (!dbName || typeof dbName !== "string") {
      return buildResponse(StatusCodes.BAD_REQUEST, "Invalid database name");
    }
    if (!collectionName || typeof collectionName !== "string") {
      return buildResponse(StatusCodes.BAD_REQUEST, "Invalid collection name");
    }
    if (
      !documentData ||
      !Array.isArray(documentData) ||
      documentData.length === 0 ||
      !documentData.every(d => d && typeof d === "object" && !Array.isArray(d))
    ) {
      return buildResponse(StatusCodes.BAD_REQUEST, "Invalid document data");
    }
    if (isReservedDatabaseName(dbName)) {
      return buildResponse(StatusCodes.FORBIDDEN, "This is a reserved system database");
    }

    try {
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
    } catch (error) {
      return buildResponse(
        StatusCodes.BAD_REQUEST,
        error instanceof Error ? error.message : "Failed to insert document",
      );
    }
  }

  public async updateDocumentById(request: AxioHttpRequest) {
    const { dbName, collectionName, documentId } = request.query as {
      dbName: string;
      collectionName: string;
      documentId: string;
    };
    const updatedData = request.body as Record<string, unknown>;

    if (!dbName || typeof dbName !== "string") {
      return buildResponse(StatusCodes.BAD_REQUEST, "Invalid database name");
    }
    if (!collectionName || typeof collectionName !== "string") {
      return buildResponse(StatusCodes.BAD_REQUEST, "Invalid collection name");
    }
    if (!documentId || typeof documentId !== "string") {
      return buildResponse(StatusCodes.BAD_REQUEST, "Invalid document ID");
    }
    if (!updatedData || typeof updatedData !== "object" || Array.isArray(updatedData)) {
      return buildResponse(StatusCodes.BAD_REQUEST, "Invalid updated data");
    }
    if (isReservedDatabaseName(dbName)) {
      return buildResponse(StatusCodes.FORBIDDEN, "This is a reserved system database");
    }

    const colOrError = await this.getExistingCollection(dbName, collectionName);
    if ("statusCode" in colOrError) return colOrError;
    const DB_Collection = colOrError;

    try {
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
    } catch (error) {
      return buildResponse(
        StatusCodes.BAD_REQUEST,
        error instanceof Error ? error.message : "Failed to update document",
      );
    }
  }

  public async updateDocumentByQuery(request: AxioHttpRequest) {
    const { dbName, collectionName, isMany } = request.query as unknown as {
      dbName: string;
      collectionName: string;
      isMany: boolean;
    };
    const { query, update: updatedData } = (request.body as {
      query?: Record<string, unknown>;
      update?: Record<string, unknown>;
    } | undefined) ?? {};

    if (!dbName || typeof dbName !== "string") {
      return buildResponse(StatusCodes.BAD_REQUEST, "Invalid database name");
    }
    if (!collectionName || typeof collectionName !== "string") {
      return buildResponse(StatusCodes.BAD_REQUEST, "Invalid collection name");
    }
    if (!query || typeof query !== "object" || Array.isArray(query)) {
      return buildResponse(StatusCodes.BAD_REQUEST, "Invalid query");
    }
    if (!updatedData || typeof updatedData !== "object" || Array.isArray(updatedData)) {
      return buildResponse(StatusCodes.BAD_REQUEST, "Invalid updated data");
    }
    if (isReservedDatabaseName(dbName)) {
      return buildResponse(StatusCodes.FORBIDDEN, "This is a reserved system database");
    }

    const colOrError = await this.getExistingCollection(dbName, collectionName);
    if ("statusCode" in colOrError) return colOrError;
    const DB_Collection = colOrError;

    try {
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
    } catch (error) {
      return buildResponse(
        StatusCodes.BAD_REQUEST,
        error instanceof Error ? error.message : "Failed to update document",
      );
    }
  }

  public async deleteDocumentById(request: AxioHttpRequest) {
    const { dbName, collectionName, documentId } = request.query as {
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

    const colOrError = await this.getExistingCollection(dbName, collectionName);
    if ("statusCode" in colOrError) return colOrError;
    const DB_Collection = colOrError;

    try {
      const deleteResult = await DB_Collection.delete({
        documentId: documentId,
      }).deleteOne();
      Logger.info(deleteResult);
      if (!deleteResult || deleteResult.statusCode !== StatusCodes.OK) {
        return buildResponse(
          StatusCodes.INTERNAL_SERVER_ERROR,
          "Failed to delete document",
        );
      }

      return buildResponse(StatusCodes.OK, "Document deleted successfully");
    } catch (error) {
      return buildResponse(
        StatusCodes.BAD_REQUEST,
        error instanceof Error ? error.message : "Failed to delete document",
      );
    }
  }

  public async deleteDocumentByQuery(request: AxioHttpRequest) {
    const { dbName, collectionName, isMany } = request.query as unknown as {
      dbName: string;
      collectionName: string;
      isMany: boolean;
    };

    const { query } = (request.body as { query?: Record<string, unknown> } | undefined) ?? {};

    if (!dbName || typeof dbName !== "string") {
      return buildResponse(StatusCodes.BAD_REQUEST, "Invalid database name");
    }
    if (!collectionName || typeof collectionName !== "string") {
      return buildResponse(StatusCodes.BAD_REQUEST, "Invalid collection name");
    }
    if (!query || typeof query !== "object" || Array.isArray(query)) {
      return buildResponse(StatusCodes.BAD_REQUEST, "Invalid query");
    }
    if (isReservedDatabaseName(dbName)) {
      return buildResponse(StatusCodes.FORBIDDEN, "This is a reserved system database");
    }

    const colOrError = await this.getExistingCollection(dbName, collectionName);
    if ("statusCode" in colOrError) return colOrError;
    const DB_Collection = colOrError;

    try {
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
    } catch (error) {
      return buildResponse(
        StatusCodes.BAD_REQUEST,
        error instanceof Error ? error.message : "Failed to delete document",
      );
    }
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
  public async runAggregation(request: AxioHttpRequest) {
    const { dbName, collectionName } = request.query as {
      dbName: string;
      collectionName: string;
    };

    const { aggregation } = request.body as {
      aggregation: Record<string, unknown>[];
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

    const colOrError = await this.getExistingCollection(dbName, collectionName);
    if ("statusCode" in colOrError) return colOrError;
    const DB_Collection = colOrError;

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
