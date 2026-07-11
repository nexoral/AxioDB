/* eslint-disable @typescript-eslint/no-explicit-any */

export interface CollectionMap {
  isCryptoEnabled: boolean;
  cryptoKey?: string;
  path: string;
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
  collectionMetaStatus: any[];
  AllCollectionsPaths: string[];
}
