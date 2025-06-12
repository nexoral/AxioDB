/* eslint-disable @typescript-eslint/no-explicit-any */
import { FastifyInstance } from "fastify";
import userAuthentication from "./Authentication/Authentication";
import validateToken from "../../../Middlewares/validateToken.middleware";
import { RequestBody } from "../../../config/Interfaces/RequestInterface";

// Main Service Routes to link all the routes to the main service
export default function MainServiceRoutes(
  fastify: FastifyInstance,
  options: any,
) {
  const { DBInstances } = options;

  // Register the Authentication routes
  fastify.register(userAuthentication, {
    prefix: "/auth",
    CentralAuthCollection: DBInstances.CentralAuthCollection,
  });

  // Register DB instances for the central service
  fastify.register(
    async function (instance: FastifyInstance) {
      // Register the Middleware for the /auth routes
      instance.addHook("preHandler", async (request, reply) =>
        validateToken(request as RequestBody, reply),
      );
    },
    {
      prefix: "/central",
      CentralAuthCollection: DBInstances.CentralAuthCollection,
    },
  );
}
