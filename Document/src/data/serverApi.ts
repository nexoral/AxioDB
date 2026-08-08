/**
 * Machine-readable description of the AxioDB HTTP Control Server API.
 *
 * Single source of truth for both the /server-api documentation page
 * (src/components/content/ServerApiReference.tsx) and the generated
 * public/openapi.json + public/.well-known/api-catalog served for agent
 * discovery (scripts/generate-seo-files.ts).
 *
 * Note: the extra leading indentation below is deliberate - the endpoint list
 * was lifted verbatim out of the component, and several `responseExample`
 * template literals would lose their internal JSON alignment if re-indented.
 */

export interface ApiEndpoint {
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

export interface ApiCategory {
  title: string;
  description: string;
  endpoints: ApiEndpoint[];
}

export const apiCategories: ApiCategory[] = [
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
          description: "Creates a new collection within a specified database.",
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
          ],
          requestBody: `{
  "dbName": "UserDB",
  "collectionName": "users"
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
      title: "Index Management",
      description: "List, create, and drop custom field indexes on a collection - gated by the index:view / index:create / index:delete permissions (View role gets view-only; Admin and Super Admin get all three)",
      endpoints: [
        {
          method: "GET",
          path: "/api/index/list",
          description: "Lists every index currently registered on a collection, including the automatic documentId index.",
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
          ],
          responseExample: `{
  "statusCode": 200,
  "status": "success",
  "message": "Indexes retrieved successfully",
  "data": [
    { "indexFieldName": "documentId", "fileName": "documentId.axiodb", "path": "/path/to/indexes/documentId.axiodb" },
    { "indexFieldName": "email", "fileName": "email.axiodb", "path": "/path/to/indexes/email.axiodb" }
  ]
}`,
          statusCodes: [
            { code: 200, description: "Success - Returns list of index metadata entries" },
            { code: 400, description: "Bad Request - Invalid database or collection name" },
            { code: 403, description: "Forbidden - Insufficient permissions, or the reserved config database" },
            { code: 404, description: "Not Found - Collection does not exist" },
            { code: 500, description: "Internal Server Error - Failed to retrieve indexes" },
          ],
        },
        {
          method: "POST",
          path: "/api/index/create",
          description: "Creates one or more indexes on a collection, one per field name. Safe to call again for a field that's already indexed - it's a no-op for that field.",
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
              description: "The name of the collection",
            },
            {
              name: "fieldNames",
              type: "body",
              dataType: "string[]",
              required: true,
              description: "One or more field names to index (non-empty array)",
            },
          ],
          requestBody: `{
  "dbName": "UserDB",
  "collectionName": "users",
  "fieldNames": ["email", "age"]
}`,
          responseExample: `{
  "statusCode": 201,
  "status": "success",
  "message": "Indexes: email, age created Indexes: ",
  "data": null
}`,
          statusCodes: [
            { code: 201, description: "Created - Index(es) created (or already existed)" },
            { code: 400, description: "Bad Request - fieldNames must be a non-empty array" },
            { code: 403, description: "Forbidden - Insufficient permissions, or the reserved config database" },
            { code: 404, description: "Not Found - Collection does not exist" },
            { code: 500, description: "Internal Server Error - Failed to create index" },
          ],
        },
        {
          method: "DELETE",
          path: "/api/index/delete",
          description: "Removes an index from a collection by field name.",
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
              name: "indexName",
              type: "query",
              dataType: "string",
              required: true,
              description: "The indexed field name to drop",
            },
          ],
          responseExample: `{
  "statusCode": 200,
  "status": "success",
  "message": "Index deleted successfully",
  "data": null
}`,
          statusCodes: [
            { code: 200, description: "Success - Index deleted successfully" },
            { code: 400, description: "Bad Request - Invalid parameters" },
            { code: 403, description: "Forbidden - Insufficient permissions, or the reserved config database" },
            { code: 404, description: "Not Found - Collection or index does not exist" },
            { code: 500, description: "Internal Server Error - Failed to delete index" },
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
