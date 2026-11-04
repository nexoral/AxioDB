import SessionStore from "../../Services/Auth/SessionStore.service";
import { SessionRecord } from "../../config/Interfaces/Auth/auth.interface";
import PermissionChecker from "../../Services/Auth/PermissionChecker.helper";
import { McpToolResult } from "./McpKeys";

export function formatToolResponse(payload: unknown, statusCode = 200, durationMs?: number): McpToolResult {
  let finalPayload = payload;
  const executionData =
    durationMs !== undefined
      ? {
          executionTime: `${durationMs.toFixed(2)}ms`,
          executionTimeMs: Math.round(durationMs * 100) / 100,
        }
      : {};

  if (typeof payload === "object" && payload !== null && !Array.isArray(payload)) {
    finalPayload = {
      ...(payload as Record<string, unknown>),
      ...executionData,
    };
  } else if (durationMs !== undefined) {
    finalPayload = {
      result: payload,
      ...executionData,
    };
  }

  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(finalPayload, null, 2),
      },
    ],
    isError: statusCode >= 400,
  };
}

export function errorResult(statusCode: number, message: string, durationMs?: number): McpToolResult {
  return formatToolResponse({ statusCode, message }, statusCode, durationMs);
}

export function resolveSession(sessionId: string): SessionRecord | null {
  const session = SessionStore.getSession(sessionId);
  if (session) {
    SessionStore.touchSession(session.sid);
  }
  return session;
}

export type ToolHandler = (
  args: Record<string, unknown>,
  session?: SessionRecord,
) => Promise<unknown> | unknown;

export function withAuth(
  permissionKey: string | null,
  handler: ToolHandler,
): (args: Record<string, unknown>) => Promise<McpToolResult> {
  return async (args: Record<string, unknown>): Promise<McpToolResult> => {
    const startTime = performance.now();
    try {
      if (permissionKey === null) {
        const res = await handler(args);
        const durationMs = performance.now() - startTime;
        return formatToolResponse(res, 200, durationMs);
      }

      const sessionId = typeof args?.sessionId === "string" ? args.sessionId.trim() : "";
      if (!sessionId) {
        const durationMs = performance.now() - startTime;
        return errorResult(
          401,
          "Authentication required. Please call 'axiodb_login' first with your username and password to obtain a sessionId, then include 'sessionId' in subsequent tool calls.",
          durationMs,
        );
      }

      const session = resolveSession(sessionId);
      if (!session) {
        const durationMs = performance.now() - startTime;
        return errorResult(
          401,
          "Invalid or expired session. Please call 'axiodb_login' to log in again.",
          durationMs,
        );
      }

      if (permissionKey === "auth:change-password") {
        const res = await handler(args, session);
        const durationMs = performance.now() - startTime;
        return formatToolResponse(res, 200, durationMs);
      }

      if (session.mustChangePassword) {
        const durationMs = performance.now() - startTime;
        return errorResult(
          403,
          "Password change required before performing this operation. Please call 'axiodb_change_own_password' first.",
          durationMs,
        );
      }

      if (permissionKey && !PermissionChecker.roleHasPermission(session.role, permissionKey)) {
        const durationMs = performance.now() - startTime;
        return errorResult(
          403,
          `Forbidden: role '${session.role}' lacks required permission '${permissionKey}'.`,
          durationMs,
        );
      }

      const res = await handler(args, session);
      const durationMs = performance.now() - startTime;
      return formatToolResponse(res, 200, durationMs);
    } catch (error) {
      const durationMs = performance.now() - startTime;
      const msg = error instanceof Error ? error.message : String(error);
      return errorResult(500, msg, durationMs);
    }
  };
}
