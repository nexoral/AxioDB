/**
 * Client-side type definitions for AxioDBCloud
 */

/**
 * Connection configuration options
 */
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

/**
 * Connection state
 */
export enum ConnectionState {
  DISCONNECTED = 'DISCONNECTED',
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
  RECONNECTING = 'RECONNECTING',
  FAILED = 'FAILED',
}

/**
 * Connection string format: axiodb://host:port
 */
export interface ParsedConnectionString {
  host: string;
  port: number;
}
