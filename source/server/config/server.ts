import Fastify from "fastify";
import fastifyCors from "@fastify/cors";
import fastifyStatic from "@fastify/static";
import path from "path";
import fs from "fs";
import { ServerKeys, staticPath } from "./keys";

export default async function createAxioDBControlServer() {
  const AxioDBControlServer = Fastify({
    logger: false, // Disable default logging
    trustProxy: true, // Trust the reverse proxy headers
    bodyLimit: 52428800, // Set body limit to 50MB
  });

  // Attach Middlewares
  await AxioDBControlServer.register(fastifyCors, {
    origin: "*", // Allow all origins
    methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE"], // Allow specific methods
    allowedHeaders: ["Content-Type", "Authorization"], // Allow specific headers
    credentials: true, // Allow credentials
    exposedHeaders: ["Content-Length", "X-Requested-With"], // Expose specific headers
    maxAge: 86400, // Cache preflight response for 24 hours
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

  // Link React build output

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

  try {
    await AxioDBControlServer.listen({
      port: ServerKeys.PORT,
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
