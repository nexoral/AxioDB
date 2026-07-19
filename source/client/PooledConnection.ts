/* eslint-disable @typescript-eslint/no-explicit-any */
import { Socket } from 'net';
import { connect as tlsConnect } from 'tls';
import { randomUUID } from 'crypto';
import { MessageBuffer, MessageFramer } from '../tcp/config/protocol';
import { TCPRequest, TCPResponse, PendingRequest } from '../tcp/types/protocol.types';
import { CommandType } from '../tcp/types/command.types';
import { AuthenticatedUser, ConnectionState } from './types/client.types';

/** Per-connection options a PooledConnection needs (pool-level options like maxPoolSize live one level up). */
export interface PooledConnectionOptions {
  timeout: number;
  reconnectAttempts: number;
  reconnectDelay: number;
  heartbeatInterval: number;
  /** Encrypt this connection with TLS instead of plaintext. */
  tls?: boolean;
  /** Pre-read CA certificate content (see AxioDBCloud's tlsCAPath) - read once at the pool level, not per connection. */
  tlsCA?: Buffer;
  tlsRejectUnauthorized?: boolean;
}

/** Callbacks a PooledConnection uses to surface lifecycle events to its owning AxioDBCloud pool. */
export interface PooledConnectionCallbacks {
  onError: (error: Error) => void;
  onDisconnected: (hadError: boolean) => void;
  onReconnecting: (attempt: number) => void;
  onReconnected: () => void;
  /** This member exhausted its reconnect attempts and is giving up permanently. */
  onExhausted: () => void;
}

/**
 * One physical TCP connection within an AxioDBCloud connection pool. Owns its own socket,
 * message-framing buffer, in-flight request map, and reconnect/heartbeat lifecycle, so a
 * failure on one pooled connection never affects the others in the pool.
 */
export default class PooledConnection {
  private socket: Socket | null = null;
  private messageBuffer: MessageBuffer = new MessageBuffer();
  private pendingRequests: Map<string, PendingRequest> = new Map();
  private reconnectAttempt = 0;
  private heartbeatInterval: NodeJS.Timeout | null = null;

  public state: ConnectionState = ConnectionState.DISCONNECTED;
  public authUser?: AuthenticatedUser;

  /** Number of requests sent on this connection awaiting a response - used by the owning pool to route new commands to the least-busy member instead of blind round-robin. */
  get pendingCount(): number {
    return this.pendingRequests.size;
  }

  constructor(
    private readonly host: string,
    private readonly port: number,
    private readonly options: PooledConnectionOptions,
    private readonly getCredentials: () => { username: string; password: string } | undefined,
    private readonly callbacks: PooledConnectionCallbacks,
  ) {}

  /**
   * Connect (or reconnect) this pooled connection, authenticating automatically if
   * credentials are available. On authentication failure, marks this connection FAILED and
   * prevents its own background auto-reconnect from retrying the same bad credentials.
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.state === ConnectionState.CONNECTED) {
        resolve();
        return;
      }

      if (this.socket) {
        this.socket.removeAllListeners();
        if (!this.socket.destroyed) {
          this.socket.destroy();
        }
        this.socket = null;
      }

      this.state = ConnectionState.CONNECTING;

      const connectionTimeout = setTimeout(() => {
        socket.destroy();
        this.state = ConnectionState.FAILED;
        reject(new Error('Connection timeout'));
      }, this.options.timeout);

      // Registered before setupSocketHandlers() so it runs first (Node fires listeners in
      // registration order), deterministically settling this connect() promise before the
      // permanent handler below re-emits the same error onto the shared callbacks.onError -
      // fixes a crash where the permanent handler's re-emit used to run first and throw
      // (via the owning AxioDBCloud's EventEmitter) before reject() ever got a chance to run.
      const connectErrorHandler = (error: Error) => {
        clearTimeout(connectionTimeout);
        this.state = ConnectionState.FAILED;
        reject(error);
      };

      const onReady = async () => {
        clearTimeout(connectionTimeout);
        socket.off('error', connectErrorHandler);
        this.state = ConnectionState.CONNECTED;
        this.reconnectAttempt = 0;
        this.startHeartbeat();

        const credentials = this.getCredentials();
        if (!credentials) {
          resolve();
          return;
        }

        try {
          await this.authenticate(credentials.username, credentials.password);
          resolve();
        } catch (authError) {
          // Prevents handleDisconnection's auto-reconnect from retrying the same bad
          // credentials up to `reconnectAttempts` times.
          this.reconnectAttempt = this.options.reconnectAttempts;
          this.state = ConnectionState.FAILED;
          this.stopHeartbeat();
          socket.destroy();
          reject(authError);
        }
      };

      // tls.connect() both creates and initiates the connection in one call (unlike
      // net.Socket, which needs a separate .connect()), firing 'secureConnect' once the TLS
      // handshake completes - a stronger readiness signal than plain TCP's 'connect', since
      // it also implies certificate validation passed (rejectUnauthorized: true, the default).
      const socket: Socket = this.options.tls
        ? tlsConnect(
            {
              host: this.host,
              port: this.port,
              ca: this.options.tlsCA,
              rejectUnauthorized: this.options.tlsRejectUnauthorized ?? true,
            },
            onReady,
          )
        : new Socket();
      this.socket = socket;
      socket.once('error', connectErrorHandler);
      this.setupSocketHandlers(socket);

      if (!this.options.tls) {
        socket.connect(this.port, this.host, onReady);
      }
    });
  }

  /** Sends the AUTHENTICATE command over this connection and stores the resulting identity. */
  async authenticate(username: string, password: string): Promise<AuthenticatedUser> {
    const result = await this.sendCommand(CommandType.AUTHENTICATE, { username, password });
    this.authUser = result as AuthenticatedUser;
    return this.authUser;
  }

  sendCommand(command: CommandType | string, params: any): Promise<any> {
    if (this.state !== ConnectionState.CONNECTED || !this.socket) {
      return Promise.reject(new Error('Not connected to server'));
    }

    const socket = this.socket;
    const id = randomUUID();
    const request: TCPRequest = { id, command: command as CommandType, params };

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
        socket.write(buffer);
      } catch (error) {
        clearTimeout(timeout);
        this.pendingRequests.delete(id);
        reject(error);
      }
    });
  }

  /** Disconnect this connection permanently (no further auto-reconnect). */
  async disconnect(): Promise<void> {
    this.reconnectAttempt = this.options.reconnectAttempts;
    this.stopHeartbeat();

    if (this.socket && !this.socket.destroyed) {
      try {
        await this.sendCommand(CommandType.DISCONNECT, {});
      } catch {
        // no-op
      }

      this.socket.removeAllListeners();
      this.socket.end();
      this.socket = null;
    }

    this.state = ConnectionState.DISCONNECTED;
  }

  private setupSocketHandlers(socket: Socket): void {
    socket.on('data', (chunk: Buffer) => {
      try {
        const messages = this.messageBuffer.addChunk(chunk);

        for (const message of messages) {
          this.handleResponse(message as TCPResponse);
        }
      } catch (error) {
        // Clear buffer on protocol errors to prevent cascade failures
        this.messageBuffer.clear();

        if (error instanceof Error && error.message.includes('Message exceeds maximum size')) {
          const enhancedError = new Error(
            'Protocol error: Message exceeds maximum size. Are you connecting to the correct port? ' +
              'AxioDBCloud uses TCP port (default: 27019), not HTTP port (27018).',
          );
          this.callbacks.onError(enhancedError);
          socket.destroy();
        } else {
          this.callbacks.onError(error instanceof Error ? error : new Error(String(error)));
        }
      }
    });

    socket.on('error', (error: Error) => {
      this.callbacks.onError(error);
      this.handleDisconnection();
    });

    socket.on('close', (hadError: boolean) => {
      this.callbacks.onDisconnected(hadError);
      this.handleDisconnection();
    });

    socket.on('end', () => {
      this.handleDisconnection();
    });
  }

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
      console.warn(`[AxioDBCloud] Received response for unknown request occured: ${response.id}`);
    }
  }

  private handleDisconnection(): void {
    this.state = ConnectionState.DISCONNECTED;
    this.stopHeartbeat();

    if (this.socket) {
      this.socket.removeAllListeners();
    }

    for (const [id, pending] of this.pendingRequests.entries()) {
      clearTimeout(pending.timeout);
      pending.reject(new Error('Connection lost'));
      this.pendingRequests.delete(id);
    }

    if (this.reconnectAttempt < this.options.reconnectAttempts) {
      this.attemptReconnect();
    } else {
      this.state = ConnectionState.FAILED;
      this.callbacks.onExhausted();
    }
  }

  private attemptReconnect(): void {
    this.reconnectAttempt++;
    const delay = Math.min(
      this.options.reconnectDelay * Math.pow(2, this.reconnectAttempt - 1),
      30000,
    );

    this.callbacks.onReconnecting(this.reconnectAttempt);
    this.state = ConnectionState.RECONNECTING;

    setTimeout(async () => {
      try {
        await this.connect();
        this.callbacks.onReconnected();
      } catch {
        // Reconnection will be attempted again in handleDisconnection
      }
    }, delay);
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(async () => {
      try {
        await this.sendCommand(CommandType.PING, {});
      } catch (error) {
        console.warn('[AxioDBCloud] Heartbeat failed:', error);
      }
    }, this.options.heartbeatInterval);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }
}
