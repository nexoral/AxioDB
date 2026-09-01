import { CommandType } from './command.types';

/**
 * TCP Request structure
 * Sent from client to server
 */
export interface TCPRequest {
  id: string; // Correlation ID (UUID v4)
  command: CommandType; // Command to execute
  params: {
    // Authentication parameters
    username?: string;
    password?: string;

    // Database parameters
    dbName?: string;

    // Collection parameters
    collectionName?: string;
    crypto?: boolean;
    key?: string;

    // Document data
    data?: Record<string, unknown>;
    documents?: Record<string, unknown>[];

    // Query parameters
    query?: Record<string, unknown>;
    id?: string; // Document ID for by-id operations
    ids?: string[]; // Document IDs for batch operations

    // Update parameters
    updateData?: Record<string, unknown>;
    updateOne?: boolean;

    // Delete parameters
    deleteOne?: boolean;

    // Query modifiers
    limit?: number;
    skip?: number;
    sort?: Record<string, 1 | -1>;
    findOne?: boolean;
    hint?: string;

    // Aggregation parameters
    pipeline?: object[];

    // Index parameters
    fieldNames?: string[];
    indexName?: string;

    // Transaction parameters
    transactionId?: string;
    savepointName?: string;
  };
}

/**
 * TCP Response structure
 * Sent from server to client
 */
export interface TCPResponse {
  id: string; // Matches request ID for correlation
  statusCode: number; // HTTP-style status codes
  message: string; // Human-readable message
  data?: unknown; // Response data (varies by command)
  error?: string; // Error details if statusCode >= 400
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
 * Pending request tracking
 */
export interface PendingRequest {
  resolve: (value: unknown) => void;
  reject: (error: Error) => void;
  timeout: NodeJS.Timeout;
  timestamp: number;
}

/**
 * Connection options
 */
export interface ConnectionOptions {
  host: string;
  port: number;
  timeout?: number; // Request timeout in milliseconds (default: 30000)
  reconnectAttempts?: number; // Max reconnection attempts (default: 10)
  reconnectDelay?: number; // Initial reconnection delay in ms (default: 1000)
  heartbeatInterval?: number; // Heartbeat interval in ms (default: 30000)
}
