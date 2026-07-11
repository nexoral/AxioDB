'use strict';

const { z } = require('zod');
const CRUDController = require('../../lib/server/controller/Operation/CRUD.controller').default;
const { PERMISSIONS } = require('../../lib/config/Keys/Permissions');
const { sessionIdField, withAuth } = require('../shared.helpers');

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
      },
    },
    withAuth(PERMISSIONS.DOCUMENT_QUERY, ({ dbName, collectionName, documentId, query, page }) => {
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
    },
    withAuth(PERMISSIONS.DOCUMENT_UPDATE, ({ dbName, collectionName, documentId, query, update, many }) => {
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
    }),
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
    },
    withAuth(PERMISSIONS.DOCUMENT_DELETE, ({ dbName, collectionName, documentId, query, many }) => {
      if (documentId) {
        return crudController.deleteDocumentById({ query: { dbName, collectionName, documentId } });
      }
      return crudController.deleteDocumentByQuery({
        query: { dbName, collectionName, isMany: !!many },
        body: { query: query || {} },
      });
    }),
  );

  server.registerTool(
    'axiodb_total_documents',
    {
      description: 'Get the total document count in a collection.',
      inputSchema: { ...sessionIdField, dbName: z.string().min(1), collectionName: z.string().min(1) },
    },
    withAuth(PERMISSIONS.DOCUMENT_VIEW, async ({ dbName, collectionName }) => {
      const databaseInstance = await axioDBInstance.createDB(dbName);
      const collection = await databaseInstance.createCollection(collectionName);
      const result = await collection.totalDocuments();
      return { statusCode: 200, message: 'OK', data: result.data };
    }),
  );

  server.registerTool(
    'axiodb_aggregate',
    {
      description: 'Run a MongoDB-style aggregation pipeline ($match, $group, $sort, etc.) against a collection.',
      inputSchema: {
        ...sessionIdField,
        dbName: z.string().min(1),
        collectionName: z.string().min(1),
        aggregation: z.array(z.record(z.string(), z.any())).min(1),
      },
    },
    withAuth(PERMISSIONS.DOCUMENT_AGGREGATE, ({ dbName, collectionName, aggregation }) =>
      crudController.runAggregation({ query: { dbName, collectionName }, body: { aggregation } }),
    ),
  );
};
