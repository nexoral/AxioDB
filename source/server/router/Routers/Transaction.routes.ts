import HttpRouter from "../../../Helper/http/HttpRouter.helper";
import { AxioDB } from "../../../Services/Indexation.operation";
import TransactionController from "../../controller/Transaction/Transaction.controller";
import { requireAuth, requireFreshPassword } from "../../middleware/auth.middleware";
import { requirePermission } from "../../middleware/permission.middleware";
import { PERMISSIONS } from "../../../config/Keys/Permissions";

interface RouterOptions {
  AxioDBInstance: AxioDB;
}

export default async function transactionRouter(
  router: HttpRouter,
  options: RouterOptions,
): Promise<void> {
  const controller = new TransactionController(options.AxioDBInstance);

  router.post(
    "/begin",
    {
      preHandler: [
        requireAuth,
        requireFreshPassword,
        requirePermission(PERMISSIONS.DOCUMENT_CREATE),
      ],
    },
    async (request, reply) => controller.beginTransaction(request, reply),
  );

  router.post(
    "/insert",
    {
      preHandler: [
        requireAuth,
        requireFreshPassword,
        requirePermission(PERMISSIONS.DOCUMENT_CREATE),
      ],
    },
    async (request, reply) => controller.insertDocument(request, reply),
  );

  router.post(
    "/update",
    {
      preHandler: [
        requireAuth,
        requireFreshPassword,
        requirePermission(PERMISSIONS.DOCUMENT_UPDATE),
      ],
    },
    async (request, reply) => controller.updateDocument(request, reply),
  );

  router.post(
    "/delete",
    {
      preHandler: [
        requireAuth,
        requireFreshPassword,
        requirePermission(PERMISSIONS.DOCUMENT_DELETE),
      ],
    },
    async (request, reply) => controller.deleteDocument(request, reply),
  );

  router.post(
    "/savepoint",
    {
      preHandler: [
        requireAuth,
        requireFreshPassword,
        requirePermission(PERMISSIONS.DOCUMENT_CREATE),
      ],
    },
    async (request, reply) => controller.savepoint(request, reply),
  );

  router.post(
    "/rollback-to-savepoint",
    {
      preHandler: [
        requireAuth,
        requireFreshPassword,
        requirePermission(PERMISSIONS.DOCUMENT_DELETE),
      ],
    },
    async (request, reply) => controller.rollbackToSavepoint(request, reply),
  );

  router.post(
    "/rollback-savepoint",
    {
      preHandler: [
        requireAuth,
        requireFreshPassword,
        requirePermission(PERMISSIONS.DOCUMENT_DELETE),
      ],
    },
    async (request, reply) => controller.rollbackToSavepoint(request, reply),
  );

  router.post(
    "/release-savepoint",
    {
      preHandler: [
        requireAuth,
        requireFreshPassword,
        requirePermission(PERMISSIONS.DOCUMENT_CREATE),
      ],
    },
    async (request, reply) => controller.releaseSavepoint(request, reply),
  );

  router.post(
    "/commit",
    {
      preHandler: [
        requireAuth,
        requireFreshPassword,
        requirePermission(PERMISSIONS.DOCUMENT_UPDATE),
      ],
    },
    async (request, reply) => controller.commitTransaction(request, reply),
  );

  router.post(
    "/rollback",
    {
      preHandler: [
        requireAuth,
        requireFreshPassword,
        requirePermission(PERMISSIONS.DOCUMENT_UPDATE),
      ],
    },
    async (request, reply) => controller.rollbackTransaction(request, reply),
  );
}
