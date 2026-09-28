import { DatabaseMap } from "./database.operation.interface";

export interface AxioDBOptions {
  GUI?: boolean;
  /** Enable HTTP API server on port 27018. Auto-enables when GUI: true. If GUI: true and HTTP: false, throws error at startup. */
  HTTP?: boolean;
  RootName?: string;
  CustomPath?: string;
  TCP?: boolean;
  /** Require username/password authentication (same RBAC users as the GUI) for TCP connections. Defaults to false. */
  TCPAuth?: boolean;
  /**
   * Initial password for the seeded `admin` account, applied only when the `config` database
   * is first created. Sets `mustChangePassword: false` so the account is immediately usable
   * over TCP; omitting it keeps the default `admin`/`admin` and the existing rotation gate.
   */
  AdminPassword?: string;
  /** Encrypt TCP connections with TLS instead of plaintext. Requires `TLSCertPath` and `TLSKeyPath`. Defaults to false - existing plaintext deployments are unaffected unless this is explicitly turned on. */
  TLS?: boolean;
  /** Path to a PEM-encoded TLS certificate file. Required when `TLS: true`. */
  TLSCertPath?: string;
  /** Path to the PEM-encoded private key file matching `TLSCertPath`. Required when `TLS: true`. */
  TLSKeyPath?: string;
  /** Enable the built-in InMemoryCache. Defaults to true - when false the cache stores nothing and every read goes to disk. */
  Cache?: boolean;
  /** Minimum cache entry lifetime in minutes. Defaults to 5. */
  minTTL?: number;
  /** Maximum cache entry lifetime in minutes. Defaults to 15. */
  maxTTL?: number;
  /** Cache housekeeping cleanup cadence and search-query retention, in seconds. Defaults to 86400 (24 hours). */
  cacheClearUp?: number;
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
