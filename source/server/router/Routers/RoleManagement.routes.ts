import HttpRouter from "../../../Helper/http/HttpRouter.helper";
import RoleManagementController from "../../controller/Auth/RoleManagement.controller";
import { requireAuth, requireFreshPassword } from "../../middleware/auth.middleware";
import { requirePermission } from "../../middleware/permission.middleware";
import { PERMISSIONS } from "../../../config/Keys/Permissions";

export default async function roleManagementRouter(router: HttpRouter): Promise<void> {
  router.get(
    "/",
    { preHandler: [requireAuth, requireFreshPassword, requirePermission(PERMISSIONS.ROLE_VIEW)] },
    async (request, reply) => new RoleManagementController().listRoles(request, reply),
  );

  router.post(
    "/",
    { preHandler: [requireAuth, requireFreshPassword, requirePermission(PERMISSIONS.ROLE_CREATE)] },
    async (request, reply) => new RoleManagementController().createRole(request, reply),
  );

  router.get(
    "/permissions",
    { preHandler: [requireAuth, requireFreshPassword, requirePermission(PERMISSIONS.ROLE_VIEW)] },
    async (request, reply) => new RoleManagementController().listPermissions(request, reply),
  );

  router.delete(
    "/:roleName",
    { preHandler: [requireAuth, requireFreshPassword, requirePermission(PERMISSIONS.ROLE_DELETE)] },
    async (request, reply) => new RoleManagementController().deleteRole(request, reply),
  );
}
