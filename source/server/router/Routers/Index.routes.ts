import HttpRouter from "../../../Helper/http/HttpRouter.helper";
import { AxioDB } from "../../../Services/Indexation.operation";
import IndexController from "../../controller/Index/Index.controller";
import { requireAuth, requireFreshPassword } from "../../middleware/auth.middleware";
import { requirePermission } from "../../middleware/permission.middleware";
import { PERMISSIONS } from "../../../config/Keys/Permissions";

interface RouterOptions {
  AxioDBInstance: AxioDB;
}

export default async function indexRouter(
  router: HttpRouter,
  options: RouterOptions,
) {
  const { AxioDBInstance } = options;

  router.get(
    "/list",
    {
      preHandler: [requireAuth, requireFreshPassword, requirePermission(PERMISSIONS.INDEX_VIEW)],
    },
    async (request) => new IndexController(AxioDBInstance).getIndexes(request),
  );

  router.post(
    "/create",
    {
      preHandler: [requireAuth, requireFreshPassword, requirePermission(PERMISSIONS.INDEX_CREATE)],
    },
    async (request) => new IndexController(AxioDBInstance).createIndex(request),
  );

  router.delete(
    "/delete",
    {
      preHandler: [requireAuth, requireFreshPassword, requirePermission(PERMISSIONS.INDEX_DELETE)],
    },
    async (request) => new IndexController(AxioDBInstance).deleteIndex(request),
  );
}
