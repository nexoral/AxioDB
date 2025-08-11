/* eslint-disable @typescript-eslint/no-explicit-any */
import path from "path";

export enum ServerKeys {
  PORT = 27018,
  LOCALHOST = "127.0.1",
  DEFAULT_KEY_EXPIRE = "1h",
  DEFAULT_KEY_ISSUER = "AxioDB Server",
  DEFAULT_KEY_AUDIENCE = "AxioDB Client",
  DEFAULT_KEY_REASON = "For Transacting with AxioDB Server",
  DEFAULT_KEY_TIMESTAMP = Date.now(),
  DEFAULT_KEY_ROUNDS = 1,
}

// Config for CORS
export const CORS_CONFIG = {
  ORIGIN: "*",
  METHODS: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE"],
  ALLOWED_HEADERS: ["Content-Type", "Authorization"],
  EXPOSED_HEADERS: ["Content-Length", "X-Requested-With"],
  MAX_AGE: 86400, // 24 hours in seconds
  ALLOW_CREDENTIALS: true,
};

export const staticPath = path.resolve(__dirname, "../public/AxioControl");

interface MainRoutesInterface {
  method: string;
  path: string;
  description: string;
  payload?: Record<string, any>;
}
interface RouteGroupInterface {
  groupName?: string;
  description: string;
  Paths: MainRoutesInterface[];
}

// Routes
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
    groupName: "Key Management",
    description: "Key Management Endpoints",
    Paths: [
      {
        method: "GET",
        path: "/api/get-token",
        description: "Get a new token for transacting with AxioDB Server",
      },
    ],
  },
  {
    groupName: "Database",
    description: "Database Management Endpoints",
    Paths: [
      {
        method: "GET",
        path: "/api/db/databases",
        description: "Get a list of all databases",
      },
      {
        method: "POST",
        path: "/api/db/create-database",
        description: "Create a new database",
        payload: {
          name: "string",
        },
      },
      {
        method: "DELETE",
        path: "/api/db/delete-database",
        description: "Delete a database",
        payload: {
          name: "string",
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
        path: "/api/collection/create-collection",
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
    groupName: "CRUD Operations",
    description: "CRUD Operations Endpoints",
    Paths: [
      {
        method: "GET",
        description: "Get all documents from a collection",
        path: "/api/operation/all/?dbName&collectionName&page"
      },
      {
        method: "POST",
        description: "Create a new document in a collection",
        path: "/api/operation/create/?dbName&collectionName",
        payload: {
          document: "object",
        },
      },
      {
        method: "PUT",
        description: "Update an existing document in a collection",
        path: "/api/operation/update/?dbName&collectionName&documentId",
        payload: {
          document: "object",
        },
      },
      {
        method: "DELETE",
        description: "Delete an existing document in a collection",
        path: "/api/operation/delete/?dbName&collectionName&documentId",
      }
    ]
  }
];
