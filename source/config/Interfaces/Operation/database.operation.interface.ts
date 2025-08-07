/* eslint-disable @typescript-eslint/no-explicit-any */

// Map Interface for metadata
export interface CollectionMap {
  isCryptoEnabled: boolean;
  cryptoKey?: string;
  path: string;
  schema?: any;
  isSchema: boolean;
}
export interface DatabaseMap {
  DatabaseName: string;
  path: string;
}
export interface FinalCollectionsInfo {
  CurrentPath: string;
  RootName: string;
  MatrixUnits: string;
  TotalSize: number;
  TotalCollections: number | string;
  ListOfCollections: string[];
  CollectionMap: Map<string, CollectionMap>;
  AllCollectionsPaths: string[];
}
