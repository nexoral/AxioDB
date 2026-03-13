import { AxioDB } from '../../Services/Indexation.operation';
import { TCPRequest, TCPResponse } from '../types/protocol.types';
import { CommandType } from '../types/command.types';
import { MessageValidator } from '../config/protocol';
import { StatusCode, ErrorMessage, SuccessMessage } from '../config/keys';
import { RequestContext } from '../connection/RequestContext';

// Handlers
import DBHandler from './handlers/DB.handler';
import CollectionHandler from './handlers/Collection.handler';
import OperationHandler from './handlers/Operation.handler';

/**
 * Command Handler - Main dispatcher for TCP commands
 * Routes commands to appropriate handlers
 */
export class CommandHandler {
  private axioDB: AxioDB;
  private dbHandler: DBHandler;
  private collectionHandler: CollectionHandler;
  private operationHandler: OperationHandler;

  constructor(axioDB: AxioDB) {
    this.axioDB = axioDB;

    // Initialize handlers
    this.dbHandler = new DBHandler(axioDB);
    this.collectionHandler = new CollectionHandler(axioDB);
    this.operationHandler = new OperationHandler(axioDB);
  }

  /**
   * Handle incoming TCP request
   */
  async handleRequest(context: RequestContext): Promise<TCPResponse> {
    const { request } = context;

    try {
      // Validate request structure
      MessageValidator.validateRequest(request);

      // Validate command-specific parameters
      MessageValidator.validateParams(request.command, request.params);

      // Route to appropriate handler
      return await this.routeCommand(request);
    } catch (error) {
      return this.createErrorResponse(
        request.id,
        StatusCode.BAD_REQUEST,
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  /**
   * Route command to appropriate handler
   */
  private async routeCommand(request: TCPRequest): Promise<TCPResponse> {
    const { command, params, id } = request;

    try {
      switch (command) {
        // Connection commands
        case CommandType.PING:
          return this.handlePing(id);

        case CommandType.DISCONNECT:
          return this.handleDisconnect(id);

        // Database commands
        case CommandType.CREATE_DB:
          return await this.dbHandler.handleCreateDB(id, params);

        case CommandType.DELETE_DB:
          return await this.dbHandler.handleDeleteDB(id, params);

        case CommandType.DB_EXISTS:
          return await this.dbHandler.handleDBExists(id, params);

        case CommandType.GET_INSTANCE_INFO:
          return await this.dbHandler.handleGetInstanceInfo(id);

        // Collection commands
        case CommandType.CREATE_COLLECTION:
          return await this.collectionHandler.handleCreateCollection(id, params);

        case CommandType.DELETE_COLLECTION:
          return await this.collectionHandler.handleDeleteCollection(id, params);

        case CommandType.COLLECTION_EXISTS:
          return await this.collectionHandler.handleCollectionExists(id, params);

        case CommandType.GET_COLLECTION_INFO:
          return await this.collectionHandler.handleGetCollectionInfo(id, params);

        // CRUD operations
        case CommandType.INSERT_DOCUMENT:
          return await this.operationHandler.handleInsertDocument(id, params);

        case CommandType.INSERT_MANY_DOCUMENTS:
          return await this.operationHandler.handleInsertManyDocuments(id, params);

        case CommandType.QUERY_DOCUMENTS:
          return await this.operationHandler.handleQueryDocuments(id, params);

        case CommandType.QUERY_BY_ID:
          return await this.operationHandler.handleQueryById(id, params);

        case CommandType.UPDATE_DOCUMENT_BY_ID:
          return await this.operationHandler.handleUpdateById(id, params);

        case CommandType.UPDATE_DOCUMENTS_BY_QUERY:
          return await this.operationHandler.handleUpdateByQuery(id, params);

        case CommandType.DELETE_DOCUMENT_BY_ID:
          return await this.operationHandler.handleDeleteById(id, params);

        case CommandType.DELETE_DOCUMENTS_BY_QUERY:
          return await this.operationHandler.handleDeleteByQuery(id, params);

        case CommandType.AGGREGATE:
          return await this.operationHandler.handleAggregate(id, params);

        case CommandType.TOTAL_DOCUMENTS:
          return await this.operationHandler.handleTotalDocuments(id, params);

        // Index operations
        case CommandType.CREATE_INDEX:
          return await this.operationHandler.handleCreateIndex(id, params);

        case CommandType.DROP_INDEX:
          return await this.operationHandler.handleDropIndex(id, params);

        // Transaction operations (future - not implemented)
        case CommandType.BEGIN_TRANSACTION:
        case CommandType.COMMIT_TRANSACTION:
        case CommandType.ROLLBACK_TRANSACTION:
          return this.createErrorResponse(
            id,
            StatusCode.NOT_IMPLEMENTED,
            'Transaction support not implemented yet'
          );

        default:
          return this.createErrorResponse(id, StatusCode.BAD_REQUEST, ErrorMessage.UNKNOWN_COMMAND);
      }
    } catch (error) {
      return this.createErrorResponse(
        id,
        StatusCode.INTERNAL_SERVER_ERROR,
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  /**
   * Handle PING command
   */
  private handlePing(requestId: string): TCPResponse {
    return {
      id: requestId,
      statusCode: StatusCode.OK,
      message: SuccessMessage.PING_PONG,
      data: { timestamp: Date.now() },
    };
  }

  /**
   * Handle DISCONNECT command
   */
  private handleDisconnect(requestId: string): TCPResponse {
    return {
      id: requestId,
      statusCode: StatusCode.OK,
      message: SuccessMessage.DISCONNECTED,
    };
  }

  /**
   * Create error response
   */
  private createErrorResponse(requestId: string, statusCode: number, message: string): TCPResponse {
    return {
      id: requestId,
      statusCode,
      message,
      error: message,
    };
  }
}
