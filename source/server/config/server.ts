/* eslint-disable @typescript-eslint/no-unused-vars */
import Fastify from "fastify";
import fastifyCors from "@fastify/cors";
import fastifyStatic from "@fastify/static";
import path from "path";
import fs from "fs";
import { CORS_CONFIG, ServerKeys, staticPath } from "./keys";
import checkPortAndDocker from "./PortFreeChecker";
import { AxioDB } from "../../Services/Indexation.operation";
import router from "../router/Router";

export default async function createAxioDBControlServer(
  AxioDBInstance: AxioDB,
): Promise<void> {
  await checkPortAndDocker(ServerKeys.PORT);

  const AxioDBControlServer = Fastify({
    logger: false, // Disable default logging
    trustProxy: true, // Trust the reverse proxy headers
    bodyLimit: 52428800, // Set body limit to 50MB
  });

  // Attach Middlewares
  await AxioDBControlServer.register(fastifyCors, {
    origin: CORS_CONFIG.ORIGIN, // Allow all origins
    methods: CORS_CONFIG.METHODS, // Allow specific methods
    allowedHeaders: CORS_CONFIG.ALLOWED_HEADERS, // Allow specific headers
    credentials: CORS_CONFIG.ALLOW_CREDENTIALS, // Allow credentials
    exposedHeaders: CORS_CONFIG.EXPOSED_HEADERS, // Expose specific headers
    maxAge: CORS_CONFIG.MAX_AGE, // Cache preflight response for 24 hours
  });

  // Configure JSON parsing
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

  // Serve static files first (JS, CSS, images)
  await AxioDBControlServer.register(fastifyStatic, {
    root: staticPath,
    prefix: "/",
    decorateReply: false,
  });

  // Serve React app for all other routes as SPA fallback
  AxioDBControlServer.get("/", async (request, reply) => {
    const indexPath = path.join(staticPath, "index.html");
    const stream = fs.createReadStream(indexPath);
    return reply.type("text/html").send(stream);
  });

  // Register the main router with /api prefix
  AxioDBControlServer.register(router, {
    prefix: "/api",
  });

  try {
    await AxioDBControlServer.listen({
      port: Number(ServerKeys.PORT),
      host: "0.0.0.0",
    });
    console.log(
      `AxioDB Control Server is running on http://localhost:${ServerKeys.PORT}`,
    );
  } catch (err) {
    AxioDBControlServer.log.error(err);
    process.exit(1);
  }
}
