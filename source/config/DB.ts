// Import All Required Sub Modules
import { General } from "./Keys/Keys";
import { SchemaTypes } from "../Models/DataTypes.models";
import schemaValidate from "../Models/validator.models";
import Configure from "../Operation/Indexation.operation";
// Web Server Configuration
import WebServer from "../server/Fastify";

// Initialize Configuration Cluster in start
WebServer();
new Configure(General.DBMS_Name).CreateTreeRoot().then((r) => console.log(r));

// Export Specific Modules
export { SchemaTypes, schemaValidate, Configure };

// Export With All Sub Modules
export default {
  SchemaTypes,
  schemaValidate,
  Configure,
};
