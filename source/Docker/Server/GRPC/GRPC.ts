import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import path from "path";
import { ServerPorts } from "../../config/Keys";
import Collection from "axiodb/lib/Operation/Collection/collection.operation";
import Database from "axiodb/lib/Operation/Database/database.operation";
import { AxioDB } from "axiodb";

// Interface
interface ServerOptions {
  CentralAuthCollection: Collection;
  CentralDB: Database;
  CentralDBInstance: AxioDB;
}

const GRPC_SERVER = async (options?: ServerOptions) => {
  // Define the path to your proto file
  const PROTO_PATH = path.resolve(__dirname, "Protos/service.proto");

  // Load the proto file
  const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
  });

  // Load the package definition
  const protoDescriptor = grpc.loadPackageDefinition(packageDefinition);
  // Use the correct package name from the proto file
  const serviceProto = protoDescriptor.axio_db;

  // Create a minimal implementation that just acknowledges requests
  const serviceImplementation = {
    Get: (call: any, callback: any) => {
      callback(null, { success: true, value: "", error_message: "" });
    },
    Set: (call: any, callback: any) => {
      callback(null, { success: true, error_message: "" });
    },
    Delete: (call: any, callback: any) => {
      callback(null, { success: true, error_message: "" });
    },
    Exists: (call: any, callback: any) => {
      callback(null, { exists: false });
    },
    Keys: (call: any, callback: any) => {
      callback(null, { keys: [] });
    },
  };

  // Create a new gRPC server
  const server = new grpc.Server();

  // Add the service implementation to the server
  // @ts-ignore - Suppressing TypeScript error for dynamic service binding
  server.addService(serviceProto.AxioDBService.service, serviceImplementation);

  // Define the server address and port
  const serverAddress = `0.0.0.0:${ServerPorts.GRPC}`;

  // Start the server
  server.bindAsync(
    serverAddress,
    grpc.ServerCredentials.createInsecure(),
    (error, port) => {
      if (error) {
        console.error("Failed to bind server:", error);
        return;
      }

      server.start();
      console.log(`gRPC server started, listening on ${serverAddress}`);
    },
  );

  // Handle graceful shutdown
  process.on("SIGINT", () => {
    console.log("Shutting down gRPC server...");
    server.tryShutdown(() => {
      console.log("Server shut down successfully");
      process.exit(0);
    });
  });
};

export default GRPC_SERVER;
