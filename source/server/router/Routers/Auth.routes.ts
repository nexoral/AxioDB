import { FastifyInstance } from "fastify";
import AuthController from "../../controller/Auth/Auth.controller";
import { requireAuth } from "../../middleware/auth.middleware";

// Auth Router - login is public, everything else requires a valid session.
export default async function authRouter(fastify: FastifyInstance): Promise<void> {
  fastify.post("/login", async (request, reply) => new AuthController().login(request, reply));

  fastify.post(
    "/logout",
    { preHandler: [requireAuth] },
    async (request, reply) => new AuthController().logout(request, reply),
  );

  fastify.get(
    "/me",
    { preHandler: [requireAuth] },
    async (request, reply) => new AuthController().me(request, reply),
  );

  fastify.patch(
    "/change-password",
    { preHandler: [requireAuth] },
    async (request, reply) => new AuthController().changePassword(request, reply),
  );
}
