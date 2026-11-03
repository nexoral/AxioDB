import HttpRouter from "../../../Helper/http/HttpRouter.helper";
import { AxioDB } from "../../../Services/Indexation.operation";
import DatabaseController from "../../controller/Database/Databse.controller";
import { requireAuth, requireFreshPassword } from "../../middleware/auth.middleware";
import { requirePermission } from "../../middleware/permission.middleware";
import { PERMISSIONS } from "../../../config/Keys/Permissions";

interface RouterOptions {
  AxioDBInstance: AxioDB;
}

export default async function dbRouter(
  router: HttpRouter,
  options: RouterOptions,
): Promise<void> {
  const { AxioDBInstance } = options;

  router.get(
    "/databases",
    { preHandler: [requireAuth, requireFreshPassword, requirePermission(PERMISSIONS.DB_VIEW)] },
    async () => {
      return new DatabaseController(AxioDBInstance).getDatabases();
    },
  );

  router.post(
    "/create-database",
    { preHandler: [requireAuth, requireFreshPassword, requirePermission(PERMISSIONS.DB_CREATE)] },
    async (request) => new DatabaseController(AxioDBInstance).createDatabase(request),
  );

  router.delete(
    "/delete-database",
    { preHandler: [requireAuth, requireFreshPassword, requirePermission(PERMISSIONS.DB_DELETE)] },
    async (request) => new DatabaseController(AxioDBInstance).deleteDatabase(request),
  );

  router.get(
    "/export-database/",
    { preHandler: [requireAuth, requireFreshPassword, requirePermission(PERMISSIONS.DB_EXPORT)] },
    async (request, reply) =>
      new DatabaseController(AxioDBInstance).exportDatabase(request, reply),
  );

  router.post(
    "/import-database/",
    { preHandler: [requireAuth, requireFreshPassword, requirePermission(PERMISSIONS.DB_IMPORT)] },
    async (request, reply) =>
      new DatabaseController(AxioDBInstance).importDatabase(request, reply),
  );
}
