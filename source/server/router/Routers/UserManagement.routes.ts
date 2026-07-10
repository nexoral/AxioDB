import { FastifyInstance } from "fastify";
import UserManagementController from "../../controller/Auth/UserManagement.controller";
import { requireAuth, requireFreshPassword } from "../../middleware/auth.middleware";
import { requirePermission } from "../../middleware/permission.middleware";
import { PERMISSIONS } from "../../../config/Keys/Permissions";

// User Management Router - Super Admin only (gated by user:* permissions).
export default async function userManagementRouter(fastify: FastifyInstance): Promise<void> {
  fastify.get(
    "/",
    { preHandler: [requireAuth, requireFreshPassword, requirePermission(PERMISSIONS.USER_VIEW)] },
    async (request, reply) => new UserManagementController().listUsers(request, reply),
  );

  fastify.post(
    "/",
    { preHandler: [requireAuth, requireFreshPassword, requirePermission(PERMISSIONS.USER_CREATE)] },
    async (request, reply) => new UserManagementController().createUser(request, reply),
  );

  fastify.patch(
    "/:username/role",
    {
      preHandler: [requireAuth, requireFreshPassword, requirePermission(PERMISSIONS.USER_UPDATE_ROLE)],
    },
    async (request, reply) => new UserManagementController().updateUserRole(request, reply),
  );

  fastify.patch(
    "/:username/reset-password",
    {
      preHandler: [
        requireAuth,
        requireFreshPassword,
        requirePermission(PERMISSIONS.USER_RESET_PASSWORD),
      ],
    },
    async (request, reply) => new UserManagementController().resetUserPassword(request, reply),
  );

  fastify.delete(
    "/:username",
    { preHandler: [requireAuth, requireFreshPassword, requirePermission(PERMISSIONS.USER_DELETE)] },
    async (request, reply) => new UserManagementController().deleteUser(request, reply),
  );
}
