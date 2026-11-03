import HttpRouter from "../../../Helper/http/HttpRouter.helper";
import { AxioDB } from "../../../Services/Indexation.operation";
import CollectionController from "../../controller/Collections/Collection.controller";
import { requireAuth, requireFreshPassword } from "../../middleware/auth.middleware";
import { requirePermission } from "../../middleware/permission.middleware";
import { PERMISSIONS } from "../../../config/Keys/Permissions";

interface RouterOptions {
  AxioDBInstance: AxioDB;
}

export default async function collectionRouter(
  router: HttpRouter,
  options: RouterOptions,
) {
  const { AxioDBInstance } = options;

  router.get(
    "/all/",
    {
      preHandler: [requireAuth, requireFreshPassword, requirePermission(PERMISSIONS.COLLECTION_VIEW)],
    },
    async (request) => {
      return new CollectionController(AxioDBInstance).getCollections(request);
    },
  );

  router.post(
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

  router.delete(
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
