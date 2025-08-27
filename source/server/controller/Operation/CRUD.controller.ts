/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable prefer-const */
import { StatusCodes } from "outers";
import { AxioDB } from "../../../Services/Indexation.operation";
import buildResponse from "../../helper/responseBuilder.helper";
import { FastifyRequest } from "fastify";
import GlobalStorageConfig from "../../config/GlobalStorage.config";
import Database from "../../../Services/Database/database.operation";

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

    page = parseInt(String(page));

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

    const DB_Collection =
      await databaseInstance.createCollection(collectionName);

    // Find All Data
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

  /**
   * Retrieves documents from a specified collection based on a query with pagination.
   *
   * @param request - The Fastify request object containing query parameters and body data.
   * @param request.query - Query parameters for the database and collection.
   * @param request.query.dbName - The name of the database to query.
   * @param request.query.collectionName - The name of the collection to query.
   * @param request.query.page - The page number for pagination (starts from 1).
   * @param request.body - The request body containing the query object.
   * @param request.body.query - The query object to filter documents.
   *
   * @returns A response object with:
   *   - Status code 200 and the retrieved documents if successful.
   *   - Status code 400 if any required parameters are invalid.
   *   - Status code 404 if no documents are found.
   *
   * @example
   * // Example request:
   * {
   *   query: {
   *     dbName: "users",
   *     collectionName: "profiles",
   *     page: 1
   *   },
   *   body: {
   *     query: { age: { $gte: 18 } }
   *   }
   * }
   */
  public async getDocumentsByQuery(request: FastifyRequest) {
    // Extracting parameters from the request body
    let { dbName, collectionName, page } = request.query as {
      dbName: string;
      collectionName: string;
      page: number;
    };
    let { query } = request.body as {
      query: object;
    };

    let PageNumber = parseInt(String(page));

    // Validating extracted parameters
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

    const skip: number = (PageNumber - 1) * 10;
    const databaseInstance: Database =
      await this.AxioDBInstance.createDB(dbName);

    const DB_Collection =
      await databaseInstance.createCollection(collectionName);

    // Find All Data
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

  /**
   * Retrieves a document from a specified collection in a database by its ID.
   *
   * @param request - The Fastify request object containing query parameters.
   * @param request.query - Query parameters for the database and collection.
   * @param request.query.dbName - The name of the database to query.
   * @param request.query.collectionName - The name of the collection to query.
   * @param request.query.documentId - The ID of the document to retrieve.
   *
   * @returns A response object with:
   *   - Status code 200 and the retrieved document if successful.
   *   - Status code 400 if any required parameters are invalid.
   *   - Status code 404 if no document is found.
   *
   * @example
   * // Example request:
   * {
   *   query: {
   *     dbName: "users",
   *     collectionName: "profiles",
   *     documentId: "12345"
   *   }
   * }
   */
  public async getDocumentsById(request: FastifyRequest) {
    // Extracting parameters from the request body
    let { dbName, collectionName, documentId } = request.query as {
      dbName: string;
      collectionName: string;
      documentId: string;
    };

    // Validating extracted parameters
    if (!dbName || typeof dbName !== "string") {
      return buildResponse(StatusCodes.BAD_REQUEST, "Invalid database name");
    }
    if (!collectionName || typeof collectionName !== "string") {
      return buildResponse(StatusCodes.BAD_REQUEST, "Invalid collection name");
    }

    const databaseInstance: Database =
      await this.AxioDBInstance.createDB(dbName);

    const DB_Collection =
      await databaseInstance.createCollection(collectionName);

    // Find All Data
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

  /**
   * Creates a new document in a specified collection within a database.
   *
   * @param request - The Fastify request object containing query parameters and body data
   * @param request.query - Query parameters containing database and collection names
   * @param request.query.dbName - The name of the database to store the document in
   * @param request.query.collectionName - The name of the collection to store the document in
   * @param request.body - The document data to be inserted
   *
   * @returns A response object with appropriate status code and message:
   *  - 201 (Created) with the inserted document data on success
   *  - 400 (Bad Request) if any required parameters are invalid
   *  - 500 (Internal Server Error) if document insertion fails
   *
   * @throws May throw exceptions if database or collection operations fail
   */
  public async createNewDocument(request: FastifyRequest) {
    // Extracting parameters from the request body
    let { dbName, collectionName } = request.query as {
      dbName: string;
      collectionName: string;
    };
    const documentData = request.body as Record<string, any>;

    // Validating extracted parameters
    if (!dbName || typeof dbName !== "string") {
      return buildResponse(StatusCodes.BAD_REQUEST, "Invalid database name");
    }
    if (!collectionName || typeof collectionName !== "string") {
      return buildResponse(StatusCodes.BAD_REQUEST, "Invalid collection name");
    }
    if (!documentData || typeof documentData !== "object") {
      return buildResponse(StatusCodes.BAD_REQUEST, "Invalid document data");
    }

    const databaseInstance = await this.AxioDBInstance.createDB(dbName);
    const DB_Collection =
      await databaseInstance.createCollection(collectionName);

    // Insert the new document
    const insertResult = await DB_Collection.insert(documentData);
    if (!insertResult || insertResult.statusCode !== StatusCodes.OK) {
      return buildResponse(
        StatusCodes.INTERNAL_SERVER_ERROR,
        "Failed to insert document",
      );
    }
    GlobalStorageConfig.clear();
    return buildResponse(
      StatusCodes.CREATED,
      "Document created successfully",
      insertResult.data,
    );
  }

  /**
   * Creates multiple new documents in a specified collection within a database.
   *
   * @param request - The Fastify request object containing query parameters and body data
   * @param request.query - Query parameters containing database and collection names
   * @param request.query.dbName - The name of the database to store the documents in
   * @param request.query.collectionName - The name of the collection to store the documents in
   * @param request.body - An array of document data to be inserted
   *
   * @returns A response object with appropriate status code and message:
   *  - 201 (Created) with the inserted document data on success
   *  - 400 (Bad Request) if any required parameters are invalid
   *  - 500 (Internal Server Error) if document insertion fails
   *
   * @throws May throw exceptions if database or collection operations fail
   */
  public async createManyNewDocument (request: FastifyRequest) {
    // Extracting parameters from the request body
    let { dbName, collectionName } = request.query as {
      dbName: string;
      collectionName: string;
    };
    const documentData = request.body as Record<string, any>;

    // Validating extracted parameters
    if (!dbName || typeof dbName !== "string") {
      return buildResponse(StatusCodes.BAD_REQUEST, "Invalid database name");
    }
    if (!collectionName || typeof collectionName !== "string") {
      return buildResponse(StatusCodes.BAD_REQUEST, "Invalid collection name");
    }
    if (!documentData || typeof documentData !== "object") {
      return buildResponse(StatusCodes.BAD_REQUEST, "Invalid document data");
    }

    const databaseInstance = await this.AxioDBInstance.createDB(dbName);
    const DB_Collection =
      await databaseInstance.createCollection(collectionName);

    // Insert the new document Array Document
    const insertResult = await DB_Collection.insertMany(documentData);
    if (!insertResult || insertResult.statusCode !== StatusCodes.OK) {
      return buildResponse(
        StatusCodes.INTERNAL_SERVER_ERROR,
        "Failed to insert document",
      );
    }
    GlobalStorageConfig.clear();
    return buildResponse(
      StatusCodes.CREATED,
      "Document created successfully",
      insertResult.data,
    );
  }

  /**
   * Update an existing document in a specified collection within a database.
   * @param request - The Fastify request object containing query parameters and body data
   * @param request.query - Query parameters containing database, collection, and document IDs
   * @param request.query.dbName - The name of the database
   * @param request.query.collectionName - The name of the collection
   * @param request.query.documentId - The ID of the document to update
   * @param request.body - The updated document data
   */
  public async updateDocumentById(request: FastifyRequest) {
    // Extracting parameters from the request body
    let { dbName, collectionName, documentId } = request.query as {
      dbName: string;
      collectionName: string;
      documentId: string;
    };
    const updatedData = request.body as Record<string, any>;

    // Validating extracted parameters
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

    const databaseInstance = await this.AxioDBInstance.createDB(dbName);
    const DB_Collection =
      await databaseInstance.createCollection(collectionName);

    // Update the document
    const updateResult = await DB_Collection.update({
      documentId: documentId,
    }).UpdateOne(updatedData);
    if (!updateResult || updateResult.statusCode !== StatusCodes.OK) {
      return buildResponse(
        StatusCodes.INTERNAL_SERVER_ERROR,
        "Failed to update document",
      );
    }
    GlobalStorageConfig.clear();
    return buildResponse(
      StatusCodes.OK,
      "Document updated successfully",
      updateResult.data,
    );
  }

  /**
   * Updates documents in a specified collection based on a query.
   * @param request - The Fastify request object containing query parameters and body data
   * @param request.query - Query parameters containing database, collection, and update options
   * @param request.query.dbName - The name of the database
   * @param request.query.collectionName - The name of the collection
   * @param request.query.isMany - Flag indicating if multiple documents should be updated
   * @param request.body - The update query and data
   * @param request.body.query - The query to match documents
   * @param request.body.update - The updated document data
   * @returns A response object with the status of the update operation
   */
  public async updateDocumentByQuery(request: FastifyRequest) {
    // Extracting parameters from the request body
    let { dbName, collectionName, isMany } = request.query as {
      dbName: string;
      collectionName: string;
      isMany: boolean;
    };
    const { query, update: updatedData } = request.body as {
      query: Record<string, any>;
      update: Record<string, any>;
    };

    // Validating extracted parameters
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
      // Update the single document
      const updateResult =
        await DB_Collection.update(query).UpdateOne(updatedData);
      if (!updateResult || updateResult.statusCode !== StatusCodes.OK) {
        return buildResponse(
          StatusCodes.INTERNAL_SERVER_ERROR,
          "Failed to update document",
        );
      }
    }
    GlobalStorageConfig.clear();
    return buildResponse(StatusCodes.OK, "Document updated successfully");
  }

  /**
   * Deletes a document from a specified collection in a database.
   *
   * @param request - The Fastify request object containing query parameters
   * @param request.query.dbName - The name of the database
   * @param request.query.collectionName - The name of the collection
   * @param request.query.documentId - The ID of the document to delete
   *
   * @returns A response object with appropriate status code and message:
   *   - 200 (OK) if the document was successfully deleted
   *   - 400 (BAD REQUEST) if any required parameters are missing or invalid
   *   - 500 (INTERNAL SERVER ERROR) if the deletion operation fails
   *
   * @throws May throw exceptions during database operations
   */
  public async deleteDocumentById(request: FastifyRequest) {
    // Extracting parameters from the request body
    let { dbName, collectionName, documentId } = request.query as {
      dbName: string;
      collectionName: string;
      documentId: string;
    };

    // Validating extracted parameters
    if (!dbName || typeof dbName !== "string") {
      return buildResponse(StatusCodes.BAD_REQUEST, "Invalid database name");
    }
    if (!collectionName || typeof collectionName !== "string") {
      return buildResponse(StatusCodes.BAD_REQUEST, "Invalid collection name");
    }
    if (!documentId || typeof documentId !== "string") {
      return buildResponse(StatusCodes.BAD_REQUEST, "Invalid document ID");
    }

    const databaseInstance = await this.AxioDBInstance.createDB(dbName);
    const DB_Collection =
      await databaseInstance.createCollection(collectionName);

    // Delete the document
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

    GlobalStorageConfig.clear();
    return buildResponse(StatusCodes.OK, "Document deleted successfully");
  }

  /**
   * Deletes one or more documents from a collection based on a query
   *
   * @param request - The Fastify request object containing the query parameters
   * @param request.query.dbName - The name of the database
   * @param request.query.collectionName - The name of the collection
   * @param request.query.query - The query object to match documents for deletion
   * @param request.query.isMany - Boolean flag indicating whether to delete multiple documents (true) or a single document (false)
   *
   * @returns A response object with status code and message
   * - 200 OK if the document(s) were successfully deleted
   * - 400 BAD_REQUEST if any of the required parameters are invalid
   * - 500 INTERNAL_SERVER_ERROR if the deletion operation failed
   *
   * @throws May throw exceptions from database operations
   */
  public async deleteDocumentByQuery(request: FastifyRequest) {
    // Extracting parameters from the request body
    let { dbName, collectionName, isMany } = request.query as {
      dbName: string;
      collectionName: string;
      isMany: boolean;
    };

    let { query } = request.body as {
      query: object;
    };

    // Validating extracted parameters
    if (!dbName || typeof dbName !== "string") {
      return buildResponse(StatusCodes.BAD_REQUEST, "Invalid database name");
    }
    if (!collectionName || typeof collectionName !== "string") {
      return buildResponse(StatusCodes.BAD_REQUEST, "Invalid collection name");
    }
    if (!query || typeof query !== "object") {
      return buildResponse(StatusCodes.BAD_REQUEST, "Invalid query");
    }

    const databaseInstance = await this.AxioDBInstance.createDB(dbName);
    const DB_Collection =
      await databaseInstance.createCollection(collectionName);

    // Delete the document
    if (isMany) {
      const deleteResult = await DB_Collection.delete(query).deleteMany();
      console.log(deleteResult);
      if (!deleteResult || deleteResult.statusCode !== StatusCodes.OK) {
        return buildResponse(
          StatusCodes.INTERNAL_SERVER_ERROR,
          "Failed to delete document",
        );
      } else {
        const deleteResult = await DB_Collection.delete(query).deleteOne();
        GlobalStorageConfig.clear();
        if (!deleteResult || deleteResult.statusCode !== StatusCodes.OK) {
          return buildResponse(
            StatusCodes.INTERNAL_SERVER_ERROR,
            "Failed to delete document",
          );
        }
      }
    }

    GlobalStorageConfig.clear();
    return buildResponse(StatusCodes.OK, "Document deleted successfully");
  }

  /**
   * Executes an aggregation pipeline on a specified collection.
   *
   * @param request - The Fastify request object containing query parameters.
   * @param request.query.dbName - The name of the database to use.
   * @param request.query.collectionName - The name of the collection to perform aggregation on.
   * @param request.query.aggregation - An array of aggregation pipeline stages.
   *
   * @returns A response object with status code, message, and aggregation results if successful.
   * If the aggregation fails, returns an error response with appropriate status code.
   *
   * @example
   * // Example request query:
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

    // validate aggregation pipeline
    if (!Array.isArray(aggregation) || aggregation.length === 0) {
      return buildResponse(
        StatusCodes.BAD_REQUEST,
        "Invalid aggregation pipeline",
      );
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

    GlobalStorageConfig.clear();
    return buildResponse(
      StatusCodes.OK,
      "Aggregation run successfully",
      aggregationResult.data,
    );
  }
}
