/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { AuthorInfo, AvailableRoutes } from "../config/keys";
import buildResponse, {
  ResponseBuilder,
} from "../helper/responseBuilder.helper";
import { Retry, StatusCodes } from "outers";
import { readFile } from "node:fs/promises";
import { AxioDB } from "../../Services/Indexation.operation";

// All Sub Routers
import dbRouter from "./Routers/DB.routes";
import KeyController from "../controller/Key/key.controller";
import collectionRouter from "./Routers/Collection.routes";
import OperationRouter from "./Routers/Operation.routes";
import StatsController from "../controller/Stats.controller";

// Interfaces
type PackageInterface = {
  name: string;
  version: number;
  author: string;
  license: string;
};

// Extended options interface to include AxioDB instance
interface RouterOptions extends FastifyPluginOptions {
  AxioDBInstance: AxioDB;
}

/**
 * Main router plugin for the AxioDB server
 * @param fastify - Fastify instance
 * @param _options - Plugin options
 * @param done - Callback to signal completion
 */
export default async function mainRouter(
  fastify: FastifyInstance,
  options: RouterOptions,
  done: () => void,
): Promise<void> {
  // Now you can access the AxioDB instance
  const { AxioDBInstance } = options;

  fastify.get("/info", async () => {
    const PackageFile: PackageInterface = JSON.parse(
      await readFile("./package.json", "utf-8"),
    );
    const Reply: ResponseBuilder = buildResponse(
      StatusCodes.OK,
      "AxioDB Information",
      {
        Package_Name: PackageFile.name,
        AxioDB_Version: PackageFile.version,
        Author_Name: PackageFile.author,
        License: PackageFile.license,
        AuthorDetails: AuthorInfo,
      },
    );
    return Reply;
  });

  // Health check route
  fastify.get("/health", async () => {
    const Reply: ResponseBuilder = buildResponse(
      StatusCodes.OK,
      "Server is healthy",
      {
        status: "ok",
        timestamp: new Date().toISOString(),
      },
    );
    return Reply;
  });

  // Available routes List
  fastify.get("/routes", async (request, reply) => {
    const Reply: ResponseBuilder = buildResponse(
      StatusCodes.OK,
      "Available routes",
      AvailableRoutes,
    );
    return reply.status(200).send(Reply);
  });

  // Get Dashboard Stats
  fastify.get("/dashboard-stats", async (request, reply) => {
    return new StatsController(AxioDBInstance).getDashBoardStat();
  });

  // Register the DB router
  fastify.register(dbRouter, {
    prefix: "/db",
    AxioDBInstance: AxioDBInstance, // Pass the AxioDB instance to the DB router
  });

  // Register Collection Router
  fastify.register(collectionRouter, {
    prefix: "/collection",
    AxioDBInstance: AxioDBInstance, // Pass the AxioDB instance to the Collection router
  });

  // Register Operation Router
  fastify.register(OperationRouter, {
    prefix: "/operation",
    AxioDBInstance: AxioDBInstance, // Pass the AxioDB instance to the Operation router
  });

  // Handle 404 Not Found
  fastify.setNotFoundHandler((request, reply) => {
    return reply
      .status(404)
      .send(
        buildResponse(
          StatusCodes.NOT_FOUND,
          `Route ${request.method}:${request.url} not found`,
        ),
      );
  });

  done();
}
