import { AxioHttpRequest, AxioHttpResponse } from "../../Helper/http/HttpTypes";
import { StatusCodes } from "../../config/Keys/StatusCode";
import buildResponse from "../helper/responseBuilder.helper";
import PermissionChecker from "../../Services/Auth/PermissionChecker.helper";

export function requirePermission(permissionKey: string) {
  return async function permissionGuard(request: AxioHttpRequest, reply: AxioHttpResponse): Promise<void> {
    const role = request.authUser?.role;
    if (!role || !PermissionChecker.roleHasPermission(role, permissionKey)) {
      reply
        .code(StatusCodes.FORBIDDEN)
        .send(buildResponse(StatusCodes.FORBIDDEN, "Insufficient permissions for this operation"));
    }
  };
}
