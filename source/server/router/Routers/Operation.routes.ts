/* eslint-disable @typescript-eslint/no-unused-vars */
import { FastifyInstance, FastifyPluginOptions } from "fastify";
import buildResponse from "../../helper/responseBuilder.helper";
import { StatusCodes } from "outers";
import { AxioDB } from "../../../Services/Indexation.operation";
import CRUDController from "../../controller/Operation/CRUD.controller";

// Extended options interface to include AxioDB instance
interface RouterOptions extends FastifyPluginOptions {
  AxioDBInstance: AxioDB;
}

// Collection Router
export default async function OperationRouter(
  fastify: FastifyInstance,
  options: RouterOptions,
) {
  const { AxioDBInstance } = options;

  // Get All Documents
  fastify.get("/all/", async (request, reply) =>
    new CRUDController(AxioDBInstance).getAllDocuments(request),
  );

  // Get Document by Query
  fastify.post("/all/by-query/", async (request, reply) =>
    new CRUDController(AxioDBInstance).getDocumentsByQuery(request),
  );

  // Get Document by id
  fastify.get("/all/by-id/", async (request, reply) =>
    new CRUDController(AxioDBInstance).getDocumentsById(request),
  );

  // Create New Document
  fastify.post("/create/", async (request, reply) =>
    new CRUDController(AxioDBInstance).createNewDocument(request),
  );

  fastify.post("/create-many/", async (request, reply) =>
    new CRUDController(AxioDBInstance).createManyNewDocument(request),
  );

  // Update Document by Id
  fastify.put("/update/by-id/", async (request, reply) =>
    new CRUDController(AxioDBInstance).updateDocumentById(request),
  );

  // Update Document by Query
  fastify.put("/update/by-query/", async (request, reply) =>
    new CRUDController(AxioDBInstance).updateDocumentByQuery(request),
  );

  // Delete Document by Id
  fastify.delete("/delete/by-id/", async (request, reply) =>
    new CRUDController(AxioDBInstance).deleteDocumentById(request),
  );

  // Delete Document by Query
  fastify.delete("/delete/by-query/", async (request, reply) =>
    new CRUDController(AxioDBInstance).deleteDocumentByQuery(request),
  );

  fastify.post("/aggregate/", async (request, reply) =>
    new CRUDController(AxioDBInstance).runAggregation(request),
  );
}
