import path from "path";
import fs from "fs";
import { ServerKeys, staticPath } from "./keys";
import checkPortAndDocker from "./PortFreeChecker";
import { AxioDB } from "../../Services/Indexation.operation";
import mainRouter from "../router/Router";
import SessionStore from "../../Services/Auth/SessionStore.service";
import Logger from "../../Helper/Logger.helper";
import HttpRouter from "../../Helper/http/HttpRouter.helper";
import HttpServerHelper from "../../Helper/http/HttpServer.helper";

export default async function createAxioDBControlServer(
  AxioDBInstance: AxioDB,
  guiEnabled: boolean = true,
): Promise<void> {
  await checkPortAndDocker(ServerKeys.PORT);

  const rootRouter = new HttpRouter();

  if (guiEnabled) {
    rootRouter.get("/", async (_request, reply) => {
      const indexPath = path.join(staticPath, "index.html");
      const stream = fs.createReadStream(indexPath);
      return reply.type("text/html").send(stream);
    });
  } else {
    rootRouter.get("/", async (_request, reply) => {
      return reply.type("application/json").send({
        message: "AxioDB HTTP API is running. GUI is disabled. Enable it with GUI: true.",
        api: "/api/health",
      });
    });
  }

  await rootRouter.register(mainRouter, {
    prefix: "/api",
    AxioDBInstance,
  });

  const server = new HttpServerHelper(rootRouter, {
    guiEnabled,
    staticPath,
    bodyLimit: 52428800,
  });

  try {
    const host = process.env.AXIODB_HOST || "127.0.0.1";
    await server.listen(Number(ServerKeys.PORT), host);
    SessionStore.startCleanupSweep();
    Logger.info(
      `AxioDB Control Server is running on http://localhost:${ServerKeys.PORT}`,
    );
  } catch (err) {
    Logger.error("Failed to start AxioDB Control Server:", err);
    process.exit(1);
  }
}
