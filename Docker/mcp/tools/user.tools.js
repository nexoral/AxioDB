'use strict';

const { z } = require('zod');
const UserManagementController = require('../../lib/server/controller/Auth/UserManagement.controller').default;
const { PERMISSIONS } = require('../../lib/config/Keys/Permissions');
const { sessionIdField, NOOP_REPLY, withAuth } = require('../shared.helpers');
const { withConfirmation, READ_ONLY, ADDITIVE, DESTRUCTIVE } = require('../confirmation.helper');

module.exports = function registerUserTools(server) {
  server.registerTool(
    'axiodb_list_users',
    {
      description: '[Super Admin] List all RBAC users.',
      inputSchema: { ...sessionIdField },
      annotations: READ_ONLY,
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
      annotations: ADDITIVE,
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
      annotations: DESTRUCTIVE,
    },
    withAuth(
      PERMISSIONS.USER_UPDATE_ROLE,
      withConfirmation(
        server,
        ({ username, role }) => `Change user "${username}" to role "${role}"? This changes what that account is allowed to do across the GUI, TCP and MCP surfaces.`,
        ({ username, role }) =>
          new UserManagementController().updateUserRole(
            { params: { username }, body: { role } },
            NOOP_REPLY,
          ),
      ),
    ),
  );

  server.registerTool(
    'axiodb_reset_user_password',
    {
      description: "[Super Admin] Reset a user's password (forces them to change it on next login).",
      inputSchema: { ...sessionIdField, username: z.string().min(1), newPassword: z.string().min(4) },
      annotations: DESTRUCTIVE,
    },
    withAuth(
      PERMISSIONS.USER_RESET_PASSWORD,
      withConfirmation(
        server,
        ({ username }) => `Reset the password for user "${username}"? Their current password stops working immediately and all of their sessions are revoked.`,
        ({ username, newPassword }) =>
          new UserManagementController().resetUserPassword(
            { params: { username }, body: { newPassword } },
            NOOP_REPLY,
          ),
      ),
    ),
  );

  server.registerTool(
    'axiodb_delete_user',
    {
      description: '[Super Admin] Delete a user.',
      inputSchema: { ...sessionIdField, username: z.string().min(1) },
      annotations: { ...DESTRUCTIVE, idempotentHint: true },
    },
    withAuth(
      PERMISSIONS.USER_DELETE,
      withConfirmation(
        server,
        ({ username }) => `Delete the user "${username}"? The account and its sessions are permanently removed.`,
        ({ username }) => new UserManagementController().deleteUser({ params: { username } }, NOOP_REPLY),
      ),
    ),
  );
};
