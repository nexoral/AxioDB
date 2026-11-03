import HttpRouter from "../../../Helper/http/HttpRouter.helper";
import UserManagementController from "../../controller/Auth/UserManagement.controller";
import { requireAuth, requireFreshPassword } from "../../middleware/auth.middleware";
import { requirePermission } from "../../middleware/permission.middleware";
import { PERMISSIONS } from "../../../config/Keys/Permissions";

export default async function userManagementRouter(router: HttpRouter): Promise<void> {
  router.get(
    "/",
    { preHandler: [requireAuth, requireFreshPassword, requirePermission(PERMISSIONS.USER_VIEW)] },
    async (request, reply) => new UserManagementController().listUsers(request, reply),
  );

  router.post(
    "/",
    { preHandler: [requireAuth, requireFreshPassword, requirePermission(PERMISSIONS.USER_CREATE)] },
    async (request, reply) => new UserManagementController().createUser(request, reply),
  );

  router.patch(
    "/:username/role",
    {
      preHandler: [requireAuth, requireFreshPassword, requirePermission(PERMISSIONS.USER_UPDATE_ROLE)],
    },
    async (request, reply) => new UserManagementController().updateUserRole(request, reply),
  );

  router.patch(
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

  router.delete(
    "/:username",
    { preHandler: [requireAuth, requireFreshPassword, requirePermission(PERMISSIONS.USER_DELETE)] },
    async (request, reply) => new UserManagementController().deleteUser(request, reply),
  );
}
