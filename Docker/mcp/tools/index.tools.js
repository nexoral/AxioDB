'use strict';

const { z } = require('zod');
const IndexController = require('../../lib/server/controller/Index/Index.controller').default;
const { PERMISSIONS } = require('../../lib/config/Keys/Permissions');
const { sessionIdField, withAuth } = require('../shared.helpers');

module.exports = function registerIndexTools(server, axioDBInstance) {
  const indexController = new IndexController(axioDBInstance);

  server.registerTool(
    'axiodb_create_index',
    {
      description: 'Create an index on one or more fields of a collection.',
      inputSchema: {
        ...sessionIdField,
        dbName: z.string().min(1),
        collectionName: z.string().min(1),
        fieldNames: z.array(z.string()).min(1),
      },
    },
    withAuth(PERMISSIONS.INDEX_CREATE, ({ dbName, collectionName, fieldNames }) =>
      indexController.createIndex({ body: { dbName, collectionName, fieldNames } }),
    ),
  );

  server.registerTool(
    'axiodb_drop_index',
    {
      description: 'Delete an index from a collection.',
      inputSchema: {
        ...sessionIdField,
        dbName: z.string().min(1),
        collectionName: z.string().min(1),
        indexName: z.string().min(1),
      },
    },
    withAuth(PERMISSIONS.INDEX_DELETE, ({ dbName, collectionName, indexName }) =>
      indexController.deleteIndex({ query: { dbName, collectionName, indexName } }),
    ),
  );

  server.registerTool(
    'axiodb_list_indexes',
    {
      description: 'List the indexes defined on a collection.',
      inputSchema: { ...sessionIdField, dbName: z.string().min(1), collectionName: z.string().min(1) },
    },
    withAuth(PERMISSIONS.INDEX_VIEW, ({ dbName, collectionName }) =>
      indexController.getIndexes({ query: { dbName, collectionName } }),
    ),
  );
};
