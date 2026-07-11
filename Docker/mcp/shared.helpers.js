'use strict';

// Shared plumbing for every tool module under mcp/tools/: MCP result formatting, and the
// session/RBAC gates every tool handler passes through before touching the AxioDB instance.

const { z } = require('zod');
const SessionStore = require('../lib/Services/Auth/SessionStore.service').default;
const PermissionChecker = require('../lib/Services/Auth/PermissionChecker.helper').default;

const sessionIdField = { sessionId: z.string().min(1).describe('Session ID returned by axiodb_login') };

// sendResponse() (used by the Auth/User/Role controllers) only ever calls reply.code(...)
// and returns the response body - a real Fastify reply is never needed here.
const NOOP_REPLY = { code() {} };

function toolText(payload) {
  return { content: [{ type: 'text', text: JSON.stringify(payload, null, 2) }] };
}

function errorResult(statusCode, message) {
  return { ...toolText({ statusCode, message }), isError: true };
}

function toolResult(response) {
  const statusCode = response && typeof response.statusCode === 'number' ? response.statusCode : 200;
  return { ...toolText(response), isError: statusCode >= 400 };
}

/** Looks up and touches (extends the TTL of) a session, or returns null if it's gone/expired. */
function resolveSession(sessionId) {
  const session = SessionStore.getSession(sessionId);
  if (session) {
    SessionStore.touchSession(session.sid);
  }
  return session;
}

/** Shared error handling + response formatting for every tool handler. */
function wrapTool(fn) {
  return async (args) => {
    try {
      const response = await fn(args);
      return toolResult(response);
    } catch (error) {
      return errorResult(500, error instanceof Error ? error.message : String(error));
    }
  };
}

/**
 * Wraps a tool handler with session validation + RBAC permission checks, mirroring exactly
 * what `requireAuth` + `requirePermission` do for each HTTP route (see
 * source/server/middleware/{auth,permission}.middleware.ts). `permissionKey === null` is
 * reserved for `axiodb_login` itself, which is the permission gate.
 */
function withAuth(permissionKey, handler) {
  return wrapTool(async (args) => {
    if (permissionKey === null) {
      return handler(args);
    }
    const session = resolveSession(args.sessionId);
    if (!session) {
      return { statusCode: 401, message: 'Invalid or expired session. Call axiodb_login first.' };
    }
    if (!PermissionChecker.roleHasPermission(session.role, permissionKey)) {
      return {
        statusCode: 403,
        message: `Role "${session.role}" does not have permission "${permissionKey}"`,
      };
    }
    return handler(args, session);
  });
}

/**
 * Wraps a tool handler that only needs a valid session, not a specific permission - mirrors
 * the HTTP GUI's self-service auth routes (`/auth/logout`, `/auth/me`,
 * `/auth/change-password`), which are gated by `requireAuth` alone, no `requirePermission`.
 */
function withSession(handler) {
  return wrapTool(async (args) => {
    const session = resolveSession(args.sessionId);
    if (!session) {
      return { statusCode: 401, message: 'Invalid or expired session. Call axiodb_login first.' };
    }
    return handler(args, session);
  });
}

module.exports = { sessionIdField, NOOP_REPLY, withAuth, withSession };
