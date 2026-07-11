import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { AxioDB } from "../../../Services/Indexation.operation";
import IndexController from "../../controller/Index/Index.controller";
import { requireAuth, requireFreshPassword } from "../../middleware/auth.middleware";
import { requirePermission } from "../../middleware/permission.middleware";
import { PERMISSIONS } from "../../../config/Keys/Permissions";

interface RouterOptions extends FastifyPluginOptions {
  AxioDBInstance: AxioDB;
}

export default async function indexRouter(
  fastify: FastifyInstance,
  options: RouterOptions,
) {
  const { AxioDBInstance } = options;

  fastify.get(
    "/list",
    {
      preHandler: [requireAuth, requireFreshPassword, requirePermission(PERMISSIONS.INDEX_VIEW)],
    },
    async (request) => new IndexController(AxioDBInstance).getIndexes(request),
  );

  fastify.post(
    "/create",
    {
      preHandler: [requireAuth, requireFreshPassword, requirePermission(PERMISSIONS.INDEX_CREATE)],
    },
    async (request) => new IndexController(AxioDBInstance).createIndex(request),
  );

  fastify.delete(
    "/delete",
    {
      preHandler: [requireAuth, requireFreshPassword, requirePermission(PERMISSIONS.INDEX_DELETE)],
    },
    async (request) => new IndexController(AxioDBInstance).deleteIndex(request),
  );
}
