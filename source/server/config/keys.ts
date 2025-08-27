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

// Config for CORS
export const CORS_CONFIG = {
  ORIGIN: "*",
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
  method: "GET" | "POST" | "PUT" | "DELETE";
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
        path: "/api/db/databases/?transactiontoken",
        description: "Get a list of all databases",
      },
      {
        method: "POST",
        path: "/api/db/create-database/?transactiontoken",
        description: "Create a new database",
        payload: {
          name: "string",
        },
      },
      {
        method: "DELETE",
        path: "/api/db/delete-database/?transactiontoken",
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
        path: "/api/collection/all/?databaseName&transactiontoken",
        description: "Get a list of all collections",
      },
      {
        method: "POST",
        path: "/api/collection/create-collection/?transactiontoken",
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
        path: "/api/collection/delete-collection/?dbName&collectionName&transactiontoken",
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
        path: "/api/operation/all/?dbName&collectionName&page&transactiontoken",
      },
      {
        method: "POST",
        description: "Get all documents from a collection",
        path: "/api/operation/all/by-query/?dbName&collectionName&page&transactiontoken",
        payload: {
          query: "object",
        },
      },
      {
        method: "GET",
        description: "Get all documents from a collection",
        path: "/api/operation/all/by-id/?dbName&collectionName&documentId&transactiontoken",
      },
      {
        method: "POST",
        description: "Create a new document in a collection",
        path: "/api/operation/create/?dbName&collectionName&transactiontoken",
        payload: {
          document: "full object with no key in body",
        },
      },
      {
        method: "POST",
        description: "Create a new document in a collection",
        path: "/api/operation/create-many/?dbName&collectionName&transactiontoken",
        payload: {
          documents: "full array of object with no key in body",
        },
      },
      {
        method: "PUT",
        description: "Update an existing document in a collection",
        path: "/api/operation/update/by-id/?dbName&collectionName&documentId&transactiontoken",
        payload: {
          document: "full object with no key in body",
        },
      },
      {
        method: "PUT",
        description: "Update an existing document in a collection",
        path: "/api/operation/update/by-query/?dbName&isMany&collectionName&transactiontoken",
        payload: {
          query: "object",
          update: "object",
        },
      },
      {
        method: "DELETE",
        description: "Delete an existing document in a collection",
        path: "/api/operation/delete/by-id/?dbName&collectionName&documentId&transactiontoken",
      },
      {
        method: "DELETE",
        description: "Delete an existing document in a collection",
        path: "/api/operation/delete/by-query/?dbName&collectionName&isMany&documentId&transactiontoken",
        payload: {
          query: "object",
        },
      },
      {
        method: "POST",
        description: "Perform aggregation on documents in a collection",
        path: "/api/operation/aggregate/?dbName&collectionName&transactiontoken",
        payload: {
          aggregation: "array",
        },
      },
    ],
  },
];
