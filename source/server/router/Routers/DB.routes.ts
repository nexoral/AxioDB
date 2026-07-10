/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { FastifyInstance, FastifyPluginOptions } from "fastify";
import buildResponse from "../../helper/responseBuilder.helper";
import { StatusCodes } from "../../../config/Keys/StatusCode";
import { AxioDB } from "../../../Services/Indexation.operation";
import DatabaseController from "../../controller/Database/Databse.controller";
import fastifyMultipart from "@fastify/multipart";
import { requireAuth, requireFreshPassword } from "../../middleware/auth.middleware";
import { requirePermission } from "../../middleware/permission.middleware";
import { PERMISSIONS } from "../../../config/Keys/Permissions";

// Extended options interface to include AxioDB instance
interface RouterOptions extends FastifyPluginOptions {
  AxioDBInstance: AxioDB;
}

// DB Routers
export default async function dbRouter(
  fastify: FastifyInstance,
  options: RouterOptions,
): Promise<void> {
  const { AxioDBInstance } = options; // Access the AxioDB instance passed from the main router
  fastify.register(fastifyMultipart);

  // Get all databases
  fastify.get(
    "/databases",
    { preHandler: [requireAuth, requireFreshPassword, requirePermission(PERMISSIONS.DB_VIEW)] },
    async (request) => {
      return new DatabaseController(AxioDBInstance).getDatabases();
    },
  );

  // Create a new database
  fastify.post(
    "/create-database",
    { preHandler: [requireAuth, requireFreshPassword, requirePermission(PERMISSIONS.DB_CREATE)] },
    async (request) => new DatabaseController(AxioDBInstance).createDatabase(request),
  );

  // Delete a database
  fastify.delete(
    "/delete-database",
    { preHandler: [requireAuth, requireFreshPassword, requirePermission(PERMISSIONS.DB_DELETE)] },
    async (request) => new DatabaseController(AxioDBInstance).deleteDatabase(request),
  );

  // Export Database
  fastify.get(
    "/export-database/",
    { preHandler: [requireAuth, requireFreshPassword, requirePermission(PERMISSIONS.DB_EXPORT)] },
    async (request, reply) =>
      new DatabaseController(AxioDBInstance).exportDatabase(request, reply),
  );

  // Import Database
  fastify.post(
    "/import-database/",
    { preHandler: [requireAuth, requireFreshPassword, requirePermission(PERMISSIONS.DB_IMPORT)] },
    async (request, reply) =>
      new DatabaseController(AxioDBInstance).importDatabase(request, reply),
  );
}
