import { AxioDB } from '../../Services/Indexation.operation';
import { TCPResponse } from '../types/protocol.types';
import { CommandType } from '../types/command.types';
import { MessageValidator } from '../config/protocol';
import { StatusCode, ErrorMessage, SuccessMessage } from '../config/keys';
import { RequestContext } from '../connection/RequestContext';
import { ConnectionManager } from '../connection/ConnectionManager';
import { TCP_COMMAND_PERMISSIONS, TCP_AUTH_EXEMPT_COMMANDS } from '../config/permissions';
import { isReservedDatabaseName } from '../../config/Keys/Permissions';
import PermissionChecker from '../../Services/Auth/PermissionChecker.helper';

// Handlers
import DBHandler from './handlers/DB.handler';
import CollectionHandler from './handlers/Collection.handler';
import OperationHandler from './handlers/Operation.handler';
import AuthHandler from './handlers/Auth.handler';

/**
 * Command Handler - Main dispatcher for TCP commands
 * Routes commands to appropriate handlers
 */
export class CommandHandler {
  private axioDB: AxioDB;
  private connectionManager: ConnectionManager;
  private requireAuth: boolean;
  private dbHandler: DBHandler;
  private collectionHandler: CollectionHandler;
  private operationHandler: OperationHandler;
  private authHandler: AuthHandler;

  constructor(axioDB: AxioDB, connectionManager: ConnectionManager, requireAuth: boolean = false) {
    this.axioDB = axioDB;
    this.connectionManager = connectionManager;
    this.requireAuth = requireAuth;

    // Initialize handlers
    this.dbHandler = new DBHandler(axioDB);
    this.collectionHandler = new CollectionHandler(axioDB);
    this.operationHandler = new OperationHandler(axioDB);
    this.authHandler = new AuthHandler();
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

      // Reject any attempt to operate on the reserved `config` (RBAC) database,
      // matching the guard already applied on every HTTP route.
      const dbName = (request.params as { dbName?: string })?.dbName;
      if (dbName && isReservedDatabaseName(dbName)) {
        return this.createErrorResponse(request.id, StatusCode.FORBIDDEN, ErrorMessage.RESERVED_DATABASE);
      }

      // Authentication + permission gate (only enforced when the TCP server was started with TCPAuth)
      if (this.requireAuth && !TCP_AUTH_EXEMPT_COMMANDS.has(request.command)) {
        const authUser = this.connectionManager.getAuthUser(context.connectionId);
        if (!authUser) {
          return this.createErrorResponse(request.id, StatusCode.UNAUTHORIZED, ErrorMessage.AUTH_REQUIRED);
        }

        const requiredPermission = TCP_COMMAND_PERMISSIONS[request.command];
        if (requiredPermission && !PermissionChecker.roleHasPermission(authUser.role, requiredPermission)) {
          return this.createErrorResponse(request.id, StatusCode.FORBIDDEN, ErrorMessage.INSUFFICIENT_PERMISSIONS);
        }
      }

      // Route to appropriate handler
      return await this.routeCommand(context);
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
  private async routeCommand(context: RequestContext): Promise<TCPResponse> {
    const { command, params, id } = context.request;

    try {
      switch (command) {
        // Connection commands
        case CommandType.PING:
          return this.handlePing(id);

        case CommandType.DISCONNECT:
          return this.handleDisconnect(id);

        // Authentication commands
        case CommandType.AUTHENTICATE:
          return await this.authHandler.handleAuthenticate(
            id,
            params,
            context.connectionId,
            context.remoteIp,
            this.connectionManager,
          );

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

        case CommandType.LIST_INDEXES:
          return await this.operationHandler.handleListIndexes(id, params);

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
