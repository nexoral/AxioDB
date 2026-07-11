'use strict';

const { z } = require('zod');
const UserManagementController = require('../../lib/server/controller/Auth/UserManagement.controller').default;
const { PERMISSIONS } = require('../../lib/config/Keys/Permissions');
const { sessionIdField, NOOP_REPLY, withAuth } = require('../shared.helpers');

module.exports = function registerUserTools(server) {
  server.registerTool(
    'axiodb_list_users',
    {
      description: '[Super Admin] List all RBAC users.',
      inputSchema: { ...sessionIdField },
    },
    withAuth(PERMISSIONS.USER_VIEW, () =>
      new UserManagementController().listUsers({}, NOOP_REPLY),
    ),
  );

  server.registerTool(
    'axiodb_create_user',
    {
      description: '[Super Admin] Create a new RBAC user with a given role.',
      inputSchema: {
        ...sessionIdField,
        username: z.string().min(1),
        password: z.string().min(4),
        role: z.string().min(1),
      },
    },
    withAuth(PERMISSIONS.USER_CREATE, ({ username, password, role }) =>
      new UserManagementController().createUser(
        { body: { username, password, role } },
        NOOP_REPLY,
      ),
    ),
  );

  server.registerTool(
    'axiodb_update_user_role',
    {
      description: "[Super Admin] Change a user's assigned role.",
      inputSchema: { ...sessionIdField, username: z.string().min(1), role: z.string().min(1) },
    },
    withAuth(PERMISSIONS.USER_UPDATE_ROLE, ({ username, role }) =>
      new UserManagementController().updateUserRole(
        { params: { username }, body: { role } },
        NOOP_REPLY,
      ),
    ),
  );

  server.registerTool(
    'axiodb_reset_user_password',
    {
      description: "[Super Admin] Reset a user's password (forces them to change it on next login).",
      inputSchema: { ...sessionIdField, username: z.string().min(1), newPassword: z.string().min(4) },
    },
    withAuth(PERMISSIONS.USER_RESET_PASSWORD, ({ username, newPassword }) =>
      new UserManagementController().resetUserPassword(
        { params: { username }, body: { newPassword } },
        NOOP_REPLY,
      ),
    ),
  );

  server.registerTool(
    'axiodb_delete_user',
    {
      description: '[Super Admin] Delete a user.',
      inputSchema: { ...sessionIdField, username: z.string().min(1) },
    },
    withAuth(PERMISSIONS.USER_DELETE, ({ username }) =>
      new UserManagementController().deleteUser({ params: { username } }, NOOP_REPLY),
    ),
  );
};
