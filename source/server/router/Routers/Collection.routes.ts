import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { AxioDB } from "../../../Services/Indexation.operation";
import CollectionController from "../../controller/Collections/Collection.controller";
import { requireAuth, requireFreshPassword } from "../../middleware/auth.middleware";
import { requirePermission } from "../../middleware/permission.middleware";
import { PERMISSIONS } from "../../../config/Keys/Permissions";

interface RouterOptions extends FastifyPluginOptions {
  AxioDBInstance: AxioDB;
}

export default async function collectionRouter(
  fastify: FastifyInstance,
  options: RouterOptions,
) {
  const { AxioDBInstance } = options;

  fastify.get(
    "/all/",
    {
      preHandler: [requireAuth, requireFreshPassword, requirePermission(PERMISSIONS.COLLECTION_VIEW)],
    },
    async (request) => {
      return new CollectionController(AxioDBInstance).getCollections(request);
    },
  );

  fastify.post(
    "/create-collection",
    {
      preHandler: [
        requireAuth,
        requireFreshPassword,
        requirePermission(PERMISSIONS.COLLECTION_CREATE),
      ],
    },
    async (request) => new CollectionController(AxioDBInstance).createCollection(request),
  );

  fastify.delete(
    "/delete-collection/",
    {
      preHandler: [
        requireAuth,
        requireFreshPassword,
        requirePermission(PERMISSIONS.COLLECTION_DELETE),
      ],
    },
    async (request) => new CollectionController(AxioDBInstance).deleteCollection(request),
  );
}
