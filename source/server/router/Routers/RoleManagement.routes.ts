import { FastifyInstance } from "fastify";
import RoleManagementController from "../../controller/Auth/RoleManagement.controller";
import { requireAuth, requireFreshPassword } from "../../middleware/auth.middleware";
import { requirePermission } from "../../middleware/permission.middleware";
import { PERMISSIONS } from "../../../config/Keys/Permissions";

// Role Management Router - Super Admin only (gated by role:* permissions).
export default async function roleManagementRouter(fastify: FastifyInstance): Promise<void> {
  fastify.get(
    "/",
    { preHandler: [requireAuth, requireFreshPassword, requirePermission(PERMISSIONS.ROLE_VIEW)] },
    async (request, reply) => new RoleManagementController().listRoles(request, reply),
  );

  fastify.post(
    "/",
    { preHandler: [requireAuth, requireFreshPassword, requirePermission(PERMISSIONS.ROLE_CREATE)] },
    async (request, reply) => new RoleManagementController().createRole(request, reply),
  );

  fastify.get(
    "/permissions",
    { preHandler: [requireAuth, requireFreshPassword, requirePermission(PERMISSIONS.ROLE_VIEW)] },
    async (request, reply) => new RoleManagementController().listPermissions(request, reply),
  );

  fastify.delete(
    "/:roleName",
    { preHandler: [requireAuth, requireFreshPassword, requirePermission(PERMISSIONS.ROLE_DELETE)] },
    async (request, reply) => new RoleManagementController().deleteRole(request, reply),
  );
}
