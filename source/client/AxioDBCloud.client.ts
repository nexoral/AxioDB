import { Socket } from 'net';
import { randomUUID } from 'crypto';
import { EventEmitter } from 'events';
import { MessageBuffer, MessageFramer } from '../tcp/config/protocol';
import { TCPRequest, TCPResponse, PendingRequest } from '../tcp/types/protocol.types';
import { CommandType } from '../tcp/types/command.types';
import { AxioDBCloudOptions, ConnectionState, ParsedConnectionString } from './types/client.types';
import DatabaseProxy from './DatabaseProxy';

/**
 * AxioDBCloud - TCP Client for remote AxioDB access
 */
export class AxioDBCloud extends EventEmitter {
  private host: string;
  private port: number;
  private socket: Socket | null = null;
  private messageBuffer: MessageBuffer = new MessageBuffer();
  private pendingRequests: Map<string, PendingRequest> = new Map();
  private connectionState: ConnectionState = ConnectionState.DISCONNECTED;
  private options: Required<AxioDBCloudOptions>;
  private reconnectAttempt: number = 0;
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor(connectionString: string, options?: AxioDBCloudOptions) {
    super();

    // Parse connection string
    const parsed = this.parseConnectionString(connectionString);
    this.host = parsed.host;
    this.port = parsed.port;

    // Set options with defaults
    this.options = {
      timeout: options?.timeout || 30000,
      reconnectAttempts: options?.reconnectAttempts || 10,
      reconnectDelay: options?.reconnectDelay || 1000,
      heartbeatInterval: options?.heartbeatInterval || 30000,
    };
  }

  /**
   * Parse connection string: axiodb://host:port
   */
  private parseConnectionString(connectionString: string): ParsedConnectionString {
    const match = connectionString.match(/^axiodb:\/\/([^:]+):(\d+)$/);

    if (!match) {
      throw new Error('Invalid connection string. Format: axiodb://host:port');
    }

    return {
      host: match[1],
      port: parseInt(match[2], 10),
    };
  }

  /**
   * Connect to AxioDB TCP server
   */
  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.connectionState === ConnectionState.CONNECTED) {
        return resolve();
      }

      this.connectionState = ConnectionState.CONNECTING;
      this.socket = new Socket();

      // Setup socket event handlers
      this.setupSocketHandlers();

      // Connection timeout
      const connectionTimeout = setTimeout(() => {
        this.socket?.destroy();
        this.connectionState = ConnectionState.FAILED;
        reject(new Error('Connection timeout'));
      }, this.options.timeout);

      // Connect to server
      this.socket.connect(this.port, this.host, () => {
        clearTimeout(connectionTimeout);
        this.connectionState = ConnectionState.CONNECTED;
        this.reconnectAttempt = 0;
        this.startHeartbeat();
        this.emit('connected');
        resolve();
      });

      // Handle connection errors
      this.socket.once('error', (error) => {
        clearTimeout(connectionTimeout);
        this.connectionState = ConnectionState.FAILED;
        reject(error);
      });
    });
  }

  /**
   * Setup socket event handlers
   */
  private setupSocketHandlers(): void {
    if (!this.socket) return;

    this.socket.on('data', (chunk: Buffer) => {
      try {
        const messages = this.messageBuffer.addChunk(chunk);

        for (const message of messages) {
          this.handleResponse(message as TCPResponse);
        }
      } catch (error) {
        this.emit('error', error);
      }
    });

    this.socket.on('error', (error: Error) => {
      this.emit('error', error);
      this.handleDisconnection();
    });

    this.socket.on('close', (hadError: boolean) => {
      this.emit('disconnected', hadError);
      this.handleDisconnection();
    });

    this.socket.on('end', () => {
      this.handleDisconnection();
    });
  }

  /**
   * Handle server response
   */
  private handleResponse(response: TCPResponse): void {
    const pending = this.pendingRequests.get(response.id);

    if (pending) {
      clearTimeout(pending.timeout);
      this.pendingRequests.delete(response.id);

      if (response.statusCode >= 200 && response.statusCode < 300) {
        pending.resolve(response.data);
      } else {
        pending.reject(new Error(response.error || response.message));
      }
    } else {
      console.warn(`[AxioDBCloud] Received response for unknown request: ${response.id}`);
    }
  }

  /**
   * Handle disconnection
   */
  private handleDisconnection(): void {
    this.connectionState = ConnectionState.DISCONNECTED;
    this.stopHeartbeat();

    // Reject all pending requests
    for (const [id, pending] of this.pendingRequests.entries()) {
      clearTimeout(pending.timeout);
      pending.reject(new Error('Connection lost'));
      this.pendingRequests.delete(id);
    }

    // Attempt reconnection
    if (this.reconnectAttempt < this.options.reconnectAttempts) {
      this.attemptReconnect();
    } else {
      this.emit('failed', new Error('Max reconnection attempts reached'));
    }
  }

  /**
   * Attempt to reconnect
   */
  private async attemptReconnect(): Promise<void> {
    this.reconnectAttempt++;
    const delay = Math.min(
      this.options.reconnectDelay * Math.pow(2, this.reconnectAttempt - 1),
      30000
    );

    this.emit('reconnecting', this.reconnectAttempt);
    this.connectionState = ConnectionState.RECONNECTING;

    setTimeout(async () => {
      try {
        await this.connect();
        this.emit('reconnected');
      } catch (error) {
        // Reconnection will be attempted again in handleDisconnection
      }
    }, delay);
  }

  /**
   * Start heartbeat
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(async () => {
      try {
        await this.sendCommand(CommandType.PING, {});
      } catch (error) {
        console.warn('[AxioDBCloud] Heartbeat failed:', error);
      }
    }, this.options.heartbeatInterval);
  }

  /**
   * Stop heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Send command to server
   */
  async sendCommand(command: CommandType, params: any): Promise<any> {
    if (this.connectionState !== ConnectionState.CONNECTED) {
      throw new Error('Not connected to server');
    }

    if (!this.socket) {
      throw new Error('Socket not initialized');
    }

    const id = randomUUID();
    const request: TCPRequest = {
      id,
      command,
      params,
    };

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(id);
        reject(new Error('Request timeout'));
      }, this.options.timeout);

      this.pendingRequests.set(id, {
        resolve,
        reject,
        timeout,
        timestamp: Date.now(),
      });

      try {
        const buffer = MessageFramer.encode(request);
        this.socket!.write(buffer);
      } catch (error) {
        clearTimeout(timeout);
        this.pendingRequests.delete(id);
        reject(error);
      }
    });
  }

  /**
   * Disconnect from server
   */
  async disconnect(): Promise<void> {
    this.stopHeartbeat();

    if (this.socket && !this.socket.destroyed) {
      try {
        await this.sendCommand(CommandType.DISCONNECT, {});
      } catch (error) {
        // Ignore disconnect errors
      }

      this.socket.end();
      this.socket = null;
    }

    this.connectionState = ConnectionState.DISCONNECTED;
  }

  /**
   * Database API - mirrors AxioDB
   */
  async createDB(name: string): Promise<DatabaseProxy> {
    await this.sendCommand(CommandType.CREATE_DB, { dbName: name });
    return new DatabaseProxy(this, name);
  }

  async deleteDatabase(name: string): Promise<void> {
    await this.sendCommand(CommandType.DELETE_DB, { dbName: name });
  }

  async isDatabaseExists(name: string): Promise<boolean> {
    const result = await this.sendCommand(CommandType.DB_EXISTS, { dbName: name });
    return result.exists;
  }

  async getInstanceInfo(): Promise<any> {
    return await this.sendCommand(CommandType.GET_INSTANCE_INFO, {});
  }

  /**
   * Get current connection state
   */
  get state(): ConnectionState {
    return this.connectionState;
  }

  /**
   * Check if connected
   */
  get isConnected(): boolean {
    return this.connectionState === ConnectionState.CONNECTED;
  }
}
