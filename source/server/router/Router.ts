import HttpRouter from "../../Helper/http/HttpRouter.helper";
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
import { requireAuth, requireFreshPassword } from "../middleware/auth.middleware";
import { requirePermission } from "../middleware/permission.middleware";
import { PERMISSIONS } from "../../config/Keys/Permissions";

type PackageInterface = {
  name: string;
  version: number;
  author: string;
  license: string;
};

interface RouterOptions {
  AxioDBInstance: AxioDB;
}

export default async function mainRouter(
  router: HttpRouter,
  options: RouterOptions,
): Promise<void> {
  const { AxioDBInstance } = options;

  router.get("/info", async () => {
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

  router.get("/health", async () => {
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

  router.get(
    "/system",
    { preHandler: [requireAuth, requireFreshPassword, requirePermission(PERMISSIONS.DASHBOARD_VIEW)] },
    async () => {
      const PackageFile: PackageInterface = JSON.parse(
        await readFile("./package.json", "utf-8"),
      );
      const memory = process.memoryUsage();
      const toMB = (bytes: number) => parseFloat((bytes / 1024 / 1024).toFixed(2));
      const cache = await AxioDBInstance.Cache.getCacheDetails();
      const instance = await AxioDBInstance.getInstanceInfo();
      const cacheData = cache as { cacheSizeInBytes: number; availableMemoryInBytes: number } | false;
      const instanceData = instance?.data as Record<string, unknown> | undefined;

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
          used: parseFloat(((cacheData ? cacheData.cacheSizeInBytes : 0) / 1024 / 1024).toFixed(2)),
          max: parseFloat(((cacheData ? cacheData.availableMemoryInBytes : 0) / 1024 / 1024).toFixed(2)),
          unit: "MB",
        },
        instance: {
          version: PackageFile.version,
          rootName: (instanceData?.RootName as string) ?? null,
          path: (instanceData?.CurrentPath as string) ?? null,
          totalDatabases: ((instanceData?.ListOfDatabases as unknown[])?.length) ?? 0,
        },
        services: [
          { name: "Dashboard + HTTP API", port: 27018, running: true },
          { name: "AxioDBCloud TCP", port: 27019, running: Boolean(process.env.AXIODB_TCP === "true") },
          { name: "MCP server", port: 27020, running: Boolean(AxioDBInstance.isMCP || process.env.AXIODB_MCP === "true"), note: "Native in core & Docker" },
        ],
      });
    },
  );

  router.get("/routes", async (request, reply) => {
    const Reply: ResponseBuilder = buildResponse(
      StatusCodes.OK,
      "Available routes",
      AvailableRoutes,
    );
    return reply.status(200).send(Reply);
  });

  router.get(
    "/dashboard-stats",
    { preHandler: [requireAuth, requireFreshPassword, requirePermission(PERMISSIONS.DASHBOARD_VIEW)] },
    async () => {
      return new StatsController(AxioDBInstance).getDashBoardStat();
    },
  );

  await router.register(dbRouter, {
    prefix: "/db",
    AxioDBInstance: AxioDBInstance,
  });

  await router.register(collectionRouter, {
    prefix: "/collection",
    AxioDBInstance: AxioDBInstance,
  });

  await router.register(OperationRouter, {
    prefix: "/operation",
    AxioDBInstance: AxioDBInstance,
  });

  await router.register(indexRouter, {
    prefix: "/index",
    AxioDBInstance: AxioDBInstance,
  });

  await router.register(authRouter, { prefix: "/auth" });
  await router.register(userManagementRouter, { prefix: "/auth/users" });
  await router.register(roleManagementRouter, { prefix: "/auth/roles" });

  router.setNotFoundHandler((request, reply) => {
    return reply
      .status(404)
      .send(
        buildResponse(
          StatusCodes.NOT_FOUND,
          `Route ${request.method}:${request.url} not found`,
        ),
      );
  });
}
