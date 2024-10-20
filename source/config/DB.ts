// Import All Required Sub Modules
import { SchemaTypes } from "../Models/DataTypes.models";
import FileManager from "../Storage/FileManager";
import FolderManager from "../Storage/FolderManager";

// Default Keys
export const DBMS_Name: string = "AxioDB";
export const DBMS_File_EXT: string = ".axiodb";

// Export Specific Modules
export { SchemaTypes, FileManager, FolderManager };

// Export With All Sub Modules
export default {
  SchemaTypes,
  FileManager,
  FolderManager,
};
