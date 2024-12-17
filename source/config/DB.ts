// Import All Required Sub Modules
import { SchemaTypes } from "../Models/DataTypes.models";
import schemaValidate from "../Models/validator.models";
import Configure from "../Operation/Indexation.operation";
// Web Server Configuration
import WebServer from "../Web/Fastify";

// Initialize Configuration Cluster in start
WebServer().then((r) => console.log(r));
new Configure().CreateTreeRoot().then((r  ) => console.log(r));

// Export Specific Modules
export { SchemaTypes, schemaValidate, Configure };

// Export With All Sub Modules
export default {
  SchemaTypes,
  schemaValidate,
  Configure
};