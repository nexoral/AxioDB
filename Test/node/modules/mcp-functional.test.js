/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-require-imports */

const Module = require('module');
const path = require('path');
const fs = require('fs');
const TestRunner = require('../helpers/TestRunner');
const { assert } = require('../helpers/assertions');
const { AxioDB } = require('../../../lib/config/DB.js');

// The MCP SDK is intentionally Docker-only. Tool modules only need these schema builders at
// registration time, so a tiny schema stub lets this suite exercise real handlers locally.
const schema = new Proxy({}, { get: (_, property) => property === 'optional' ? () => schema : () => schema });
const zodStub = { z: { string: () => schema, record: () => schema, array: () => schema, number: () => schema, boolean: () => schema, any: () => schema } };

class McpFunctionalTests extends TestRunner {
  constructor() {
    super('MCP Functional Test Suite');
    this.testDir = './Test/TestMcpFunctional';
    this.db = null;
    this.handlers = new Map();
    this.dockerLibCreated = false;
  }

  async setUp() {
    if (fs.existsSync(this.testDir)) fs.rmSync(this.testDir, { recursive: true, force: true });
    this.db = new AxioDB({ GUI: false, MCP: true, RootName: 'McpFunctionalTestDB', CustomPath: this.testDir });
    await this.db.createDB('InitDB');
    const AuthSeeder = require('../../../lib/Services/Auth/AuthSeeder.service').default;
    await new AuthSeeder(this.db).seedIfNeeded();

    const dockerLibPath = path.resolve(__dirname, '../../../Docker/lib');
    const actualLibPath = path.resolve(__dirname, '../../../lib');
    if (!fs.existsSync(dockerLibPath)) {
      try {
        fs.symlinkSync(actualLibPath, dockerLibPath, 'junction');
        this.dockerLibCreated = true;
      } catch {
        // Ignored
      }
    }

    const fakeServer = {
      server: { getClientCapabilities: () => ({}) },
      registerTool: (name, _definition, handler) => this.handlers.set(name, handler),
    };
    const originalLoad = Module._load;
    Module._load = function load(request, parent, isMain) {
      if (request === 'zod') return zodStub;
      const libMarker = request.indexOf('lib/');
      if (libMarker >= 0) {
        return originalLoad.call(this, path.join(__dirname, '..', '..', '..', request.slice(libMarker)), parent, isMain);
      }
      return originalLoad.call(this, request, parent, isMain);
    };
    try {
      const tools = [
        ['auth', require('../../../Docker/mcp/tools/auth.tools')],
        ['database', require('../../../Docker/mcp/tools/database.tools')],
        ['collection', require('../../../Docker/mcp/tools/collection.tools')],
        ['document', require('../../../Docker/mcp/tools/document.tools')],
        ['index', require('../../../Docker/mcp/tools/index.tools')],
        ['dashboard', require('../../../Docker/mcp/tools/dashboard.tools')],
        ['user', require('../../../Docker/mcp/tools/user.tools')],
        ['role', require('../../../Docker/mcp/tools/role.tools')],
        ['transaction', require('../../../Docker/mcp/tools/transaction.tools')],
      ];
      for (const [, register] of tools) register(fakeServer, this.db);
    } finally {
      Module._load = originalLoad;
    }
  }

  async tearDown() {
    if (this.db) {
      await this.db.stopMCPServer();
    }
    if (this.dockerLibCreated) {
      const dockerLibPath = path.resolve(__dirname, '../../../Docker/lib');
      try {
        fs.unlinkSync(dockerLibPath);
      } catch {
        // Ignored
      }
    }
    if (fs.existsSync(this.testDir)) fs.rmSync(this.testDir, { recursive: true, force: true });
  }

  async call(name, args) {
    const handler = this.handlers.get(name);
    if (!handler) throw new Error(`MCP tool was not registered: ${name}`);
    const result = await handler(args);
    return JSON.parse(result.content[0].text);
  }

  async runTests() {
    await this.test('Registers all MCP tool families, including transactions', async () => {
      assert.equal(this.handlers.size, 43);
      assert.ok(this.handlers.has('axiodb_login'));
      assert.ok(this.handlers.has('axiodb_begin_transaction'));
      assert.ok(this.handlers.has('axiodb_create_user'));
      assert.ok(this.handlers.has('axiodb_create_role'));
      assert.ok(this.handlers.has('axiodb_health'));
    });

    const login = await this.call('axiodb_login', { username: 'admin', password: 'admin' });
    const sessionId = login.data.sessionId;

    await this.test('Executes MCP database, collection, document, index, and aggregate handlers', async () => {
      assert.equal((await this.call('axiodb_create_database', { sessionId, name: 'McpDB' })).statusCode, 201);
      assert.equal((await this.call('axiodb_create_collection', { sessionId, dbName: 'McpDB', collectionName: 'items' })).statusCode, 201);
      assert.equal((await this.call('axiodb_database_exists', { sessionId, name: 'McpDB' })).data.exists, true);
      assert.equal((await this.call('axiodb_collection_exists', { sessionId, dbName: 'McpDB', collectionName: 'items' })).data.exists, true);
      assert.equal((await this.call('axiodb_get_instance_info', { sessionId })).statusCode, 200);
      assert.equal((await this.call('axiodb_get_collection_info', { sessionId, databaseName: 'McpDB' })).statusCode, 200);
      assert.equal((await this.call('axiodb_insert_document', { sessionId, dbName: 'McpDB', collectionName: 'items', document: { category: 'a', value: 2 } })).statusCode, 201);
      assert.equal((await this.call('axiodb_insert_many_documents', { sessionId, dbName: 'McpDB', collectionName: 'items', documents: [{ category: 'b', value: 3 }, { category: 'a', value: 4 }] })).statusCode, 201);
      const query = await this.call('axiodb_query_documents', { sessionId, dbName: 'McpDB', collectionName: 'items', query: { category: 'a' } });
      assert.equal(query.statusCode, 200);
      const documents = query.data.documents ?? query.data.data?.documents;
      assert.equal(documents.length, 2);
      assert.equal((await this.call('axiodb_create_index', { sessionId, dbName: 'McpDB', collectionName: 'items', fieldNames: ['category'] })).statusCode, 201);
      assert.equal((await this.call('axiodb_list_indexes', { sessionId, dbName: 'McpDB', collectionName: 'items' })).statusCode, 200);
      const hinted = await this.call('axiodb_query_documents', { sessionId, dbName: 'McpDB', collectionName: 'items', query: { category: 'a' }, hint: 'category' });
      assert.equal(hinted.statusCode, 200);
      const ids = documents.map((document) => document.documentId);
      assert.equal((await this.call('axiodb_find_documents_by_ids', { sessionId, dbName: 'McpDB', collectionName: 'items', ids })).statusCode, 200);
      assert.equal((await this.call('axiodb_update_document', { sessionId, dbName: 'McpDB', collectionName: 'items', documentId: ids[0], update: { value: 20 } })).statusCode, 200);
      assert.equal((await this.call('axiodb_delete_document', { sessionId, dbName: 'McpDB', collectionName: 'items', documentId: ids[1] })).statusCode, 200);
      assert.equal((await this.call('axiodb_aggregate', { sessionId, dbName: 'McpDB', collectionName: 'items', aggregation: [{ $match: { category: 'a' } }] })).statusCode, 200);
      assert.equal((await this.call('axiodb_drop_index', { sessionId, dbName: 'McpDB', collectionName: 'items', indexName: 'category' })).statusCode, 200);
    });

    await this.test('Executes MCP transaction handlers and rolls back buffered work', async () => {
      const begin = await this.call('axiodb_begin_transaction', { sessionId, dbName: 'McpDB', collectionName: 'items' });
      const transactionId = begin.data.transactionId;
      assert.equal((await this.call('axiodb_transaction_insert', { sessionId, transactionId, document: { category: 'rollback' } })).statusCode, 200);
      assert.equal((await this.call('axiodb_transaction_savepoint', { sessionId, transactionId, savepointName: 'before-update' })).statusCode, 200);
      assert.equal((await this.call('axiodb_transaction_update', { sessionId, transactionId, query: { category: 'a' }, update: { staged: true } })).statusCode, 200);
      assert.equal((await this.call('axiodb_transaction_rollback_to_savepoint', { sessionId, transactionId, savepointName: 'before-update' })).statusCode, 200);
      assert.equal((await this.call('axiodb_transaction_release_savepoint', { sessionId, transactionId, savepointName: 'before-update' })).statusCode, 200);
      assert.equal((await this.call('axiodb_transaction_delete', { sessionId, transactionId, query: { category: 'missing' } })).statusCode, 200);
      assert.equal((await this.call('axiodb_rollback_transaction', { sessionId, transactionId })).statusCode, 200);
      const count = await this.call('axiodb_total_documents', { sessionId, dbName: 'McpDB', collectionName: 'items' });
      assert.equal(count.data.total, 2);
    });

    await this.test('Executes MCP user, role, dashboard, and session handlers', async () => {
      assert.equal((await this.call('axiodb_whoami', { sessionId })).statusCode, 200);
      assert.equal((await this.call('axiodb_list_users', { sessionId })).statusCode, 200);
      assert.equal((await this.call('axiodb_list_roles', { sessionId })).statusCode, 200);
      assert.equal((await this.call('axiodb_list_permissions', { sessionId })).statusCode, 200);
      assert.equal((await this.call('axiodb_get_dashboard_stats', { sessionId })).statusCode, 200);
      assert.equal((await this.call('axiodb_health', { sessionId })).data.status, 'ok');
      assert.equal((await this.call('axiodb_create_role', { sessionId, roleName: 'McpTempRole', permissions: ['document:view'] })).statusCode, 201);
      assert.equal((await this.call('axiodb_create_user', { sessionId, username: 'mcp-temp-user', password: 'temp1234', role: 'McpTempRole' })).statusCode, 201);
      assert.equal((await this.call('axiodb_update_user_role', { sessionId, username: 'mcp-temp-user', role: 'View' })).statusCode, 200);
      assert.equal((await this.call('axiodb_reset_user_password', { sessionId, username: 'mcp-temp-user', newPassword: 'temp5678' })).statusCode, 200);
      assert.equal((await this.call('axiodb_delete_user', { sessionId, username: 'mcp-temp-user' })).statusCode, 200);
      assert.equal((await this.call('axiodb_delete_role', { sessionId, roleName: 'McpTempRole' })).statusCode, 200);
      assert.equal((await this.call('axiodb_logout', { sessionId })).statusCode, 200);
    });

    await this.test('Native HTTP MCP Server on port 27020 handles JSON-RPC 2.0 and tells unauthenticated agents to log in', async () => {
      // 1. GET /mcp health/discovery
      const healthRes = await fetch('http://localhost:27020/mcp');
      assert.equal(healthRes.status, 200);
      const healthJson = await healthRes.json();
      assert.equal(healthJson.service, 'axiodb-mcp-server');
      assert.equal(healthJson.port, 27020);

      // 2. POST /mcp initialize
      const initRes = await fetch('http://localhost:27020/mcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize' }),
      });
      const initJson = await initRes.json();
      assert.equal(initJson.result.serverInfo.name, 'axiodb-mcp-server');
      assert.equal(initJson.result.protocolVersion, '2024-11-05');
      const mcpSessionId = initRes.headers.get('mcp-session-id');
      assert.ok(mcpSessionId);

      // 2b. POST /mcp notifications/initialized (Codex / RMCP handshake) returns 202 Accepted
      const initNotifRes = await fetch('http://localhost:27020/mcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'mcp-session-id': mcpSessionId },
        body: JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }),
      });
      assert.equal(initNotifRes.status, 202);
      const notifBody = await initNotifRes.text();
      assert.equal(notifBody, '');

      // 3. POST /mcp tools/list
      const listRes = await fetch('http://localhost:27020/mcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'tools/list' }),
      });
      const listJson = await listRes.json();
      assert.ok(Array.isArray(listJson.result.tools));
      assert.ok(listJson.result.tools.some((t) => t.name === 'axiodb_login'));
      assert.ok(listJson.result.tools.some((t) => t.name === 'axiodb_query_documents'));

      // 4. Call without sessionId tells AI agent to login first
      const noAuthRes = await fetch('http://localhost:27020/mcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 3,
          method: 'tools/call',
          params: { name: 'axiodb_list_databases', arguments: {} },
        }),
      });
      const noAuthJson = await noAuthRes.json();
      assert.equal(noAuthJson.result.isError, true);
      const errPayload = JSON.parse(noAuthJson.result.content[0].text);
      assert.equal(errPayload.statusCode, 401);
      assert.ok(errPayload.message.includes('axiodb_login'));

      // 5. Call axiodb_login over native HTTP MCP
      const loginRes = await fetch('http://localhost:27020/mcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 4,
          method: 'tools/call',
          params: { name: 'axiodb_login', arguments: { username: 'admin', password: 'admin' } },
        }),
      });
      const loginJson = await loginRes.json();
      const loginPayload = JSON.parse(loginJson.result.content[0].text);
      assert.equal(loginPayload.statusCode, 200);
      assert.ok(loginPayload.data.sessionId);

      // 6. If mustChangePassword is true, password change is enforced first
      if (loginPayload.data.mustChangePassword) {
        const blockedRes = await fetch('http://localhost:27020/mcp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 5,
            method: 'tools/call',
            params: { name: 'axiodb_list_databases', arguments: { sessionId: loginPayload.data.sessionId } },
          }),
        });
        const blockedJson = await blockedRes.json();
        const blockedPayload = JSON.parse(blockedJson.result.content[0].text);
        assert.equal(blockedPayload.statusCode, 403);

        const changeRes = await fetch('http://localhost:27020/mcp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 6,
            method: 'tools/call',
            params: {
              name: 'axiodb_change_own_password',
              arguments: {
                sessionId: loginPayload.data.sessionId,
                oldPassword: 'admin',
                newPassword: 'newAdminPassword123!',
              },
            },
          }),
        });
        const changeJson = await changeRes.json();
        const changePayload = JSON.parse(changeJson.result.content[0].text);
        assert.equal(changePayload.statusCode, 200);
      }

      // 7. Call with active authenticated session succeeds
      const dbListRes = await fetch('http://localhost:27020/mcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 7,
          method: 'tools/call',
          params: { name: 'axiodb_list_databases', arguments: { sessionId: loginPayload.data.sessionId } },
        }),
      });
      const dbListJson = await dbListRes.json();
      const dbListPayload = JSON.parse(dbListJson.result.content[0].text);
      assert.equal(dbListPayload.statusCode, 200);
      assert.ok(dbListPayload.executionTime);
      assert.ok(typeof dbListPayload.executionTimeMs === 'number');

      // 8. Call axiodb_list_collections with { name: 'InitDB' } or { dbName: 'InitDB' } succeeds
      const colListRes = await fetch('http://localhost:27020/mcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 8,
          method: 'tools/call',
          params: { name: 'axiodb_list_collections', arguments: { sessionId: loginPayload.data.sessionId, name: 'InitDB' } },
        }),
      });
      const colListJson = await colListRes.json();
      const colListPayload = JSON.parse(colListJson.result.content[0].text);
      assert.equal(colListPayload.statusCode, 200);
      assert.ok(colListPayload.executionTime);

      // 9. axiodb_create_index works with fieldName or fieldNames
      const createIdxRes = await fetch('http://localhost:27020/mcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 9,
          method: 'tools/call',
          params: {
            name: 'axiodb_create_index',
            arguments: {
              sessionId: loginPayload.data.sessionId,
              dbName: 'McpDB',
              collectionName: 'items',
              fieldName: 'value',
            },
          },
        }),
      });
      const createIdxJson = await createIdxRes.json();
      const createIdxPayload = JSON.parse(createIdxJson.result.content[0].text);
      assert.equal(createIdxPayload.statusCode, 201);

      // 10. axiodb_drop_index works
      const dropIdxRes = await fetch('http://localhost:27020/mcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 10,
          method: 'tools/call',
          params: {
            name: 'axiodb_drop_index',
            arguments: {
              sessionId: loginPayload.data.sessionId,
              dbName: 'McpDB',
              collectionName: 'items',
              indexName: 'value',
            },
          },
        }),
      });
      const dropIdxJson = await dropIdxRes.json();
      const dropIdxPayload = JSON.parse(dropIdxJson.result.content[0].text);
      assert.equal(dropIdxPayload.statusCode, 200);

      // 11. Empty transaction commit returns 200 instead of 500
      const beginRes = await fetch('http://localhost:27020/mcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 11,
          method: 'tools/call',
          params: {
            name: 'axiodb_begin_transaction',
            arguments: {
              sessionId: loginPayload.data.sessionId,
              dbName: 'McpDB',
              collectionName: 'items',
            },
          },
        }),
      });
      const beginJson = await beginRes.json();
      const beginPayload = JSON.parse(beginJson.result.content[0].text);
      assert.equal(beginPayload.statusCode, 200);
      const emptyTxnId = beginPayload.data.transactionId;

      const commitRes = await fetch('http://localhost:27020/mcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 12,
          method: 'tools/call',
          params: {
            name: 'axiodb_commit_transaction',
            arguments: {
              sessionId: loginPayload.data.sessionId,
              transactionId: emptyTxnId,
            },
          },
        }),
      });
      const commitJson = await commitRes.json();
      const commitPayload = JSON.parse(commitJson.result.content[0].text);
      assert.equal(commitPayload.statusCode, 200);

      // 12. Create and delete user over live MCP with admin session succeeds
      const createUserRes = await fetch('http://localhost:27020/mcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 13,
          method: 'tools/call',
          params: {
            name: 'axiodb_create_user',
            arguments: {
              sessionId: loginPayload.data.sessionId,
              username: 'mcp-live-test-user',
              password: 'testPassword123!',
              role: 'View',
            },
          },
        }),
      });
      const createUserJson = await createUserRes.json();
      const createUserPayload = JSON.parse(createUserJson.result.content[0].text);
      assert.equal(createUserPayload.statusCode, 201);

      const deleteUserRes = await fetch('http://localhost:27020/mcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 14,
          method: 'tools/call',
          params: {
            name: 'axiodb_delete_user',
            arguments: {
              sessionId: loginPayload.data.sessionId,
              username: 'mcp-live-test-user',
            },
          },
        }),
      });
      const deleteUserJson = await deleteUserRes.json();
      const deleteUserPayload = JSON.parse(deleteUserJson.result.content[0].text);
      assert.equal(deleteUserPayload.statusCode, 200);
    });
  }
}

module.exports = McpFunctionalTests;
