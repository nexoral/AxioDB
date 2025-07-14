/* eslint-disable @typescript-eslint/no-unused-vars */
import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { AvailableRoutes } from "../config/keys";
import buildResponse, { ResponseBuilder } from "../helper/responseBuilder.helper";
import { StatusCodes } from "outers";
import { readFile } from "node:fs/promises";


// Interfaces
type PackageInterface = {
  name: string,
  version: number,
  author: string,
  license: string
}

/**
 * Main router plugin for the AxioDB server
 *
 * @param fastify - Fastify instance
 * @param _options - Plugin options
 * @param done - Callback to signal completion
 */
export default async function mainRouter(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions,
  done: () => void,
): Promise<void> {

  fastify.get("/info", async ()=> {
    const PackageFile: PackageInterface = JSON.parse(await readFile("./package.json", "utf-8"));
    const Reply: ResponseBuilder = buildResponse(StatusCodes.OK, "AxioDB Information", {
      Package_Name: PackageFile.name,
      AxioDB_Version: PackageFile.version,
      Author_Name: PackageFile.author,
      License: PackageFile.license
    })
    return Reply
  })

  // Health check route
  fastify.get("/health", async () => {
    const Reply: ResponseBuilder = buildResponse(StatusCodes.OK, "Server is healthy", {
      status: "ok",
      timestamp: new Date().toISOString(),
    })
    return Reply;
  });

  // Available routes List
  fastify.get("/routes", async (request, reply) => {
    const Reply: ResponseBuilder = buildResponse(StatusCodes.OK, "Available routes", AvailableRoutes);
    return reply
      .status(200)
      .send(Reply);
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
