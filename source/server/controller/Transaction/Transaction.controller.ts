import { AxioHttpRequest, AxioHttpResponse } from "../../../Helper/http/HttpTypes";
import { StatusCodes } from "../../../config/Keys/StatusCode";
import buildResponse, { ResponseBuilder, sendResponse } from "../../helper/responseBuilder.helper";
import { AxioDB } from "../../../Services/Indexation.operation";
import HttpTransactionManager from "../../helper/HttpTransactionManager.helper";
import { isReservedDatabaseName } from "../../../config/Keys/Permissions";
import SafeErrorMessage from "../../../Helper/SafeErrorMessage.helper";

interface BeginTransactionBody {
  dbName?: string;
  collectionName?: string;
}

interface TransactionOperationBody {
  transactionId?: string;
  document?: Record<string, unknown>;
  query?: Record<string, unknown>;
  update?: Record<string, unknown>;
  savepointName?: string;
}

export default class TransactionController {
  private readonly axioDB: AxioDB;
  private readonly txnManager: HttpTransactionManager;

  constructor(axioDB: AxioDB) {
    this.axioDB = axioDB;
    this.txnManager = HttpTransactionManager.getInstance();
  }

  private extractTransactionId(request: AxioHttpRequest): string | undefined {
    const body = (request.body && typeof request.body === "object" ? request.body : {}) as TransactionOperationBody;
    const query = (request.query && typeof request.query === "object" ? request.query : {}) as Record<string, unknown>;
    const params = (request.params && typeof request.params === "object" ? request.params : {}) as Record<string, string>;

    const id = body.transactionId || query.transactionId || params.transactionId;
    return typeof id === "string" && id.trim() !== "" ? id.trim() : undefined;
  }

  public async beginTransaction(request: AxioHttpRequest, reply: AxioHttpResponse): Promise<ResponseBuilder> {
    const body = (request.body && typeof request.body === "object" ? request.body : {}) as BeginTransactionBody;
    const { dbName, collectionName } = body;

    if (!dbName || typeof dbName !== "string" || dbName.trim() === "") {
      return sendResponse(reply, buildResponse(StatusCodes.BAD_REQUEST, "dbName is required"));
    }
    if (!collectionName || typeof collectionName !== "string" || collectionName.trim() === "") {
      return sendResponse(reply, buildResponse(StatusCodes.BAD_REQUEST, "collectionName is required"));
    }
    if (isReservedDatabaseName(dbName)) {
      return sendResponse(reply, buildResponse(StatusCodes.FORBIDDEN, "This is a reserved system database"));
    }

    try {
      const databaseInstance = await this.axioDB.createDB(dbName.trim());
      const collection = await databaseInstance.createCollection(collectionName.trim());
      const collectionPath = (collection as unknown as { getCollectionPath(): string }).getCollectionPath();

      const username = request.authUser?.username || "anonymous";
      const txn = this.txnManager.beginTransaction(username, collectionPath, this.axioDB.Cache);

      return sendResponse(
        reply,
        buildResponse(StatusCodes.OK, "Transaction started", { transactionId: txn.getId() }),
      );
    } catch (err: unknown) {
      const message = SafeErrorMessage.sanitize(err instanceof Error ? err.message : String(err));
      return sendResponse(reply, buildResponse(StatusCodes.INTERNAL_SERVER_ERROR, message));
    }
  }

  public async insertDocument(request: AxioHttpRequest, reply: AxioHttpResponse): Promise<ResponseBuilder> {
    const transactionId = this.extractTransactionId(request);
    if (!transactionId) {
      return sendResponse(reply, buildResponse(StatusCodes.BAD_REQUEST, "transactionId is required"));
    }

    const body = (request.body && typeof request.body === "object" ? request.body : {}) as TransactionOperationBody;
    const doc = body.document;

    if (!doc || typeof doc !== "object" || Array.isArray(doc)) {
      return sendResponse(reply, buildResponse(StatusCodes.BAD_REQUEST, "document must be a valid JSON object"));
    }

    const txn = this.txnManager.getTransaction(transactionId, request.authUser?.username);
    if (!txn) {
      return sendResponse(reply, buildResponse(StatusCodes.NOT_FOUND, "Transaction not found or already completed"));
    }

    try {
      txn.insert(doc);
      return sendResponse(
        reply,
        buildResponse(StatusCodes.OK, "Document buffered in transaction", { transactionId }),
      );
    } catch (err: unknown) {
      const message = SafeErrorMessage.sanitize(err instanceof Error ? err.message : String(err));
      return sendResponse(reply, buildResponse(StatusCodes.BAD_REQUEST, message));
    }
  }

  public async updateDocument(request: AxioHttpRequest, reply: AxioHttpResponse): Promise<ResponseBuilder> {
    const transactionId = this.extractTransactionId(request);
    if (!transactionId) {
      return sendResponse(reply, buildResponse(StatusCodes.BAD_REQUEST, "transactionId is required"));
    }

    const body = (request.body && typeof request.body === "object" ? request.body : {}) as TransactionOperationBody;
    const { query, update } = body;

    if (!query || typeof query !== "object" || Array.isArray(query)) {
      return sendResponse(reply, buildResponse(StatusCodes.BAD_REQUEST, "query must be a valid JSON object"));
    }
    if (!update || typeof update !== "object" || Array.isArray(update)) {
      return sendResponse(reply, buildResponse(StatusCodes.BAD_REQUEST, "update must be a valid JSON object"));
    }

    const txn = this.txnManager.getTransaction(transactionId, request.authUser?.username);
    if (!txn) {
      return sendResponse(reply, buildResponse(StatusCodes.NOT_FOUND, "Transaction not found or already completed"));
    }

    try {
      txn.update(query, update);
      return sendResponse(
        reply,
        buildResponse(StatusCodes.OK, "Update buffered in transaction", { transactionId }),
      );
    } catch (err: unknown) {
      const message = SafeErrorMessage.sanitize(err instanceof Error ? err.message : String(err));
      return sendResponse(reply, buildResponse(StatusCodes.BAD_REQUEST, message));
    }
  }

  public async deleteDocument(request: AxioHttpRequest, reply: AxioHttpResponse): Promise<ResponseBuilder> {
    const transactionId = this.extractTransactionId(request);
    if (!transactionId) {
      return sendResponse(reply, buildResponse(StatusCodes.BAD_REQUEST, "transactionId is required"));
    }

    const body = (request.body && typeof request.body === "object" ? request.body : {}) as TransactionOperationBody;
    const { query } = body;

    if (!query || typeof query !== "object" || Array.isArray(query)) {
      return sendResponse(reply, buildResponse(StatusCodes.BAD_REQUEST, "query must be a valid JSON object"));
    }

    const txn = this.txnManager.getTransaction(transactionId, request.authUser?.username);
    if (!txn) {
      return sendResponse(reply, buildResponse(StatusCodes.NOT_FOUND, "Transaction not found or already completed"));
    }

    try {
      txn.delete(query);
      return sendResponse(
        reply,
        buildResponse(StatusCodes.OK, "Delete buffered in transaction", { transactionId }),
      );
    } catch (err: unknown) {
      const message = SafeErrorMessage.sanitize(err instanceof Error ? err.message : String(err));
      return sendResponse(reply, buildResponse(StatusCodes.BAD_REQUEST, message));
    }
  }

  public async savepoint(request: AxioHttpRequest, reply: AxioHttpResponse): Promise<ResponseBuilder> {
    const transactionId = this.extractTransactionId(request);
    if (!transactionId) {
      return sendResponse(reply, buildResponse(StatusCodes.BAD_REQUEST, "transactionId is required"));
    }

    const body = (request.body && typeof request.body === "object" ? request.body : {}) as TransactionOperationBody;
    const savepointName = typeof body.savepointName === "string" ? body.savepointName.trim() : "";

    if (!savepointName) {
      return sendResponse(reply, buildResponse(StatusCodes.BAD_REQUEST, "savepointName is required"));
    }

    const txn = this.txnManager.getTransaction(transactionId, request.authUser?.username);
    if (!txn) {
      return sendResponse(reply, buildResponse(StatusCodes.NOT_FOUND, "Transaction not found or already completed"));
    }

    try {
      txn.savepoint(savepointName);
      return sendResponse(
        reply,
        buildResponse(StatusCodes.OK, `Savepoint '${savepointName}' created`, {
          transactionId,
          savepointName,
        }),
      );
    } catch (err: unknown) {
      const message = SafeErrorMessage.sanitize(err instanceof Error ? err.message : String(err));
      return sendResponse(reply, buildResponse(StatusCodes.BAD_REQUEST, message));
    }
  }

  public async rollbackToSavepoint(request: AxioHttpRequest, reply: AxioHttpResponse): Promise<ResponseBuilder> {
    const transactionId = this.extractTransactionId(request);
    if (!transactionId) {
      return sendResponse(reply, buildResponse(StatusCodes.BAD_REQUEST, "transactionId is required"));
    }

    const body = (request.body && typeof request.body === "object" ? request.body : {}) as TransactionOperationBody;
    const savepointName = typeof body.savepointName === "string" ? body.savepointName.trim() : "";

    if (!savepointName) {
      return sendResponse(reply, buildResponse(StatusCodes.BAD_REQUEST, "savepointName is required"));
    }

    const txn = this.txnManager.getTransaction(transactionId, request.authUser?.username);
    if (!txn) {
      return sendResponse(reply, buildResponse(StatusCodes.NOT_FOUND, "Transaction not found or already completed"));
    }

    try {
      txn.rollbackTo(savepointName);
      return sendResponse(
        reply,
        buildResponse(StatusCodes.OK, `Rolled back to savepoint '${savepointName}'`, {
          transactionId,
          savepointName,
        }),
      );
    } catch (err: unknown) {
      const message = SafeErrorMessage.sanitize(err instanceof Error ? err.message : String(err));
      return sendResponse(reply, buildResponse(StatusCodes.BAD_REQUEST, message));
    }
  }

  public async releaseSavepoint(request: AxioHttpRequest, reply: AxioHttpResponse): Promise<ResponseBuilder> {
    const transactionId = this.extractTransactionId(request);
    if (!transactionId) {
      return sendResponse(reply, buildResponse(StatusCodes.BAD_REQUEST, "transactionId is required"));
    }

    const body = (request.body && typeof request.body === "object" ? request.body : {}) as TransactionOperationBody;
    const savepointName = typeof body.savepointName === "string" ? body.savepointName.trim() : "";

    if (!savepointName) {
      return sendResponse(reply, buildResponse(StatusCodes.BAD_REQUEST, "savepointName is required"));
    }

    const txn = this.txnManager.getTransaction(transactionId, request.authUser?.username);
    if (!txn) {
      return sendResponse(reply, buildResponse(StatusCodes.NOT_FOUND, "Transaction not found or already completed"));
    }

    try {
      txn.releaseSavepoint(savepointName);
      return sendResponse(
        reply,
        buildResponse(StatusCodes.OK, `Savepoint '${savepointName}' released`, {
          transactionId,
          savepointName,
        }),
      );
    } catch (err: unknown) {
      const message = SafeErrorMessage.sanitize(err instanceof Error ? err.message : String(err));
      return sendResponse(reply, buildResponse(StatusCodes.BAD_REQUEST, message));
    }
  }

  public async commitTransaction(request: AxioHttpRequest, reply: AxioHttpResponse): Promise<ResponseBuilder> {
    const transactionId = this.extractTransactionId(request);
    if (!transactionId) {
      return sendResponse(reply, buildResponse(StatusCodes.BAD_REQUEST, "transactionId is required"));
    }

    const txn = this.txnManager.getTransaction(transactionId, request.authUser?.username);
    if (!txn) {
      return sendResponse(reply, buildResponse(StatusCodes.NOT_FOUND, "Transaction not found or already completed"));
    }

    this.txnManager.removeTransaction(transactionId);

    try {
      const result = await txn.commit();
      if (
        result &&
        typeof result === "object" &&
        "status" in result &&
        result.status === false &&
        (result as { message?: string }).message === "No operations to commit"
      ) {
        return sendResponse(
          reply,
          buildResponse(StatusCodes.OK, "Transaction completed (no operations to commit)", {
            transactionId,
            operationsCount: 0,
          }),
        );
      }

      if (result && typeof result === "object" && "status" in result && result.status === true) {
        return sendResponse(
          reply,
          buildResponse(StatusCodes.OK, "Transaction committed successfully", result.data),
        );
      }

      const errMsg =
        result && typeof result === "object" && "message" in result
          ? String((result as { message?: unknown }).message)
          : "Transaction commit failed";
      return sendResponse(reply, buildResponse(StatusCodes.INTERNAL_SERVER_ERROR, errMsg));
    } catch (err: unknown) {
      const message = SafeErrorMessage.sanitize(err instanceof Error ? err.message : String(err));
      return sendResponse(reply, buildResponse(StatusCodes.INTERNAL_SERVER_ERROR, message));
    }
  }

  public async rollbackTransaction(request: AxioHttpRequest, reply: AxioHttpResponse): Promise<ResponseBuilder> {
    const transactionId = this.extractTransactionId(request);
    if (!transactionId) {
      return sendResponse(reply, buildResponse(StatusCodes.BAD_REQUEST, "transactionId is required"));
    }

    const txn = this.txnManager.getTransaction(transactionId, request.authUser?.username);
    if (!txn) {
      return sendResponse(reply, buildResponse(StatusCodes.NOT_FOUND, "Transaction not found or already completed"));
    }

    this.txnManager.removeTransaction(transactionId);

    try {
      const result = await txn.rollback();
      return sendResponse(
        reply,
        buildResponse(StatusCodes.OK, "Transaction rolled back successfully", result),
      );
    } catch (err: unknown) {
      const message = SafeErrorMessage.sanitize(err instanceof Error ? err.message : String(err));
      return sendResponse(reply, buildResponse(StatusCodes.INTERNAL_SERVER_ERROR, message));
    }
  }
}
