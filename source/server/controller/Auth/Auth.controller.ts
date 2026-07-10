import { FastifyReply, FastifyRequest } from "fastify";
import { StatusCodes } from "../../../config/Keys/StatusCode";
import buildResponse, { ResponseBuilder, sendResponse } from "../../helper/responseBuilder.helper";
import AuthService from "../../../Services/Auth/AuthService.service";
import SessionStore from "../../../Services/Auth/SessionStore.service";
import CookieCodec from "../../../Services/Auth/CookieCodec.helper";
import PermissionChecker from "../../../Services/Auth/PermissionChecker.helper";
import { SESSION_COOKIE_NAME, SESSION_TTL_MS } from "../../../config/Keys/Permissions";
import {
  ChangePasswordRequestBody,
  LoginRequestBody,
} from "../../../config/Interfaces/Auth/auth.interface";

const MIN_PASSWORD_LENGTH = 4;

export default class AuthController {
  private readonly authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  public async login(request: FastifyRequest, reply: FastifyReply): Promise<ResponseBuilder> {
    const { username, password } = request.body as LoginRequestBody;

    if (!username || typeof username !== "string") {
      return sendResponse(reply, buildResponse(StatusCodes.BAD_REQUEST, "Username is required"));
    }
    if (!password || typeof password !== "string") {
      return sendResponse(reply, buildResponse(StatusCodes.BAD_REQUEST, "Password is required"));
    }

    const result = await this.authService.login(username, password);
    if (!result.success || !result.user) {
      return sendResponse(reply, buildResponse(StatusCodes.UNAUTHORIZED, result.message));
    }

    const session = SessionStore.createSession(
      result.user.username,
      result.user.role,
      result.user.mustChangePassword,
    );
    this.setSessionCookie(reply, session.sid);

    return sendResponse(
      reply,
      buildResponse(StatusCodes.OK, "Login successful", {
        username: result.user.username,
        role: result.user.role,
        permissions: PermissionChecker.getPermissionsForRole(result.user.role),
        mustChangePassword: result.user.mustChangePassword,
      }),
    );
  }

  public async logout(request: FastifyRequest, reply: FastifyReply): Promise<ResponseBuilder> {
    const sid = this.extractSid(request);
    if (sid) {
      SessionStore.revokeSession(sid);
    }
    reply.clearCookie(SESSION_COOKIE_NAME, { path: "/" });
    return sendResponse(reply, buildResponse(StatusCodes.OK, "Logged out successfully"));
  }

  public async me(request: FastifyRequest, reply: FastifyReply): Promise<ResponseBuilder> {
    const authUser = request.authUser;
    if (!authUser) {
      return sendResponse(reply, buildResponse(StatusCodes.UNAUTHORIZED, "Not authenticated"));
    }
    return sendResponse(
      reply,
      buildResponse(StatusCodes.OK, "OK", {
        username: authUser.username,
        role: authUser.role,
        mustChangePassword: authUser.mustChangePassword,
        permissions: PermissionChecker.getPermissionsForRole(authUser.role),
      }),
    );
  }

  public async changePassword(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<ResponseBuilder> {
    const authUser = request.authUser;
    if (!authUser) {
      return sendResponse(reply, buildResponse(StatusCodes.UNAUTHORIZED, "Not authenticated"));
    }

    const { currentPassword, newPassword } = request.body as ChangePasswordRequestBody;
    if (!currentPassword || typeof currentPassword !== "string") {
      return sendResponse(
        reply,
        buildResponse(StatusCodes.BAD_REQUEST, "Current password is required"),
      );
    }
    if (!newPassword || typeof newPassword !== "string" || newPassword.length < MIN_PASSWORD_LENGTH) {
      return sendResponse(
        reply,
        buildResponse(
          StatusCodes.BAD_REQUEST,
          `New password must be at least ${MIN_PASSWORD_LENGTH} characters`,
        ),
      );
    }

    const result = await this.authService.changeOwnPassword(
      authUser.username,
      currentPassword,
      newPassword,
    );
    if (!result.success) {
      return sendResponse(reply, buildResponse(StatusCodes.BAD_REQUEST, result.message));
    }

    // Rotate the session so a still-live cookie can't keep referencing the old password state.
    SessionStore.revokeSessionsForUser(authUser.username);
    const session = SessionStore.createSession(authUser.username, authUser.role, false);
    this.setSessionCookie(reply, session.sid);

    return sendResponse(
      reply,
      buildResponse(StatusCodes.OK, "Password changed successfully", {
        username: authUser.username,
        role: authUser.role,
        permissions: PermissionChecker.getPermissionsForRole(authUser.role),
        mustChangePassword: false,
      }),
    );
  }

  private setSessionCookie(reply: FastifyReply, sid: string): void {
    const cookieValue = CookieCodec.encode({ sid, iat: Date.now() });
    reply.setCookie(SESSION_COOKIE_NAME, cookieValue, {
      httpOnly: true,
      sameSite: "lax",
      secure: "auto",
      path: "/",
      maxAge: SESSION_TTL_MS / 1000,
    });
  }

  private extractSid(request: FastifyRequest): string | null {
    const rawCookie = request.cookies[SESSION_COOKIE_NAME];
    const payload = rawCookie ? CookieCodec.decode(rawCookie) : null;
    return payload ? payload.sid : null;
  }
}
