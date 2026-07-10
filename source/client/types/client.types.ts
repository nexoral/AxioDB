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
}

/** Public shape returned by a successful AUTHENTICATE command. */
export interface AuthenticatedUser {
  username: string;
  role: string;
  mustChangePassword: boolean;
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
