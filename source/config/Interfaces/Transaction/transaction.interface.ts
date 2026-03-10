export interface TransactionOperation {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  documentId?: string;
  query?: object;
  data?: object;
  fileName?: string;
  oldData?: object;
  savepointName?: string;
}

export interface WALEntry {
  transactionId: string;
  timestamp: string;
  operationType: 'INSERT' | 'UPDATE' | 'DELETE';
  documentId: string;
  fileName: string;
  beforeData?: string;
  afterData?: string;
  checksum: string;
  savepointName?: string;
}

export interface TransactionMetadata {
  transactionId: string;
  collectionPath: string;
  status: 'ACTIVE' | 'PREPARING' | 'COMMITTED' | 'ABORTED';
  startTime: string;
  lockedDocuments: string[];
  isolationLevel: 'READ_COMMITTED' | 'REPEATABLE_READ';
}

export interface LockInfo {
  documentId: string;
  transactionId: string;
  lockType: 'WRITE';
  timestamp: number;
}

export interface Savepoint {
  name: string;
  operationIndex: number;
  timestamp: string;
  lockedDocumentsSnapshot: string[];
}

export interface SessionOptions {
  defaultTimeout?: number;
  retryWrites?: boolean;
  maxRetries?: number;
}
