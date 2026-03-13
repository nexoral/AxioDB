import { CommandType } from './command.types';

/**
 * TCP Request structure
 * Sent from client to server
 */
export interface TCPRequest {
  id: string; // Correlation ID (UUID v4)
  command: CommandType; // Command to execute
  params: {
    // Database parameters
    dbName?: string;

    // Collection parameters
    collectionName?: string;
    crypto?: boolean;
    key?: string;

    // Document data
    data?: any;
    documents?: any[];

    // Query parameters
    query?: object;
    id?: string; // Document ID for by-id operations

    // Update parameters
    updateData?: object;
    updateOne?: boolean;

    // Delete parameters
    deleteOne?: boolean;

    // Query modifiers
    limit?: number;
    skip?: number;
    sort?: object;
    findOne?: boolean;

    // Aggregation parameters
    pipeline?: object[];

    // Index parameters
    fieldNames?: string[];
    indexName?: string;

    // Transaction parameters (future)
    transactionId?: string;
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
  data?: any; // Response data (varies by command)
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
  resolve: (value: any) => void;
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
