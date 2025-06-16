/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import Fastify from "fastify";
import ServerInfo from "../../config/Info";
import { ServerPorts } from "../../config/Keys";
import { AxioDB } from "axiodb";
import Collection from "axiodb/lib/Operation/Collection/collection.operation";
import Database from "axiodb/lib/Operation/Database/database.operation";

// Import all Routes
import MainServiceRoutes from "./Router/Router";
import fastifyRateLimit from "@fastify/rate-limit";
import { StatusCodes } from "outers";
import fastifyStatic from "@fastify/static";
import path from "path";

// Interface
interface ServerOptions {
  CentralAuthCollection: Collection;
  CentralDB: Database;
  CentralDBInstance: AxioDB;
}

// Start the server
const start = async (options: ServerOptions) => {
  // Create a Fastify instance
  const fastify = Fastify({
    logger: true, // Enable logging
  });

  const PORT: number = Number(ServerPorts.HTTP) || 27018;

  // Register the rate limit plugin with custom error response
  // This will limit the number of requests to 100 per minute
  fastify.register(fastifyRateLimit, {
    max: 100, // Max number of requests
    timeWindow: "1 minute", // Time window for the max
    errorResponseBuilder: function (req, context) {
      return {
        statusCode: StatusCodes.TOO_MANY_REQUESTS,
        success: false,
        error: "Too Many Requests",
        message: `You have reached the limit of ${context.max} requests in ${context.after}. Try again later.`,
      };
    },
  });

  // Register routes with a prefix
  fastify.register(MainServiceRoutes, {
    prefix: "/services",
    DBInstances: options,
  });

  // Define a simple important route

  fastify.get("/status", async (_request: any, reply: any) => {
    return reply.status(StatusCodes.OK).send({
      status: "OK",
      message: "AxioDB is running",
    });
  });

  // Define a route to get the version information
  fastify.get("/info", async (_request: any, _reply: any) => {
    const { DB_Info, OS_Info, Runtime_Info } = await ServerInfo();
    return { DB_Info, OS_Info, Runtime_Info };
  });

  try {
    await fastify.listen({ port: PORT, host: "0.0.0.0" });
    console.log(`REST API Server is running at http://localhost:${PORT}`);
  } catch (err) {
    fastify.log.error(err);
  }
};

export default start;
