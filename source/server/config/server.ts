import { ServerKeys } from "./keys";
import checkPortAndDocker from "./PortFreeChecker";
import { AxioDB } from "../../Services/Indexation.operation";
import mainRouter from "../router/Router";
import SessionStore from "../../Services/Auth/SessionStore.service";
import HttpTransactionManager from "../helper/HttpTransactionManager.helper";
import Logger from "../../Helper/Logger.helper";
import HttpRouter from "../../Helper/http/HttpRouter.helper";
import HttpServerHelper from "../../Helper/http/HttpServer.helper";

const WELCOME_MESSAGE = `Welcome to AxioDB!

The HTTP REST API is running on port 27018.

To download the official Desktop GUI (AxioDB Control), run:
  Linux / macOS:
    curl -fsSL https://raw.githubusercontent.com/nexoral/AxioDB/main/cli/Scripts/install.sh | CHOICE=2 bash

  Windows (PowerShell):
    irm https://raw.githubusercontent.com/nexoral/AxioDB/main/cli/Scripts/install.ps1 | iex

Explore the REST API:
  Health check: /api/health
  API Routes:   /api/routes
`;

export default async function createAxioDBControlServer(
  AxioDBInstance: AxioDB,
): Promise<void> {
  await checkPortAndDocker(ServerKeys.PORT);

  const rootRouter = new HttpRouter();

  rootRouter.get("/", async (_request, reply) => {
    return reply.type("text/plain; charset=utf-8").send(WELCOME_MESSAGE);
  });

  await rootRouter.register(mainRouter, {
    prefix: "/api",
    AxioDBInstance,
  });

  const server = new HttpServerHelper(rootRouter, {
    bodyLimit: 52428800,
  });

  try {
    const host = process.env.AXIODB_HOST || "127.0.0.1";
    await server.listen(Number(ServerKeys.PORT), host);
    SessionStore.startCleanupSweep();
    HttpTransactionManager.getInstance().startCleanupSweep();
    Logger.info(
      `AxioDB Control Server is running on http://localhost:${ServerKeys.PORT}`,
    );
  } catch (err) {
    Logger.error("Failed to start AxioDB Control Server:", err);
    process.exit(1);
  }
}
