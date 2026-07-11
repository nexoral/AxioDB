import { InMemoryCache } from "../Memory/memory.operation";
import Converter from "../Helper/Converter.helper";
import { CryptoHelper } from "../Helper/Crypto.helper";
import ResponseHelper from "../Helper/response.helper";
import Aggregation from "../Services/Aggregation/Aggregation.Operation";
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
  FileManager,
  FolderManager,
  Converter,
  CryptoHelper,
  ResponseHelper,
  InMemoryCache,
};

export { AxioDB, AxioDBCloud, InstanceTypes };

export default {
  AxioDB,
  AxioDBCloud,
  InstanceTypes,
};
