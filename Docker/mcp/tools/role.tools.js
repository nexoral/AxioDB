'use strict';

const { z } = require('zod');
const RoleManagementController = require('../../lib/server/controller/Auth/RoleManagement.controller').default;
const { PERMISSIONS } = require('../../lib/config/Keys/Permissions');
const { sessionIdField, NOOP_REPLY, withAuth } = require('../shared.helpers');

module.exports = function registerRoleTools(server) {
  server.registerTool(
    'axiodb_list_roles',
    {
      description: '[Super Admin] List all roles and their permissions.',
      inputSchema: { ...sessionIdField },
    },
    withAuth(PERMISSIONS.ROLE_VIEW, () =>
      new RoleManagementController().listRoles({}, NOOP_REPLY),
    ),
  );

  server.registerTool(
    'axiodb_create_role',
    {
      description: '[Super Admin] Create a new role from the predefined permission catalogue.',
      inputSchema: {
        ...sessionIdField,
        roleName: z.string().min(1),
        permissions: z.array(z.string()).min(1),
      },
    },
    withAuth(PERMISSIONS.ROLE_CREATE, ({ roleName, permissions }) =>
      new RoleManagementController().createRole(
        { body: { roleName, permissions } },
        NOOP_REPLY,
      ),
    ),
  );

  server.registerTool(
    'axiodb_delete_role',
    {
      description: '[Super Admin] Delete a custom role. Predefined system roles (Super Admin, Admin, View) and roles still assigned to a user cannot be deleted.',
      inputSchema: { ...sessionIdField, roleName: z.string().min(1) },
    },
    withAuth(PERMISSIONS.ROLE_DELETE, ({ roleName }) =>
      new RoleManagementController().deleteRole({ params: { roleName } }, NOOP_REPLY),
    ),
  );

  server.registerTool(
    'axiodb_list_permissions',
    {
      description: '[Super Admin] List the full permission catalogue available for custom roles.',
      inputSchema: { ...sessionIdField },
    },
    withAuth(PERMISSIONS.ROLE_VIEW, () =>
      new RoleManagementController().listPermissions({}, NOOP_REPLY),
    ),
  );
};
