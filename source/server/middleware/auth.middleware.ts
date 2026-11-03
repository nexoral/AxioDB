import { AxioHttpRequest, AxioHttpResponse } from "../../Helper/http/HttpTypes";
import { StatusCodes } from "../../config/Keys/StatusCode";
import buildResponse from "../helper/responseBuilder.helper";
import CookieCodec from "../../Services/Auth/CookieCodec.helper";
import SessionStore from "../../Services/Auth/SessionStore.service";
import { SESSION_COOKIE_NAME } from "../../config/Keys/Permissions";

export async function requireAuth(request: AxioHttpRequest, reply: AxioHttpResponse): Promise<void> {
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

export async function requireFreshPassword(request: AxioHttpRequest, reply: AxioHttpResponse): Promise<void> {
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
