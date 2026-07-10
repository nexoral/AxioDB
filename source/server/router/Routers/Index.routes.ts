import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { AxioDB } from "../../../Services/Indexation.operation";
import IndexController from "../../controller/Index/Index.controller";
import { requireAuth, requireFreshPassword } from "../../middleware/auth.middleware";
import { requirePermission } from "../../middleware/permission.middleware";
import { PERMISSIONS } from "../../../config/Keys/Permissions";

// Extended options interface to include AxioDB instance
interface RouterOptions extends FastifyPluginOptions {
  AxioDBInstance: AxioDB;
}

// Index Router
export default async function indexRouter(
  fastify: FastifyInstance,
  options: RouterOptions,
) {
  const { AxioDBInstance } = options;

  // List Indexes
  fastify.get(
    "/list",
    {
      preHandler: [requireAuth, requireFreshPassword, requirePermission(PERMISSIONS.INDEX_VIEW)],
    },
    async (request) => new IndexController(AxioDBInstance).getIndexes(request),
  );

  // Create Index
  fastify.post(
    "/create",
    {
      preHandler: [requireAuth, requireFreshPassword, requirePermission(PERMISSIONS.INDEX_CREATE)],
    },
    async (request) => new IndexController(AxioDBInstance).createIndex(request),
  );

  // Delete Index
  fastify.delete(
    "/delete",
    {
      preHandler: [requireAuth, requireFreshPassword, requirePermission(PERMISSIONS.INDEX_DELETE)],
    },
    async (request) => new IndexController(AxioDBInstance).deleteIndex(request),
  );
}
