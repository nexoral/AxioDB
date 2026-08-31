'use strict';

const { z } = require('zod');
const CRUDController = require('../../lib/server/controller/Operation/CRUD.controller').default;
const { PERMISSIONS } = require('../../lib/config/Keys/Permissions');
const { sessionIdField, withAuth } = require('../shared.helpers');
const { withConfirmation, READ_ONLY, ADDITIVE, DESTRUCTIVE } = require('../confirmation.helper');

/** Keeps a confirmation prompt readable when an agent passes a large update payload. */
function preview(value) {
  const json = JSON.stringify(value);
  return json.length > 200 ? `${json.slice(0, 200)}... (truncated)` : json;
}

/** Human-readable blast radius for a confirmation prompt: one known doc, one match, or all matches. */
function describeTarget(documentId, query, many) {
  if (documentId) return `document "${documentId}"`;
  const filter = preview(query || {});
  return many ? `EVERY document matching ${filter}` : `the first document matching ${filter}`;
}

module.exports = function registerDocumentTools(server, axioDBInstance) {
  const crudController = new CRUDController(axioDBInstance);

  server.registerTool(
    'axiodb_insert_document',
    {
      description: 'Insert a single document into a collection.',
      inputSchema: {
        ...sessionIdField,
        dbName: z.string().min(1),
        collectionName: z.string().min(1),
        document: z.record(z.string(), z.any()),
      },
      annotations: ADDITIVE,
    },
    withAuth(PERMISSIONS.DOCUMENT_CREATE, ({ dbName, collectionName, document }) =>
      crudController.createNewDocument({ query: { dbName, collectionName }, body: document }),
    ),
  );

  server.registerTool(
    'axiodb_insert_many_documents',
    {
      description: 'Insert multiple documents into a collection in one call.',
      inputSchema: {
        ...sessionIdField,
        dbName: z.string().min(1),
        collectionName: z.string().min(1),
        documents: z.array(z.record(z.string(), z.any())).min(1),
      },
      annotations: ADDITIVE,
    },
    withAuth(PERMISSIONS.DOCUMENT_CREATE, ({ dbName, collectionName, documents }) =>
      crudController.createManyNewDocument({ query: { dbName, collectionName }, body: documents }),
    ),
  );

  server.registerTool(
    'axiodb_query_documents',
    {
      description: 'Read documents from a collection: by documentId, by a MongoDB-style filter query, or paginated (page defaults to 1, 10 per page) when neither is given.',
      inputSchema: {
        ...sessionIdField,
        dbName: z.string().min(1),
        collectionName: z.string().min(1),
        documentId: z.string().optional(),
        query: z.record(z.string(), z.any()).optional(),
        page: z.number().int().min(1).optional(),
        hint: z.string().optional(),
      },
      annotations: READ_ONLY,
    },
    withAuth(PERMISSIONS.DOCUMENT_QUERY, ({ dbName, collectionName, documentId, query, page, hint }) => {
      if (documentId) {
        return crudController.getDocumentsById({ query: { dbName, collectionName, documentId } });
      }
      if (query) {
        return crudController.getDocumentsByQuery({
          query: { dbName, collectionName, page: page || 1 },
          body: { query },
        });
      }
      return crudController.getAllDocuments({ query: { dbName, collectionName, page: page || 1 } });
    }),
  );

  server.registerTool(
    'axiodb_update_document',
    {
      description: 'Update a document by documentId, or by a filter query (set `many: true` to update all matches, otherwise only the first match is updated).',
      inputSchema: {
        ...sessionIdField,
        dbName: z.string().min(1),
        collectionName: z.string().min(1),
        documentId: z.string().optional(),
        query: z.record(z.string(), z.any()).optional(),
        update: z.record(z.string(), z.any()),
        many: z.boolean().optional(),
      },
      annotations: DESTRUCTIVE,
    },
    withAuth(
      PERMISSIONS.DOCUMENT_UPDATE,
      withConfirmation(
        server,
        ({ dbName, collectionName, documentId, query, update, many }) =>
          `Overwrite ${describeTarget(documentId, query, many)} in "${dbName}.${collectionName}" with ${preview(update)}? The previous field values are not recoverable.`,
        ({ dbName, collectionName, documentId, query, update, many }) => {
          if (documentId) {
            return crudController.updateDocumentById({
              query: { dbName, collectionName, documentId },
              body: update,
            });
          }
          return crudController.updateDocumentByQuery({
            query: { dbName, collectionName, isMany: !!many },
            body: { query: query || {}, update },
          });
        },
      ),
    ),
  );

  server.registerTool(
    'axiodb_delete_document',
    {
      description: 'Delete a document by documentId, or by a filter query (set `many: true` to delete all matches, otherwise only the first match is deleted).',
      inputSchema: {
        ...sessionIdField,
        dbName: z.string().min(1),
        collectionName: z.string().min(1),
        documentId: z.string().optional(),
        query: z.record(z.string(), z.any()).optional(),
        many: z.boolean().optional(),
      },
      annotations: DESTRUCTIVE,
    },
    withAuth(
      PERMISSIONS.DOCUMENT_DELETE,
      withConfirmation(
        server,
        ({ dbName, collectionName, documentId, query, many }) =>
          `Delete ${describeTarget(documentId, query, many)} from "${dbName}.${collectionName}"? This cannot be undone.`,
        ({ dbName, collectionName, documentId, query, many }) => {
          if (documentId) {
            return crudController.deleteDocumentById({ query: { dbName, collectionName, documentId } });
          }
          return crudController.deleteDocumentByQuery({
            query: { dbName, collectionName, isMany: !!many },
            body: { query: query || {} },
          });
        },
      ),
    ),
  );

  server.registerTool(
    'axiodb_total_documents',
    {
      description: 'Get the total document count in a collection.',
      inputSchema: { ...sessionIdField, dbName: z.string().min(1), collectionName: z.string().min(1) },
      annotations: { ...ADDITIVE, idempotentHint: true },
    },
    withAuth(PERMISSIONS.DOCUMENT_VIEW, async ({ dbName, collectionName }) => {
      const databaseInstance = await axioDBInstance.createDB(dbName);
      const collection = await databaseInstance.createCollection(collectionName);
      const result = await collection.totalDocuments();
      return { statusCode: 200, message: 'OK', data: result.data };
    }),
  );

  server.registerTool(
    'axiodb_find_documents_by_ids',
    {
      description: 'Retrieve multiple documents from a collection by their IDs in a single call.',
      inputSchema: {
        ...sessionIdField,
        dbName: z.string().min(1),
        collectionName: z.string().min(1),
        ids: z.array(z.string()).min(1),
      },
      annotations: READ_ONLY,
    },
    withAuth(PERMISSIONS.DOCUMENT_VIEW, ({ dbName, collectionName, ids }) =>
      crudController.getDocumentsByIds({ query: { dbName, collectionName }, body: { ids } }),
    ),
  );

  server.registerTool(
    'axiodb_aggregate',
    {
      description: 'Run a MongoDB-style aggregation pipeline with 60+ stages ($match, $group, $sort, $project, $lookup for cross-collection joins, $facet, $bucket, $count, $sample, etc.), full expression evaluator, and custom operator support.',
      inputSchema: {
        ...sessionIdField,
        dbName: z.string().min(1),
        collectionName: z.string().min(1),
        aggregation: z.array(z.record(z.string(), z.any())).min(1),
      },
      annotations: READ_ONLY,
    },
    withAuth(PERMISSIONS.DOCUMENT_AGGREGATE, ({ dbName, collectionName, aggregation }) =>
      crudController.runAggregation({ query: { dbName, collectionName }, body: { aggregation } }),
    ),
  );
};
