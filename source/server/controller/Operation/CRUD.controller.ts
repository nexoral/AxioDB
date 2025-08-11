/* eslint-disable @typescript-eslint/no-explicit-any */
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
    const allDocuments = await DB_Collection.query({}).Limit(10).Sort({ updatedAt : -1 }).Skip(skip).exec();
    if (!allDocuments.data) {
      return buildResponse(StatusCodes.NOT_FOUND, "No documents found");
    }

    return buildResponse(StatusCodes.OK, "Documents retrieved successfully", allDocuments);
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
  public async createNewDocument(request: FastifyRequest){
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
    const DB_Collection = await databaseInstance.createCollection(collectionName);

    // Insert the new document
    const insertResult = await DB_Collection.insert(documentData);
    if (!insertResult || insertResult.statusCode !== StatusCodes.OK) {
      return buildResponse(StatusCodes.INTERNAL_SERVER_ERROR, "Failed to insert document");
    }

    return buildResponse(StatusCodes.CREATED, "Document created successfully", insertResult.data);
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
  public async updateDocument(request: FastifyRequest) {
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
    const DB_Collection = await databaseInstance.createCollection(collectionName);

    // Update the document
    const updateResult = await DB_Collection.update({ documentId: documentId }).UpdateOne(updatedData);
    if (!updateResult || updateResult.statusCode !== StatusCodes.OK) {
      return buildResponse(StatusCodes.INTERNAL_SERVER_ERROR, "Failed to update document");
    }

    return buildResponse(StatusCodes.OK, "Document updated successfully", updateResult.data);
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
  public async deleteDocument(request: FastifyRequest) {
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
    const DB_Collection = await databaseInstance.createCollection(collectionName);

    // Delete the document
    const deleteResult = await DB_Collection.delete({ documentId: documentId }).deleteOne();
    console.log(deleteResult);
    if (!deleteResult || deleteResult.statusCode !== StatusCodes.OK) {
      return buildResponse(StatusCodes.INTERNAL_SERVER_ERROR, "Failed to delete document");
    }

    return buildResponse(StatusCodes.OK, "Document deleted successfully");
  }
}
