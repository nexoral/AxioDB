import { DatabaseMap } from "./database.operation.interface";

export interface AxioDBOptions {
  GUI?: boolean;
  RootName?: string;
  CustomPath?: string;
  TCP?: boolean;
}

export interface FinalDatabaseInfo {
  CurrentPath: string;
  RootName: string;
  TotalSize: number;
  TotalDatabases: string;
  ListOfDatabases: string[];
  DatabaseMap: Map<string, DatabaseMap>;
  AllDatabasesPaths: string[];
}
