'use strict';

const { z } = require('zod');
const DatabaseController = require('../../lib/server/controller/Database/Databse.controller').default;
const { PERMISSIONS } = require('../../lib/config/Keys/Permissions');
const { sessionIdField, withAuth } = require('../shared.helpers');

module.exports = function registerDatabaseTools(server, axioDBInstance) {
  const dbController = new DatabaseController(axioDBInstance);

  server.registerTool(
    'axiodb_create_database',
    {
      description: 'Create a new AxioDB database.',
      inputSchema: { ...sessionIdField, name: z.string().min(1) },
    },
    withAuth(PERMISSIONS.DB_CREATE, ({ name }) =>
      dbController.createDatabase({ body: { name } }),
    ),
  );

  server.registerTool(
    'axiodb_delete_database',
    {
      description: 'Delete an AxioDB database.',
      inputSchema: { ...sessionIdField, dbName: z.string().min(1) },
    },
    withAuth(PERMISSIONS.DB_DELETE, ({ dbName }) =>
      dbController.deleteDatabase({ query: { dbName } }),
    ),
  );

  server.registerTool(
    'axiodb_database_exists',
    {
      description: 'Check whether a database exists.',
      inputSchema: { ...sessionIdField, name: z.string().min(1) },
    },
    withAuth(PERMISSIONS.DB_VIEW, async ({ name }) => {
      const exists = await axioDBInstance.isDatabaseExists(name);
      return { statusCode: 200, message: 'OK', data: { name, exists } };
    }),
  );

  server.registerTool(
    'axiodb_get_instance_info',
    {
      description: 'Get the list of databases and instance-level storage info.',
      inputSchema: { ...sessionIdField },
    },
    withAuth(PERMISSIONS.DB_VIEW, () => dbController.getDatabases()),
  );
};
