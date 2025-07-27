/* eslint-disable @typescript-eslint/no-unused-vars */
import { FastifyInstance, FastifyPluginOptions } from "fastify";
import buildResponse from "../../helper/responseBuilder.helper";
import { StatusCodes } from "outers";
import { AxioDB } from "../../../Services/Indexation.operation";
import DatabaseController from "../../controller/Database/Databse.controller";

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

  // Get all databases
  fastify.get("/databases", async () =>
    new DatabaseController(AxioDBInstance).getDatabases(),
  );

  // Create a new database
  fastify.post("/create-database", async (request) =>
    new DatabaseController(AxioDBInstance).createDatabase(request),
  );

  // Delete a database
  fastify.delete("/delete-database", async (request) =>
    new DatabaseController(AxioDBInstance).deleteDatabase(request),
  );
}
