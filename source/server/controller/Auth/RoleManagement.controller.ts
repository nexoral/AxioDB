import { FastifyReply, FastifyRequest } from "fastify";
import { StatusCodes } from "../../../config/Keys/StatusCode";
import buildResponse, { ResponseBuilder, sendResponse } from "../../helper/responseBuilder.helper";
import AuthService from "../../../Services/Auth/AuthService.service";
import { CreateRoleRequestBody } from "../../../config/Interfaces/Auth/auth.interface";
import { PERMISSION_CATALOGUE } from "../../../config/Keys/Permissions";

export default class RoleManagementController {
  private readonly authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  public async listRoles(request: FastifyRequest, reply: FastifyReply): Promise<ResponseBuilder> {
    const roles = await this.authService.listRoles();
    return sendResponse(reply, buildResponse(StatusCodes.OK, "List of Roles", roles));
  }

  public async createRole(request: FastifyRequest, reply: FastifyReply): Promise<ResponseBuilder> {
    const { roleName, permissions } = request.body as CreateRoleRequestBody;

    if (!roleName || typeof roleName !== "string" || roleName.trim() === "") {
      return sendResponse(reply, buildResponse(StatusCodes.BAD_REQUEST, "Role name is required"));
    }
    if (!Array.isArray(permissions) || permissions.length === 0) {
      return sendResponse(
        reply,
        buildResponse(StatusCodes.BAD_REQUEST, "At least one permission is required"),
      );
    }
    if (!permissions.every((key) => typeof key === "string")) {
      return sendResponse(
        reply,
        buildResponse(StatusCodes.BAD_REQUEST, "Permissions must be an array of strings"),
      );
    }

    const result = await this.authService.createRole(roleName, permissions);
    if (!result.success) {
      const statusCode = result.conflict ? StatusCodes.CONFLICT : StatusCodes.BAD_REQUEST;
      return sendResponse(reply, buildResponse(statusCode, result.message));
    }
    return sendResponse(
      reply,
      buildResponse(StatusCodes.CREATED, result.message, { roleName, permissions }),
    );
  }

  public async listPermissions(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<ResponseBuilder> {
    return sendResponse(
      reply,
      buildResponse(StatusCodes.OK, "Permission catalogue", PERMISSION_CATALOGUE),
    );
  }
}
