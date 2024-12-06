import Fastify from "fastify";

// Import the Details
import { General } from "./Keys/Keys";

const Server = Fastify({ logger: true });

// Listen to the server
Server.listen({ port: General.PORT }, (err, address) => {
  if (err) {
    Server.log.error(err);
    process.exit(1);
  }
  Server.log.info(`AxioDB Web Interface is  listening on ${address}`);
});
