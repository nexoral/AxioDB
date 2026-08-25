import { InMemoryCache } from "../Memory/memory.operation";
import Converter from "../Helper/Converter.helper";
import ResponseHelper from "../Helper/response.helper";
import Aggregation from "../Services/Aggregation/Aggregation.Operation";
import { OperatorRegistry } from "../Services/Aggregation/OperatorRegistry";
import Collection from "../Services/Collection/collection.operation";
import Database from "../Services/Database/database.operation";
import { AxioDB } from "../Services/Indexation.operation";
import { AxioDBCloud } from "../client/AxioDBCloud.client";
import FileManager from "../engine/Filesystem/FileManager";
import FolderManager from "../engine/Filesystem/FolderManager";

const InstanceTypes = {
  Collection,
  Database,
  Aggregation,
  OperatorRegistry,
  FileManager,
  FolderManager,
  Converter,
  ResponseHelper,
  InMemoryCache,
};

export { AxioDB, AxioDBCloud, InstanceTypes, OperatorRegistry };

export default {
  AxioDB,
  AxioDBCloud,
  InstanceTypes,
  OperatorRegistry,
};
