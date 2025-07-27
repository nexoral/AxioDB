// Import All Required Sub Modules
import { InMemoryCache } from "../caching/cache.operation";
import Converter from "../Helper/Converter.helper";
import { CryptoHelper } from "../Helper/Crypto.helper";
import ResponseHelper from "../Helper/response.helper";
import { SchemaTypes } from "../Schema/DataTypes.models";
import schemaValidate from "../Schema/validator.models";
import Aggregation from "../Services/Aggregation/Aggregation.Operation";
import Collection from "../Services/Collection/collection.operation";
import Database from "../Services/Database/database.operation";
import { AxioDB } from "../Services/Indexation.operation";
import FileManager from "../engine/Filesystem/FileManager";
import FolderManager from "../engine/Filesystem/FolderManager";

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
