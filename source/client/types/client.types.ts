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
