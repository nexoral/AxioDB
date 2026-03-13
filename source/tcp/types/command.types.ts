/**
 * Command types for TCP protocol
 * Defines all operations that can be performed over TCP connection
 */

export enum CommandType {
  // Connection Commands
  PING = 'PING',
  DISCONNECT = 'DISCONNECT',

  // Database Operations
  CREATE_DB = 'CREATE_DB',
  DELETE_DB = 'DELETE_DB',
  DB_EXISTS = 'DB_EXISTS',
  GET_INSTANCE_INFO = 'GET_INSTANCE_INFO',

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
  UPDATE_DOCUMENT_BY_ID = 'UPDATE_DOCUMENT_BY_ID',
  UPDATE_DOCUMENTS_BY_QUERY = 'UPDATE_DOCUMENTS_BY_QUERY',
  DELETE_DOCUMENT_BY_ID = 'DELETE_DOCUMENT_BY_ID',
  DELETE_DOCUMENTS_BY_QUERY = 'DELETE_DOCUMENTS_BY_QUERY',
  AGGREGATE = 'AGGREGATE',
  TOTAL_DOCUMENTS = 'TOTAL_DOCUMENTS',

  // Index Operations
  CREATE_INDEX = 'CREATE_INDEX',
  DROP_INDEX = 'DROP_INDEX',

  // Transaction Operations (future)
  BEGIN_TRANSACTION = 'BEGIN_TRANSACTION',
  COMMIT_TRANSACTION = 'COMMIT_TRANSACTION',
  ROLLBACK_TRANSACTION = 'ROLLBACK_TRANSACTION',
}

/**
 * Command documentation map for better error messages
 */
export const CommandDocumentation: Record<CommandType, string> = {
  [CommandType.PING]: 'Heartbeat ping to verify connection',
  [CommandType.DISCONNECT]: 'Gracefully disconnect from server',
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
  [CommandType.UPDATE_DOCUMENT_BY_ID]: 'Update document by ID',
  [CommandType.UPDATE_DOCUMENTS_BY_QUERY]: 'Update documents matching query',
  [CommandType.DELETE_DOCUMENT_BY_ID]: 'Delete document by ID',
  [CommandType.DELETE_DOCUMENTS_BY_QUERY]: 'Delete documents matching query',
  [CommandType.AGGREGATE]: 'Run aggregation pipeline',
  [CommandType.TOTAL_DOCUMENTS]: 'Get total document count',
  [CommandType.CREATE_INDEX]: 'Create index on collection fields',
  [CommandType.DROP_INDEX]: 'Drop existing index',
  [CommandType.BEGIN_TRANSACTION]: 'Begin database transaction',
  [CommandType.COMMIT_TRANSACTION]: 'Commit database transaction',
  [CommandType.ROLLBACK_TRANSACTION]: 'Rollback database transaction',
};
