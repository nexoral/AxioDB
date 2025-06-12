/* eslint-disable @typescript-eslint/no-explicit-any */
import { FastifyInstance } from "fastify";

// Import Controllers
import Authentication from "../../../../Controller/Authentication/Authentication";
import Collection from "axiodb/lib/Operation/Collection/collection.operation";

// Method to handle user Authentication management
export default function userAuthentication(
  fastify: FastifyInstance,
  options: { CentralAuthCollection: Collection },
) {
  const { CentralAuthCollection } = options;
  // Route to handle user registration
  fastify.post("/register", async (request: any, reply: any) => {
    const userData = request.body;

    const result = await Authentication.Register(
      userData,
      CentralAuthCollection,
    );
    return reply.status(result.status ? 201 : 400).send(result);
  });

  // Route to handle user login
  fastify.post("/login", async (request: any, reply: any) => {
    const userData = request.body;

    const result = await Authentication.Login(userData, CentralAuthCollection);
    return reply.status(result.status ? 200 : 401).send(result);
  });
}
