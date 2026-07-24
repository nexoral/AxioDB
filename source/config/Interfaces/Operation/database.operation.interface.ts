/* eslint-disable @typescript-eslint/no-explicit-any */

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
