'use strict';

const { z } = require('zod');
const Transaction = require('../../lib/Services/Transaction/Transaction.service').default;
const { PERMISSIONS } = require('../../lib/config/Keys/Permissions');
const { sessionIdField, withAuth } = require('../shared.helpers');
const { READ_ONLY, ADDITIVE, DESTRUCTIVE, withConfirmation } = require('../confirmation.helper');

const transactionIdField = { transactionId: z.string().min(1) };
const transactionStore = new Map();

function getTransaction(transactionId, sessionId) {
  const stored = transactionStore.get(transactionId);
  if (!stored) return undefined;
  if (stored.sessionId !== sessionId) return { statusCode: 403, message: 'Transaction belongs to another MCP session' };
  return stored.transaction;
}

function requireTransaction(transactionId, sessionId) {
  const transaction = getTransaction(transactionId, sessionId);
  if (!transaction) {
    return { statusCode: 404, message: 'Transaction not found or already closed' };
  }
  return transaction;
}

module.exports = function registerTransactionTools(server, axioDBInstance) {
  server.registerTool(
    'axiodb_begin_transaction',
    {
      description: 'Begin a single-collection ACID transaction. Use the returned transactionId with the transaction operation tools.',
      inputSchema: { ...sessionIdField, dbName: z.string().min(1), collectionName: z.string().min(1) },
      annotations: ADDITIVE,
    },
    withAuth(PERMISSIONS.DOCUMENT_CREATE, async ({ dbName, collectionName }, session) => {
      const database = await axioDBInstance.createDB(dbName);
      const collection = await database.createCollection(collectionName);
      const transaction = new Transaction(collection.getCollectionPath());
      transactionStore.set(transaction.getId(), { transaction, sessionId: session.sid });
      return { statusCode: 200, message: 'Transaction started', data: { transactionId: transaction.getId() } };
    }),
  );

  server.registerTool(
    'axiodb_transaction_insert',
    {
      description: 'Buffer a document insert inside an active MCP transaction.',
      inputSchema: { ...sessionIdField, ...transactionIdField, document: z.record(z.string(), z.any()) },
      annotations: ADDITIVE,
    },
    withAuth(PERMISSIONS.DOCUMENT_CREATE, ({ transactionId, document }, session) => {
      const transaction = requireTransaction(transactionId, session.sid);
      if (!transaction.getId) return transaction;
      transaction.insert(document);
      return { statusCode: 200, message: 'Document buffered in transaction', data: { transactionId } };
    }),
  );

  server.registerTool(
    'axiodb_transaction_update',
    {
      description: 'Buffer a flat-merge update inside an active MCP transaction.',
      inputSchema: { ...sessionIdField, ...transactionIdField, query: z.record(z.string(), z.any()), update: z.record(z.string(), z.any()) },
      annotations: DESTRUCTIVE,
    },
    withAuth(PERMISSIONS.DOCUMENT_UPDATE, withConfirmation(
      server,
      ({ transactionId }) => `Buffer an update in transaction "${transactionId}"?`,
      ({ transactionId, query, update }, session) => {
        const transaction = requireTransaction(transactionId, session.sid);
        if (!transaction.getId) return transaction;
        transaction.update(query, update);
        return { statusCode: 200, message: 'Update buffered in transaction', data: { transactionId } };
      },
    )),
  );

  server.registerTool(
    'axiodb_transaction_delete',
    {
      description: 'Buffer a delete inside an active MCP transaction.',
      inputSchema: { ...sessionIdField, ...transactionIdField, query: z.record(z.string(), z.any()) },
      annotations: DESTRUCTIVE,
    },
    withAuth(PERMISSIONS.DOCUMENT_DELETE, withConfirmation(
      server,
      ({ transactionId }) => `Buffer a delete in transaction "${transactionId}"?`,
      ({ transactionId, query }, session) => {
        const transaction = requireTransaction(transactionId, session.sid);
        if (!transaction.getId) return transaction;
        transaction.delete(query);
        return { statusCode: 200, message: 'Delete buffered in transaction', data: { transactionId } };
      },
    )),
  );

  server.registerTool(
    'axiodb_transaction_savepoint',
    {
      description: 'Create a named savepoint inside an active MCP transaction.',
      inputSchema: { ...sessionIdField, ...transactionIdField, savepointName: z.string().min(1) },
      annotations: ADDITIVE,
    },
    withAuth(PERMISSIONS.DOCUMENT_CREATE, ({ transactionId, savepointName }, session) => {
      const transaction = requireTransaction(transactionId, session.sid);
      if (!transaction.getId) return transaction;
      transaction.savepoint(savepointName);
      return { statusCode: 200, message: 'Savepoint created', data: { transactionId, savepointName } };
    }),
  );

  server.registerTool(
    'axiodb_transaction_rollback_to_savepoint',
    {
      description: 'Discard operations after a named savepoint.',
      inputSchema: { ...sessionIdField, ...transactionIdField, savepointName: z.string().min(1) },
      annotations: DESTRUCTIVE,
    },
    withAuth(PERMISSIONS.DOCUMENT_DELETE, withConfirmation(
      server,
      ({ transactionId, savepointName }) => `Roll back transaction "${transactionId}" to savepoint "${savepointName}"?`,
      ({ transactionId, savepointName }, session) => {
        const transaction = requireTransaction(transactionId, session.sid);
        if (!transaction.getId) return transaction;
        transaction.rollbackTo(savepointName);
        return { statusCode: 200, message: 'Rolled back to savepoint', data: { transactionId, savepointName } };
      },
    )),
  );

  server.registerTool(
    'axiodb_transaction_release_savepoint',
    {
      description: 'Release a named savepoint without changing buffered operations.',
      inputSchema: { ...sessionIdField, ...transactionIdField, savepointName: z.string().min(1) },
      annotations: ADDITIVE,
    },
    withAuth(PERMISSIONS.DOCUMENT_CREATE, ({ transactionId, savepointName }, session) => {
      const transaction = requireTransaction(transactionId, session.sid);
      if (!transaction.getId) return transaction;
      transaction.releaseSavepoint(savepointName);
      return { statusCode: 200, message: 'Savepoint released', data: { transactionId, savepointName } };
    }),
  );

  server.registerTool(
    'axiodb_commit_transaction',
    {
      description: 'Commit all buffered operations atomically and close the MCP transaction.',
      inputSchema: { ...sessionIdField, ...transactionIdField },
      annotations: DESTRUCTIVE,
    },
    withAuth(PERMISSIONS.DOCUMENT_UPDATE, withConfirmation(
      server,
      ({ transactionId }) => `Commit all buffered operations in transaction "${transactionId}"?`,
      async ({ transactionId }, session) => {
        const transaction = requireTransaction(transactionId, session.sid);
        if (!transaction.getId) return transaction;
        const result = await transaction.commit();
        transactionStore.delete(transactionId);
        return result;
      },
    )),
  );

  server.registerTool(
    'axiodb_rollback_transaction',
    {
      description: 'Roll back all buffered operations and close the MCP transaction.',
      inputSchema: { ...sessionIdField, ...transactionIdField },
      annotations: DESTRUCTIVE,
    },
    withAuth(PERMISSIONS.DOCUMENT_DELETE, withConfirmation(
      server,
      ({ transactionId }) => `Roll back transaction "${transactionId}"? All buffered operations will be discarded.`,
      async ({ transactionId }, session) => {
        const transaction = requireTransaction(transactionId, session.sid);
        if (!transaction.getId) return transaction;
        const result = await transaction.rollback();
        transactionStore.delete(transactionId);
        return result;
      },
    )),
  );
};
