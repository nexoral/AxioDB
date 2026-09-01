
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
  collectionMetaStatus: Array<{ collectionName: string; path: string }>;
  AllCollectionsPaths: string[];
}
