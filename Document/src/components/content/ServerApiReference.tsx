import { Globe, Server, ChevronDown, ChevronRight } from "lucide-react";
import React, { useState, useEffect } from "react";
import { React as Service } from "react-caches";

interface ApiEndpoint {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  path: string;
  description: string;
  parameters?: {
    name: string;
    type: "query" | "body" | "header";
    dataType: string;
    required: boolean;
    description: string;
  }[];
  requestBody?: string;
  responseExample?: string;
  statusCodes: {
    code: number;
    description: string;
  }[];
}

interface ApiCategory {
  title: string;
  description: string;
  endpoints: ApiEndpoint[];
}

const ServerApiReference: React.FC = () => {
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [expandedEndpoints, setExpandedEndpoints] = useState<string[]>([]);

  useEffect(() => {
    Service.UpdateDocumentTitle("AxioDB Server API Reference - Comprehensive Guide to RESTful Endpoints");
  }, []);

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category],
    );
  };

  const toggleEndpoint = (endpoint: string) => {
    setExpandedEndpoints((prev) =>
      prev.includes(endpoint)
        ? prev.filter((e) => e !== endpoint)
        : [...prev, endpoint],
    );
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case "GET":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-300 dark:border-green-700";
      case "POST":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-300 dark:border-blue-700";
      case "PUT":
        return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border-amber-300 dark:border-amber-700";
      case "PATCH":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 border-purple-300 dark:border-purple-700";
      case "DELETE":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-300 dark:border-red-700";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300 border-gray-300 dark:border-gray-700";
    }
  };

  // API Categories and Endpoints
  const apiCategories: ApiCategory[] = [
    {
      title: "System & Health",
      description: "Basic system information, health checks, and available routes",
      endpoints: [
        {
          method: "GET",
          path: "/api/info",
          description: "Retrieves system information including package name, version, author details, and license information.",
          responseExample: `{
  "statusCode": 200,
  "status": "success",
  "message": "AxioDB Information",
  "data": {
    "Package_Name": "axiodb",
    "AxioDB_Version": "3.31.105",
    "Author_Name": "Ankan Saha",
    "License": "MIT",
    "AuthorDetails": { /* author info */ }
  }
}`,
          statusCodes: [
            { code: 200, description: "Success - Returns system information" },
          ],
        },
        {
          method: "GET",
          path: "/api/health",
          description: "Health check endpoint to verify server status. Use this for monitoring and uptime checks.",
          responseExample: `{
  "statusCode": 200,
  "status": "success",
  "message": "Server is healthy",
  "data": {
    "status": "ok",
    "timestamp": "2025-10-31T12:00:00.000Z"
  }
}`,
          statusCodes: [
            { code: 200, description: "Success - Server is operational" },
          ],
        },
        {
          method: "GET",
          path: "/api/routes",
          description: "Returns a list of all available API routes and their descriptions. Useful for API discovery.",
          responseExample: `{
  "statusCode": 200,
  "status": "success",
  "message": "Available routes",
  "data": [ /* array of route objects */ ]
}`,
          statusCodes: [
            { code: 200, description: "Success - Returns available routes" },
          ],
        },
        {
          method: "GET",
          path: "/api/dashboard-stats",
          description: "Retrieves dashboard statistics including total databases, collections, documents, and storage usage. Perfect for admin dashboards.",
          responseExample: `{
  "statusCode": 200,
  "status": "success",
  "message": "Dashboard statistics",
  "data": {
    "totalDatabases": 5,
    "totalCollections": 12,
    "totalDocuments": 1245,
    "totalSize": "15.4 MB"
  }
}`,
          statusCodes: [
            { code: 200, description: "Success - Returns dashboard statistics" },
          ],
        },
      ],
    },
    {
      title: "Authentication & Access Control",
      description: "Login, session, and RBAC-gated user/role management endpoints",
      endpoints: [
        {
          method: "POST",
          path: "/api/auth/login",
          description: "Authenticates with username/password and starts a server-side session, returning the session as an httpOnly cookie. On first login (including the seeded default admin), the response signals that a password change is required before any other action is allowed.",
          parameters: [
            { name: "username", type: "body", dataType: "string", required: true, description: "Account username" },
            { name: "password", type: "body", dataType: "string", required: true, description: "Account password" },
          ],
          requestBody: `{
  "username": "admin",
  "password": "admin"
}`,
          responseExample: `{
  "statusCode": 200,
  "message": "Login successful",
  "data": {
    "username": "admin",
    "role": "Super Admin",
    "permissions": ["db:view", "db:create", "..."],
    "mustChangePassword": true
  }
}`,
          statusCodes: [
            { code: 200, description: "Success - Login successful, session cookie set" },
            { code: 400, description: "Bad Request - Missing username or password" },
            { code: 401, description: "Unauthorized - Invalid username or password" },
          ],
        },
        {
          method: "POST",
          path: "/api/auth/logout",
          description: "Revokes the current session (server-side) and clears the session cookie.",
          responseExample: `{
  "statusCode": 200,
  "message": "Logged out successfully"
}`,
          statusCodes: [
            { code: 200, description: "Success - Session revoked" },
            { code: 401, description: "Unauthorized - No valid session" },
          ],
        },
        {
          method: "GET",
          path: "/api/auth/me",
          description: "Returns the currently authenticated user's username, role, resolved permissions, and whether a password change is still required. This is the endpoint the GUI calls on load to restore session state.",
          responseExample: `{
  "statusCode": 200,
  "message": "OK",
  "data": {
    "username": "admin",
    "role": "Super Admin",
    "mustChangePassword": false,
    "permissions": ["db:view", "user:create", "..."]
  }
}`,
          statusCodes: [
            { code: 200, description: "Success - Returns the authenticated user" },
            { code: 401, description: "Unauthorized - Session invalid or expired" },
          ],
        },
        {
          method: "PATCH",
          path: "/api/auth/change-password",
          description: "Changes the caller's own password. Requires the current password. Rotates the session, so any previously issued cookie for this account becomes invalid.",
          parameters: [
            { name: "currentPassword", type: "body", dataType: "string", required: true, description: "The account's current password" },
            { name: "newPassword", type: "body", dataType: "string", required: true, description: "The new password (min 4 characters)" },
          ],
          requestBody: `{
  "currentPassword": "admin",
  "newPassword": "a-much-stronger-password"
}`,
          responseExample: `{
  "statusCode": 200,
  "message": "Password changed successfully",
  "data": {
    "username": "admin",
    "role": "Super Admin",
    "permissions": ["..."],
    "mustChangePassword": false
  }
}`,
          statusCodes: [
            { code: 200, description: "Success - Password changed, session rotated" },
            { code: 400, description: "Bad Request - Wrong current password or weak new password" },
            { code: 401, description: "Unauthorized - Session invalid or expired" },
          ],
        },
        {
          method: "GET",
          path: "/api/auth/users",
          description: "Lists all users (Super Admin only - requires the `user:view` permission). Password hashes are never included in the response.",
          responseExample: `{
  "statusCode": 200,
  "message": "List of Users",
  "data": [
    { "username": "admin", "role": "Super Admin", "mustChangePassword": false, "isActive": true, "createdAt": "2026-01-01T00:00:00.000Z" }
  ]
}`,
          statusCodes: [
            { code: 200, description: "Success - Returns the user list" },
            { code: 401, description: "Unauthorized - Session invalid or expired" },
            { code: 403, description: "Forbidden - Missing user:view permission" },
          ],
        },
        {
          method: "POST",
          path: "/api/auth/users",
          description: "Creates a new user with a temporary password and an assigned role (Super Admin only - requires `user:create`). The new user is forced to change their password on first login.",
          parameters: [
            { name: "username", type: "body", dataType: "string", required: true, description: "New account's username" },
            { name: "password", type: "body", dataType: "string", required: true, description: "Temporary password" },
            { name: "role", type: "body", dataType: "string", required: true, description: "One of the existing role names" },
          ],
          requestBody: `{
  "username": "jane",
  "password": "TempPass123",
  "role": "Admin"
}`,
          responseExample: `{
  "statusCode": 201,
  "message": "User created successfully",
  "data": { "username": "jane", "role": "Admin" }
}`,
          statusCodes: [
            { code: 201, description: "Created - User created successfully" },
            { code: 400, description: "Bad Request - Invalid username/password or unknown role" },
            { code: 401, description: "Unauthorized - Session invalid or expired" },
            { code: 403, description: "Forbidden - Missing user:create permission" },
            { code: 409, description: "Conflict - Username already exists" },
          ],
        },
        {
          method: "PATCH",
          path: "/api/auth/users/:username/role",
          description: "Changes a user's assigned role (Super Admin only - requires `user:update-role`). Revokes that user's existing sessions immediately.",
          parameters: [
            { name: "role", type: "body", dataType: "string", required: true, description: "New role name to assign" },
          ],
          requestBody: `{ "role": "View" }`,
          responseExample: `{
  "statusCode": 200,
  "message": "Role updated successfully"
}`,
          statusCodes: [
            { code: 200, description: "Success - Role updated, target user's sessions revoked" },
            { code: 400, description: "Bad Request - Unknown role, user not found, or would remove the last Super Admin" },
            { code: 401, description: "Unauthorized - Session invalid or expired" },
            { code: 403, description: "Forbidden - Missing user:update-role permission" },
          ],
        },
        {
          method: "PATCH",
          path: "/api/auth/users/:username/reset-password",
          description: "Admin-forced password reset (Super Admin only - requires `user:reset-password`). Sets a new password and flags the account to require a password change on next login. Revokes that user's existing sessions immediately.",
          parameters: [
            { name: "newPassword", type: "body", dataType: "string", required: true, description: "New temporary password" },
          ],
          requestBody: `{ "newPassword": "NewTempPass1" }`,
          responseExample: `{
  "statusCode": 200,
  "message": "Password reset successfully"
}`,
          statusCodes: [
            { code: 200, description: "Success - Password reset, target user's sessions revoked" },
            { code: 400, description: "Bad Request - User not found or weak password" },
            { code: 401, description: "Unauthorized - Session invalid or expired" },
            { code: 403, description: "Forbidden - Missing user:reset-password permission" },
          ],
        },
        {
          method: "DELETE",
          path: "/api/auth/users/:username",
          description: "Deletes a user (Super Admin only - requires `user:delete`). Rejected if the target is the last remaining Super Admin account.",
          responseExample: `{
  "statusCode": 200,
  "message": "User deleted successfully"
}`,
          statusCodes: [
            { code: 200, description: "Success - User deleted" },
            { code: 400, description: "Bad Request - User not found or is the last remaining Super Admin" },
            { code: 401, description: "Unauthorized - Session invalid or expired" },
            { code: 403, description: "Forbidden - Missing user:delete permission" },
          ],
        },
        {
          method: "GET",
          path: "/api/auth/roles",
          description: "Lists all roles, including custom roles created from the permission catalogue (Super Admin only - requires `role:view`).",
          responseExample: `{
  "statusCode": 200,
  "message": "List of Roles",
  "data": [
    { "roleName": "Super Admin", "permissions": ["..."], "isSystemRole": true, "createdAt": "2026-01-01T00:00:00.000Z" }
  ]
}`,
          statusCodes: [
            { code: 200, description: "Success - Returns the role list" },
            { code: 401, description: "Unauthorized - Session invalid or expired" },
            { code: 403, description: "Forbidden - Missing role:view permission" },
          ],
        },
        {
          method: "POST",
          path: "/api/auth/roles",
          description: "Creates a new role from the predefined permission catalogue (Super Admin only - requires `role:create`). Every permission key must exist in the catalogue returned by GET /api/auth/roles/permissions.",
          parameters: [
            { name: "roleName", type: "body", dataType: "string", required: true, description: "Unique name for the new role" },
            { name: "permissions", type: "body", dataType: "array", required: true, description: "Array of permission keys from the catalogue" },
          ],
          requestBody: `{
  "roleName": "Auditor",
  "permissions": ["document:view", "document:query", "dashboard:view"]
}`,
          responseExample: `{
  "statusCode": 201,
  "message": "Role created successfully",
  "data": { "roleName": "Auditor", "permissions": ["document:view", "document:query", "dashboard:view"] }
}`,
          statusCodes: [
            { code: 201, description: "Created - Role created successfully" },
            { code: 400, description: "Bad Request - Unknown permission key(s)" },
            { code: 401, description: "Unauthorized - Session invalid or expired" },
            { code: 403, description: "Forbidden - Missing role:create permission" },
            { code: 409, description: "Conflict - Role name already exists" },
          ],
        },
        {
          method: "GET",
          path: "/api/auth/roles/permissions",
          description: "Returns the full predefined permission catalogue, grouped by category - used to render the permission picker when creating a custom role.",
          responseExample: `{
  "statusCode": 200,
  "message": "Permission catalogue",
  "data": [
    { "key": "db:view", "group": "Database", "description": "View the list of databases and dashboard database counts" }
  ]
}`,
          statusCodes: [
            { code: 200, description: "Success - Returns the permission catalogue" },
            { code: 401, description: "Unauthorized - Session invalid or expired" },
            { code: 403, description: "Forbidden - Missing role:view permission" },
          ],
        },
      ],
    },
    {
      title: "Database Management",
      description: "Create, list, delete, import, and export databases",
      endpoints: [
        {
          method: "GET",
          path: "/api/db/databases",
          description: "Retrieves a list of all databases in the AxioDB instance with their metadata, including size, path, and creation date.",
          responseExample: `{
  "statusCode": 200,
  "status": "success",
  "message": "List of Databases",
  "data": {
    "CurrentPath": "/path/to/AxioDB",
    "RootName": "AxioDB",
    "TotalSize": 52428800,
    "TotalDatabases": "5 Databases",
    "Databases": ["UserDB", "ProductsDB", "OrdersDB"]
  }
}`,
          statusCodes: [
            { code: 200, description: "Success - Returns list of databases" },
          ],
        },
        {
          method: "POST",
          path: "/api/db/create-database",
          description: "Creates a new database with the specified name. Database names must be unique and follow naming conventions (alphanumeric and underscores).",
          parameters: [
            {
              name: "name",
              type: "body",
              dataType: "string",
              required: true,
              description: "The name of the database to create",
            },
          ],
          requestBody: `{
  "name": "MyNewDatabase"
}`,
          responseExample: `{
  "statusCode": 201,
  "status": "success",
  "message": "Database Created",
  "data": {
    "Database_Name": "MyNewDatabase"
  }
}`,
          statusCodes: [
            { code: 201, description: "Created - Database created successfully" },
            { code: 400, description: "Bad Request - Invalid database name or name is missing" },
            { code: 409, description: "Conflict - Database already exists" },
            { code: 500, description: "Internal Server Error - Failed to create database" },
          ],
        },
        {
          method: "DELETE",
          path: "/api/db/delete-database",
          description: "Permanently deletes a database and all its collections. This operation cannot be undone. Use with extreme caution in production.",
          parameters: [
            {
              name: "dbName",
              type: "query",
              dataType: "string",
              required: true,
              description: "The name of the database to delete",
            },
          ],
          responseExample: `{
  "statusCode": 200,
  "status": "success",
  "message": "Database Deleted",
  "data": {
    "Database_Name": "MyDatabase"
  }
}`,
          statusCodes: [
            { code: 200, description: "Success - Database deleted successfully" },
            { code: 404, description: "Not Found - Database does not exist" },
            { code: 500, description: "Internal Server Error - Failed to delete database" },
          ],
        },
        {
          method: "GET",
          path: "/api/db/export-database/",
          description: "Exports a database as a compressed .tar.gz file for backup or migration. The file is streamed to the client as a downloadable attachment.",
          parameters: [
            {
              name: "dbName",
              type: "query",
              dataType: "string",
              required: true,
              description: "The name of the database to export",
            },
          ],
          responseExample: `// Binary file stream (database.tar.gz)
Content-Type: application/gzip
Content-Disposition: attachment; filename="MyDatabase.tar.gz"`,
          statusCodes: [
            { code: 200, description: "Success - Database exported as tar.gz file" },
            { code: 400, description: "Bad Request - Database name is required" },
            { code: 404, description: "Not Found - Database does not exist" },
            { code: 500, description: "Internal Server Error - Export failed" },
          ],
        },
        {
          method: "POST",
          path: "/api/db/import-database/",
          description: "Imports a database from a .tar.gz file. Use multipart/form-data to upload the compressed database file.",
          parameters: [
            {
              name: "file",
              type: "body",
              dataType: "file (multipart/form-data)",
              required: true,
              description: "The .tar.gz file containing the database to import",
            },
          ],
          requestBody: `// Multipart form data with file upload
Content-Type: multipart/form-data

file: [database.tar.gz file]`,
          responseExample: `{
  "statusCode": 201,
  "status": "success",
  "message": "Database imported successfully",
  "data": {
    "Database_Name": "ImportedDatabase"
  }
}`,
          statusCodes: [
            { code: 201, description: "Created - Database imported successfully" },
            { code: 400, description: "Bad Request - Invalid file or file missing" },
            { code: 500, description: "Internal Server Error - Import failed" },
          ],
        },
      ],
    },
    {
      title: "Collection Management",
      description: "Create, list, and delete collections within databases",
      endpoints: [
        {
          method: "GET",
          path: "/api/collection/all/",
          description: "Retrieves all collections in a specified database with their metadata, including document counts, size, and paths.",
          parameters: [
            {
              name: "databaseName",
              type: "query",
              dataType: "string",
              required: true,
              description: "The name of the database to query",
            },
          ],
          responseExample: `{
  "statusCode": 200,
  "status": "success",
  "message": "Collections retrieved successfully",
  "data": {
    "DatabaseName": "UserDB",
    "TotalCollections": 3,
    "AllCollectionsPaths": ["/path/to/users", "/path/to/sessions"],
    "CollectionSizeMap": [
      { "folderPath": "/path/to/users", "fileCount": 150 },
      { "folderPath": "/path/to/sessions", "fileCount": 45 }
    ]
  }
}`,
          statusCodes: [
            { code: 200, description: "Success - Returns list of collections" },
            { code: 400, description: "Bad Request - Database name is required" },
            { code: 500, description: "Internal Server Error - Failed to retrieve collections" },
          ],
        },
        {
          method: "POST",
          path: "/api/collection/create-collection",
          description: "Creates a new collection within a specified database. Optionally enables encryption with AES-256 for sensitive data.",
          parameters: [
            {
              name: "dbName",
              type: "body",
              dataType: "string",
              required: true,
              description: "The name of the database",
            },
            {
              name: "collectionName",
              type: "body",
              dataType: "string",
              required: true,
              description: "The name of the collection to create",
            },
            {
              name: "crypto",
              type: "body",
              dataType: "boolean",
              required: false,
              description: "Enable encryption for this collection (default: false)",
            },
            {
              name: "key",
              type: "body",
              dataType: "string",
              required: false,
              description: "Encryption key (required if crypto is true)",
            },
          ],
          requestBody: `{
  "dbName": "UserDB",
  "collectionName": "users",
  "crypto": false
}

// With encryption
{
  "dbName": "SecureDB",
  "collectionName": "sensitive_data",
  "crypto": true,
  "key": "your-secret-encryption-key"
}`,
          responseExample: `{
  "statusCode": 201,
  "status": "success",
  "message": "Collection created successfully",
  "data": {
    "dbName": "UserDB",
    "collectionName": "users"
  }
}`,
          statusCodes: [
            { code: 201, description: "Created - Collection created successfully" },
            { code: 400, description: "Bad Request - Invalid database or collection name" },
            { code: 409, description: "Conflict - Collection already exists" },
            { code: 500, description: "Internal Server Error - Failed to create collection" },
          ],
        },
        {
          method: "DELETE",
          path: "/api/collection/delete-collection/",
          description: "Permanently deletes a collection and all its documents. This operation is irreversible.",
          parameters: [
            {
              name: "dbName",
              type: "query",
              dataType: "string",
              required: true,
              description: "The name of the database",
            },
            {
              name: "collectionName",
              type: "query",
              dataType: "string",
              required: true,
              description: "The name of the collection to delete",
            },
          ],
          responseExample: `{
  "statusCode": 200,
  "status": "success",
  "message": "Collection deleted successfully",
  "data": {
    "dbName": "UserDB",
    "collectionName": "old_users"
  }
}`,
          statusCodes: [
            { code: 200, description: "Success - Collection deleted successfully" },
            { code: 400, description: "Bad Request - Invalid parameters" },
            { code: 404, description: "Not Found - Collection does not exist" },
            { code: 500, description: "Internal Server Error - Failed to delete collection" },
          ],
        },
      ],
    },
    {
      title: "Document Operations (CRUD)",
      description: "Create, read, update, and delete documents with advanced query support",
      endpoints: [
        {
          method: "GET",
          path: "/api/operation/all/",
          description: "Retrieves all documents from a collection with pagination support. Returns 10 documents per page, sorted by most recent updates first.",
          parameters: [
            {
              name: "dbName",
              type: "query",
              dataType: "string",
              required: true,
              description: "The name of the database",
            },
            {
              name: "collectionName",
              type: "query",
              dataType: "string",
              required: true,
              description: "The name of the collection",
            },
            {
              name: "page",
              type: "query",
              dataType: "number",
              required: true,
              description: "Page number (starts from 1)",
            },
          ],
          responseExample: `{
  "statusCode": 200,
  "status": "success",
  "message": "Documents retrieved successfully",
  "data": [
    {
      "documentId": "abc123",
      "name": "John Doe",
      "email": "john@example.com",
      "updatedAt": "2025-10-31T12:00:00.000Z"
    }
    // ... more documents
  ]
}`,
          statusCodes: [
            { code: 200, description: "Success - Returns documents" },
            { code: 400, description: "Bad Request - Invalid parameters" },
            { code: 404, description: "Not Found - No documents found" },
          ],
        },
        {
          method: "POST",
          path: "/api/operation/all/by-query/",
          description: "Retrieves documents matching a MongoDB-style query with pagination. Supports operators like $gt, $gte, $lt, $lte, $ne, $in, $regex.",
          parameters: [
            {
              name: "dbName",
              type: "query",
              dataType: "string",
              required: true,
              description: "The name of the database",
            },
            {
              name: "collectionName",
              type: "query",
              dataType: "string",
              required: true,
              description: "The name of the collection",
            },
            {
              name: "page",
              type: "query",
              dataType: "number",
              required: true,
              description: "Page number (starts from 1)",
            },
            {
              name: "query",
              type: "body",
              dataType: "object",
              required: true,
              description: "MongoDB-style query object",
            },
          ],
          requestBody: `{
  "query": {
    "age": { "$gte": 18 },
    "status": "active"
  }
}

// Complex query with regex
{
  "query": {
    "email": { "$regex": "@gmail.com$", "$options": "i" },
    "age": { "$gt": 25, "$lt": 50 }
  }
}`,
          responseExample: `{
  "statusCode": 200,
  "status": "success",
  "message": "Documents retrieved successfully",
  "data": [ /* array of matching documents */ ]
}`,
          statusCodes: [
            { code: 200, description: "Success - Returns matching documents" },
            { code: 400, description: "Bad Request - Invalid query or parameters" },
            { code: 404, description: "Not Found - No documents match the query" },
          ],
        },
        {
          method: "GET",
          path: "/api/operation/all/by-id/",
          description: "Retrieves a specific document by its unique documentId. Fastest way to fetch a single document.",
          parameters: [
            {
              name: "dbName",
              type: "query",
              dataType: "string",
              required: true,
              description: "The name of the database",
            },
            {
              name: "collectionName",
              type: "query",
              dataType: "string",
              required: true,
              description: "The name of the collection",
            },
            {
              name: "documentId",
              type: "query",
              dataType: "string",
              required: true,
              description: "The unique document ID",
            },
          ],
          responseExample: `{
  "statusCode": 200,
  "status": "success",
  "message": "Document retrieved successfully",
  "data": {
    "documentId": "abc123",
    "name": "John Doe",
    "email": "john@example.com",
    "age": 30,
    "updatedAt": "2025-10-31T12:00:00.000Z"
  }
}`,
          statusCodes: [
            { code: 200, description: "Success - Returns the document" },
            { code: 400, description: "Bad Request - Invalid parameters" },
            { code: 404, description: "Not Found - Document does not exist" },
          ],
        },
        {
          method: "POST",
          path: "/api/operation/create/",
          description: "Creates a new document in the collection. AxioDB automatically adds a unique documentId and updatedAt timestamp.",
          parameters: [
            {
              name: "dbName",
              type: "query",
              dataType: "string",
              required: true,
              description: "The name of the database",
            },
            {
              name: "collectionName",
              type: "query",
              dataType: "string",
              required: true,
              description: "The name of the collection",
            },
            {
              name: "data",
              type: "body",
              dataType: "object",
              required: true,
              description: "The document data to insert",
            },
          ],
          requestBody: `{
  "data": {
    "name": "Jane Smith",
    "email": "jane@example.com",
    "age": 28,
    "active": true
  }
}`,
          responseExample: `{
  "statusCode": 201,
  "status": "success",
  "message": "Document created successfully",
  "data": {
    "documentId": "xyz789",
    "name": "Jane Smith",
    "email": "jane@example.com",
    "age": 28,
    "active": true,
    "updatedAt": "2025-10-31T12:00:00.000Z"
  }
}`,
          statusCodes: [
            { code: 201, description: "Created - Document created successfully" },
            { code: 400, description: "Bad Request - Invalid data or parameters" },
            { code: 500, description: "Internal Server Error - Failed to create document" },
          ],
        },
        {
          method: "POST",
          path: "/api/operation/create-many/",
          description: "Creates multiple documents in a single operation. Efficient for bulk inserts.",
          parameters: [
            {
              name: "dbName",
              type: "query",
              dataType: "string",
              required: true,
              description: "The name of the database",
            },
            {
              name: "collectionName",
              type: "query",
              dataType: "string",
              required: true,
              description: "The name of the collection",
            },
            {
              name: "data",
              type: "body",
              dataType: "array",
              required: true,
              description: "Array of documents to insert",
            },
          ],
          requestBody: `{
  "data": [
    { "name": "User 1", "email": "user1@example.com" },
    { "name": "User 2", "email": "user2@example.com" },
    { "name": "User 3", "email": "user3@example.com" }
  ]
}`,
          responseExample: `{
  "statusCode": 201,
  "status": "success",
  "message": "Documents created successfully",
  "data": {
    "total": 3,
    "documentIds": ["id1", "id2", "id3"]
  }
}`,
          statusCodes: [
            { code: 201, description: "Created - Documents created successfully" },
            { code: 400, description: "Bad Request - Invalid data or parameters" },
            { code: 500, description: "Internal Server Error - Failed to create documents" },
          ],
        },
        {
          method: "PUT",
          path: "/api/operation/update/by-id/",
          description: "Updates a specific document by its documentId. Only provided fields are updated; others remain unchanged.",
          parameters: [
            {
              name: "dbName",
              type: "query",
              dataType: "string",
              required: true,
              description: "The name of the database",
            },
            {
              name: "collectionName",
              type: "query",
              dataType: "string",
              required: true,
              description: "The name of the collection",
            },
            {
              name: "documentId",
              type: "query",
              dataType: "string",
              required: true,
              description: "The unique document ID",
            },
            {
              name: "data",
              type: "body",
              dataType: "object",
              required: true,
              description: "Fields to update",
            },
          ],
          requestBody: `{
  "data": {
    "age": 31,
    "status": "premium"
  }
}`,
          responseExample: `{
  "statusCode": 200,
  "status": "success",
  "message": "Document updated successfully",
  "data": {
    "newData": { /* updated document */ },
    "previousData": { /* old document */ },
    "documentId": "abc123"
  }
}`,
          statusCodes: [
            { code: 200, description: "Success - Document updated successfully" },
            { code: 400, description: "Bad Request - Invalid data or parameters" },
            { code: 404, description: "Not Found - Document does not exist" },
            { code: 500, description: "Internal Server Error - Failed to update document" },
          ],
        },
        {
          method: "PUT",
          path: "/api/operation/update/by-query/",
          description: "Updates all documents matching a query. Useful for bulk status changes or field updates.",
          parameters: [
            {
              name: "dbName",
              type: "query",
              dataType: "string",
              required: true,
              description: "The name of the database",
            },
            {
              name: "collectionName",
              type: "query",
              dataType: "string",
              required: true,
              description: "The name of the collection",
            },
            {
              name: "query",
              type: "body",
              dataType: "object",
              required: true,
              description: "Query to match documents",
            },
            {
              name: "data",
              type: "body",
              dataType: "object",
              required: true,
              description: "Fields to update",
            },
          ],
          requestBody: `{
  "query": { "status": "pending" },
  "data": { "status": "active" }
}`,
          responseExample: `{
  "statusCode": 200,
  "status": "success",
  "message": "Documents updated successfully",
  "data": {
    "total": 15,
    "documentIds": ["id1", "id2", ...]
  }
}`,
          statusCodes: [
            { code: 200, description: "Success - Documents updated successfully" },
            { code: 400, description: "Bad Request - Invalid query or data" },
            { code: 404, description: "Not Found - No documents match the query" },
            { code: 500, description: "Internal Server Error - Failed to update documents" },
          ],
        },
        {
          method: "DELETE",
          path: "/api/operation/delete/by-id/",
          description: "Deletes a specific document by its documentId. This operation is irreversible.",
          parameters: [
            {
              name: "dbName",
              type: "query",
              dataType: "string",
              required: true,
              description: "The name of the database",
            },
            {
              name: "collectionName",
              type: "query",
              dataType: "string",
              required: true,
              description: "The name of the collection",
            },
            {
              name: "documentId",
              type: "query",
              dataType: "string",
              required: true,
              description: "The unique document ID to delete",
            },
          ],
          responseExample: `{
  "statusCode": 200,
  "status": "success",
  "message": "Document deleted successfully",
  "data": {
    "deleteData": { /* deleted document */ }
  }
}`,
          statusCodes: [
            { code: 200, description: "Success - Document deleted successfully" },
            { code: 400, description: "Bad Request - Invalid parameters" },
            { code: 404, description: "Not Found - Document does not exist" },
            { code: 500, description: "Internal Server Error - Failed to delete document" },
          ],
        },
        {
          method: "DELETE",
          path: "/api/operation/delete/by-query/",
          description: "Deletes all documents matching a query. Use with caution as this operation cannot be undone.",
          parameters: [
            {
              name: "dbName",
              type: "query",
              dataType: "string",
              required: true,
              description: "The name of the database",
            },
            {
              name: "collectionName",
              type: "query",
              dataType: "string",
              required: true,
              description: "The name of the collection",
            },
            {
              name: "query",
              type: "body",
              dataType: "object",
              required: true,
              description: "Query to match documents to delete",
            },
          ],
          requestBody: `{
  "query": { "status": "inactive", "lastActive": { "$lt": "2024-01-01" } }
}`,
          responseExample: `{
  "statusCode": 200,
  "status": "success",
  "message": "Documents deleted successfully",
  "data": {
    "deleteData": [ /* array of deleted documents */ ]
  }
}`,
          statusCodes: [
            { code: 200, description: "Success - Documents deleted successfully" },
            { code: 400, description: "Bad Request - Invalid query" },
            { code: 404, description: "Not Found - No documents match the query" },
            { code: 500, description: "Internal Server Error - Failed to delete documents" },
          ],
        },
        {
          method: "POST",
          path: "/api/operation/aggregate/",
          description: "Runs MongoDB-style aggregation pipeline for complex data analysis. Supports $match, $group, $sort, $project, $limit, $skip, $unwind, $addFields.",
          parameters: [
            {
              name: "dbName",
              type: "query",
              dataType: "string",
              required: true,
              description: "The name of the database",
            },
            {
              name: "collectionName",
              type: "query",
              dataType: "string",
              required: true,
              description: "The name of the collection",
            },
            {
              name: "pipeline",
              type: "body",
              dataType: "array",
              required: true,
              description: "Aggregation pipeline stages",
            },
          ],
          requestBody: `{
  "pipeline": [
    { "$match": { "status": "active" } },
    { "$group": {
      "_id": "$city",
      "count": { "$sum": 1 },
      "avgAge": { "$avg": "$age" }
    }},
    { "$sort": { "count": -1 } },
    { "$limit": 10 }
  ]
}`,
          responseExample: `{
  "statusCode": 200,
  "status": "success",
  "message": "Aggregation completed",
  "data": [
    { "_id": "New York", "count": 150, "avgAge": 32.5 },
    { "_id": "Los Angeles", "count": 120, "avgAge": 29.8 }
  ]
}`,
          statusCodes: [
            { code: 200, description: "Success - Returns aggregation results" },
            { code: 400, description: "Bad Request - Invalid pipeline" },
            { code: 500, description: "Internal Server Error - Aggregation failed" },
          ],
        },
      ],
    },
  ];

  return (
    <section id="server-api-reference" className="pt-12 scroll-mt-20">
      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-indigo-900/20 dark:via-slate-800 dark:to-purple-900/20 rounded-2xl p-8 lg:p-12 mb-12 border border-indigo-200 dark:border-indigo-800 shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-400/10 to-purple-400/10 rounded-full blur-3xl"></div>

        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl shadow-lg">
              <Globe className="h-10 w-10 text-white" />
            </div>
            <div>
              <h2 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-indigo-800 via-purple-700 to-pink-700 dark:from-indigo-200 dark:via-purple-300 dark:to-pink-200 bg-clip-text text-transparent">
                HTTP Server API Reference
              </h2>
              <p className="text-xl text-slate-600 dark:text-slate-300 font-light mt-2">
                RESTful API documentation for AxioDB GUI Server
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-lg text-slate-700 dark:text-slate-300 leading-relaxed">
              The AxioDB GUI Server provides a comprehensive RESTful API for managing databases, collections, and documents
              over HTTP. All endpoints return JSON responses and support standard HTTP status codes. Base URL: <code className="bg-indigo-100 dark:bg-indigo-900 px-2 py-1 rounded">http://localhost:27018</code>
            </p>
            <p className="text-lg text-slate-700 dark:text-slate-300 leading-relaxed">
              Every endpoint below except <code className="bg-indigo-100 dark:bg-indigo-900 px-2 py-1 rounded">/api/info</code>, <code className="bg-indigo-100 dark:bg-indigo-900 px-2 py-1 rounded">/api/health</code>, <code className="bg-indigo-100 dark:bg-indigo-900 px-2 py-1 rounded">/api/routes</code>, and <code className="bg-indigo-100 dark:bg-indigo-900 px-2 py-1 rounded">/api/auth/login</code> requires an authenticated session (see the <strong>Authentication &amp; Access Control</strong> section below) and is subject to role-based permission checks - expect <code className="bg-indigo-100 dark:bg-indigo-900 px-2 py-1 rounded">401</code> without a valid session cookie and <code className="bg-indigo-100 dark:bg-indigo-900 px-2 py-1 rounded">403</code> if the caller's role lacks the required permission.
            </p>

            {/* Quick Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div className="bg-indigo-100 dark:bg-indigo-900/30 rounded-lg p-4 border border-indigo-200 dark:border-indigo-700">
                <h3 className="font-semibold text-indigo-900 dark:text-indigo-200 mb-2 flex items-center gap-2">
                  <Server className="h-5 w-5" />
                  Base URL
                </h3>
                <code className="text-sm text-indigo-800 dark:text-indigo-300 break-all">
                  http://localhost:27018
                </code>
              </div>

              <div className="bg-purple-100 dark:bg-purple-900/30 rounded-lg p-4 border border-purple-200 dark:border-purple-700">
                <h3 className="font-semibold text-purple-900 dark:text-purple-200 mb-2">
                  Content-Type
                </h3>
                <code className="text-sm text-purple-800 dark:text-purple-300">
                  application/json
                </code>
              </div>

              <div className="bg-pink-100 dark:bg-pink-900/30 rounded-lg p-4 border border-pink-200 dark:border-pink-700">
                <h3 className="font-semibold text-pink-900 dark:text-pink-200 mb-2">
                  Authentication
                </h3>
                <p className="text-sm text-pink-800 dark:text-pink-300">
                  Session cookie (httpOnly) via <code>/api/auth/login</code>, RBAC-enforced
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* API Categories */}
      <div className="space-y-6">
        {apiCategories.map((category) => (
          <div
            key={category.title}
            className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden"
          >
            <button
              className="flex items-center justify-between w-full p-6 text-left bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-700 dark:to-slate-800 hover:from-slate-100 hover:to-slate-200 dark:hover:from-slate-600 dark:hover:to-slate-700 transition-all"
              onClick={() => toggleCategory(category.title)}
            >
              <div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
                  {category.title}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {category.description}
                </p>
              </div>
              {expandedCategories.includes(category.title) ? (
                <ChevronDown size={24} className="text-slate-500" />
              ) : (
                <ChevronRight size={24} className="text-slate-500" />
              )}
            </button>

            {expandedCategories.includes(category.title) && (
              <div className="divide-y divide-slate-100 dark:divide-slate-700">
                {category.endpoints.map((endpoint, idx) => {
                  const endpointId = `${category.title}-${idx}`;
                  return (
                    <div key={endpointId} className="p-6">
                      <button
                        className="flex items-center justify-between w-full text-left mb-4"
                        onClick={() => toggleEndpoint(endpointId)}
                      >
                        <div className="flex items-center gap-3 flex-wrap">
                          <span
                            className={`px-3 py-1 rounded-lg font-bold text-sm border ${getMethodColor(endpoint.method)}`}
                          >
                            {endpoint.method}
                          </span>
                          <code className="font-mono text-slate-700 dark:text-slate-300 font-medium">
                            {endpoint.path}
                          </code>
                        </div>
                        {expandedEndpoints.includes(endpointId) ? (
                          <ChevronDown size={20} className="text-slate-500 flex-shrink-0" />
                        ) : (
                          <ChevronRight size={20} className="text-slate-500 flex-shrink-0" />
                        )}
                      </button>

                      <p className="text-slate-700 dark:text-slate-300 mb-4">
                        {endpoint.description}
                      </p>

                      {expandedEndpoints.includes(endpointId) && (
                        <div className="space-y-4 mt-4">
                          {/* Parameters */}
                          {endpoint.parameters && endpoint.parameters.length > 0 && (
                            <div>
                              <h4 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-2">
                                Parameters
                              </h4>
                              <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 space-y-3">
                                {endpoint.parameters.map((param, paramIdx) => (
                                  <div key={paramIdx} className="border-l-2 border-indigo-400 pl-3">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <code className="font-mono text-indigo-600 dark:text-indigo-400 font-semibold">
                                        {param.name}
                                      </code>
                                      <span className="text-xs bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded">
                                        {param.type}
                                      </span>
                                      <span className="text-xs text-slate-600 dark:text-slate-400">
                                        {param.dataType}
                                      </span>
                                      {param.required && (
                                        <span className="text-xs bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 px-2 py-0.5 rounded font-semibold">
                                          required
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                                      {param.description}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Request Body */}
                          {endpoint.requestBody && (
                            <div>
                              <h4 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-2">
                                Request Body Example
                              </h4>
                              <pre className="bg-slate-900 dark:bg-slate-950 p-4 rounded-lg overflow-x-auto">
                                <code className="text-sm font-mono text-green-400">
                                  {endpoint.requestBody}
                                </code>
                              </pre>
                            </div>
                          )}

                          {/* Response Example */}
                          {endpoint.responseExample && (
                            <div>
                              <h4 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-2">
                                Response Example
                              </h4>
                              <pre className="bg-slate-900 dark:bg-slate-950 p-4 rounded-lg overflow-x-auto">
                                <code className="text-sm font-mono text-cyan-400">
                                  {endpoint.responseExample}
                                </code>
                              </pre>
                            </div>
                          )}

                          {/* Status Codes */}
                          <div>
                            <h4 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-2">
                              Status Codes
                            </h4>
                            <div className="space-y-2">
                              {endpoint.statusCodes.map((status, statusIdx) => (
                                <div
                                  key={statusIdx}
                                  className="flex items-start gap-3 text-sm"
                                >
                                  <span
                                    className={`px-2 py-1 rounded font-mono font-semibold ${status.code >= 200 && status.code < 300
                                      ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                      : status.code >= 400 && status.code < 500
                                        ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                                        : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                                      }`}
                                  >
                                    {status.code}
                                  </span>
                                  <span className="text-slate-700 dark:text-slate-300">
                                    {status.description}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer Info */}
      <div className="mt-12 space-y-6">
        {/* Error Response Format */}
        <div className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 rounded-lg p-6 border border-red-200 dark:border-red-800">
          <h3 className="text-xl font-bold text-red-900 dark:text-red-200 mb-4 flex items-center gap-2">
            <span className="text-2xl">⚠️</span> Error Response Format
          </h3>
          <p className="text-red-800 dark:text-red-300 mb-3">
            All error responses follow this consistent format:
          </p>
          <pre className="bg-red-900 dark:bg-red-950 p-4 rounded-lg overflow-x-auto">
            <code className="text-sm font-mono text-red-200">{`{
  "statusCode": 400,
  "status": "error",
  "message": "Detailed error message",
  "error": {
    // Additional error details (optional)
  }
}`}</code>
          </pre>
        </div>

        {/* Usage Tips */}
        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
          <h3 className="text-xl font-bold text-blue-900 dark:text-blue-200 mb-4 flex items-center gap-2">
            <span className="text-2xl">💡</span> Usage Tips
          </h3>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-blue-800 dark:text-blue-300">
            <li className="flex items-start gap-2">
              <span className="text-blue-600 dark:text-blue-400 mt-0.5">✓</span>
              <span className="text-sm">Set <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">Content-Type: application/json</code> for all requests</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 dark:text-blue-400 mt-0.5">✓</span>
              <span className="text-sm">Use pagination for large datasets (10 items per page)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 dark:text-blue-400 mt-0.5">✓</span>
              <span className="text-sm">Check status codes for proper error handling</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 dark:text-blue-400 mt-0.5">✓</span>
              <span className="text-sm">Use documentId queries for fastest lookups</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 dark:text-blue-400 mt-0.5">✓</span>
              <span className="text-sm">Enable encryption when creating sensitive collections</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 dark:text-blue-400 mt-0.5">✓</span>
              <span className="text-sm">Export databases regularly for backups</span>
            </li>
          </ul>
        </div>

        {/* Final Note */}
        <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
          <p className="text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <span className="text-indigo-600 dark:text-indigo-400 text-xl">ℹ️</span>
            <span>
              The AxioDB GUI Server runs on <code className="bg-slate-200 dark:bg-slate-800 px-2 py-1 rounded mx-1">localhost:27018</code> by default.
              All API endpoints are available when GUI is enabled in AxioDB initialization. For more details on the JavaScript/TypeScript API,
              see the <a href="/api-reference" className="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold">Core API Reference</a>.
            </span>
          </p>
        </div>
      </div>
    </section>
  );
};

export default ServerApiReference;
