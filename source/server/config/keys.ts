/* eslint-disable @typescript-eslint/no-explicit-any */
import path from "path";

export enum ServerKeys {
  PORT = 27018,
  LOCALHOST = "127.0.1",
  DEFAULT_KEY_EXPIRE = "24h",
  DEFAULT_KEY_ISSUER = "AxioDB Server",
  DEFAULT_KEY_AUDIENCE = "AxioDB Client",
  DEFAULT_KEY_REASON = "For Transacting with AxioDB Server",
  DEFAULT_KEY_TIMESTAMP = Date.now(),
  DEFAULT_KEY_ROUNDS = 1,
}

// NOTE: ORIGIN cannot be "*" while ALLOW_CREDENTIALS is true - browsers reject
// wildcard origins on credentialed (cookie-bearing) requests. 5173 is the GUI's
// Vite dev server; 27018 is where the built GUI is served from in production
// (same-origin there, so CORS doesn't matter for that case).
export const CORS_CONFIG = {
  ORIGIN: ["http://localhost:5173", "http://localhost:27018"],
  METHODS: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE"],
  ALLOWED_HEADERS: ["Content-Type", "Authorization"],
  EXPOSED_HEADERS: ["Content-Length", "X-Requested-With"],
  MAX_AGE: 86400, // 24 hours in seconds
  ALLOW_CREDENTIALS: true,
};

export const staticPath: string = path.resolve(
  __dirname,
  "../public/AxioControl",
);

interface MainRoutesInterface {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  path: string;
  description: string;
  payload?: Record<string, any>;
}
interface RouteGroupInterface {
  groupName?: string;
  description: string;
  Paths: MainRoutesInterface[];
}

export const AvailableRoutes: RouteGroupInterface[] = [
  {
    groupName: "Information",
    description: "Information Endpoints",
    Paths: [
      {
        method: "GET",
        path: "/api/info",
        description: "To Get Internal Information about this DB",
      },
      {
        method: "GET",
        path: "/api/health",
        description: "Health check endpoint to verify server status",
      },
      {
        method: "GET",
        path: "/api/routes",
        description: "List all available API routes",
      },
    ],
  },
  {
    groupName: "Database",
    description: "Database Management Endpoints",
    Paths: [
      {
        method: "GET",
        path: "/api/db/databases/",
        description: "Get a list of all databases",
      },
      {
        method: "POST",
        path: "/api/db/create-database/",
        description: "Create a new database",
        payload: {
          name: "string",
        },
      },
      {
        method: "DELETE",
        path: "/api/db/delete-database/",
        description: "Delete a database",
        payload: {
          name: "string",
        },
      },
      {
        method: "GET",
        path: "/api/db/export-database/?dbName",
        description: "Export a database as a compressed file",
      },
      {
        method: "POST",
        path: "/api/db/import-database/",
        description: "Import a database from a compressed file",
        payload: {
          file: "file",
        },
      },
    ],
  },
  {
    groupName: "Collection",
    description: "Collection Management Endpoints",
    Paths: [
      {
        method: "GET",
        path: "/api/collection/all/?databaseName",
        description: "Get a list of all collections",
      },
      {
        method: "POST",
        path: "/api/collection/create-collection/",
        description: "Create a new collection",
        payload: {
          dbName: "string",
          collectionName: "string",
          crypto: "boolean",
          key: "string",
        },
      },
      {
        method: "DELETE",
        path: "/api/collection/delete-collection/?dbName&collectionName",
        description: "Delete a collection",
      },
    ],
  },
  {
    groupName: "Index",
    description: "Index Management Endpoints",
    Paths: [
      {
        method: "GET",
        path: "/api/index/list/?dbName&collectionName",
        description: "List all indexes registered on a collection",
      },
      {
        method: "POST",
        path: "/api/index/create/",
        description: "Create one or more indexes on a collection",
        payload: {
          dbName: "string",
          collectionName: "string",
          fieldNames: "array",
        },
      },
      {
        method: "DELETE",
        path: "/api/index/delete/?dbName&collectionName&indexName",
        description: "Delete an index from a collection",
      },
    ],
  },
  {
    groupName: "CRUD Operations",
    description: "CRUD Operations Endpoints",
    Paths: [
      {
        method: "GET",
        description: "Get all documents from a collection",
        path: "/api/operation/all/?dbName&collectionName&page",
      },
      {
        method: "POST",
        description: "Get all documents from a collection by query",
        path: "/api/operation/all/by-query/?dbName&collectionName&page",
        payload: {
          query: "object",
        },
      },
      {
        method: "GET",
        description: "Get specific documents from a collection by ID",
        path: "/api/operation/all/by-id/?dbName&collectionName&documentId",
      },
      {
        method: "POST",
        description: "Create a new document in a collection",
        path: "/api/operation/create/?dbName&collectionName",
        payload: {
          document: "full object with no key in body",
        },
      },
      {
        method: "POST",
        description: "Create a new document in a collection",
        path: "/api/operation/create-many/?dbName&collectionName",
        payload: {
          documents: "full array of object with no key in body",
        },
      },
      {
        method: "PUT",
        description: "Update an existing document in a collection by ID",
        path: "/api/operation/update/by-id/?dbName&collectionName&documentId",
        payload: {
          document: "full object with no key in body",
        },
      },
      {
        method: "PUT",
        description: "Update an existing document in a collection by query",
        path: "/api/operation/update/by-query/?dbName&isMany&collectionName",
        payload: {
          query: "object",
          update: "object",
        },
      },
      {
        method: "DELETE",
        description: "Delete an existing document in a collection by ID",
        path: "/api/operation/delete/by-id/?dbName&collectionName&documentId",
      },
      {
        method: "DELETE",
        description: "Delete an existing document in a collection by query",
        path: "/api/operation/delete/by-query/?dbName&collectionName&isMany&documentId",
        payload: {
          query: "object",
        },
      },
      {
        method: "POST",
        description:
          "Perform aggregation on documents in a collection using an aggregation pipeline",
        path: "/api/operation/aggregate/?dbName&collectionName",
        payload: {
          aggregation: "array",
        },
      },
    ],
  },
  {
    groupName: "Authentication",
    description: "Login, session, and self-service password endpoints",
    Paths: [
      {
        method: "POST",
        path: "/api/auth/login",
        description: "Authenticate with username/password and start a session",
        payload: { username: "string", password: "string" },
      },
      {
        method: "POST",
        path: "/api/auth/logout",
        description: "End the current session",
      },
      {
        method: "GET",
        path: "/api/auth/me",
        description: "Get the currently authenticated user's role and permissions",
      },
      {
        method: "PATCH",
        path: "/api/auth/change-password",
        description: "Change the current user's own password",
        payload: { currentPassword: "string", newPassword: "string" },
      },
    ],
  },
  {
    groupName: "User & Role Management",
    description: "Super Admin-only endpoints for managing users and roles",
    Paths: [
      {
        method: "GET",
        path: "/api/auth/users",
        description: "List all users",
      },
      {
        method: "POST",
        path: "/api/auth/users",
        description: "Create a new user",
        payload: { username: "string", password: "string", role: "string" },
      },
      {
        method: "PATCH",
        path: "/api/auth/users/:username/role",
        description: "Change a user's assigned role",
        payload: { role: "string" },
      },
      {
        method: "PATCH",
        path: "/api/auth/users/:username/reset-password",
        description: "Reset a user's password (forces change on next login)",
        payload: { newPassword: "string" },
      },
      {
        method: "DELETE",
        path: "/api/auth/users/:username",
        description: "Delete a user",
      },
      {
        method: "GET",
        path: "/api/auth/roles",
        description: "List all roles",
      },
      {
        method: "POST",
        path: "/api/auth/roles",
        description: "Create a new role from the predefined permission catalogue",
        payload: { roleName: "string", permissions: "array" },
      },
      {
        method: "GET",
        path: "/api/auth/roles/permissions",
        description: "List the full predefined permission catalogue",
      },
    ],
  },
];

type AuthorInfoType = {
  name: string;
  Designation: string;
  Country: string;
  Email: string;
  LinkedIn: string;
  github: string;
};

export const AuthorInfo: AuthorInfoType = {
  name: "Ankan Saha",
  Designation: "Software Engineer",
  Country: "India",
  Email: "ankansahaofficial@gmail.com",
  LinkedIn: "https://www.linkedin.com/in/theankansaha/",
  github: "https://github.com/AnkanSaha",
};
