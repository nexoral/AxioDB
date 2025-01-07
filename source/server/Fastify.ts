import Fastify from "fastify";
import { Console } from "outers";
import { WebServer as ConfigWebServer } from "../config/Keys/Keys";
import path from "path";
import fastifyStatic from "@fastify/static";

/**
 * Starts the web server using Fastify.
 *
 * This function initializes a Fastify server instance with logging disabled.
 * It registers a static file plugin to serve files from the "public" directory
 * with a URL prefix of "/public/".
 *
 * The server listens on the port specified in the configuration (`ConfigWebServer.ServerPORT`).
 * If an error occurs while starting the server, it logs the error and exits the process.
 * On successful start, it logs the address the server is listening on.
 *
 * @module Fastify
 */
export default function startWebServer() {
  const Server = Fastify({ logger: false });

  // Register static file plugin to serve files
  Server.register(fastifyStatic, {
    root: path.resolve(process.cwd(), "public"), // Directory for static files
    prefix: "/public/", // URL prefix for static files
  });

  // Listen to the server
  Server.listen({ port: ConfigWebServer.ServerPORT }, (err, address) => {
    if (err) {
      Server.log.error(err);
      Console.red("Failed to start the server", err);
    }
    Server.log.info(`AxioDB Web Interface is  listening on ${address}`);
    Console.green("Web Interface Server is running on", address);
  });
}
