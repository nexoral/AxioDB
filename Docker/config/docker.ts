// Import all Servers
import restStart from "../Server/Fastify/Fastify";
import tcpServer from "../Server/TCP";
import GRPC_SERVER from "../Server/GRPC/GRPC";
import { udpServer } from "../Server/UDP";
import { Console } from "outers";

// Import AxioDB for Storing the Fastify Server Related Information & Authentication
import { AxioDB } from "axiodb";
import { CentralInformation } from "./Keys"; // Import Central Information from Keys

const main = async () => {
  /// Create Central Database Instance
  const centralAxioDBInstance: AxioDB = new AxioDB(
    CentralInformation.CentralDB_InstanceName,
    ".",
  );
  Console.green(
    `Central AxioDB Instance Created with ${CentralInformation.CentralDB_InstanceName}`,
  );
  /// Create Central Database
  const centralDB = await centralAxioDBInstance.createDB(
    CentralInformation.CentralDB_Name,
  );
  Console.green(
    `Central AxioDB Database Created with ${CentralInformation.CentralDB_Name}`,
  );
  const centralAuthCollection = await centralDB.createCollection(
    CentralInformation.CentralDB_Collection_Auth,
    CentralInformation.CentralDB_Auth_UserCollection_Schema,
  );
  Console.green(
    `Central Auth Collection Created with ${CentralInformation.CentralDB_Collection_Auth}`,
  );

  /// Start All Servers ========================== X ==========================

  // Start Fastify Server
  restStart({
    CentralAuthCollection: centralAuthCollection,
    CentralDB: centralDB,
    CentralDBInstance: centralAxioDBInstance,
  });

  // Start TCP Server
  tcpServer({
    CentralAuthCollection: centralAuthCollection,
    CentralDB: centralDB,
    CentralDBInstance: centralAxioDBInstance,
  });

  // Start GRPC Server
  GRPC_SERVER({
    CentralAuthCollection: centralAuthCollection,
    CentralDB: centralDB,
    CentralDBInstance: centralAxioDBInstance,
  });

  // Start UDP Server
  udpServer({
    CentralAuthCollection: centralAuthCollection,
    CentralDB: centralDB,
    CentralDBInstance: centralAxioDBInstance,
  });
};
main(); // Start the main function to start all servers
