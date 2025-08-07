import { DatabaseMap } from "./database.operation.interface";

export interface FinalDatabaseInfo {
  CurrentPath: string;
  RootName: string;
  MatrixUnits: string;
  TotalSize: number;
  TotalDatabases: string;
  ListOfDatabases: string[];
  DatabaseMap: Map<string, DatabaseMap>;
  AllDatabasesPaths: string[];
}
