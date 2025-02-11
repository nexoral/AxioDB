// Import All Required Sub Modules
import { SchemaTypes } from "../Models/DataTypes.models";
import schemaValidate from "../Models/validator.models";
import {AxioDB } from "../Operation/Indexation.operation";
// Web Server Configuration
import WebServer from "../server/Fastify";

// Initialize Configuration Cluster in start
WebServer();

// Export Specific Modules
export { SchemaTypes, schemaValidate, AxioDB };

// Export With All Sub Modules
export default {
  SchemaTypes,
  schemaValidate,
  AxioDB,
};
