import Fastify from "fastify";
import { Console } from "outers";
import { WebServer as ConfigWebServer } from "../config/Keys/Keys";
import path from "path";
import fastifyStatic from "@fastify/static";

export default async function startWebServer() {
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
      process.exit(1);
    }
    Server.log.info(`AxioDB Web Interface is  listening on ${address}`);
    Console.green("Web Interface Server is running on", address);
  });
}
