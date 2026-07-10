import { FastifyReply, FastifyRequest } from "fastify";
import { StatusCodes } from "../../config/Keys/StatusCode";
import buildResponse from "../helper/responseBuilder.helper";
import PermissionChecker from "../../Services/Auth/PermissionChecker.helper";

/**
 * Factory for a `preHandler` that checks the authenticated caller's role against
 * a required permission key. Must run after `requireAuth` in the `preHandler` chain.
 */
export function requirePermission(permissionKey: string) {
  return async function permissionGuard(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const role = request.authUser?.role;
    if (!role || !PermissionChecker.roleHasPermission(role, permissionKey)) {
      reply
        .code(StatusCodes.FORBIDDEN)
        .send(buildResponse(StatusCodes.FORBIDDEN, "Insufficient permissions for this operation"));
    }
  };
}
