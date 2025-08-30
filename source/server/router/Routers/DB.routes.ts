/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { FastifyInstance, FastifyPluginOptions } from "fastify";
import buildResponse from "../../helper/responseBuilder.helper";
import { StatusCodes } from "outers";
import { AxioDB } from "../../../Services/Indexation.operation";
import DatabaseController from "../../controller/Database/Databse.controller";
import fastifyMultipart from "@fastify/multipart";

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
  fastify.get("/databases", async (request) => {
    const transactionToken = (request.query as any)?.transactiontoken;
    return new DatabaseController(AxioDBInstance).getDatabases(
      transactionToken,
    );
  });

  // Create a new database
  fastify.post("/create-database", async (request) =>
    new DatabaseController(AxioDBInstance).createDatabase(request),
  );

  // Delete a database
  fastify.delete("/delete-database", async (request) =>
    new DatabaseController(AxioDBInstance).deleteDatabase(request),
  );

  // Export Database
  fastify.get("/export-database/", async (request, reply) =>
    new DatabaseController(AxioDBInstance).exportDatabase(request, reply),
  );

  // Import Database
  fastify.post("/import-database/", async (request, reply) =>
    new DatabaseController(AxioDBInstance).importDatabase(request, reply),
  );
}
