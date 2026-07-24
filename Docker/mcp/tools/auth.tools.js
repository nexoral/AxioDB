'use strict';

const { z } = require('zod');
const AuthService = require('../../lib/Services/Auth/AuthService.service').default;
const SessionStore = require('../../lib/Services/Auth/SessionStore.service').default;
const PermissionChecker = require('../../lib/Services/Auth/PermissionChecker.helper').default;
const LoginRateLimiter = require('../../lib/Services/Auth/LoginRateLimiter.service').default;
const AuthEvents = require('../../lib/Services/Auth/AuthEvents.service').default;
const { sessionIdField, withAuth, withSession } = require('../shared.helpers');

module.exports = function registerAuthTools(server) {
  const authService = new AuthService();

  server.registerTool(
    'axiodb_login',
    {
      description: 'Log in with an AxioDB username/password and obtain a sessionId required by every other tool. Default seeded account: admin/admin (forces a password change on first login, same as the web GUI).',
      inputSchema: { username: z.string().min(1), password: z.string().min(1) },
    },
    withAuth(null, async ({ username, password }) => {
      const cooldownRemaining = LoginRateLimiter.getCooldownRemaining('mcp');
      if (cooldownRemaining > 0) {
        return {
          statusCode: 429,
          message: `Too many failed login attempts. Try again in ${Math.ceil(cooldownRemaining / 1000)}s.`,
        };
      }

      const result = await authService.login(username, password);
      if (!result.success || !result.user) {
        LoginRateLimiter.recordFailure('mcp');
        return { statusCode: 401, message: result.message };
      }
      LoginRateLimiter.recordSuccess('mcp');

      const session = SessionStore.createSession(
        result.user.username,
        result.user.role,
        result.user.mustChangePassword,
      );
      return {
        statusCode: 200,
        message: 'Login successful',
        data: {
          sessionId: session.sid,
          username: result.user.username,
          role: result.user.role,
          permissions: PermissionChecker.getPermissionsForRole(result.user.role),
          mustChangePassword: result.user.mustChangePassword,
        },
      };
    }),
  );

  server.registerTool(
    'axiodb_logout',
    {
      description: 'Log out and invalidate a session. Sessions live in server memory only (24h TTL) - always call this when finished with a session to free it early rather than waiting for expiry.',
      inputSchema: { ...sessionIdField },
    },
    withSession((args, session) => {
      SessionStore.revokeSession(session.sid);
      return { statusCode: 200, message: 'Logged out successfully' };
    }),
  );

  server.registerTool(
    'axiodb_whoami',
    {
      description: 'Get the identity, role, and effective permissions of the currently logged-in session.',
      inputSchema: { ...sessionIdField },
    },
    withSession((args, session) => ({
      statusCode: 200,
      message: 'OK',
      data: {
        username: session.username,
        role: session.role,
        mustChangePassword: session.mustChangePassword,
        permissions: PermissionChecker.getPermissionsForRole(session.role),
      },
    })),
  );

  server.registerTool(
    'axiodb_change_own_password',
    {
      description: 'Change the password for the currently logged-in user. Revokes the old session and returns a new sessionId to use afterward.',
      inputSchema: {
        ...sessionIdField,
        currentPassword: z.string().min(1),
        newPassword: z.string().min(4),
      },
    },
    withSession(async ({ currentPassword, newPassword }, session) => {
      const result = await authService.changeOwnPassword(
        session.username,
        currentPassword,
        newPassword,
      );
      if (!result.success) {
        return { statusCode: 400, message: result.message };
      }

      // Rotate the session, matching AuthController.changePassword's HTTP behavior.
      SessionStore.revokeSessionsForUser(session.username);
      AuthEvents.emit('user-revoked', session.username);
      const newSession = SessionStore.createSession(session.username, session.role, false);

      return {
        statusCode: 200,
        message: 'Password changed successfully',
        data: {
          sessionId: newSession.sid,
          username: session.username,
          role: session.role,
          permissions: PermissionChecker.getPermissionsForRole(session.role),
          mustChangePassword: false,
        },
      };
    }),
  );
};