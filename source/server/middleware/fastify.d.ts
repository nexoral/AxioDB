import { AuthenticatedUser } from "../../config/Interfaces/Auth/auth.interface";

declare module "fastify" {
  interface FastifyRequest {
    authUser?: AuthenticatedUser;
  }
}
