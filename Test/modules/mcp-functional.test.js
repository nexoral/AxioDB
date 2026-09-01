/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-require-imports */

const Module = require('module');
const path = require('path');
const fs = require('fs');
const TestRunner = require('../helpers/TestRunner');
const { assert } = require('../helpers/assertions');
const { AxioDB } = require('../../lib/config/DB.js');

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
  }

  async setUp() {
    if (fs.existsSync(this.testDir)) fs.rmSync(this.testDir, { recursive: true, force: true });
    this.db = new AxioDB({ GUI: false, RootName: 'McpFunctionalTestDB', CustomPath: this.testDir });
    const AuthSeeder = require('../../lib/Services/Auth/AuthSeeder.service').default;
    await new AuthSeeder(this.db).seedIfNeeded();
    const fakeServer = {
      server: { getClientCapabilities: () => ({}) },
      registerTool: (name, _definition, handler) => this.handlers.set(name, handler),
    };
    const originalLoad = Module._load;
    Module._load = function load(request, parent, isMain) {
      if (request === 'zod') return zodStub;
      const libMarker = request.indexOf('lib/');
      if (libMarker >= 0) {
        return originalLoad.call(this, path.join(__dirname, '..', '..', request.slice(libMarker)), parent, isMain);
      }
      return originalLoad.call(this, request, parent, isMain);
    };
    try {
      const tools = [
        ['auth', require('../../Docker/mcp/tools/auth.tools')],
        ['database', require('../../Docker/mcp/tools/database.tools')],
        ['collection', require('../../Docker/mcp/tools/collection.tools')],
        ['document', require('../../Docker/mcp/tools/document.tools')],
        ['index', require('../../Docker/mcp/tools/index.tools')],
        ['dashboard', require('../../Docker/mcp/tools/dashboard.tools')],
        ['user', require('../../Docker/mcp/tools/user.tools')],
        ['role', require('../../Docker/mcp/tools/role.tools')],
        ['transaction', require('../../Docker/mcp/tools/transaction.tools')],
      ];
      for (const [, register] of tools) register(fakeServer, this.db);
    } finally {
      Module._load = originalLoad;
    }
  }

  async tearDown() {
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
  }
}

module.exports = McpFunctionalTests;
