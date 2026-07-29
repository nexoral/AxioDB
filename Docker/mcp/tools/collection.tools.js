'use strict';

const { z } = require('zod');
const CollectionController = require('../../lib/server/controller/Collections/Collection.controller').default;
const { PERMISSIONS } = require('../../lib/config/Keys/Permissions');
const { sessionIdField, withAuth } = require('../shared.helpers');
const { withConfirmation, READ_ONLY, ADDITIVE, DESTRUCTIVE } = require('../confirmation.helper');

module.exports = function registerCollectionTools(server, axioDBInstance) {
  const collectionController = new CollectionController(axioDBInstance);

  server.registerTool(
    'axiodb_create_collection',
    {
      description: 'Create a new collection inside a database.',
      inputSchema: {
        ...sessionIdField,
        dbName: z.string().min(1),
        collectionName: z.string().min(1),
      },
      annotations: { ...ADDITIVE, idempotentHint: true },
    },
    withAuth(PERMISSIONS.COLLECTION_CREATE, ({ dbName, collectionName }) =>
      collectionController.createCollection({ body: { dbName, collectionName } }),
    ),
  );

  server.registerTool(
    'axiodb_delete_collection',
    {
      description: 'Delete a collection from a database.',
      inputSchema: { ...sessionIdField, dbName: z.string().min(1), collectionName: z.string().min(1) },
      annotations: { ...DESTRUCTIVE, idempotentHint: true },
    },
    withAuth(
      PERMISSIONS.COLLECTION_DELETE,
      withConfirmation(
        server,
        ({ dbName, collectionName }) => `Delete the collection "${collectionName}" from database "${dbName}"? Every document and index inside it is permanently removed. This cannot be undone.`,
        ({ dbName, collectionName }) => collectionController.deleteCollection({ query: { dbName, collectionName } }),
      ),
    ),
  );

  server.registerTool(
    'axiodb_collection_exists',
    {
      description: 'Check whether a collection exists inside a database.',
      inputSchema: { ...sessionIdField, dbName: z.string().min(1), collectionName: z.string().min(1) },
      // Not readOnly: createDB() creates the database directory if it is missing, so probing a
      // collection in an unknown database leaves an empty database behind.
      annotations: { ...ADDITIVE, idempotentHint: true },
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
      annotations: READ_ONLY,
    },
    withAuth(PERMISSIONS.COLLECTION_VIEW, ({ databaseName }) =>
      collectionController.getCollections({ query: { databaseName } }),
    ),
  );
};
