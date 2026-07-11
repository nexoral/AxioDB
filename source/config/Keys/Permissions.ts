// Predefined permission catalogue and role matrix for the Control Server's RBAC system.

export const PERMISSIONS = {
  DB_VIEW: "db:view",
  DB_CREATE: "db:create",
  DB_DELETE: "db:delete",
  DB_EXPORT: "db:export",
  DB_IMPORT: "db:import",

  COLLECTION_VIEW: "collection:view",
  COLLECTION_CREATE: "collection:create",
  COLLECTION_DELETE: "collection:delete",

  DOCUMENT_VIEW: "document:view",
  DOCUMENT_QUERY: "document:query",
  DOCUMENT_CREATE: "document:create",
  DOCUMENT_UPDATE: "document:update",
  DOCUMENT_DELETE: "document:delete",
  DOCUMENT_AGGREGATE: "document:aggregate",

  DASHBOARD_VIEW: "dashboard:view",

  USER_VIEW: "user:view",
  USER_CREATE: "user:create",
  USER_UPDATE_ROLE: "user:update-role",
  USER_RESET_PASSWORD: "user:reset-password",
  USER_DELETE: "user:delete",

  ROLE_VIEW: "role:view",
  ROLE_CREATE: "role:create",
  ROLE_DELETE: "role:delete",

  INDEX_VIEW: "index:view",
  INDEX_CREATE: "index:create",
  INDEX_DELETE: "index:delete",
} as const;

export type PermissionKey = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

interface PermissionCatalogueEntry {
  key: PermissionKey;
  group: string;
  description: string;
}

export const PERMISSION_CATALOGUE: PermissionCatalogueEntry[] = [
  { key: PERMISSIONS.DB_VIEW, group: "Database", description: "View the list of databases and dashboard database counts" },
  { key: PERMISSIONS.DB_CREATE, group: "Database", description: "Create new databases" },
  { key: PERMISSIONS.DB_DELETE, group: "Database", description: "Delete databases" },
  { key: PERMISSIONS.DB_EXPORT, group: "Database", description: "Export a database as a compressed archive" },
  { key: PERMISSIONS.DB_IMPORT, group: "Database", description: "Import a database from a compressed archive" },

  { key: PERMISSIONS.COLLECTION_VIEW, group: "Collection", description: "View collections inside a database" },
  { key: PERMISSIONS.COLLECTION_CREATE, group: "Collection", description: "Create new collections" },
  { key: PERMISSIONS.COLLECTION_DELETE, group: "Collection", description: "Delete collections" },

  { key: PERMISSIONS.DOCUMENT_VIEW, group: "Document", description: "View documents inside a collection" },
  { key: PERMISSIONS.DOCUMENT_QUERY, group: "Document", description: "Query documents with filters" },
  { key: PERMISSIONS.DOCUMENT_CREATE, group: "Document", description: "Create new documents" },
  { key: PERMISSIONS.DOCUMENT_UPDATE, group: "Document", description: "Update existing documents" },
  { key: PERMISSIONS.DOCUMENT_DELETE, group: "Document", description: "Delete documents" },
  { key: PERMISSIONS.DOCUMENT_AGGREGATE, group: "Document", description: "Run aggregation pipelines" },

  { key: PERMISSIONS.DASHBOARD_VIEW, group: "Dashboard", description: "View dashboard statistics" },

  { key: PERMISSIONS.USER_VIEW, group: "User Management", description: "View the list of users" },
  { key: PERMISSIONS.USER_CREATE, group: "User Management", description: "Create new users" },
  { key: PERMISSIONS.USER_UPDATE_ROLE, group: "User Management", description: "Change a user's assigned role" },
  { key: PERMISSIONS.USER_RESET_PASSWORD, group: "User Management", description: "Reset a user's password" },
  { key: PERMISSIONS.USER_DELETE, group: "User Management", description: "Delete a user" },

  { key: PERMISSIONS.ROLE_VIEW, group: "Role Management", description: "View the list of roles and the permission catalogue" },
  { key: PERMISSIONS.ROLE_CREATE, group: "Role Management", description: "Create new roles from the predefined permission catalogue" },
  { key: PERMISSIONS.ROLE_DELETE, group: "Role Management", description: "Delete a custom role that is not a predefined system role and has no users assigned" },

  { key: PERMISSIONS.INDEX_VIEW, group: "Index", description: "View the list of indexes on a collection" },
  { key: PERMISSIONS.INDEX_CREATE, group: "Index", description: "Create new indexes on a collection" },
  { key: PERMISSIONS.INDEX_DELETE, group: "Index", description: "Delete an index from a collection" },
];

export const ALL_PERMISSION_KEYS: string[] = PERMISSION_CATALOGUE.map((entry) => entry.key);

const DATA_PLANE_PERMISSIONS: string[] = [
  PERMISSIONS.DB_VIEW,
  PERMISSIONS.DB_CREATE,
  PERMISSIONS.DB_DELETE,
  PERMISSIONS.DB_EXPORT,
  PERMISSIONS.DB_IMPORT,
  PERMISSIONS.COLLECTION_VIEW,
  PERMISSIONS.COLLECTION_CREATE,
  PERMISSIONS.COLLECTION_DELETE,
  PERMISSIONS.DOCUMENT_VIEW,
  PERMISSIONS.DOCUMENT_QUERY,
  PERMISSIONS.DOCUMENT_CREATE,
  PERMISSIONS.DOCUMENT_UPDATE,
  PERMISSIONS.DOCUMENT_DELETE,
  PERMISSIONS.DOCUMENT_AGGREGATE,
  PERMISSIONS.DASHBOARD_VIEW,
  PERMISSIONS.INDEX_VIEW,
  PERMISSIONS.INDEX_CREATE,
  PERMISSIONS.INDEX_DELETE,
];

const VIEW_ONLY_PERMISSIONS: string[] = [
  PERMISSIONS.DB_VIEW,
  PERMISSIONS.COLLECTION_VIEW,
  PERMISSIONS.DOCUMENT_VIEW,
  PERMISSIONS.DOCUMENT_QUERY,
  PERMISSIONS.DOCUMENT_AGGREGATE,
  PERMISSIONS.DASHBOARD_VIEW,
  PERMISSIONS.INDEX_VIEW,
];

export const SUPER_ADMIN_ROLE = "Super Admin";
export const ADMIN_ROLE = "Admin";
export const VIEW_ROLE = "View";

export const PREDEFINED_ROLES: { roleName: string; permissions: string[] }[] = [
  { roleName: SUPER_ADMIN_ROLE, permissions: ALL_PERMISSION_KEYS },
  { roleName: ADMIN_ROLE, permissions: DATA_PLANE_PERMISSIONS },
  { roleName: VIEW_ROLE, permissions: VIEW_ONLY_PERMISSIONS },
];

export const RESERVED_DB_NAME = "config";

/** The `config` database backs the RBAC system and must never be reachable through the generic Database/Collection/Operation routes. */
export function isReservedDatabaseName(name: string): boolean {
  return typeof name === "string" && name.toLowerCase() === RESERVED_DB_NAME;
}

export const CONFIG_USERS_COLLECTION = "users";
export const CONFIG_ROLES_COLLECTION = "roles";
export const CONFIG_PERMISSIONS_COLLECTION = "permissions";

export const DEFAULT_ADMIN_USERNAME = "admin";
export const DEFAULT_ADMIN_PASSWORD = "admin";

export const SESSION_COOKIE_NAME = "axiodb_session";
export const SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
export const SESSION_SWEEP_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Login rate limiting - shared by the GUI's /auth/login route and the TCP AUTHENTICATE
 * command (see LoginRateLimiter.service.ts). Tracked per client IP: after
 * LOGIN_RATE_LIMIT_MAX_ATTEMPTS failures within LOGIN_RATE_LIMIT_WINDOW_MS, that IP is
 * locked out for LOGIN_RATE_LIMIT_COOLDOWN_MS.
 */
export const LOGIN_RATE_LIMIT_MAX_ATTEMPTS = 5;
export const LOGIN_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
export const LOGIN_RATE_LIMIT_COOLDOWN_MS = 15 * 60 * 1000; // 15 minutes
export const LOGIN_RATE_LIMIT_SWEEP_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
