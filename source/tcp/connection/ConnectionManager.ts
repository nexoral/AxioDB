import { Socket } from 'net';
import { EventEmitter } from 'events';
import { MessageBuffer, MessageFramer } from '../config/protocol';
import { TCPRequest, TCPResponse } from '../types/protocol.types';
import { MAX_CONNECTIONS, CONNECTION_TIMEOUT, ErrorMessage, StatusCode } from '../config/keys';
import { AuthenticatedUser } from '../../config/Interfaces/Auth/auth.interface';

/**
 * Connection metadata
 */
interface ConnectionInfo {
  socket: Socket;
  buffer: MessageBuffer;
  connectedAt: number;
  lastActivity: number;
  requestCount: number;
  /** Set once a successful AUTHENTICATE command has run on this connection. Lives for the socket's lifetime. */
  authUser?: AuthenticatedUser;
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

    // Idle timeout: destroys the connection (via the 'timeout' handler below) if no data
    // is received for CONNECTION_TIMEOUT ms. Without this, a client that opens a connection
    // and never completes its handshake (e.g. sends a partial length-prefixed header and
    // goes silent) would hold its slot in the MAX_CONNECTIONS cap indefinitely.
    socket.setTimeout(CONNECTION_TIMEOUT);

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
   * Mark a connection as authenticated, following a successful AUTHENTICATE command.
   */
  setAuthUser(connectionId: string, authUser: AuthenticatedUser): void {
    const info = this.connections.get(connectionId);
    if (info) {
      info.authUser = authUser;
    }
  }

  /**
   * Get the authenticated identity for a connection, if AUTHENTICATE has succeeded.
   */
  getAuthUser(connectionId: string): AuthenticatedUser | undefined {
    return this.connections.get(connectionId)?.authUser;
  }

  /**
   * Clears the cached authenticated identity for every connection belonging to a
   * given username, following a role change, password reset, or account deletion
   * elsewhere (see AuthEvents). The connection itself is left open - the next
   * command on it will simply be treated as unauthenticated again, mirroring how a
   * revoked GUI session cookie stops working without forcibly closing the browser tab.
   */
  revokeAuthForUser(username: string): void {
    for (const info of this.connections.values()) {
      if (info.authUser?.username === username) {
        info.authUser = undefined;
      }
    }
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
