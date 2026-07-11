/* eslint-disable @typescript-eslint/no-explicit-any */
import { EventEmitter } from 'events';
import PooledConnection from './PooledConnection';
import { CommandType } from '../tcp/types/command.types';
import { AxioDBCloudOptions, AuthenticatedUser, ConnectionState, ParsedConnectionString, PoolDegradedEvent } from './types/client.types';
import DatabaseProxy from './DatabaseProxy';

const DEFAULT_MAX_POOL_SIZE = 10;

/**
 * AxioDBCloud - TCP Client for remote AxioDB access
 *
 * Maintains a pool of `maxPoolSize` concurrent TCP connections (default: 10, mirrors
 * MongoDB's driver default naming/behavior) to the same server. Commands are routed to
 * whichever connected pool member has the fewest in-flight requests, so a slow command
 * on one connection doesn't queue new commands behind it while other members sit idle;
 * each member independently reconnects (with exponential backoff) and re-authenticates,
 * so one dropped connection never affects the others or blocks in-flight commands routed
 * to healthy members.
 */
export class AxioDBCloud extends EventEmitter {
  private host: string;
  private port: number;
  private pool: PooledConnection[] = [];
  private options: Required<Omit<AxioDBCloudOptions, 'username' | 'password'>>;
  // Kept separate from `options` above: unlike timeout/reconnectAttempts/etc, credentials
  // have no sensible default, so they can't live in a Required<AxioDBCloudOptions> object.
  private credentials?: { username: string; password: string };

  constructor(connectionString: string, options?: AxioDBCloudOptions) {
    super();

    // Increase max listeners for reconnection scenarios
    this.setMaxListeners(20);

    // Default 'error' listener: Node's EventEmitter throws synchronously when 'error' is
    // emitted with zero listeners attached. Every pooled connection re-emits its socket
    // errors onto this instance (see PooledConnectionCallbacks.onError below), so without a
    // guaranteed listener here, a network error the host application never explicitly
    // listens for (e.g. a server restart) would crash the entire process. This listener only
    // logs when it's the sole 'error' listener - if the consuming app has also attached its
    // own, that one handles visibility and we don't double-log.
    this.on('error', (error: Error) => {
      if (this.listenerCount('error') <= 1) {
        console.error(
          '[AxioDBCloud] Unhandled connection error:',
          error instanceof Error ? error.message : error,
        );
      }
    });

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
      maxPoolSize: options?.maxPoolSize || DEFAULT_MAX_POOL_SIZE,
    };

    if (options?.username && options?.password) {
      this.credentials = { username: options.username, password: options.password };
    }
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
   * Open the connection pool. Authenticates the first connection alone (if credentials are
   * provided) before opening the rest of the pool - this avoids multiplying failed-login
   * attempts against the server's shared per-IP rate limiter N times over for a single bad
   * -credentials connect() call, and ensures a bad-credentials failure never leaves any pool
   * member mid-reconnect.
   *
   * The first connection must succeed or `connect()` rejects entirely (it's the signal that
   * the server is reachable and credentials are valid at all). The rest of the pool uses
   * allSettled rather than all: if `maxPoolSize` asks for more connections than the server
   * allows from this IP (see the server's per-IP connection cap) or a handful hit a transient
   * error, the pool still comes up with however many succeeded instead of failing outright -
   * a smaller-than-requested pool is far more useful to the caller than no pool at all.
   */
  async connect(): Promise<void> {
    if (this.pool.length > 0 && this.pool.some((connection) => connection.state === ConnectionState.CONNECTED)) {
      return;
    }

    const poolSize = this.options.maxPoolSize;
    this.pool = Array.from({ length: poolSize }, () => this.createPooledConnection());

    await this.pool[0].connect();

    if (poolSize > 1) {
      const results = await Promise.allSettled(this.pool.slice(1).map((connection) => connection.connect()));
      const failures = results.filter(
        (result): result is PromiseRejectedResult => result.status === 'rejected',
      );

      if (failures.length > 0) {
        const event: PoolDegradedEvent = {
          requested: poolSize,
          connected: poolSize - failures.length,
          failed: failures.length,
          errors: failures.map((failure) =>
            failure.reason instanceof Error ? failure.reason : new Error(String(failure.reason)),
          ),
        };
        this.emit('poolDegraded', event);
      }
    }

    this.emit('connected');
  }

  private createPooledConnection(): PooledConnection {
    return new PooledConnection(
      this.host,
      this.port,
      {
        timeout: this.options.timeout,
        reconnectAttempts: this.options.reconnectAttempts,
        reconnectDelay: this.options.reconnectDelay,
        heartbeatInterval: this.options.heartbeatInterval,
      },
      () => this.credentials,
      {
        onError: (error: Error) => this.emit('error', error),
        onDisconnected: (hadError: boolean) => this.emit('disconnected', hadError),
        onReconnecting: (attempt: number) => this.emit('reconnecting', attempt),
        onReconnected: () => this.emit('reconnected'),
        onExhausted: () => {
          if (this.pool.every((connection) => connection.state === ConnectionState.FAILED)) {
            this.emit('failed', new Error('Max reconnection attempts reached'));
          }
        },
      },
    );
  }

  /**
   * Authenticate with username/password (same RBAC users as the GUI Control Server).
   * Only required when the server was started with `TCPAuth: true`.
   *
   * Authenticates every currently-connected pool member and stashes the credentials so a
   * later automatic reconnect replays login on any member that drops - otherwise a network
   * blip after a runtime `login()` call would silently leave the reconnected member
   * unauthenticated.
   */
  async login(username: string, password: string): Promise<AuthenticatedUser> {
    const connectedMembers = this.pool.filter((connection) => connection.state === ConnectionState.CONNECTED);
    if (connectedMembers.length === 0) {
      throw new Error('Not connected to server');
    }

    const results = await Promise.all(
      connectedMembers.map((connection) => connection.authenticate(username, password)),
    );
    this.credentials = { username, password };
    return results[0];
  }

  /**
   * The currently authenticated identity, if `login()` (or constructor credentials)
   * succeeded on at least one pool member.
   */
  get authenticatedUser(): AuthenticatedUser | undefined {
    return this.pool.find((connection) => connection.authUser)?.authUser;
  }

  /**
   * Send command to server - picks the least-busy connected pool member.
   */
  async sendCommand(command: CommandType, params: any): Promise<any> {
    const connection = this.pickConnection();
    if (!connection) {
      throw new Error('Not connected to server');
    }

    return connection.sendCommand(command, params);
  }

  /**
   * Picks the connected pool member with the fewest in-flight requests (least-busy),
   * rather than round-robin, so a connection stuck on a slow command doesn't receive
   * more work while other members are idle.
   */
  private pickConnection(): PooledConnection | null {
    let best: PooledConnection | null = null;

    for (const connection of this.pool) {
      if (connection.state !== ConnectionState.CONNECTED) {
        continue;
      }
      if (best === null || connection.pendingCount < best.pendingCount) {
        best = connection;
      }
    }

    return best;
  }

  /**
   * Disconnect from server - closes every connection in the pool.
   */
  async disconnect(): Promise<void> {
    await Promise.all(this.pool.map((connection) => connection.disconnect()));
    this.pool = [];
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
   * Get current connection state - CONNECTED if at least one pool member is connected,
   * otherwise the "best" state across the pool (RECONNECTING > CONNECTING > FAILED).
   */
  get state(): ConnectionState {
    if (this.pool.length === 0) {
      return ConnectionState.DISCONNECTED;
    }
    if (this.pool.some((connection) => connection.state === ConnectionState.CONNECTED)) {
      return ConnectionState.CONNECTED;
    }
    if (this.pool.some((connection) => connection.state === ConnectionState.RECONNECTING)) {
      return ConnectionState.RECONNECTING;
    }
    if (this.pool.some((connection) => connection.state === ConnectionState.CONNECTING)) {
      return ConnectionState.CONNECTING;
    }
    return ConnectionState.FAILED;
  }

  /**
   * Check if connected - true when at least one pool member is connected.
   */
  get isConnected(): boolean {
    return this.pool.some((connection) => connection.state === ConnectionState.CONNECTED);
  }
}
