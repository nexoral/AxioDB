// Import TCP Server Configuration
import net from "node:net";
import { ServerPorts } from "../config/Keys";
import Collection from "axiodb/lib/Operation/Collection/collection.operation";
import Database from "axiodb/lib/Operation/Database/database.operation";
import { AxioDB } from "axiodb";
const PORT: number = Number(ServerPorts.TCP) || 27018;

// Interface
interface ServerOptions {
  CentralAuthCollection: Collection;
  CentralDB: Database;
  CentralDBInstance: AxioDB;
}

const tcpServer = async (options?: ServerOptions) => {
  const server = net.createServer((socket) => {
    console.log("Client connected");

    socket.on("data", (Command: string) => {
      console.log("Received from client:", Command.toString());
      socket.write(`Echo: ${Command}`);
    });

    socket.on("end", () => {
      console.log("Client disconnected");
    });

    socket.on("error", (err: Error) => {
      console.error("Socket Error:", err.message);
    });
  });

  server.listen(PORT, () => {
    console.log(`TCP Server listening on port ${PORT}`);
  });
};

export default tcpServer;
