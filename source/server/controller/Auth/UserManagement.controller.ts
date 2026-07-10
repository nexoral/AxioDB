import { FastifyReply, FastifyRequest } from "fastify";
import { StatusCodes } from "../../../config/Keys/StatusCode";
import buildResponse, { ResponseBuilder, sendResponse } from "../../helper/responseBuilder.helper";
import AuthService from "../../../Services/Auth/AuthService.service";
import {
  CreateUserRequestBody,
  ResetPasswordRequestBody,
  UpdateUserRoleRequestBody,
} from "../../../config/Interfaces/Auth/auth.interface";

const MIN_PASSWORD_LENGTH = 4;

export default class UserManagementController {
  private readonly authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  public async listUsers(request: FastifyRequest, reply: FastifyReply): Promise<ResponseBuilder> {
    const users = await this.authService.listUsers();
    return sendResponse(reply, buildResponse(StatusCodes.OK, "List of Users", users));
  }

  public async createUser(request: FastifyRequest, reply: FastifyReply): Promise<ResponseBuilder> {
    const { username, password, role } = request.body as CreateUserRequestBody;

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

    const result = await this.authService.createUser(username, password, role);
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
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<ResponseBuilder> {
    const { username } = request.params as { username: string };
    const { newPassword } = request.body as ResetPasswordRequestBody;

    if (!newPassword || typeof newPassword !== "string" || newPassword.length < MIN_PASSWORD_LENGTH) {
      return sendResponse(
        reply,
        buildResponse(
          StatusCodes.BAD_REQUEST,
          `New password must be at least ${MIN_PASSWORD_LENGTH} characters`,
        ),
      );
    }

    const result = await this.authService.resetUserPassword(username, newPassword);
    if (!result.success) {
      return sendResponse(reply, buildResponse(StatusCodes.BAD_REQUEST, result.message));
    }
    return sendResponse(reply, buildResponse(StatusCodes.OK, result.message));
  }

  public async updateUserRole(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<ResponseBuilder> {
    const { username } = request.params as { username: string };
    const { role } = request.body as UpdateUserRoleRequestBody;

    if (!role || typeof role !== "string") {
      return sendResponse(reply, buildResponse(StatusCodes.BAD_REQUEST, "Role is required"));
    }

    const result = await this.authService.updateUserRole(username, role);
    if (!result.success) {
      return sendResponse(reply, buildResponse(StatusCodes.BAD_REQUEST, result.message));
    }
    return sendResponse(reply, buildResponse(StatusCodes.OK, result.message));
  }

  public async deleteUser(request: FastifyRequest, reply: FastifyReply): Promise<ResponseBuilder> {
    const { username } = request.params as { username: string };

    const result = await this.authService.deleteUser(username);
    if (!result.success) {
      return sendResponse(reply, buildResponse(StatusCodes.BAD_REQUEST, result.message));
    }
    return sendResponse(reply, buildResponse(StatusCodes.OK, result.message));
  }
}
