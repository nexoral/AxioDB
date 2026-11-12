/**
 * Command types for TCP protocol
 * Defines all operations that can be performed over TCP connection
 */

export enum CommandType {
  // Connection Commands
  PING = 'PING',
  HEALTH = 'HEALTH',
  DISCONNECT = 'DISCONNECT',

  // Authentication Commands
  AUTHENTICATE = 'AUTHENTICATE',

  // Database Operations
  CREATE_DB = 'CREATE_DB',
  DELETE_DB = 'DELETE_DB',
  DB_EXISTS = 'DB_EXISTS',
  GET_INSTANCE_INFO = 'GET_INSTANCE_INFO',
  EXPORT_DATABASE = 'EXPORT_DATABASE',
  IMPORT_DATABASE = 'IMPORT_DATABASE',

  // Collection Operations
  CREATE_COLLECTION = 'CREATE_COLLECTION',
  DELETE_COLLECTION = 'DELETE_COLLECTION',
  COLLECTION_EXISTS = 'COLLECTION_EXISTS',
  GET_COLLECTION_INFO = 'GET_COLLECTION_INFO',

  // CRUD Operations
  INSERT_DOCUMENT = 'INSERT_DOCUMENT',
  INSERT_MANY_DOCUMENTS = 'INSERT_MANY_DOCUMENTS',
  QUERY_DOCUMENTS = 'QUERY_DOCUMENTS',
  QUERY_BY_ID = 'QUERY_BY_ID',
  FIND_BY_IDS = 'FIND_BY_IDS',
  UPDATE_DOCUMENT_BY_ID = 'UPDATE_DOCUMENT_BY_ID',
  UPDATE_DOCUMENTS_BY_QUERY = 'UPDATE_DOCUMENTS_BY_QUERY',
  DELETE_DOCUMENT_BY_ID = 'DELETE_DOCUMENT_BY_ID',
  DELETE_DOCUMENTS_BY_QUERY = 'DELETE_DOCUMENTS_BY_QUERY',
  AGGREGATE = 'AGGREGATE',
  TOTAL_DOCUMENTS = 'TOTAL_DOCUMENTS',
  VECTOR_SEARCH = 'VECTOR_SEARCH',

  // Index Operations
  CREATE_INDEX = 'CREATE_INDEX',
  DROP_INDEX = 'DROP_INDEX',
  LIST_INDEXES = 'LIST_INDEXES',

  // Transaction Operations
  BEGIN_TRANSACTION = 'BEGIN_TRANSACTION',
  COMMIT_TRANSACTION = 'COMMIT_TRANSACTION',
  ROLLBACK_TRANSACTION = 'ROLLBACK_TRANSACTION',
  SAVEPOINT = 'SAVEPOINT',
  ROLLBACK_TO_SAVEPOINT = 'ROLLBACK_TO_SAVEPOINT',
  RELEASE_SAVEPOINT = 'RELEASE_SAVEPOINT',

  // User & Role Management
  LIST_USERS = 'LIST_USERS',
  CREATE_USER = 'CREATE_USER',
  UPDATE_USER_ROLE = 'UPDATE_USER_ROLE',
  RESET_USER_PASSWORD = 'RESET_USER_PASSWORD',
  CHANGE_PASSWORD = 'CHANGE_PASSWORD',
  DELETE_USER = 'DELETE_USER',
  LIST_ROLES = 'LIST_ROLES',
  CREATE_ROLE = 'CREATE_ROLE',
  DELETE_ROLE = 'DELETE_ROLE',
  LIST_PERMISSIONS = 'LIST_PERMISSIONS',

  // Metrics & System Diagnostics
  GET_SYSTEM_INFO = 'GET_SYSTEM_INFO',
  GET_DASHBOARD_STATS = 'GET_DASHBOARD_STATS',
}

/**
 * Command documentation map for better error messages
 */
export const CommandDocumentation: Record<CommandType, string> = {
  [CommandType.PING]: 'Heartbeat ping to verify connection',
  [CommandType.HEALTH]: 'Get TCP service health status',
  [CommandType.DISCONNECT]: 'Gracefully disconnect from server',
  [CommandType.AUTHENTICATE]: 'Authenticate with username and password',
  [CommandType.CREATE_DB]: 'Create a new database',
  [CommandType.DELETE_DB]: 'Delete an existing database',
  [CommandType.DB_EXISTS]: 'Check if database exists',
  [CommandType.GET_INSTANCE_INFO]: 'Get AxioDB instance information',
  [CommandType.CREATE_COLLECTION]: 'Create a new collection in database',
  [CommandType.DELETE_COLLECTION]: 'Delete a collection from database',
  [CommandType.COLLECTION_EXISTS]: 'Check if collection exists',
  [CommandType.GET_COLLECTION_INFO]: 'Get collection metadata',
  [CommandType.INSERT_DOCUMENT]: 'Insert single document into collection',
  [CommandType.INSERT_MANY_DOCUMENTS]: 'Insert multiple documents into collection',
  [CommandType.QUERY_DOCUMENTS]: 'Query documents with filters and options',
  [CommandType.QUERY_BY_ID]: 'Query document by ID',
  [CommandType.FIND_BY_IDS]: 'Retrieve multiple documents by their IDs',
  [CommandType.UPDATE_DOCUMENT_BY_ID]: 'Update document by ID',
  [CommandType.UPDATE_DOCUMENTS_BY_QUERY]: 'Update documents matching query',
  [CommandType.DELETE_DOCUMENT_BY_ID]: 'Delete document by ID',
  [CommandType.DELETE_DOCUMENTS_BY_QUERY]: 'Delete documents matching query',
  [CommandType.AGGREGATE]: 'Run aggregation pipeline',
  [CommandType.TOTAL_DOCUMENTS]: 'Get total document count',
  [CommandType.VECTOR_SEARCH]: 'Run vector similarity search on a collection',
  [CommandType.CREATE_INDEX]: 'Create index on collection fields',
  [CommandType.DROP_INDEX]: 'Drop existing index',
  [CommandType.LIST_INDEXES]: 'List all indexes registered on a collection',
  [CommandType.BEGIN_TRANSACTION]: 'Begin database transaction',
  [CommandType.COMMIT_TRANSACTION]: 'Commit database transaction',
  [CommandType.ROLLBACK_TRANSACTION]: 'Rollback database transaction',
  [CommandType.SAVEPOINT]: 'Create a savepoint within a transaction',
  [CommandType.ROLLBACK_TO_SAVEPOINT]: 'Rollback to a specific savepoint',
  [CommandType.RELEASE_SAVEPOINT]: 'Release a savepoint',
  [CommandType.LIST_USERS]: 'List all registered users',
  [CommandType.CREATE_USER]: 'Create a new user with role',
  [CommandType.UPDATE_USER_ROLE]: 'Update a user assigned role',
  [CommandType.RESET_USER_PASSWORD]: 'Administrative reset of a user password',
  [CommandType.CHANGE_PASSWORD]: 'Change own password for authenticated user',
  [CommandType.DELETE_USER]: 'Delete a user',
  [CommandType.LIST_ROLES]: 'List all roles',
  [CommandType.CREATE_ROLE]: 'Create a custom role with permissions',
  [CommandType.DELETE_ROLE]: 'Delete a role',
  [CommandType.LIST_PERMISSIONS]: 'List available system permissions',
  [CommandType.GET_SYSTEM_INFO]: 'Get host, process, and service diagnostics',
  [CommandType.GET_DASHBOARD_STATS]: 'Get aggregate storage, database tree, and cache metrics',
  [CommandType.EXPORT_DATABASE]: 'Export database as chunked archive',
  [CommandType.IMPORT_DATABASE]: 'Import database from chunked archive',
};
