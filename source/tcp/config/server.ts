import { Server, Socket, createServer } from 'net';
import { AxioDB } from '../../Services/Indexation.operation';
import { ConnectionManager, ConnectionRejectReason } from '../connection/ConnectionManager';
import { CommandHandler } from '../handler/CommandHandler';
import { RequestContext } from '../connection/RequestContext';
import { TCPRequest, TCPResponse } from '../types/protocol.types';
import { MessageFramer } from './protocol';
import { DEFAULT_TCP_PORT, ErrorMessage, StatusCode } from './keys';
import { CommandType } from '../types/command.types';
import AuthEvents from '../../Services/Auth/AuthEvents.service';
import ConnectionRateLimiter from '../connection/ConnectionRateLimiter';

/** Wire response for each way `ConnectionManager.addConnection` can reject a new socket. */
const CONNECTION_REJECTION_RESPONSES: Record<
  ConnectionRejectReason,
  { id: string; statusCode: number; message: string }
> = {
  [ConnectionRejectReason.SERVER_OVERLOAD]: {
    id: 'server_overload',
    statusCode: StatusCode.SERVICE_UNAVAILABLE,
    message: ErrorMessage.SERVER_OVERLOAD,
  },
  [ConnectionRejectReason.IP_LIMIT_EXCEEDED]: {
    id: 'ip_limit_exceeded',
    statusCode: StatusCode.TOO_MANY_REQUESTS,
    message: ErrorMessage.TOO_MANY_CONNECTIONS_FROM_IP,
  },
  [ConnectionRejectReason.RATE_LIMITED]: {
    id: 'rate_limited',
    statusCode: StatusCode.TOO_MANY_REQUESTS,
    message: ErrorMessage.TOO_MANY_CONNECTION_ATTEMPTS,
  },
};

/**
 * TCP Server for AxioDB
 * Provides remote access to AxioDB via TCP protocol
 */
export default async function createAxioDBTCPServer(
  axioDB: AxioDB,
  port: number = DEFAULT_TCP_PORT,
  requireAuth: boolean = false
): Promise<Server> {
  const connectionManager = new ConnectionManager();
  const commandHandler = new CommandHandler(axioDB, connectionManager, requireAuth);
  let server: Server;

  // Connection-attempt rate limiting is relevant as soon as the TCP surface is up at all,
  // independent of TCPAuth (it guards raw connection churn, not logins).
  ConnectionRateLimiter.startCleanupSweep();

  // Setup connection manager event handlers
  setupConnectionManagerHandlers(connectionManager);

  // Bridge GUI-side auth mutations (role change, password reset, deletion) into this
  // TCP server's own connection state - see AuthEvents.service.ts. AxioDB is a
  // singleton with at most one TCP server per process, so this is a single
  // process-lifetime subscription, not a per-connection leak.
  AuthEvents.on('user-revoked', (username: string) => {
    connectionManager.revokeAuthForUser(username);
  });

  // Create TCP server
  server = createServer((socket: Socket) => {
    handleNewConnection(socket, connectionManager, commandHandler);
  });

  // Setup server error handling
  server.on('error', (error: Error) => {
    console.error('[AxioDB TCP Server] Server error:', error);
  });

  server.on('listening', () => {
    const address = server.address();
    console.log(`[AxioDB TCP Server] Listening on port ${typeof address === 'object' ? address?.port : port}`);
  });

  // Start listening
  server.listen(port, () => {
    console.log(`[AxioDB TCP Server] Started successfully on port ${port}`);
  });

  return server;
}

/**
 * Setup connection manager event handlers
 */
function setupConnectionManagerHandlers(connectionManager: ConnectionManager): void {
  connectionManager.on('connection:added', (connectionId: string, remoteAddress: string) => {
    console.log(`[AxioDB TCP] Client connected: ${connectionId} from ${remoteAddress}`);
  });

  connectionManager.on('connection:removed', (connectionId: string) => {
    console.log(`[AxioDB TCP] Client disconnected: ${connectionId}`);
  });

  connectionManager.on('error', (error: Error, connectionId: string) => {
    console.error(`[AxioDB TCP] Error on connection ${connectionId}:`, error);
  });

  connectionManager.on('socket:error', (error: Error, connectionId: string) => {
    console.error(`[AxioDB TCP] Socket error on connection ${connectionId}:`, error);
  });

  connectionManager.on('socket:closed', (connectionId: string, hadError: boolean) => {
    if (hadError) {
      console.log(`[AxioDB TCP] Connection ${connectionId} closed with error`);
    }
  });

  connectionManager.on('socket:timeout', (connectionId: string) => {
    console.log(`[AxioDB TCP] Connection ${connectionId} timed out`);
  });
}

/**
 * Handle new client connection
 */
function handleNewConnection(
  socket: Socket,
  connectionManager: ConnectionManager,
  commandHandler: CommandHandler
): void {
  const result = connectionManager.addConnection(socket);

  if ('rejected' in result) {
    const { id, statusCode, message } = CONNECTION_REJECTION_RESPONSES[result.rejected];
    const errorResponse: TCPResponse = { id, statusCode, message, error: message };

    try {
      socket.write(MessageFramer.encode(errorResponse));
    } catch (error) {
      console.error('[AxioDB TCP] Error sending rejection response:', error);
    }

    socket.end();
    return;
  }

  const { connectionId } = result;

  // Setup message handler. Registered as a named listener (rather than an anonymous
  // closure kept forever) so it can be removed on disconnect - otherwise every past
  // connection leaves a permanent no-op listener on the shared ConnectionManager,
  // and every subsequent message pays O(n) dead-listener invocations.
  const onMessage = async (connId: string, message: TCPRequest, clientSocket: Socket) => {
    if (connId !== connectionId) return; // Only handle messages for this connection

    await handleMessage(connId, message, clientSocket, commandHandler, connectionManager);
  };
  connectionManager.on('message', onMessage);

  const onConnectionRemoved = (removedConnectionId: string) => {
    if (removedConnectionId !== connectionId) return; // Not this connection - keep listening
    connectionManager.off('message', onMessage);
    connectionManager.off('connection:removed', onConnectionRemoved);
  };
  connectionManager.on('connection:removed', onConnectionRemoved);
}

/**
 * Handle incoming message
 */
async function handleMessage(
  connectionId: string,
  message: TCPRequest,
  socket: Socket,
  commandHandler: CommandHandler,
  connectionManager: ConnectionManager
): Promise<void> {
  try {
    // Create request context
    const context = new RequestContext(message, socket, connectionId);

    // Handle the request
    const response = await commandHandler.handleRequest(context);

    // Send response
    const sent = connectionManager.sendResponse(connectionId, response);

    if (!sent) {
      console.error(`[AxioDB TCP] Failed to send response for request ${message.id}`);
    }

    // Handle DISCONNECT command
    if (message.command === CommandType.DISCONNECT) {
      connectionManager.removeConnection(connectionId);
    }
  } catch (error) {
    console.error('[AxioDB TCP] Error handling message:', error);

    // Send error response
    const errorResponse: TCPResponse = {
      id: message.id || 'error',
      statusCode: StatusCode.INTERNAL_SERVER_ERROR,
      message: ErrorMessage.INTERNAL_ERROR,
      error: error instanceof Error ? error.message : String(error),
    };

    connectionManager.sendResponse(connectionId, errorResponse);
  }
}
