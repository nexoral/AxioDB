import { DatabaseMap } from "./database.operation.interface";

export interface AxioDBOptions {
  GUI?: boolean;
  RootName?: string;
  CustomPath?: string;
  TCP?: boolean;
  /** Require username/password authentication (same RBAC users as the GUI) for TCP connections. Defaults to false. */
  TCPAuth?: boolean;
  /** Encrypt TCP connections with TLS instead of plaintext. Requires `TLSCertPath` and `TLSKeyPath`. Defaults to false - existing plaintext deployments are unaffected unless this is explicitly turned on. */
  TLS?: boolean;
  /** Path to a PEM-encoded TLS certificate file. Required when `TLS: true`. */
  TLSCertPath?: string;
  /** Path to the PEM-encoded private key file matching `TLSCertPath`. Required when `TLS: true`. */
  TLSKeyPath?: string;
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
