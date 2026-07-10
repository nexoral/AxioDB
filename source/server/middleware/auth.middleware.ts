import { FastifyReply, FastifyRequest } from "fastify";
import { StatusCodes } from "../../config/Keys/StatusCode";
import buildResponse from "../helper/responseBuilder.helper";
import CookieCodec from "../../Services/Auth/CookieCodec.helper";
import SessionStore from "../../Services/Auth/SessionStore.service";
import { SESSION_COOKIE_NAME } from "../../config/Keys/Permissions";

/**
 * Validates the session cookie against the in-memory SessionStore and decorates
 * `request.authUser`. Must run before `requireFreshPassword`/`requirePermission`
 * in a route's `preHandler` array.
 */
export async function requireAuth(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const rawCookie = request.cookies[SESSION_COOKIE_NAME];
  const payload = rawCookie ? CookieCodec.decode(rawCookie) : null;
  const session = payload ? SessionStore.getSession(payload.sid) : null;

  if (!session) {
    reply
      .code(StatusCodes.UNAUTHORIZED)
      .send(buildResponse(StatusCodes.UNAUTHORIZED, "Session invalid or expired"));
    return;
  }

  SessionStore.touchSession(session.sid);
  request.authUser = {
    username: session.username,
    role: session.role,
    mustChangePassword: session.mustChangePassword,
  };
}

/**
 * Blocks access to any gated route while the caller still has a forced password
 * change pending. `GET /auth/me`, `PATCH /auth/change-password`, and `POST /auth/logout`
 * are intentionally not gated by this so a user can still see their own state and
 * complete the change.
 */
export async function requireFreshPassword(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  if (request.authUser?.mustChangePassword) {
    reply
      .code(StatusCodes.FORBIDDEN)
      .send(
        buildResponse(StatusCodes.FORBIDDEN, "Password change required before continuing", {
          mustChangePassword: true,
        }),
      );
  }
}
