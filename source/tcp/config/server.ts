import { Server, Socket, createServer } from 'net';
import { AxioDB } from '../../Services/Indexation.operation';
import { ConnectionManager } from '../connection/ConnectionManager';
import { CommandHandler } from '../handler/CommandHandler';
import { RequestContext } from '../connection/RequestContext';
import { TCPRequest, TCPResponse } from '../types/protocol.types';
import { MessageValidator, MessageFramer } from './protocol';
import { DEFAULT_TCP_PORT, ErrorMessage, StatusCode } from './keys';
import { CommandType } from '../types/command.types';

/**
 * TCP Server for AxioDB
 * Provides remote access to AxioDB via TCP protocol
 */
export default async function createAxioDBTCPServer(
  axioDB: AxioDB,
  port: number = DEFAULT_TCP_PORT
): Promise<Server> {
  const connectionManager = new ConnectionManager();
  const commandHandler = new CommandHandler(axioDB);
  let server: Server;

  // Setup connection manager event handlers
  setupConnectionManagerHandlers(connectionManager);

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

  connectionManager.on('message', async (connectionId: string, message: TCPRequest, socket: Socket) => {
    // This is handled in handleMessage function
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
  const connectionId = connectionManager.addConnection(socket);

  if (!connectionId) {
    // Server overload - reject connection
    const errorResponse: TCPResponse = {
      id: 'server_overload',
      statusCode: StatusCode.SERVICE_UNAVAILABLE,
      message: ErrorMessage.SERVER_OVERLOAD,
      error: ErrorMessage.SERVER_OVERLOAD,
    };

    try {
      socket.write(MessageFramer.encode(errorResponse));
    } catch (error) {
      console.error('[AxioDB TCP] Error sending overload response:', error);
    }

    socket.end();
    return;
  }

  // Setup message handler
  connectionManager.on('message', async (connId: string, message: TCPRequest, clientSocket: Socket) => {
    if (connId !== connectionId) return; // Only handle messages for this connection

    await handleMessage(connId, message, clientSocket, commandHandler, connectionManager);
  });
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
    const context = new RequestContext(message, socket);

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

/**
 * Gracefully shutdown TCP server
 */
export function shutdownTCPServer(server: Server, connectionManager: ConnectionManager): Promise<void> {
  return new Promise((resolve) => {
    console.log('[AxioDB TCP Server] Shutting down...');

    // Close all connections
    connectionManager.closeAll();

    // Close server
    server.close(() => {
      console.log('[AxioDB TCP Server] Shutdown complete');
      resolve();
    });
  });
}
