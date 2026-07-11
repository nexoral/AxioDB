/* eslint-disable @typescript-eslint/no-unused-vars */
import { FastifyInstance, FastifyPluginOptions } from "fastify";
import buildResponse from "../../helper/responseBuilder.helper";
import { StatusCodes } from "../../../config/Keys/StatusCode";
import { AxioDB } from "../../../Services/Indexation.operation";
import CRUDController from "../../controller/Operation/CRUD.controller";
import { requireAuth, requireFreshPassword } from "../../middleware/auth.middleware";
import { requirePermission } from "../../middleware/permission.middleware";
import { PERMISSIONS } from "../../../config/Keys/Permissions";

interface RouterOptions extends FastifyPluginOptions {
  AxioDBInstance: AxioDB;
}

export default async function OperationRouter(
  fastify: FastifyInstance,
  options: RouterOptions,
) {
  const { AxioDBInstance } = options;

  fastify.get(
    "/all/",
    { preHandler: [requireAuth, requireFreshPassword, requirePermission(PERMISSIONS.DOCUMENT_VIEW)] },
    async (request, reply) => new CRUDController(AxioDBInstance).getAllDocuments(request),
  );

  fastify.post(
    "/all/by-query/",
    { preHandler: [requireAuth, requireFreshPassword, requirePermission(PERMISSIONS.DOCUMENT_QUERY)] },
    async (request, reply) => new CRUDController(AxioDBInstance).getDocumentsByQuery(request),
  );

  fastify.get(
    "/all/by-id/",
    { preHandler: [requireAuth, requireFreshPassword, requirePermission(PERMISSIONS.DOCUMENT_VIEW)] },
    async (request, reply) => new CRUDController(AxioDBInstance).getDocumentsById(request),
  );

  fastify.post(
    "/create/",
    {
      preHandler: [requireAuth, requireFreshPassword, requirePermission(PERMISSIONS.DOCUMENT_CREATE)],
    },
    async (request, reply) => new CRUDController(AxioDBInstance).createNewDocument(request),
  );

  fastify.post(
    "/create-many/",
    {
      preHandler: [requireAuth, requireFreshPassword, requirePermission(PERMISSIONS.DOCUMENT_CREATE)],
    },
    async (request, reply) => new CRUDController(AxioDBInstance).createManyNewDocument(request),
  );

  fastify.put(
    "/update/by-id/",
    {
      preHandler: [requireAuth, requireFreshPassword, requirePermission(PERMISSIONS.DOCUMENT_UPDATE)],
    },
    async (request, reply) => new CRUDController(AxioDBInstance).updateDocumentById(request),
  );

  fastify.put(
    "/update/by-query/",
    {
      preHandler: [requireAuth, requireFreshPassword, requirePermission(PERMISSIONS.DOCUMENT_UPDATE)],
    },
    async (request, reply) => new CRUDController(AxioDBInstance).updateDocumentByQuery(request),
  );

  fastify.delete(
    "/delete/by-id/",
    {
      preHandler: [requireAuth, requireFreshPassword, requirePermission(PERMISSIONS.DOCUMENT_DELETE)],
    },
    async (request, reply) => new CRUDController(AxioDBInstance).deleteDocumentById(request),
  );

  fastify.delete(
    "/delete/by-query/",
    {
      preHandler: [requireAuth, requireFreshPassword, requirePermission(PERMISSIONS.DOCUMENT_DELETE)],
    },
    async (request, reply) => new CRUDController(AxioDBInstance).deleteDocumentByQuery(request),
  );

  fastify.post(
    "/aggregate/",
    {
      preHandler: [
        requireAuth,
        requireFreshPassword,
        requirePermission(PERMISSIONS.DOCUMENT_AGGREGATE),
      ],
    },
    async (request, reply) => new CRUDController(AxioDBInstance).runAggregation(request),
  );
}
