import { Socket } from 'net';
import { EventEmitter } from 'events';
import { MessageBuffer, MessageFramer } from '../config/protocol';
import { TCPRequest, TCPResponse } from '../types/protocol.types';
import { MAX_CONNECTIONS, ErrorMessage, StatusCode } from '../config/keys';

/**
 * Connection metadata
 */
interface ConnectionInfo {
  socket: Socket;
  buffer: MessageBuffer;
  connectedAt: number;
  lastActivity: number;
  requestCount: number;
}

/**
 * Connection Manager - Manages all active TCP connections
 */
export class ConnectionManager extends EventEmitter {
  private connections: Map<string, ConnectionInfo> = new Map();
  private connectionCounter: number = 0;

  constructor() {
    super();
    // Increase max listeners since we handle 1000+ concurrent connections
    this.setMaxListeners(0); // 0 = unlimited
  }

  /**
   * Add new connection
   */
  addConnection(socket: Socket): string | null {
    if (this.connections.size >= MAX_CONNECTIONS) {
      return null; // Reject connection - server overload
    }

    const connectionId = this.generateConnectionId();
    const info: ConnectionInfo = {
      socket,
      buffer: new MessageBuffer(),
      connectedAt: Date.now(),
      lastActivity: Date.now(),
      requestCount: 0,
    };

    this.connections.set(connectionId, info);

    // Setup socket handlers
    this.setupSocketHandlers(connectionId, socket, info);

    this.emit('connection:added', connectionId, socket.remoteAddress);
    return connectionId;
  }

  /**
   * Remove connection
   */
  removeConnection(connectionId: string): void {
    const info = this.connections.get(connectionId);
    if (info) {
      if (!info.socket.destroyed) {
        info.socket.destroy();
      }
      this.connections.delete(connectionId);
      this.emit('connection:removed', connectionId);
    }
  }

  /**
   * Send response to client
   */
  sendResponse(connectionId: string, response: TCPResponse): boolean {
    const info = this.connections.get(connectionId);
    if (!info || info.socket.destroyed) {
      return false;
    }

    try {
      const buffer = MessageFramer.encode(response);
      info.socket.write(buffer);
      info.lastActivity = Date.now();
      return true;
    } catch (error) {
      this.emit('error', error, connectionId);
      return false;
    }
  }

  /**
   * Get connection info
   */
  getConnection(connectionId: string): ConnectionInfo | undefined {
    return this.connections.get(connectionId);
  }

  /**
   * Get total active connections
   */
  get activeConnections(): number {
    return this.connections.size;
  }

  /**
   * Get all connection IDs
   */
  getAllConnectionIds(): string[] {
    return Array.from(this.connections.keys());
  }

  /**
   * Close all connections gracefully
   */
  closeAll(): void {
    for (const [connectionId, info] of this.connections.entries()) {
      if (!info.socket.destroyed) {
        info.socket.end();
      }
      this.connections.delete(connectionId);
    }
    this.emit('all:closed');
  }

  /**
   * Setup socket event handlers
   */
  private setupSocketHandlers(connectionId: string, socket: Socket, info: ConnectionInfo): void {
    socket.on('data', (chunk: Buffer) => {
      try {
        info.lastActivity = Date.now();
        const messages = info.buffer.addChunk(chunk);

        for (const message of messages) {
          info.requestCount++;
          this.emit('message', connectionId, message as TCPRequest, socket);
        }
      } catch (error) {
        this.emit('error', error, connectionId);

        // Send error response
        const errorResponse: TCPResponse = {
          id: 'error',
          statusCode: StatusCode.BAD_REQUEST,
          message: ErrorMessage.INVALID_MESSAGE_FORMAT,
          error: error instanceof Error ? error.message : String(error),
        };
        this.sendResponse(connectionId, errorResponse);

        // Clear buffer for recovery
        info.buffer.clear();
      }
    });

    socket.on('error', (error: Error) => {
      this.emit('socket:error', error, connectionId);
      this.removeConnection(connectionId);
    });

    socket.on('close', (hadError: boolean) => {
      this.emit('socket:closed', connectionId, hadError);
      this.removeConnection(connectionId);
    });

    socket.on('end', () => {
      this.emit('socket:end', connectionId);
      this.removeConnection(connectionId);
    });

    socket.on('timeout', () => {
      this.emit('socket:timeout', connectionId);
      this.removeConnection(connectionId);
    });
  }

  /**
   * Generate unique connection ID
   */
  private generateConnectionId(): string {
    this.connectionCounter++;
    return `conn_${this.connectionCounter}_${Date.now()}`;
  }

  /**
   * Get connection statistics
   */
  getStats(): Record<string, any> {
    let totalRequests = 0;
    let oldestConnection = Date.now();

    for (const info of this.connections.values()) {
      totalRequests += info.requestCount;
      if (info.connectedAt < oldestConnection) {
        oldestConnection = info.connectedAt;
      }
    }

    return {
      activeConnections: this.connections.size,
      maxConnections: MAX_CONNECTIONS,
      totalRequests,
      oldestConnectionAge: Date.now() - oldestConnection,
    };
  }
}
