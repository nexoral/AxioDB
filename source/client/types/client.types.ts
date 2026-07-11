export interface AxioDBCloudOptions {
  timeout?: number; // Request timeout in milliseconds (default: 30000)
  reconnectAttempts?: number; // Max reconnection attempts (default: 10)
  reconnectDelay?: number; // Initial reconnection delay in ms (default: 1000)
  heartbeatInterval?: number; // Heartbeat interval in ms (default: 30000)
  username?: string; // Username to authenticate with, if the server was started with TCPAuth: true
  password?: string; // Password to authenticate with, if the server was started with TCPAuth: true
  // Number of concurrent TCP connections to keep open in the pool (default: 10). Mirrors
  // MongoDB's driver option of the same name. Commands are routed to whichever connected
  // pool member has the fewest in-flight requests (least-busy); each member reconnects and
  // re-authenticates independently.
  maxPoolSize?: number;
  /** Encrypt the connection with TLS instead of plaintext. Must match the server's own TLS setting. Defaults to false. */
  tls?: boolean;
  /** Path to a CA certificate (or the server's own cert, for a self-signed deployment) to validate the server's certificate against. Only relevant when `tls: true`. */
  tlsCAPath?: string;
  /** Defaults to true. Set to false only for local/dev testing against an unverified self-signed certificate - never in production, since it disables all server-identity verification. */
  tlsRejectUnauthorized?: boolean;
}

/** Public shape returned by a successful AUTHENTICATE command. */
export interface AuthenticatedUser {
  username: string;
  role: string;
  mustChangePassword: boolean;
}

/**
 * Emitted by `connect()` when the pool comes up smaller than `maxPoolSize` requested -
 * e.g. some members hit the server's per-IP connection cap, or a transient network error.
 * `connect()` still resolves as long as at least one pool member connected; this event is
 * how the app finds out it's running under capacity instead of silently getting fewer
 * connections than it asked for.
 */
export interface PoolDegradedEvent {
  requested: number;
  connected: number;
  failed: number;
  errors: Error[];
}

export enum ConnectionState {
  DISCONNECTED = 'DISCONNECTED',
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
  RECONNECTING = 'RECONNECTING',
  FAILED = 'FAILED',
}

/** Parsed form of an `axiodb://host:port` connection string. */
export interface ParsedConnectionString {
  host: string;
  port: number;
}
