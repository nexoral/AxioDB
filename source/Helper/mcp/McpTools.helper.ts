import { IncomingMessage } from "node:http";
import { AxioDB } from "../../Services/Indexation.operation";
import AuthService from "../../Services/Auth/AuthService.service";
import SessionStore from "../../Services/Auth/SessionStore.service";
import { SessionRecord } from "../../config/Interfaces/Auth/auth.interface";
import PermissionChecker from "../../Services/Auth/PermissionChecker.helper";
import LoginRateLimiter from "../../Services/Auth/LoginRateLimiter.service";
import { PERMISSIONS } from "../../config/Keys/Permissions";
import DatabaseController from "../../server/controller/Database/Databse.controller";
import CollectionController from "../../server/controller/Collections/Collection.controller";
import CRUDController from "../../server/controller/Operation/CRUD.controller";
import IndexController from "../../server/controller/Index/Index.controller";
import UserManagementController from "../../server/controller/Auth/UserManagement.controller";
import RoleManagementController from "../../server/controller/Auth/RoleManagement.controller";
import StatsController from "../../server/controller/Stats.controller";
import Transaction from "../../Services/Transaction/Transaction.service";
import { AxioHttpRequest, AxioHttpResponse } from "../http/HttpTypes";
import { McpToolDefinition, McpToolResult } from "./McpKeys";
import { withAuth } from "./McpAuth.helper";

const NOOP_REPLY = {
  code() {
    return this;
  },
  status() {
    return this;
  },
} as unknown as AxioHttpResponse;

function extractDbName(args: Record<string, unknown>): string {
  return String(args.dbName || args.databaseName || args.name || "").trim();
}

function extractCollectionName(args: Record<string, unknown>): string {
  return String(args.collectionName || args.collection || "").trim();
}

function mockRequest(options: {
  body?: unknown;
  query?: Record<string, unknown>;
  params?: Record<string, string>;
  authUser?: { username: string; role: string; mustChangePassword?: boolean };
  ip?: string;
}): AxioHttpRequest {
  return {
    method: "POST",
    url: "/mcp",
    path: "/mcp",
    ip: options.ip || "127.0.0.1",
    query: options.query || {},
    params: options.params || {},
    headers: {},
    body: options.body || {},
    cookies: {},
    authUser: options.authUser,
    raw: {} as unknown as IncomingMessage,
    file: async () => null,
  };
}

export interface RegisteredTool {
  definition: McpToolDefinition;
  handler: (args: Record<string, unknown>) => Promise<McpToolResult>;
}

export function buildMcpTools(axioDBInstance: AxioDB): Map<string, RegisteredTool> {
  const tools = new Map<string, RegisteredTool>();

  const authService = new AuthService();
  const dbController = new DatabaseController(axioDBInstance);
  const collectionController = new CollectionController(axioDBInstance);
  const crudController = new CRUDController(axioDBInstance);
  const indexController = new IndexController(axioDBInstance);
  const userController = new UserManagementController();
  const roleController = new RoleManagementController();
  const statsController = new StatsController(axioDBInstance);

  const activeTransactions = new Map<string, { transaction: Transaction; sessionId: string }>();

  function register(
    definition: McpToolDefinition,
    permissionKey: string | null,
    handler: (args: Record<string, unknown>, session?: SessionRecord) => Promise<unknown> | unknown,
  ) {
    tools.set(definition.name, {
      definition,
      handler: withAuth(permissionKey, handler),
    });
  }

  // --- Auth Tools ---
  register(
    {
      name: "axiodb_login",
      description: "Log in with an AxioDB username and password to obtain a sessionId required for other tools.",
      inputSchema: {
        type: "object",
        properties: {
          username: { type: "string", description: "AxioDB username" },
          password: { type: "string", description: "AxioDB password" },
        },
        required: ["username", "password"],
      },
    },
    null,
    async (args) => {
      const username = String(args.username || "").trim();
      const password = String(args.password || "");

      const cooldown = LoginRateLimiter.getCooldownRemaining("mcp");
      if (cooldown > 0) {
        return {
          statusCode: 429,
          message: `Too many failed login attempts. Try again in ${Math.ceil(cooldown / 1000)}s.`,
        };
      }

      const result = await authService.login(username, password);
      if (!result.success || !result.user) {
        LoginRateLimiter.recordFailure("mcp");
        return { statusCode: 401, message: result.message };
      }
      LoginRateLimiter.recordSuccess("mcp");

      const session = SessionStore.createSession(
        result.user.username,
        result.user.role,
        result.user.mustChangePassword,
      );

      return {
        statusCode: 200,
        message: "Login successful",
        data: {
          sessionId: session.sid,
          username: result.user.username,
          role: result.user.role,
          mustChangePassword: result.user.mustChangePassword,
          permissions: PermissionChecker.getPermissionsForRole(result.user.role),
        },
      };
    },
  );

  register(
    {
      name: "axiodb_logout",
      description: "Log out and invalidate the given active session.",
      inputSchema: {
        type: "object",
        properties: {
          sessionId: { type: "string", description: "Active session ID" },
        },
        required: ["sessionId"],
      },
    },
    null,
    (args, session) => {
      if (session) {
        SessionStore.revokeSession(session.sid);
      }
      return { statusCode: 200, message: "Logged out successfully" };
    },
  );

  register(
    {
      name: "axiodb_whoami",
      description: "Inspect the current authenticated session, role, and permissions.",
      inputSchema: {
        type: "object",
        properties: {
          sessionId: { type: "string", description: "Active session ID" },
        },
        required: ["sessionId"],
      },
    },
    PERMISSIONS.DASHBOARD_VIEW,
    (_args, session) => {
      return {
        statusCode: 200,
        message: "Session info",
        data: {
          username: session!.username,
          role: session!.role,
          mustChangePassword: session!.mustChangePassword,
          permissions: PermissionChecker.getPermissionsForRole(session!.role),
        },
      };
    },
  );

  register(
    {
      name: "axiodb_change_own_password",
      description: "Change the current authenticated user password.",
      inputSchema: {
        type: "object",
        properties: {
          sessionId: { type: "string", description: "Active session ID" },
          oldPassword: { type: "string", description: "Current password" },
          newPassword: { type: "string", description: "New password" },
        },
        required: ["sessionId", "oldPassword", "newPassword"],
      },
    },
    "auth:change-password",
    async (args, session) => {
      const res = await authService.changeOwnPassword(
        session!.username,
        String(args.oldPassword),
        String(args.newPassword),
      );
      if (res.success) {
        session!.mustChangePassword = false;
        SessionStore.updateSessionMustChangePassword(session!.sid, false);
      }
      return {
        statusCode: res.success ? 200 : 400,
        success: res.success,
        message: res.message,
      };
    },
  );

  // --- Database Tools ---
  register(
    {
      name: "axiodb_list_databases",
      description: "List all existing AxioDB databases.",
      inputSchema: {
        type: "object",
        properties: {
          sessionId: { type: "string", description: "Active session ID" },
        },
        required: ["sessionId"],
      },
    },
    PERMISSIONS.DB_VIEW,
    () => dbController.getDatabases(),
  );

  register(
    {
      name: "axiodb_create_database",
      description: "Create a new database.",
      inputSchema: {
        type: "object",
        properties: {
          sessionId: { type: "string", description: "Active session ID" },
          name: { type: "string", description: "Database name to create (e.g. 'AnkanDB')" },
          dbName: { type: "string", description: "Alias for name" },
        },
        required: ["sessionId"],
      },
    },
    PERMISSIONS.DB_CREATE,
    (args) => {
      const name = extractDbName(args);
      return dbController.createDatabase(mockRequest({ body: { name } }));
    },
  );

  register(
    {
      name: "axiodb_delete_database",
      description: "Permanently delete an entire database and all its collections.",
      inputSchema: {
        type: "object",
        properties: {
          sessionId: { type: "string", description: "Active session ID" },
          dbName: { type: "string", description: "Database name to delete" },
          name: { type: "string", description: "Alias for dbName" },
        },
        required: ["sessionId"],
      },
    },
    PERMISSIONS.DB_DELETE,
    (args) => {
      const dbName = extractDbName(args);
      return dbController.deleteDatabase(mockRequest({ query: { dbName, name: dbName } }));
    },
  );

  register(
    {
      name: "axiodb_database_exists",
      description: "Check if a database exists.",
      inputSchema: {
        type: "object",
        properties: {
          sessionId: { type: "string", description: "Active session ID" },
          name: { type: "string", description: "Database name to check" },
          dbName: { type: "string", description: "Alias for name" },
        },
        required: ["sessionId"],
      },
    },
    PERMISSIONS.DB_VIEW,
    async (args) => {
      const name = extractDbName(args);
      const exists = await axioDBInstance.isDatabaseExists(name);
      return { statusCode: 200, message: "OK", data: { name, exists } };
    },
  );

  register(
    {
      name: "axiodb_get_instance_info",
      description:
        "Get instance-level storage information and list all databases in the AxioDB instance.",
      inputSchema: {
        type: "object",
        properties: {
          sessionId: { type: "string", description: "Active session ID" },
        },
        required: ["sessionId"],
      },
    },
    PERMISSIONS.DB_VIEW,
    () => dbController.getDatabases(),
  );

  // --- Collection Tools ---
  register(
    {
      name: "axiodb_list_collections",
      description:
        "List all collections and their document counts in a database. Pass the target database name via 'dbName' (or 'name' / 'databaseName').",
      inputSchema: {
        type: "object",
        properties: {
          sessionId: { type: "string", description: "Active session ID" },
          dbName: { type: "string", description: "Database name (e.g. 'AnkanDB')" },
          name: { type: "string", description: "Alias for dbName" },
          databaseName: { type: "string", description: "Alias for dbName" },
        },
        required: ["sessionId"],
      },
    },
    PERMISSIONS.COLLECTION_VIEW,
    (args) => {
      const dbName = extractDbName(args);
      if (!dbName) {
        return { statusCode: 400, message: "Database name is required (pass 'dbName' or 'name')" };
      }
      return collectionController.getCollections(
        mockRequest({ query: { databaseName: dbName, dbName } }),
      );
    },
  );

  register(
    {
      name: "axiodb_get_collection_info",
      description:
        "Get the list of collections in a database, with per-collection file counts and storage metadata.",
      inputSchema: {
        type: "object",
        properties: {
          sessionId: { type: "string", description: "Active session ID" },
          databaseName: {
            type: "string",
            description: "Name of the database to inspect (e.g. 'MyDB'). You can also use 'dbName' or 'name'.",
          },
          dbName: { type: "string", description: "Alias for databaseName" },
          name: { type: "string", description: "Alias for databaseName" },
        },
        required: ["sessionId"],
      },
    },
    PERMISSIONS.COLLECTION_VIEW,
    (args) => {
      const dbName = extractDbName(args);
      if (!dbName) {
        return { statusCode: 400, message: "Database name is required (pass 'databaseName' or 'dbName')" };
      }
      return collectionController.getCollections(
        mockRequest({ query: { databaseName: dbName, dbName } }),
      );
    },
  );

  register(
    {
      name: "axiodb_collection_exists",
      description:
        "Check whether a collection exists inside an AxioDB database without altering storage.",
      inputSchema: {
        type: "object",
        properties: {
          sessionId: { type: "string", description: "Active session ID" },
          dbName: {
            type: "string",
            description: "Target database name (e.g. 'MyDB'). You can also use 'databaseName' or 'name'.",
          },
          name: { type: "string", description: "Alias for dbName" },
          collectionName: {
            type: "string",
            description: "Collection name to check (e.g. 'users'). You can also use 'collection'.",
          },
          collection: { type: "string", description: "Alias for collectionName" },
        },
        required: ["sessionId"],
      },
    },
    PERMISSIONS.COLLECTION_VIEW,
    async (args) => {
      const dbName = extractDbName(args);
      const collectionName = extractCollectionName(args);
      if (!dbName) {
        return { statusCode: 400, message: "Database name is required (pass 'dbName' or 'name')" };
      }
      if (!collectionName) {
        return {
          statusCode: 400,
          message: "Collection name is required (pass 'collectionName' or 'collection')",
        };
      }
      const dbExists = await axioDBInstance.isDatabaseExists(dbName);
      if (!dbExists) {
        return { statusCode: 200, message: "OK", data: { dbName, collectionName, exists: false } };
      }
      const databaseInstance = await axioDBInstance.createDB(dbName);
      const exists = await databaseInstance.isCollectionExists(collectionName);
      return { statusCode: 200, message: "OK", data: { dbName, collectionName, exists } };
    },
  );

  register(
    {
      name: "axiodb_create_collection",
      description: "Create a new collection inside a database.",
      inputSchema: {
        type: "object",
        properties: {
          sessionId: { type: "string", description: "Active session ID" },
          dbName: { type: "string", description: "Database name (e.g. 'AnkanDB')" },
          name: { type: "string", description: "Alias for dbName" },
          collectionName: { type: "string", description: "Collection name (e.g. 'BCC')" },
          collection: { type: "string", description: "Alias for collectionName" },
        },
        required: ["sessionId"],
      },
    },
    PERMISSIONS.COLLECTION_CREATE,
    (args) => {
      const dbName = extractDbName(args);
      const collectionName = extractCollectionName(args);
      return collectionController.createCollection(
        mockRequest({ body: { dbName, collectionName } }),
      );
    },
  );

  register(
    {
      name: "axiodb_delete_collection",
      description: "Delete a collection and its documents.",
      inputSchema: {
        type: "object",
        properties: {
          sessionId: { type: "string", description: "Active session ID" },
          dbName: { type: "string", description: "Database name" },
          name: { type: "string", description: "Alias for dbName" },
          collectionName: { type: "string", description: "Collection name" },
          collection: { type: "string", description: "Alias for collectionName" },
        },
        required: ["sessionId"],
      },
    },
    PERMISSIONS.COLLECTION_DELETE,
    (args) => {
      const dbName = extractDbName(args);
      const collectionName = extractCollectionName(args);
      return collectionController.deleteCollection(
        mockRequest({ query: { dbName, collectionName } }),
      );
    },
  );

  // --- Document CRUD Tools ---
  register(
    {
      name: "axiodb_insert_document",
      description: "Insert a single document into a collection.",
      inputSchema: {
        type: "object",
        properties: {
          sessionId: { type: "string", description: "Active session ID" },
          dbName: { type: "string", description: "Database name (or 'name')" },
          name: { type: "string", description: "Alias for dbName" },
          collectionName: { type: "string", description: "Collection name (or 'collection')" },
          collection: { type: "string", description: "Alias for collectionName" },
          document: { type: "object", description: "Document object to insert" },
        },
        required: ["sessionId", "document"],
      },
    },
    PERMISSIONS.DOCUMENT_CREATE,
    (args) => {
      const dbName = extractDbName(args);
      const collectionName = extractCollectionName(args);
      return crudController.createNewDocument(
        mockRequest({
          query: { dbName, collectionName },
          body: args.document,
        }),
      );
    },
  );

  register(
    {
      name: "axiodb_insert_many_documents",
      description: "Insert multiple documents into a collection.",
      inputSchema: {
        type: "object",
        properties: {
          sessionId: { type: "string", description: "Active session ID" },
          dbName: { type: "string", description: "Database name (or 'name')" },
          name: { type: "string", description: "Alias for dbName" },
          collectionName: { type: "string", description: "Collection name (or 'collection')" },
          collection: { type: "string", description: "Alias for collectionName" },
          documents: {
            type: "array",
            items: { type: "object" },
            description: "Array of documents to insert",
          },
        },
        required: ["sessionId", "documents"],
      },
    },
    PERMISSIONS.DOCUMENT_CREATE,
    (args) => {
      const dbName = extractDbName(args);
      const collectionName = extractCollectionName(args);
      return crudController.createManyNewDocument(
        mockRequest({
          query: { dbName, collectionName },
          body: args.documents,
        }),
      );
    },
  );

  register(
    {
      name: "axiodb_query_documents",
      description:
        "Read documents from a collection. Supports filter queries with MongoDB-style operators ($gt, $gte, $lt, $lte, $in, $nin, $ne, $regex, etc.), direct documentId lookup, index hint optimization, and pagination (page defaults to 1, 10 documents per page). Example query: {\"name\": \"Ankan Saha\"} or {\"age\": {\"$gt\": 21}}.",
      inputSchema: {
        type: "object",
        properties: {
          sessionId: { type: "string", description: "Active session ID obtained from axiodb_login" },
          dbName: { type: "string", description: "Target database name (or 'name')" },
          name: { type: "string", description: "Alias for dbName" },
          collectionName: { type: "string", description: "Target collection name (or 'collection')" },
          collection: { type: "string", description: "Alias for collectionName" },
          query: {
            type: "object",
            description:
              "Filter query object (e.g. {\"name\": \"Ankan Saha\"} or {\"age\": {\"$gte\": 18}}). Leave empty or omit if retrieving all documents.",
          },
          documentId: { type: "string", description: "Direct lookup by unique document ID" },
          page: { type: "number", description: "Page number for pagination (defaults to 1, 10 items per page)" },
          hint: { type: "string", description: "Optional indexed field name to force index-accelerated query execution" },
        },
        required: ["sessionId"],
      },
    },
    PERMISSIONS.DOCUMENT_QUERY,
    async (args) => {
      const dbName = extractDbName(args);
      const collectionName = extractCollectionName(args);

      if (args.documentId) {
        return crudController.getDocumentsById(
          mockRequest({
            query: { dbName, collectionName, documentId: args.documentId },
          }),
        );
      }

      if (args.query) {
        const queryObj: Record<string, unknown> = (
          typeof args.query === "object" &&
          args.query !== null &&
          "query" in args.query &&
          typeof (args.query as Record<string, unknown>).query === "object"
            ? (args.query as Record<string, unknown>).query
            : args.query
        ) as Record<string, unknown>;

        const result = (await crudController.getDocumentsByQuery(
          mockRequest({
            query: { dbName, collectionName, page: Number(args.page) || 1, hint: args.hint },
            body: { query: queryObj },
          }),
        )) as Record<string, unknown>;

        // If index lookup returned 0 documents (e.g. index created after document insert or stale hint), fall back to scanning collection directly
        const inner = (result?.data as Record<string, unknown>)?.data as Record<string, unknown> | undefined;
        const docs = Array.isArray(inner?.documents) ? (inner.documents as Record<string, unknown>[]) : [];
        if (docs.length === 0) {
          const allRes = (await crudController.getAllDocuments(
            mockRequest({
              query: { dbName, collectionName, page: Number(args.page) || 1 },
            }),
          )) as Record<string, unknown>;

          const allInner = (allRes?.data as Record<string, unknown>)?.data as Record<string, unknown> | undefined;
          const allDocs = Array.isArray(allInner?.documents) ? (allInner.documents as Record<string, unknown>[]) : [];

          const queryEntries = Object.entries(queryObj);
          if (queryEntries.length > 0) {
            const matches = allDocs.filter((doc) => {
              return queryEntries.every(([k, v]) => {
                if (typeof v === "object" && v !== null) {
                  return true;
                }
                return doc[k] === v;
              });
            });
            if (matches.length > 0) {
              return {
                statusCode: 200,
                message: "Documents retrieved successfully",
                data: {
                  statusCode: 200,
                  status: true,
                  data: { documents: matches },
                },
              };
            }
          }
        }

        return result;
      }

      return crudController.getAllDocuments(
        mockRequest({
          query: { dbName, collectionName, page: Number(args.page) || 1 },
        }),
      );
    },
  );

  register(
    {
      name: "axiodb_update_document",
      description: "Update documents matching a query or documentId.",
      inputSchema: {
        type: "object",
        properties: {
          sessionId: { type: "string", description: "Active session ID" },
          dbName: { type: "string", description: "Database name (or 'name')" },
          name: { type: "string", description: "Alias for dbName" },
          collectionName: { type: "string", description: "Collection name (or 'collection')" },
          collection: { type: "string", description: "Alias for collectionName" },
          query: { type: "object", description: "Filter query to match target documents" },
          documentId: { type: "string", description: "Target document ID if updating by ID" },
          update: { type: "object", description: "New fields or values to set" },
          many: { type: "boolean", description: "Whether to update all matching documents (default false)" },
          upsert: { type: "boolean", description: "Insert document if no match found" },
        },
        required: ["sessionId", "update"],
      },
    },
    PERMISSIONS.DOCUMENT_UPDATE,
    (args) => {
      const dbName = extractDbName(args);
      const collectionName = extractCollectionName(args);

      if (args.documentId) {
        return crudController.updateDocumentById(
          mockRequest({
            query: { dbName, collectionName, documentId: args.documentId },
            body: args.update,
          }),
        );
      }

      return crudController.updateDocumentByQuery(
        mockRequest({
          query: { dbName, collectionName, isMany: Boolean(args.many) },
          body: { query: (args.query as Record<string, unknown>) || {}, update: (args.update as Record<string, unknown>) || {} },
        }),
      );
    },
  );

  register(
    {
      name: "axiodb_delete_document",
      description: "Delete documents by query or documentId.",
      inputSchema: {
        type: "object",
        properties: {
          sessionId: { type: "string", description: "Active session ID" },
          dbName: { type: "string", description: "Database name (or 'name')" },
          name: { type: "string", description: "Alias for dbName" },
          collectionName: { type: "string", description: "Collection name (or 'collection')" },
          collection: { type: "string", description: "Alias for collectionName" },
          query: { type: "object", description: "Filter query matching documents to delete" },
          documentId: { type: "string", description: "Document ID to delete" },
          many: { type: "boolean", description: "Whether to delete all matching documents (default false)" },
        },
        required: ["sessionId"],
      },
    },
    PERMISSIONS.DOCUMENT_DELETE,
    (args) => {
      const dbName = extractDbName(args);
      const collectionName = extractCollectionName(args);

      if (args.documentId) {
        return crudController.deleteDocumentById(
          mockRequest({
            query: { dbName, collectionName, documentId: args.documentId },
          }),
        );
      }

      return crudController.deleteDocumentByQuery(
        mockRequest({
          query: { dbName, collectionName, isMany: Boolean(args.many) },
          body: { query: (args.query as object) || {} },
        }),
      );
    },
  );

  register(
    {
      name: "axiodb_total_documents",
      description: "Count total documents in a collection.",
      inputSchema: {
        type: "object",
        properties: {
          sessionId: { type: "string", description: "Active session ID" },
          dbName: { type: "string", description: "Database name (or 'name')" },
          name: { type: "string", description: "Alias for dbName" },
          collectionName: { type: "string", description: "Collection name (or 'collection')" },
          collection: { type: "string", description: "Alias for collectionName" },
        },
        required: ["sessionId"],
      },
    },
    PERMISSIONS.DOCUMENT_VIEW,
    async (args) => {
      const dbName = extractDbName(args);
      const collectionName = extractCollectionName(args);
      const db = await axioDBInstance.createDB(dbName);
      const col = await db.createCollection(collectionName);
      return col.totalDocuments();
    },
  );

  register(
    {
      name: "axiodb_find_documents_by_ids",
      description:
        "Retrieve multiple documents from a collection by their unique document IDs (_id) in a single batch operation.",
      inputSchema: {
        type: "object",
        properties: {
          sessionId: { type: "string", description: "Active session ID" },
          dbName: {
            type: "string",
            description: "Database name containing the collection (e.g. 'MyDB'). You can also use 'databaseName' or 'name'.",
          },
          name: { type: "string", description: "Alias for dbName" },
          collectionName: {
            type: "string",
            description: "Collection name (e.g. 'users'). You can also use 'collection'.",
          },
          collection: { type: "string", description: "Alias for collectionName" },
          ids: {
            type: "array",
            items: { type: "string" },
            description: "Array of document IDs to fetch, e.g. ['doc_1', 'doc_2']",
          },
        },
        required: ["sessionId", "ids"],
      },
    },
    PERMISSIONS.DOCUMENT_VIEW,
    (args) => {
      const dbName = extractDbName(args);
      const collectionName = extractCollectionName(args);
      if (!dbName) {
        return { statusCode: 400, message: "Database name is required (pass 'dbName' or 'name')" };
      }
      if (!collectionName) {
        return {
          statusCode: 400,
          message: "Collection name is required (pass 'collectionName' or 'collection')",
        };
      }
      const ids = Array.isArray(args.ids) ? args.ids : [];
      if (ids.length === 0) {
        return { statusCode: 400, message: "ids must be a non-empty array of strings" };
      }
      return crudController.getDocumentsByIds(
        mockRequest({ query: { dbName, collectionName }, body: { ids } }),
      );
    },
  );

  register(
    {
      name: "axiodb_aggregate",
      description:
        "Run a aggregation pipeline with 60+ stages ($match, $group, $sort, $project, $lookup, $unwind, $limit, $skip, $count, $facet, etc.) on documents in a collection.",
      inputSchema: {
        type: "object",
        properties: {
          sessionId: { type: "string", description: "Active session ID" },
          dbName: {
            type: "string",
            description: "Database name (e.g. 'MyDB'). You can also use 'databaseName' or 'name'.",
          },
          name: { type: "string", description: "Alias for dbName" },
          collectionName: {
            type: "string",
            description: "Collection name (e.g. 'users'). You can also use 'collection'.",
          },
          collection: { type: "string", description: "Alias for collectionName" },
          aggregation: {
            type: "array",
            items: { type: "object" },
            description:
              "Array of pipeline stages, e.g. [{ \"$match\": { \"status\": \"active\" } }, { \"$group\": { \"_id\": \"$role\", \"total\": { \"$sum\": 1 } } }]",
          },
          pipeline: {
            type: "array",
            items: { type: "object" },
            description: "Alias for aggregation pipeline array",
          },
        },
        required: ["sessionId"],
      },
    },
    PERMISSIONS.DOCUMENT_AGGREGATE,
    (args) => {
      const dbName = extractDbName(args);
      const collectionName = extractCollectionName(args);
      if (!dbName) {
        return { statusCode: 400, message: "Database name is required (pass 'dbName' or 'name')" };
      }
      if (!collectionName) {
        return {
          statusCode: 400,
          message: "Collection name is required (pass 'collectionName' or 'collection')",
        };
      }
      const rawAggregation = args.aggregation || args.pipeline;
      if (!Array.isArray(rawAggregation) || rawAggregation.length === 0) {
        return {
          statusCode: 400,
          message: "Invalid aggregation pipeline: must be a non-empty array of stage objects",
        };
      }
      return crudController.runAggregation(
        mockRequest({ query: { dbName, collectionName }, body: { aggregation: rawAggregation } }),
      );
    },
  );

  // --- Secondary Index Tools ---
  register(
    {
      name: "axiodb_create_index",
      description: "Create a secondary index on one or more collection fields.",
      inputSchema: {
        type: "object",
        properties: {
          sessionId: { type: "string", description: "Active session ID" },
          dbName: { type: "string", description: "Database name (or 'name')" },
          name: { type: "string", description: "Alias for dbName" },
          collectionName: { type: "string", description: "Collection name (or 'collection')" },
          collection: { type: "string", description: "Alias for collectionName" },
          fieldNames: {
            type: "array",
            items: { type: "string" },
            description: "Array of field names to index (e.g. ['name'] or ['category', 'createdAt'])",
          },
          fieldName: {
            type: "string",
            description: "Single field name to index (e.g. 'name'). Can be used instead of fieldNames.",
          },
        },
        required: ["sessionId"],
      },
    },
    PERMISSIONS.INDEX_CREATE,
    (args) => {
      const dbName = extractDbName(args);
      const collectionName = extractCollectionName(args);

      let fieldNames: string[] = [];
      if (Array.isArray(args.fieldNames)) {
        fieldNames = args.fieldNames.map(String).filter((s) => s.trim() !== "");
      } else if (typeof args.fieldName === "string" && args.fieldName.trim() !== "") {
        fieldNames = [args.fieldName.trim()];
      } else if (typeof args.fieldNames === "string" && (args.fieldNames as string).trim() !== "") {
        fieldNames = [(args.fieldNames as string).trim()];
      }

      if (fieldNames.length === 0) {
        return { statusCode: 400, message: "Field name is required (pass 'fieldNames' array or 'fieldName' string)" };
      }

      return indexController.createIndex(
        mockRequest({
          body: {
            dbName,
            collectionName,
            fieldNames,
          },
        }),
      );
    },
  );

  register(
    {
      name: "axiodb_drop_index",
      description: "Drop a secondary index from a collection.",
      inputSchema: {
        type: "object",
        properties: {
          sessionId: { type: "string", description: "Active session ID" },
          dbName: { type: "string", description: "Database name (or 'name')" },
          name: { type: "string", description: "Alias for dbName" },
          collectionName: { type: "string", description: "Collection name (or 'collection')" },
          collection: { type: "string", description: "Alias for collectionName" },
          indexName: { type: "string", description: "Index name to drop (or fieldName)" },
          fieldName: { type: "string", description: "Alias for indexName" },
        },
        required: ["sessionId"],
      },
    },
    PERMISSIONS.INDEX_DELETE,
    (args) => {
      const dbName = extractDbName(args);
      const collectionName = extractCollectionName(args);
      const indexName = String(args.indexName || args.fieldName || "").trim();
      if (!indexName) {
        return { statusCode: 400, message: "Index name is required (pass 'indexName' or 'fieldName')" };
      }
      return indexController.deleteIndex(
        mockRequest({
          query: {
            dbName,
            collectionName,
            indexName,
          },
        }),
      );
    },
  );

  register(
    {
      name: "axiodb_list_indexes",
      description: "List all secondary indexes on a collection.",
      inputSchema: {
        type: "object",
        properties: {
          sessionId: { type: "string", description: "Active session ID" },
          dbName: { type: "string", description: "Database name (or 'name')" },
          name: { type: "string", description: "Alias for dbName" },
          collectionName: { type: "string", description: "Collection name (or 'collection')" },
          collection: { type: "string", description: "Alias for collectionName" },
        },
        required: ["sessionId"],
      },
    },
    PERMISSIONS.INDEX_VIEW,
    (args) => {
      const dbName = extractDbName(args);
      const collectionName = extractCollectionName(args);
      return indexController.getIndexes(
        mockRequest({
          query: { dbName, collectionName },
        }),
      );
    },
  );

  // --- ACID Transactions ---
  function getActiveTransaction(
    transactionId: unknown,
    sessionId: string,
  ): { transaction: Transaction } | { error: { statusCode: number; message: string } } {
    if (!transactionId || typeof transactionId !== "string") {
      return { error: { statusCode: 400, message: "transactionId is required" } };
    }
    const entry = activeTransactions.get(transactionId);
    if (!entry) {
      return { error: { statusCode: 404, message: "Transaction not found or already completed" } };
    }
    if (entry.sessionId !== sessionId) {
      return { error: { statusCode: 403, message: "Transaction belongs to another MCP session" } };
    }
    return { transaction: entry.transaction };
  }

  register(
    {
      name: "axiodb_begin_transaction",
      description: "Start a new ACID transaction on a collection.",
      inputSchema: {
        type: "object",
        properties: {
          sessionId: { type: "string", description: "Active session ID" },
          dbName: { type: "string", description: "Database name" },
          collectionName: { type: "string", description: "Collection name" },
        },
        required: ["sessionId", "dbName", "collectionName"],
      },
    },
    PERMISSIONS.DOCUMENT_CREATE,
    async (args, session) => {
      const dbName = extractDbName(args);
      const collectionName = extractCollectionName(args);
      const db = await axioDBInstance.createDB(dbName);
      const col = await db.createCollection(collectionName);
      const txn = new Transaction(col.getCollectionPath(), axioDBInstance.Cache);
      activeTransactions.set(txn.getId(), { transaction: txn, sessionId: session!.sid });
      return {
        statusCode: 200,
        message: "Transaction begun",
        data: { transactionId: txn.getId() },
      };
    },
  );

  register(
    {
      name: "axiodb_transaction_insert",
      description:
        "Buffer a document insert operation inside an active ACID transaction. The document will be committed when axiodb_commit_transaction is called.",
      inputSchema: {
        type: "object",
        properties: {
          sessionId: { type: "string", description: "Active session ID" },
          transactionId: {
            type: "string",
            description: "Active transaction ID from axiodb_begin_transaction",
          },
          document: {
            type: "object",
            description: "JSON document object to insert into the transaction collection",
          },
        },
        required: ["sessionId", "transactionId", "document"],
      },
    },
    PERMISSIONS.DOCUMENT_CREATE,
    (args, session) => {
      const txLookup = getActiveTransaction(args.transactionId, session!.sid);
      if ("error" in txLookup) return txLookup.error;
      const doc = args.document;
      if (!doc || typeof doc !== "object" || Array.isArray(doc)) {
        return { statusCode: 400, message: "document must be a valid JSON object" };
      }
      txLookup.transaction.insert(doc as object);
      return {
        statusCode: 200,
        message: "Document buffered in transaction",
        data: { transactionId: args.transactionId },
      };
    },
  );

  register(
    {
      name: "axiodb_transaction_update",
      description:
        "Buffer a flat-merge update operation inside an active ACID transaction for documents matching the query filter.",
      inputSchema: {
        type: "object",
        properties: {
          sessionId: { type: "string", description: "Active session ID" },
          transactionId: {
            type: "string",
            description: "Active transaction ID from axiodb_begin_transaction",
          },
          query: {
            type: "object",
            description: "Filter query to match document(s) to update, e.g. { \"id\": \"doc_1\" }",
          },
          update: {
            type: "object",
            description: "Object containing fields and values to update/merge into matching documents",
          },
        },
        required: ["sessionId", "transactionId", "query", "update"],
      },
    },
    PERMISSIONS.DOCUMENT_UPDATE,
    (args, session) => {
      const txLookup = getActiveTransaction(args.transactionId, session!.sid);
      if ("error" in txLookup) return txLookup.error;
      const query = args.query;
      const update = args.update;
      if (!query || typeof query !== "object" || Array.isArray(query)) {
        return { statusCode: 400, message: "query must be a valid JSON object" };
      }
      if (!update || typeof update !== "object" || Array.isArray(update)) {
        return { statusCode: 400, message: "update must be a valid JSON object" };
      }
      txLookup.transaction.update(
        query as Record<string, unknown>,
        update as Record<string, unknown>,
      );
      return {
        statusCode: 200,
        message: "Update buffered in transaction",
        data: { transactionId: args.transactionId },
      };
    },
  );

  register(
    {
      name: "axiodb_transaction_delete",
      description:
        "Buffer a delete operation inside an active ACID transaction for documents matching the query filter.",
      inputSchema: {
        type: "object",
        properties: {
          sessionId: { type: "string", description: "Active session ID" },
          transactionId: {
            type: "string",
            description: "Active transaction ID from axiodb_begin_transaction",
          },
          query: {
            type: "object",
            description: "Filter query to match document(s) to delete, e.g. { \"id\": \"doc_1\" }",
          },
        },
        required: ["sessionId", "transactionId", "query"],
      },
    },
    PERMISSIONS.DOCUMENT_DELETE,
    (args, session) => {
      const txLookup = getActiveTransaction(args.transactionId, session!.sid);
      if ("error" in txLookup) return txLookup.error;
      const query = args.query;
      if (!query || typeof query !== "object" || Array.isArray(query)) {
        return { statusCode: 400, message: "query must be a valid JSON object" };
      }
      txLookup.transaction.delete(query as Record<string, unknown>);
      return {
        statusCode: 200,
        message: "Delete buffered in transaction",
        data: { transactionId: args.transactionId },
      };
    },
  );

  register(
    {
      name: "axiodb_transaction_savepoint",
      description:
        "Create a named savepoint inside an active ACID transaction. You can later roll back to this savepoint using axiodb_transaction_rollback_to_savepoint.",
      inputSchema: {
        type: "object",
        properties: {
          sessionId: { type: "string", description: "Active session ID" },
          transactionId: { type: "string", description: "Active transaction ID" },
          savepointName: { type: "string", description: "Unique name for the savepoint, e.g. 'sp_1'" },
        },
        required: ["sessionId", "transactionId", "savepointName"],
      },
    },
    PERMISSIONS.DOCUMENT_CREATE,
    (args, session) => {
      const txLookup = getActiveTransaction(args.transactionId, session!.sid);
      if ("error" in txLookup) return txLookup.error;
      const savepointName = String(args.savepointName || "").trim();
      if (!savepointName) {
        return { statusCode: 400, message: "savepointName is required" };
      }
      try {
        txLookup.transaction.savepoint(savepointName);
        return {
          statusCode: 200,
          message: "Savepoint created",
          data: { transactionId: args.transactionId, savepointName },
        };
      } catch (err: unknown) {
        return {
          statusCode: 400,
          message: err instanceof Error ? err.message : "Failed to create savepoint",
        };
      }
    },
  );

  register(
    {
      name: "axiodb_transaction_rollback_to_savepoint",
      description:
        "Discard all buffered transaction operations after a named savepoint, reverting the transaction to that checkpoint.",
      inputSchema: {
        type: "object",
        properties: {
          sessionId: { type: "string", description: "Active session ID" },
          transactionId: { type: "string", description: "Active transaction ID" },
          savepointName: { type: "string", description: "Name of the savepoint to roll back to" },
        },
        required: ["sessionId", "transactionId", "savepointName"],
      },
    },
    PERMISSIONS.DOCUMENT_DELETE,
    (args, session) => {
      const txLookup = getActiveTransaction(args.transactionId, session!.sid);
      if ("error" in txLookup) return txLookup.error;
      const savepointName = String(args.savepointName || "").trim();
      if (!savepointName) {
        return { statusCode: 400, message: "savepointName is required" };
      }
      try {
        txLookup.transaction.rollbackTo(savepointName);
        return {
          statusCode: 200,
          message: "Rolled back to savepoint",
          data: { transactionId: args.transactionId, savepointName },
        };
      } catch (err: unknown) {
        return {
          statusCode: 400,
          message: err instanceof Error ? err.message : "Failed to rollback to savepoint",
        };
      }
    },
  );

  register(
    {
      name: "axiodb_transaction_release_savepoint",
      description:
        "Release a named savepoint without discarding buffered operations. Cleans up savepoint metadata.",
      inputSchema: {
        type: "object",
        properties: {
          sessionId: { type: "string", description: "Active session ID" },
          transactionId: { type: "string", description: "Active transaction ID" },
          savepointName: { type: "string", description: "Name of the savepoint to release" },
        },
        required: ["sessionId", "transactionId", "savepointName"],
      },
    },
    PERMISSIONS.DOCUMENT_CREATE,
    (args, session) => {
      const txLookup = getActiveTransaction(args.transactionId, session!.sid);
      if ("error" in txLookup) return txLookup.error;
      const savepointName = String(args.savepointName || "").trim();
      if (!savepointName) {
        return { statusCode: 400, message: "savepointName is required" };
      }
      try {
        txLookup.transaction.releaseSavepoint(savepointName);
        return {
          statusCode: 200,
          message: "Savepoint released",
          data: { transactionId: args.transactionId, savepointName },
        };
      } catch (err: unknown) {
        return {
          statusCode: 400,
          message: err instanceof Error ? err.message : "Failed to release savepoint",
        };
      }
    },
  );

  register(
    {
      name: "axiodb_commit_transaction",
      description: "Commit an active transaction.",
      inputSchema: {
        type: "object",
        properties: {
          sessionId: { type: "string", description: "Active session ID" },
          transactionId: { type: "string", description: "Transaction ID" },
        },
        required: ["sessionId", "transactionId"],
      },
    },
    PERMISSIONS.DOCUMENT_UPDATE,
    async (args, session) => {
      const entry = activeTransactions.get(String(args.transactionId));
      if (!entry || entry.sessionId !== session!.sid) {
        return { statusCode: 404, message: "Transaction not found or already completed" };
      }
      activeTransactions.delete(String(args.transactionId));
      const res = await entry.transaction.commit();
      if (
        res &&
        typeof res === "object" &&
        "status" in res &&
        res.status === false &&
        (res as { message?: string }).message === "No operations to commit"
      ) {
        return {
          statusCode: 200,
          message: "Transaction completed (no operations to commit)",
          data: { transactionId: args.transactionId, operationsCount: 0 },
        };
      }
      return res;
    },
  );

  register(
    {
      name: "axiodb_rollback_transaction",
      description: "Rollback and discard an active transaction.",
      inputSchema: {
        type: "object",
        properties: {
          sessionId: { type: "string", description: "Active session ID" },
          transactionId: { type: "string", description: "Transaction ID" },
        },
        required: ["sessionId", "transactionId"],
      },
    },
    PERMISSIONS.DOCUMENT_UPDATE,
    async (args, session) => {
      const entry = activeTransactions.get(String(args.transactionId));
      if (!entry || entry.sessionId !== session!.sid) {
        return { statusCode: 404, message: "Transaction not found or already completed" };
      }
      activeTransactions.delete(String(args.transactionId));
      const res = await entry.transaction.rollback();
      return res;
    },
  );

  // --- Admin, RBAC & Dashboard ---
  register(
    {
      name: "axiodb_health",
      description: "Healthcheck tool for verifying database status.",
      inputSchema: {
        type: "object",
        properties: {
          sessionId: { type: "string", description: "Active session ID" },
        },
        required: ["sessionId"],
      },
    },
    PERMISSIONS.DASHBOARD_VIEW,
    () => ({
      statusCode: 200,
      message: "AxioDB is healthy",
      data: {
        status: "ok",
        uptime: process.uptime(),
        timestamp: Date.now(),
      },
    }),
  );

  register(
    {
      name: "axiodb_get_dashboard_stats",
      description: "Get comprehensive system metrics and database statistics.",
      inputSchema: {
        type: "object",
        properties: {
          sessionId: { type: "string", description: "Active session ID" },
        },
        required: ["sessionId"],
      },
    },
    PERMISSIONS.DASHBOARD_VIEW,
    () => statsController.getDashBoardStat(),
  );

  register(
    {
      name: "axiodb_list_users",
      description: "List all registered database users.",
      inputSchema: {
        type: "object",
        properties: {
          sessionId: { type: "string", description: "Active session ID" },
        },
        required: ["sessionId"],
      },
    },
    PERMISSIONS.USER_VIEW,
    () => userController.listUsers(mockRequest({}), NOOP_REPLY),
  );

  register(
    {
      name: "axiodb_create_user",
      description: "Create a new database user.",
      inputSchema: {
        type: "object",
        properties: {
          sessionId: { type: "string", description: "Active session ID" },
          username: { type: "string", description: "New username" },
          password: { type: "string", description: "User password" },
          role: { type: "string", description: "Assigned role name" },
        },
        required: ["sessionId", "username", "password", "role"],
      },
    },
    PERMISSIONS.USER_CREATE,
    (args, session) =>
      userController.createUser(
        mockRequest({
          body: {
            username: args.username,
            password: args.password,
            role: args.role,
          },
          authUser: session ? { username: session.username, role: session.role } : undefined,
        }),
        NOOP_REPLY,
      ),
  );

  register(
    {
      name: "axiodb_delete_user",
      description: "Delete an existing user.",
      inputSchema: {
        type: "object",
        properties: {
          sessionId: { type: "string", description: "Active session ID" },
          username: { type: "string", description: "Username to delete" },
        },
        required: ["sessionId", "username"],
      },
    },
    PERMISSIONS.USER_DELETE,
    (args, session) =>
      userController.deleteUser(
        mockRequest({
          params: { username: String(args.username) },
          query: { username: String(args.username) },
          authUser: session ? { username: session.username, role: session.role } : undefined,
        }),
        NOOP_REPLY,
      ),
  );

  register(
    {
      name: "axiodb_update_user_role",
      description:
        "[Super Admin] Change the assigned RBAC role of an existing user (e.g. 'Super Admin', 'Admin', 'View', or any custom role).",
      inputSchema: {
        type: "object",
        properties: {
          sessionId: { type: "string", description: "Active session ID" },
          username: { type: "string", description: "Username of the target user" },
          role: { type: "string", description: "New role to assign to the user" },
        },
        required: ["sessionId", "username", "role"],
      },
    },
    PERMISSIONS.USER_UPDATE_ROLE,
    (args, session) =>
      userController.updateUserRole(
        mockRequest({
          params: { username: String(args.username) },
          body: { role: String(args.role) },
          authUser: session ? { username: session.username, role: session.role } : undefined,
        }),
        NOOP_REPLY,
      ),
  );

  register(
    {
      name: "axiodb_reset_user_password",
      description:
        "[Super Admin] Reset an existing user's password and force them to change it upon next login. Revokes all active sessions for that user.",
      inputSchema: {
        type: "object",
        properties: {
          sessionId: { type: "string", description: "Active session ID" },
          username: { type: "string", description: "Username of the user whose password to reset" },
          newPassword: {
            type: "string",
            description: "New temporary password (minimum 4 characters)",
          },
        },
        required: ["sessionId", "username", "newPassword"],
      },
    },
    PERMISSIONS.USER_RESET_PASSWORD,
    (args, session) =>
      userController.resetUserPassword(
        mockRequest({
          params: { username: String(args.username) },
          body: { newPassword: String(args.newPassword) },
          authUser: session ? { username: session.username, role: session.role } : undefined,
        }),
        NOOP_REPLY,
      ),
  );

  register(
    {
      name: "axiodb_list_roles",
      description: "List all RBAC roles in the database.",
      inputSchema: {
        type: "object",
        properties: {
          sessionId: { type: "string", description: "Active session ID" },
        },
        required: ["sessionId"],
      },
    },
    PERMISSIONS.ROLE_VIEW,
    () => roleController.listRoles(mockRequest({}), NOOP_REPLY),
  );

  register(
    {
      name: "axiodb_create_role",
      description:
        "[Super Admin] Create a new custom RBAC role with a specified array of permissions from the permission catalogue (see axiodb_list_permissions).",
      inputSchema: {
        type: "object",
        properties: {
          sessionId: { type: "string", description: "Active session ID" },
          roleName: { type: "string", description: "Name of the new role to create" },
          permissions: {
            type: "array",
            items: { type: "string" },
            description:
              "Array of permission keys to grant to this role (e.g. ['db:view', 'collection:view'])",
          },
        },
        required: ["sessionId", "roleName", "permissions"],
      },
    },
    PERMISSIONS.ROLE_CREATE,
    (args, session) =>
      roleController.createRole(
        mockRequest({
          body: {
            roleName: String(args.roleName),
            permissions: Array.isArray(args.permissions) ? args.permissions : [],
          },
          authUser: session ? { username: session.username, role: session.role } : undefined,
        }),
        NOOP_REPLY,
      ),
  );

  register(
    {
      name: "axiodb_delete_role",
      description:
        "[Super Admin] Delete a custom RBAC role. System built-in roles ('Super Admin', 'Admin', 'View') and roles currently assigned to users cannot be deleted.",
      inputSchema: {
        type: "object",
        properties: {
          sessionId: { type: "string", description: "Active session ID" },
          roleName: { type: "string", description: "Name of the custom role to delete" },
        },
        required: ["sessionId", "roleName"],
      },
    },
    PERMISSIONS.ROLE_DELETE,
    (args, session) =>
      roleController.deleteRole(
        mockRequest({
          params: { roleName: String(args.roleName) },
          authUser: session ? { username: session.username, role: session.role } : undefined,
        }),
        NOOP_REPLY,
      ),
  );

  register(
    {
      name: "axiodb_list_permissions",
      description:
        "[Super Admin] List the complete catalogue of all available permissions in AxioDB for role creation and RBAC management.",
      inputSchema: {
        type: "object",
        properties: {
          sessionId: { type: "string", description: "Active session ID" },
        },
        required: ["sessionId"],
      },
    },
    PERMISSIONS.ROLE_VIEW,
    (args, session) =>
      roleController.listPermissions(
        mockRequest({
          authUser: session ? { username: session.username, role: session.role } : undefined,
        }),
        NOOP_REPLY,
      ),
  );

  return tools;
}
