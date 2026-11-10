import { AxioHttpRequest, AxioHttpResponse } from "../../../Helper/http/HttpTypes";
import { StatusCodes } from "../../../config/Keys/StatusCode";
import buildResponse, { ResponseBuilder, sendResponse } from "../../helper/responseBuilder.helper";
import AuthService from "../../../Services/Auth/AuthService.service";
import {
  CreateUserRequestBody,
  ResetPasswordRequestBody,
  UpdateUserRoleRequestBody,
} from "../../../config/Interfaces/Auth/auth.interface";

const MIN_PASSWORD_LENGTH = 8;

export default class UserManagementController {
  private readonly authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  public async listUsers(request: AxioHttpRequest, reply: AxioHttpResponse): Promise<ResponseBuilder> {
    const users = await this.authService.listUsers();
    return sendResponse(reply, buildResponse(StatusCodes.OK, "List of Users", users));
  }

  public async createUser(request: AxioHttpRequest, reply: AxioHttpResponse): Promise<ResponseBuilder> {
    const { username, password, role } = (request.body as CreateUserRequestBody | undefined) ?? {};

    if (!username || typeof username !== "string" || username.trim() === "") {
      return sendResponse(reply, buildResponse(StatusCodes.BAD_REQUEST, "Username is required"));
    }
    if (!password || typeof password !== "string" || password.length < MIN_PASSWORD_LENGTH) {
      return sendResponse(
        reply,
        buildResponse(
          StatusCodes.BAD_REQUEST,
          `Password must be at least ${MIN_PASSWORD_LENGTH} characters`,
        ),
      );
    }
    if (!role || typeof role !== "string") {
      return sendResponse(reply, buildResponse(StatusCodes.BAD_REQUEST, "Role is required"));
    }

    const actorUsername = request.authUser?.username;
    const result = await this.authService.createUser(username.trim(), password, role, actorUsername);
    if (!result.success) {
      const statusCode = result.conflict ? StatusCodes.CONFLICT : StatusCodes.BAD_REQUEST;
      return sendResponse(reply, buildResponse(statusCode, result.message));
    }
    return sendResponse(
      reply,
      buildResponse(StatusCodes.CREATED, result.message, { username, role }),
    );
  }

  public async resetUserPassword(
    request: AxioHttpRequest,
    reply: AxioHttpResponse,
  ): Promise<ResponseBuilder> {
    const { username } = (request.params as { username?: string } | undefined) ?? {};
    if (!username || typeof username !== "string" || username.trim().length === 0) {
      return sendResponse(reply, buildResponse(StatusCodes.BAD_REQUEST, "Username is required"));
    }

    const { newPassword } = (request.body as ResetPasswordRequestBody | undefined) ?? {};

    if (!newPassword || typeof newPassword !== "string" || newPassword.length < MIN_PASSWORD_LENGTH) {
      return sendResponse(
        reply,
        buildResponse(
          StatusCodes.BAD_REQUEST,
          `New password must be at least ${MIN_PASSWORD_LENGTH} characters`,
        ),
      );
    }

    const actorUsername = request.authUser?.username;
    if (!actorUsername) {
      return sendResponse(
        reply,
        buildResponse(StatusCodes.UNAUTHORIZED, "Session invalid or expired"),
      );
    }

    const result = await this.authService.resetUserPassword(username.trim(), newPassword, actorUsername);
    if (!result.success) {
      return sendResponse(reply, buildResponse(StatusCodes.BAD_REQUEST, result.message));
    }
    return sendResponse(reply, buildResponse(StatusCodes.OK, result.message));
  }

  public async updateUserRole(
    request: AxioHttpRequest,
    reply: AxioHttpResponse,
  ): Promise<ResponseBuilder> {
    const { username } = (request.params as { username?: string } | undefined) ?? {};
    if (!username || typeof username !== "string" || username.trim().length === 0) {
      return sendResponse(reply, buildResponse(StatusCodes.BAD_REQUEST, "Username is required"));
    }

    const { role } = (request.body as UpdateUserRoleRequestBody | undefined) ?? {};

    if (!role || typeof role !== "string") {
      return sendResponse(reply, buildResponse(StatusCodes.BAD_REQUEST, "Role is required"));
    }

    const actorUsername = request.authUser?.username;
    if (!actorUsername) {
      return sendResponse(
        reply,
        buildResponse(StatusCodes.UNAUTHORIZED, "Session invalid or expired"),
      );
    }

    const result = await this.authService.updateUserRole(username.trim(), role, actorUsername);
    if (!result.success) {
      return sendResponse(reply, buildResponse(StatusCodes.BAD_REQUEST, result.message));
    }
    return sendResponse(reply, buildResponse(StatusCodes.OK, result.message));
  }

  public async deleteUser(request: AxioHttpRequest, reply: AxioHttpResponse): Promise<ResponseBuilder> {
    const { username } = (request.params as { username?: string } | undefined) ?? {};
    if (!username || typeof username !== "string" || username.trim().length === 0) {
      return sendResponse(reply, buildResponse(StatusCodes.BAD_REQUEST, "Username is required"));
    }

    const actorUsername = request.authUser?.username;
    if (!actorUsername) {
      return sendResponse(
        reply,
        buildResponse(StatusCodes.UNAUTHORIZED, "Session invalid or expired"),
      );
    }

    const result = await this.authService.deleteUser(username.trim(), actorUsername);
    if (!result.success) {
      return sendResponse(reply, buildResponse(StatusCodes.BAD_REQUEST, result.message));
    }
    return sendResponse(reply, buildResponse(StatusCodes.OK, result.message));
  }
}
