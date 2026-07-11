/* eslint-disable @typescript-eslint/no-unused-vars */
import Fastify from "fastify";
import fastifyCors from "@fastify/cors";
import fastifyStatic from "@fastify/static";
import fastifyCookie from "@fastify/cookie";
import path from "path";
import fs from "fs";
import { CORS_CONFIG, ServerKeys, staticPath } from "./keys";
import checkPortAndDocker from "./PortFreeChecker";
import { AxioDB } from "../../Services/Indexation.operation";
import router from "../router/Router";
import SessionStore from "../../Services/Auth/SessionStore.service";

export default async function createAxioDBControlServer(
  AxioDBInstance: AxioDB,
): Promise<void> {
  await checkPortAndDocker(ServerKeys.PORT);

  const AxioDBControlServer = Fastify({
    logger: false,
    trustProxy: true,
    bodyLimit: 52428800, // 50MB
  });

  await AxioDBControlServer.register(fastifyCors, {
    origin: CORS_CONFIG.ORIGIN,
    methods: CORS_CONFIG.METHODS,
    allowedHeaders: CORS_CONFIG.ALLOWED_HEADERS,
    credentials: CORS_CONFIG.ALLOW_CREDENTIALS,
    exposedHeaders: CORS_CONFIG.EXPOSED_HEADERS,
    maxAge: CORS_CONFIG.MAX_AGE, // preflight cache duration
  });

  // Cookie support for session-based authentication (no signing secret needed -
  // the cookie value is meaningless without a matching entry in SessionStore's map)
  await AxioDBControlServer.register(fastifyCookie);

  AxioDBControlServer.addContentTypeParser(
    "application/json",
    { parseAs: "string", bodyLimit: 52428800 },
    (req, body, done) => {
      try {
        const json = JSON.parse(body as string);
        done(null, json);
      } catch (err) {
        done(err as Error, undefined);
      }
    },
  );

  // Registered before the SPA fallback route below, so static assets are served directly
  // rather than falling through to index.html.
  await AxioDBControlServer.register(fastifyStatic, {
    root: staticPath,
    prefix: "/",
    decorateReply: false,
  });

  // SPA fallback: any non-API, non-static route gets the React app's index.html
  AxioDBControlServer.get("/", async (request, reply) => {
    const indexPath = path.join(staticPath, "index.html");
    const stream = fs.createReadStream(indexPath);
    return reply.type("text/html").send(stream);
  });

  AxioDBControlServer.register(router, {
    prefix: "/api",
    AxioDBInstance,
  });

  try {
    await AxioDBControlServer.listen({
      port: Number(ServerKeys.PORT),
      host: "0.0.0.0",
    });
    SessionStore.startCleanupSweep();
    console.log(
      `AxioDB Control Server is running on http://localhost:${ServerKeys.PORT}`,
    );
  } catch (err) {
    AxioDBControlServer.log.error(err);
    process.exit(1);
  }
}
