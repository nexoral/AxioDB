'use strict';

const { z } = require('zod');
const CollectionController = require('../../lib/server/controller/Collections/Collection.controller').default;
const { PERMISSIONS } = require('../../lib/config/Keys/Permissions');
const { sessionIdField, withAuth } = require('../shared.helpers');

module.exports = function registerCollectionTools(server, axioDBInstance) {
  const collectionController = new CollectionController(axioDBInstance);

  server.registerTool(
    'axiodb_create_collection',
    {
      description: 'Create a new collection inside a database, optionally with AES-256 encryption.',
      inputSchema: {
        ...sessionIdField,
        dbName: z.string().min(1),
        collectionName: z.string().min(1),
        crypto: z.boolean().optional(),
        key: z.string().optional(),
      },
    },
    withAuth(PERMISSIONS.COLLECTION_CREATE, ({ dbName, collectionName, crypto, key }) =>
      collectionController.createCollection({ body: { dbName, collectionName, crypto, key } }),
    ),
  );

  server.registerTool(
    'axiodb_delete_collection',
    {
      description: 'Delete a collection from a database.',
      inputSchema: { ...sessionIdField, dbName: z.string().min(1), collectionName: z.string().min(1) },
    },
    withAuth(PERMISSIONS.COLLECTION_DELETE, ({ dbName, collectionName }) =>
      collectionController.deleteCollection({ query: { dbName, collectionName } }),
    ),
  );

  server.registerTool(
    'axiodb_collection_exists',
    {
      description: 'Check whether a collection exists inside a database.',
      inputSchema: { ...sessionIdField, dbName: z.string().min(1), collectionName: z.string().min(1) },
    },
    withAuth(PERMISSIONS.COLLECTION_VIEW, async ({ dbName, collectionName }) => {
      const databaseInstance = await axioDBInstance.createDB(dbName);
      const exists = await databaseInstance.isCollectionExists(collectionName);
      return { statusCode: 200, message: 'OK', data: { dbName, collectionName, exists } };
    }),
  );

  server.registerTool(
    'axiodb_get_collection_info',
    {
      description: 'Get the list of collections in a database, with per-collection file counts.',
      inputSchema: { ...sessionIdField, databaseName: z.string().min(1) },
    },
    withAuth(PERMISSIONS.COLLECTION_VIEW, ({ databaseName }) =>
      collectionController.getCollections({ query: { databaseName } }),
    ),
  );
};
