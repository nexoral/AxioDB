// Import All Required Sub Modules
import { InMemoryCache } from "../Caching/cache.operation";
import Converter from "../Helper/Converter.helper";
import { CryptoHelper } from "../Helper/Crypto.helper";
import ResponseHelper from "../Helper/response.helper";
import { SchemaTypes } from "../Models/DataTypes.models";
import schemaValidate from "../Models/validator.models";
import Aggregation from "../Operation/Aggregation/Aggregation.Operation";
import Collection from "../Operation/Collection/collection.operation";
import Database from "../Operation/Database/database.operation";
import { AxioDB } from "../Operation/Indexation.operation";
import FileManager from "../engine/Storage/FileManager";
import FolderManager from "../engine/Storage/FolderManager";

// Export All Required Sub Modules Instance Types to support TypeScript
const InstanceTypes = {
  Collection,
  Database,
  Aggregation,
  FileManager,
  FolderManager,
  Converter,
  CryptoHelper,
  ResponseHelper,
  InMemoryCache,
};
// Export Specific Modules
export { SchemaTypes, schemaValidate, AxioDB, InstanceTypes };

// Export With All Sub Modules
export default {
  SchemaTypes,
  schemaValidate,
  AxioDB,
  InstanceTypes,
};
