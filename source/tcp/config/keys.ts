/**
 * TCP Server Configuration Constants
 */

// Server Configuration
export const DEFAULT_TCP_PORT = 27019;
export const MAX_MESSAGE_SIZE = 50 * 1024 * 1024; // 50MB
export const MAX_CONNECTIONS = 1000; // Maximum concurrent connections
// Maximum concurrent connections from a single remote IP. Prevents one client (malicious
// or misbehaving) from exhausting the entire MAX_CONNECTIONS budget by itself; 100 still
// comfortably covers several legitimate AxioDBCloud clients sharing one IP/NAT gateway at
// the default maxPoolSize of 10.
export const MAX_CONNECTIONS_PER_IP = 100;
export const CONNECTION_TIMEOUT = 60000; // 60 seconds

/**
 * Per-IP connection-*attempt* rate limiting - complements MAX_CONNECTIONS_PER_IP, which only
 * bounds concurrent connections and does nothing to stop an attacker who stays under that cap
 * while hammering the server with rapid connect-then-drop churn (each attempt still costs a
 * TCP handshake + accept/reject cycle). Same sliding-window + cooldown shape as the login rate
 * limiter (LOGIN_RATE_LIMIT_* in config/Keys/Permissions.ts), applied to raw connection
 * attempts instead of failed logins. See ConnectionRateLimiter.ts.
 */
export const CONNECTION_RATE_LIMIT_MAX_ATTEMPTS = 300; // per IP, within the trailing window
export const CONNECTION_RATE_LIMIT_WINDOW_MS = 10000; // 10 seconds
export const CONNECTION_RATE_LIMIT_COOLDOWN_MS = 30000; // 30 seconds
export const CONNECTION_RATE_LIMIT_SWEEP_INTERVAL_MS = 60000; // 1 minute

// Request/Response Configuration
export const DEFAULT_REQUEST_TIMEOUT = 30000; // 30 seconds
export const HEARTBEAT_INTERVAL = 30000; // 30 seconds
export const HEARTBEAT_TIMEOUT = 5000; // 5 seconds

// Reconnection Configuration
export const MAX_RECONNECT_ATTEMPTS = 10;
export const INITIAL_RECONNECT_DELAY = 1000; // 1 second
export const MAX_RECONNECT_DELAY = 30000; // 30 seconds

// Protocol Configuration
export const MESSAGE_LENGTH_BYTES = 4; // 4-byte uint32 for message length
export const ENCODING = 'utf8';

// Buffer Configuration
export const INITIAL_BUFFER_SIZE = 4096; // 4KB
export const MAX_BUFFER_SIZE = MAX_MESSAGE_SIZE + MESSAGE_LENGTH_BYTES;

// Status Codes (HTTP-style)
export const StatusCode = {
  // Success
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,

  // Client Errors
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  PAYLOAD_TOO_LARGE: 413,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,

  // Server Errors
  INTERNAL_SERVER_ERROR: 500,
  NOT_IMPLEMENTED: 501,
  SERVICE_UNAVAILABLE: 503,
} as const;

// Error Messages
export const ErrorMessage = {
  INVALID_MESSAGE_FORMAT: 'Invalid message format',
  MESSAGE_TOO_LARGE: 'Message exceeds maximum size',
  UNKNOWN_COMMAND: 'Unknown command',
  MISSING_REQUIRED_PARAMS: 'Missing required parameters',
  INVALID_CORRELATION_ID: 'Invalid correlation ID',
  CONNECTION_TIMEOUT: 'Connection timeout',
  REQUEST_TIMEOUT: 'Request timeout',
  SERVER_OVERLOAD: 'Server is overloaded',
  TOO_MANY_CONNECTIONS_FROM_IP: 'Too many concurrent connections from this IP address',
  TOO_MANY_CONNECTION_ATTEMPTS: 'Too many connection attempts from this IP address. Try again later.',
  INTERNAL_ERROR: 'Internal server error',
  AUTH_REQUIRED: 'Authentication required. Send an AUTHENTICATE command with username and password.',
  INVALID_CREDENTIALS: 'Invalid username or password',
  INSUFFICIENT_PERMISSIONS: 'Insufficient permissions for this operation',
  RESERVED_DATABASE: 'This is a reserved system database',
  TOO_MANY_LOGIN_ATTEMPTS: 'Too many failed login attempts. Try again later.',
  PASSWORD_CHANGE_REQUIRED:
    'This account must change its password before it can be used over TCP. Log into the Control Server GUI to change the password, or authenticate with a different account that has already completed its password change.',
} as const;

// Success Messages
export const SuccessMessage = {
  PING_PONG: 'PONG',
  DISCONNECTED: 'Successfully disconnected',
  DB_CREATED: 'Database created successfully',
  DB_DELETED: 'Database deleted successfully',
  COLLECTION_CREATED: 'Collection created successfully',
  COLLECTION_DELETED: 'Collection deleted successfully',
  DOCUMENT_INSERTED: 'Document inserted successfully',
  DOCUMENTS_INSERTED: 'Documents inserted successfully',
  DOCUMENT_UPDATED: 'Document updated successfully',
  DOCUMENTS_UPDATED: 'Documents updated successfully',
  DOCUMENT_DELETED: 'Document deleted successfully',
  DOCUMENTS_DELETED: 'Documents deleted successfully',
  INDEX_CREATED: 'Index created successfully',
  INDEX_DROPPED: 'Index dropped successfully',
  AUTHENTICATED: 'Authenticated successfully',
} as const;
