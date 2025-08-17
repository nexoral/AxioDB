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

  // Create New Document
  fastify.post("/create/", async (request, reply) =>
    new CRUDController(AxioDBInstance).createNewDocument(request),
  );

  // Update Document
  fastify.put("/update/", async (request, reply) =>
    new CRUDController(AxioDBInstance).updateDocument(request),
  );

  // Delete Document
  fastify.delete("/delete/", async (request, reply) =>
    new CRUDController(AxioDBInstance).deleteDocument(request),
  );

  fastify.post("/aggregate/", async (request, reply) =>
    new CRUDController(AxioDBInstance).runAggregation(request),
  );
}
