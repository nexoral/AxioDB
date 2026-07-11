/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { AuthorInfo, AvailableRoutes } from "../config/keys";
import buildResponse, {
  ResponseBuilder,
} from "../helper/responseBuilder.helper";
import { StatusCodes } from "../../config/Keys/StatusCode";
import { readFile } from "node:fs/promises";
import { AxioDB } from "../../Services/Indexation.operation";

import dbRouter from "./Routers/DB.routes";
import collectionRouter from "./Routers/Collection.routes";
import indexRouter from "./Routers/Index.routes";
import OperationRouter from "./Routers/Operation.routes";
import authRouter from "./Routers/Auth.routes";
import userManagementRouter from "./Routers/UserManagement.routes";
import roleManagementRouter from "./Routers/RoleManagement.routes";
import StatsController from "../controller/Stats.controller";
import { requireAuth, requireFreshPassword } from "../middleware/auth.middleware";
import { requirePermission } from "../middleware/permission.middleware";
import { PERMISSIONS } from "../../config/Keys/Permissions";

type PackageInterface = {
  name: string;
  version: number;
  author: string;
  license: string;
};

interface RouterOptions extends FastifyPluginOptions {
  AxioDBInstance: AxioDB;
}

export default async function mainRouter(
  fastify: FastifyInstance,
  options: RouterOptions,
  done: () => void,
): Promise<void> {
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

  fastify.get("/routes", async (request, reply) => {
    const Reply: ResponseBuilder = buildResponse(
      StatusCodes.OK,
      "Available routes",
      AvailableRoutes,
    );
    return reply.status(200).send(Reply);
  });

  fastify.get(
    "/dashboard-stats",
    { preHandler: [requireAuth, requireFreshPassword, requirePermission(PERMISSIONS.DASHBOARD_VIEW)] },
    async (request, reply) => {
      return new StatsController(AxioDBInstance).getDashBoardStat();
    },
  );

  fastify.register(dbRouter, {
    prefix: "/db",
    AxioDBInstance: AxioDBInstance,
  });

  fastify.register(collectionRouter, {
    prefix: "/collection",
    AxioDBInstance: AxioDBInstance,
  });

  fastify.register(OperationRouter, {
    prefix: "/operation",
    AxioDBInstance: AxioDBInstance,
  });

  fastify.register(indexRouter, {
    prefix: "/index",
    AxioDBInstance: AxioDBInstance,
  });

  // login is public; session/password endpoints inside require auth
  fastify.register(authRouter, { prefix: "/auth" });

  // Super Admin only (enforced inside these routers)
  fastify.register(userManagementRouter, { prefix: "/auth/users" });
  fastify.register(roleManagementRouter, { prefix: "/auth/roles" });

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
