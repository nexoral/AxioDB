import HttpRouter from "../../../Helper/http/HttpRouter.helper";
import { AxioDB } from "../../../Services/Indexation.operation";
import CRUDController from "../../controller/Operation/CRUD.controller";
import { requireAuth, requireFreshPassword } from "../../middleware/auth.middleware";
import { requirePermission } from "../../middleware/permission.middleware";
import { PERMISSIONS, isReservedDatabaseName } from "../../../config/Keys/Permissions";

interface RouterOptions {
  AxioDBInstance: AxioDB;
}

export default async function OperationRouter(
  router: HttpRouter,
  options: RouterOptions,
) {
  const { AxioDBInstance } = options;

  router.get(
    "/all/",
    { preHandler: [requireAuth, requireFreshPassword, requirePermission(PERMISSIONS.DOCUMENT_VIEW)] },
    async (request) => new CRUDController(AxioDBInstance).getAllDocuments(request),
  );

  router.get(
    "/total/",
    { preHandler: [requireAuth, requireFreshPassword, requirePermission(PERMISSIONS.DOCUMENT_VIEW)] },
    async (request) => {
      const { dbName, collectionName } = request.query as { dbName?: string; collectionName?: string };
      if (!dbName || !collectionName) {
        return { statusCode: 400, message: "dbName and collectionName are required" };
      }
      if (isReservedDatabaseName(dbName)) {
        return { statusCode: 403, message: "This is a reserved system database" };
      }
      try {
        const dbExists = await AxioDBInstance.isDatabaseExists(dbName);
        if (!dbExists) {
          return { statusCode: 404, message: "Database does not exist" };
        }
        const database = await AxioDBInstance.createDB(dbName);
        const colExists = await database.isCollectionExists(collectionName);
        if (!colExists) {
          return { statusCode: 404, message: "Collection does not exist" };
        }
        const collection = await database.createCollection(collectionName);
        return collection.totalDocuments();
      } catch {
        return { statusCode: 500, message: "Unable to count documents" };
      }
    },
  );

  router.post(
    "/all/by-query/",
    { preHandler: [requireAuth, requireFreshPassword, requirePermission(PERMISSIONS.DOCUMENT_QUERY)] },
    async (request) => new CRUDController(AxioDBInstance).getDocumentsByQuery(request),
  );

  router.get(
    "/all/by-id/",
    { preHandler: [requireAuth, requireFreshPassword, requirePermission(PERMISSIONS.DOCUMENT_VIEW)] },
    async (request) => new CRUDController(AxioDBInstance).getDocumentsById(request),
  );

  router.post(
    "/all/by-ids/",
    { preHandler: [requireAuth, requireFreshPassword, requirePermission(PERMISSIONS.DOCUMENT_VIEW)] },
    async (request) => new CRUDController(AxioDBInstance).getDocumentsByIds(request),
  );

  router.post(
    "/create/",
    {
      preHandler: [requireAuth, requireFreshPassword, requirePermission(PERMISSIONS.DOCUMENT_CREATE)],
    },
    async (request) => new CRUDController(AxioDBInstance).createNewDocument(request),
  );

  router.post(
    "/create-many/",
    {
      preHandler: [requireAuth, requireFreshPassword, requirePermission(PERMISSIONS.DOCUMENT_CREATE)],
    },
    async (request) => new CRUDController(AxioDBInstance).createManyNewDocument(request),
  );

  router.put(
    "/update/by-id/",
    {
      preHandler: [requireAuth, requireFreshPassword, requirePermission(PERMISSIONS.DOCUMENT_UPDATE)],
    },
    async (request) => new CRUDController(AxioDBInstance).updateDocumentById(request),
  );

  router.put(
    "/update/by-query/",
    {
      preHandler: [requireAuth, requireFreshPassword, requirePermission(PERMISSIONS.DOCUMENT_UPDATE)],
    },
    async (request) => new CRUDController(AxioDBInstance).updateDocumentByQuery(request),
  );

  router.delete(
    "/delete/by-id/",
    {
      preHandler: [requireAuth, requireFreshPassword, requirePermission(PERMISSIONS.DOCUMENT_DELETE)],
    },
    async (request) => new CRUDController(AxioDBInstance).deleteDocumentById(request),
  );

  router.delete(
    "/delete/by-query/",
    {
      preHandler: [requireAuth, requireFreshPassword, requirePermission(PERMISSIONS.DOCUMENT_DELETE)],
    },
    async (request) => new CRUDController(AxioDBInstance).deleteDocumentByQuery(request),
  );

  router.post(
    "/aggregate/",
    {
      preHandler: [
        requireAuth,
        requireFreshPassword,
        requirePermission(PERMISSIONS.DOCUMENT_AGGREGATE),
      ],
    },
    async (request) => new CRUDController(AxioDBInstance).runAggregation(request),
  );
}
