import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { AuthorInfo, AvailableRoutes } from "../config/keys";
import buildResponse, {
  ResponseBuilder,
} from "../helper/responseBuilder.helper";
import { StatusCodes } from "../../config/Keys/StatusCode";
import { readFile } from "node:fs/promises";
import { cpus } from "node:os";
import { AxioDB } from "../../Services/Indexation.operation";

import dbRouter from "./Routers/DB.routes";
import collectionRouter from "./Routers/Collection.routes";
import indexRouter from "./Routers/Index.routes";
import OperationRouter from "./Routers/Operation.routes";
import authRouter from "./Routers/Auth.routes";
import userManagementRouter from "./Routers/UserManagement.routes";
import roleManagementRouter from "./Routers/RoleManagement.routes";
import StatsController from "../controller/Stats.controller";
import InMemoryCache from "../../Memory/memory.operation";
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

  // Unauthenticated on purpose - this is the liveness probe used by Docker's healthcheck.
  // It stays deliberately thin: process id, memory, platform and Node version are useful to
  // an operator but they also fingerprint the host, so they live behind auth on /system.
  fastify.get("/health", async () => {
    const Reply: ResponseBuilder = buildResponse(
      StatusCodes.OK,
      "Server is healthy",
      {
        status: "ok",
        timestamp: new Date().toISOString(),
        uptimeSeconds: Math.floor(process.uptime()),
      },
    );
    return Reply;
  });

  /**
   * Operational detail for the Status page. Authenticated and permission-gated, because it
   * reports host characteristics that are worth withholding from an anonymous caller.
   */
  fastify.get(
    "/system",
    { preHandler: [requireAuth, requireFreshPassword, requirePermission(PERMISSIONS.DASHBOARD_VIEW)] },
    async () => {
      const PackageFile: PackageInterface = JSON.parse(
        await readFile("./package.json", "utf-8"),
      );
      const memory = process.memoryUsage();
      const toMB = (bytes: number) => parseFloat((bytes / 1024 / 1024).toFixed(2));
      const cache = await InMemoryCache.getCacheDetails();
      const instance = await AxioDBInstance.getInstanceInfo();

      return buildResponse(StatusCodes.OK, "System information", {
        process: {
          uptimeSeconds: Math.floor(process.uptime()),
          startedAt: new Date(Date.now() - process.uptime() * 1000).toISOString(),
          pid: process.pid,
          nodeVersion: process.version,
          platform: process.platform,
          arch: process.arch,
          cpuCount: cpus().length,
        },
        memory: {
          rss: toMB(memory.rss),
          heapUsed: toMB(memory.heapUsed),
          heapTotal: toMB(memory.heapTotal),
          external: toMB(memory.external),
          unit: "MB",
        },
        cache: {
          used: parseFloat((cache.cacheSizeInBytes / 1024 / 1024).toFixed(2)),
          max: parseFloat((cache.availableMemoryInBytes / 1024 / 1024).toFixed(2)),
          unit: "MB",
        },
        instance: {
          version: PackageFile.version,
          rootName: instance?.data?.RootName ?? null,
          path: instance?.data?.CurrentPath ?? null,
          totalDatabases: instance?.data?.ListOfDatabases?.length ?? 0,
        },
        // Ports are fixed in code; the TCP/MCP surfaces are opt-in at startup.
        services: [
          { name: "Dashboard + HTTP API", port: 27018, running: true },
          { name: "AxioDBCloud TCP", port: 27019, running: Boolean(process.env.AXIODB_TCP === "true") },
          { name: "MCP server", port: 27020, running: Boolean(process.env.AXIODB_MCP === "true"), note: "Docker image only" },
        ],
      });
    },
  );

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
    async () => {
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
