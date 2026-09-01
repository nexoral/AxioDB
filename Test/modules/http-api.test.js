/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable no-undef */

const TestRunner = require('../helpers/TestRunner');
const { assert } = require('../helpers/assertions');
const fs = require('fs');
const http = require('http');

const { AxioDB } = require('../../lib/config/DB.js');

const PORT = 27018;

function request(method, urlPath, { body, cookie } = {}) {
  return new Promise((resolve, reject) => {
    const headers = {};
    if (cookie) headers['Cookie'] = cookie;
    if (body !== undefined) headers['Content-Type'] = 'application/json';

    const req = http.request({
      hostname: '127.0.0.1',
      port: PORT,
      path: urlPath,
      method,
      headers,
    }, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        const raw = Buffer.concat(chunks).toString();
        let parsed;
        try { parsed = JSON.parse(raw); } catch { parsed = raw; }
        const setCookie = res.headers['set-cookie'];
        const cookieHeader = setCookie
          ? setCookie.find((c) => c.startsWith('axiodb_session='))
          : null;
        const sid = cookieHeader ? cookieHeader.split(';')[0] : null;
        resolve({ status: res.statusCode, body: parsed, sid });
      });
    });
    req.on('error', reject);
    if (body !== undefined) req.write(JSON.stringify(body));
    req.end();
  });
}

class HTTPAPITests extends TestRunner {
  constructor() {
    super('HTTP API Test Suite');
    this.testDir = './Test/TestHttpApi';
    this.dbInstance = null;
    this.db = null;
    this.collection = null;
    this.cookie = null;
    this.documentIds = [];
  }

  async setUp() {
    this.log('Setting up test environment...', 'info');
    if (fs.existsSync(this.testDir)) {
      fs.rmSync(this.testDir, { recursive: true, force: true });
    }
    this.dbInstance = new AxioDB({ GUI: true, RootName: 'HttpApiTestDB', CustomPath: this.testDir });
    this.db = await this.dbInstance.createDB('TestDB');
    this.collection = await this.db.createCollection('Users');
    await this.collection.newIndex('email', 'age');

    const insertResult = await this.collection.insertMany([
      { name: 'Alice', email: 'alice@test.com', age: 30, active: true },
      { name: 'Bob', email: 'bob@test.com', age: 25, active: false },
      { name: 'Charlie', email: 'charlie@test.com', age: 35, active: true },
    ]);
    this.documentIds = insertResult.data.id;
    await new Promise((r) => setTimeout(r, 500));
    this.log('Test environment ready', 'success');
  }

  async tearDown() {
    this.log('Cleaning up...', 'info');
    if (fs.existsSync(this.testDir)) {
      fs.rmSync(this.testDir, { recursive: true, force: true });
    }
    this.log('Cleanup complete', 'success');
  }

  setCookie(sid) {
    this.cookie = sid;
  }

  cookieHeader() {
    return this.cookie ? { cookie: this.cookie } : {};
  }

  async runTests() {
    await this.describe('Auth Endpoints', async () => {
      await this.test('POST /api/auth/login - valid credentials', async () => {
        const res = await request('POST', '/api/auth/login', {
          body: { username: 'admin', password: 'admin' },
        });
        assert.equal(res.body.statusCode, 200);
        assert.exists(res.sid);
        this.setCookie(res.sid);
      });

      await this.test('POST /api/auth/login - invalid credentials', async () => {
        const res = await request('POST', '/api/auth/login', {
          body: { username: 'admin', password: 'wrong' },
        });
        assert.equal(res.body.statusCode, 401);
      });

      await this.test('POST /api/auth/login - missing body', async () => {
        const res = await request('POST', '/api/auth/login', { body: {} });
        assert.isAbove(res.body.statusCode, 399);
      });

      await this.test('GET /api/auth/me - returns current user with mustChangePassword', async () => {
        const res = await request('GET', '/api/auth/me', this.cookieHeader());
        assert.equal(res.body.statusCode, 200);
        assert.equal(res.body.data.username, 'admin');
        assert.equal(res.body.data.mustChangePassword, true);
      });

      await this.test('GET /api/auth/me - no cookie returns 401', async () => {
        const res = await request('GET', '/api/auth/me');
        assert.equal(res.body.statusCode, 401);
      });

      await this.test('PATCH /api/auth/change-password - change forced password', async () => {
        const res = await request('PATCH', '/api/auth/change-password', {
          body: { currentPassword: 'admin', newPassword: 'admin123' },
          ...this.cookieHeader(),
        });
        assert.equal(res.body.statusCode, 200);
        if (res.sid) this.setCookie(res.sid);
      });

      await this.test('GET /api/auth/me - mustChangePassword is now false', async () => {
        const res = await request('GET', '/api/auth/me', this.cookieHeader());
        assert.equal(res.body.statusCode, 200);
        assert.equal(res.body.data.mustChangePassword, false);
      });

      await this.test('POST /api/auth/logout - clears session', async () => {
        const res = await request('POST', '/api/auth/logout', this.cookieHeader());
        assert.equal(res.body.statusCode, 200);
      });

      await this.test('POST /api/auth/logout - no cookie returns 401', async () => {
        const res = await request('POST', '/api/auth/logout');
        assert.equal(res.body.statusCode, 401);
      });

      await this.test('Re-login after logout', async () => {
        const res = await request('POST', '/api/auth/login', {
          body: { username: 'admin', password: 'admin123' },
        });
        assert.equal(res.body.statusCode, 200);
        assert.exists(res.sid);
        this.setCookie(res.sid);
      });
    });

    await this.describe('Database Endpoints', async () => {
      await this.test('GET /api/db/databases - lists databases', async () => {
        const res = await request('GET', '/api/db/databases', this.cookieHeader());
        assert.equal(res.body.statusCode, 200);
        assert.ok(Array.isArray(res.body.data.ListOfDatabases));
      });

      await this.test('POST /api/db/create-database - creates a database', async () => {
        const res = await request('POST', '/api/db/create-database', {
          body: { name: 'TempDB' },
          ...this.cookieHeader(),
        });
        assert.equal(res.body.statusCode, 201);
      });

      await this.test('POST /api/db/create-database - duplicate returns error', async () => {
        const res = await request('POST', '/api/db/create-database', {
          body: { name: 'TempDB' },
          ...this.cookieHeader(),
        });
        assert.isAbove(res.body.statusCode, 399);
      });

      await this.test('DELETE /api/db/delete-database - deletes a database', async () => {
        const res = await request('DELETE', '/api/db/delete-database?dbName=TempDB', this.cookieHeader());
        assert.equal(res.body.statusCode, 200);
      });

      await this.test('DELETE /api/db/delete-database - non-existent returns error', async () => {
        const res = await request('DELETE', '/api/db/delete-database?dbName=NonExistent', this.cookieHeader());
        assert.isAbove(res.body.statusCode, 399);
      });
    });

    await this.describe('Document Count Endpoint', async () => {
      await this.test('GET /api/operation/total/ - returns collection count', async () => {
        const res = await request('GET', '/api/operation/total/?dbName=TestDB&collectionName=Users', this.cookieHeader());
        assert.equal(res.body.statusCode, 200);
        assert.equal(res.body.data.total, 3);
      });
    });

    await this.describe('Collection Endpoints', async () => {
      await this.test('GET /api/collection/all/ - lists collections', async () => {
        const res = await request('GET', '/api/collection/all/?databaseName=TestDB', this.cookieHeader());
        assert.equal(res.body.statusCode, 200);
        assert.ok(res.body.data);
      });

      await this.test('POST /api/collection/create-collection - creates a collection', async () => {
        const res = await request('POST', '/api/collection/create-collection', {
          body: { dbName: 'TestDB', collectionName: 'TempColl' },
          ...this.cookieHeader(),
        });
        assert.equal(res.body.statusCode, 201);
      });

      await this.test('POST /api/collection/create-collection - duplicate returns error', async () => {
        const res = await request('POST', '/api/collection/create-collection', {
          body: { dbName: 'TestDB', collectionName: 'TempColl' },
          ...this.cookieHeader(),
        });
        assert.isAbove(res.body.statusCode, 399);
      });

      await this.test('DELETE /api/collection/delete-collection/ - deletes a collection', async () => {
        const res = await request('DELETE', '/api/collection/delete-collection/?dbName=TestDB&collectionName=TempColl', this.cookieHeader());
        assert.equal(res.body.statusCode, 200);
      });
    });

    await this.describe('Document CRUD Endpoints', async () => {
      let newDocId;

      await this.test('POST /api/operation/create/ - inserts a document', async () => {
        const res = await request('POST', '/api/operation/create/?dbName=TestDB&collectionName=Users', {
          body: { name: 'Diana', email: 'diana@test.com', age: 28 },
          ...this.cookieHeader(),
        });
        assert.equal(res.body.statusCode, 201);
        assert.exists(res.body.data.documentId);
        newDocId = res.body.data.documentId;
      });

      await this.test('GET /api/operation/all/by-id/ - fetches document by ID', async () => {
        const res = await request('GET', `/api/operation/all/by-id/?dbName=TestDB&collectionName=Users&documentId=${newDocId}`, this.cookieHeader());
        assert.equal(res.body.statusCode, 200);
      });

      await this.test('GET /api/operation/all/by-id/ - non-existent returns 404', async () => {
        const res = await request('GET', '/api/operation/all/by-id/?dbName=TestDB&collectionName=Users&documentId=nonexistent', this.cookieHeader());
        assert.isAbove(res.body.statusCode, 399);
      });

      await this.test('POST /api/operation/all/by-query/ - queries documents', async () => {
        const res = await request('POST', '/api/operation/all/by-query/?dbName=TestDB&collectionName=Users&page=1', {
          body: { query: { active: true } },
          ...this.cookieHeader(),
        });
        assert.equal(res.body.statusCode, 200);
      });

      await this.test('POST /api/operation/all/by-query/ - with index hint', async () => {
        const res = await request('POST', '/api/operation/all/by-query/?dbName=TestDB&collectionName=Users&page=1&hint=email', {
          body: { query: { email: 'alice@test.com' } },
          ...this.cookieHeader(),
        });
        assert.equal(res.body.statusCode, 200);
      });

      await this.test('POST /api/operation/all/by-ids/ - batch read by IDs', async () => {
        const ids = this.documentIds.slice(0, 2);
        const res = await request('POST', '/api/operation/all/by-ids/?dbName=TestDB&collectionName=Users', {
          body: { ids },
          ...this.cookieHeader(),
        });
        assert.equal(res.body.statusCode, 200);
      });

      await this.test('POST /api/operation/all/by-ids/ - empty IDs returns error', async () => {
        const res = await request('POST', '/api/operation/all/by-ids/?dbName=TestDB&collectionName=Users', {
          body: { ids: [] },
          ...this.cookieHeader(),
        });
        assert.isAbove(res.body.statusCode, 399);
      });

      await this.test('PUT /api/operation/update/by-id/ - updates a document', async () => {
        const res = await request('PUT', `/api/operation/update/by-id/?dbName=TestDB&collectionName=Users&documentId=${newDocId}`, {
          body: { age: 29 },
          ...this.cookieHeader(),
        });
        assert.equal(res.body.statusCode, 200);
      });

      await this.test('PUT /api/operation/update/by-query/ - updates by query', async () => {
        const res = await request('PUT', '/api/operation/update/by-query/?dbName=TestDB&collectionName=Users', {
          body: { query: { name: 'Diana' }, update: { active: true } },
          ...this.cookieHeader(),
        });
        assert.equal(res.body.statusCode, 200);
      });

      await this.test('DELETE /api/operation/delete/by-id/ - deletes a document', async () => {
        const res = await request('DELETE', `/api/operation/delete/by-id/?dbName=TestDB&collectionName=Users&documentId=${newDocId}`, this.cookieHeader());
        assert.equal(res.body.statusCode, 200);
      });

      await this.test('POST /api/operation/create-many/ - bulk insert', async () => {
        const res = await request('POST', '/api/operation/create-many/?dbName=TestDB&collectionName=Users', {
          body: [
            { name: 'Eve', email: 'eve@test.com', age: 22 },
            { name: 'Frank', email: 'frank@test.com', age: 40 },
          ],
          ...this.cookieHeader(),
        });
        assert.equal(res.body.statusCode, 201);
      });
    });

    await this.describe('Index Endpoints', async () => {
      await this.test('GET /api/index/list - lists indexes', async () => {
        const res = await request('GET', '/api/index/list?dbName=TestDB&collectionName=Users', this.cookieHeader());
        assert.equal(res.body.statusCode, 200);
      });

      await this.test('POST /api/index/create - creates an index', async () => {
        const res = await request('POST', '/api/index/create', {
          body: { dbName: 'TestDB', collectionName: 'Users', fieldNames: ['name'] },
          ...this.cookieHeader(),
        });
        assert.equal(res.body.statusCode, 201);
      });

      await this.test('DELETE /api/index/delete - deletes an index', async () => {
        const res = await request('DELETE', '/api/index/delete?dbName=TestDB&collectionName=Users&indexName=name', this.cookieHeader());
        assert.equal(res.body.statusCode, 200);
      });
    });

    await this.describe('Aggregation Endpoint', async () => {
      await this.test('POST /api/operation/aggregate/ - runs aggregation pipeline', async () => {
        const res = await request('POST', '/api/operation/aggregate/?dbName=TestDB&collectionName=Users', {
          body: {
            aggregation: [
              { $match: { active: true } },
              { $group: { _id: null, count: { $sum: 1 } } },
            ],
          },
          ...this.cookieHeader(),
        });
        assert.equal(res.body.statusCode, 200);
      });
    });

    await this.describe('Dashboard Stats Endpoint', async () => {
      await this.test('GET /api/dashboard-stats - returns dashboard stats', async () => {
        const res = await request('GET', '/api/dashboard-stats', this.cookieHeader());
        assert.equal(res.body.statusCode, 200);
      });
    });

    await this.describe('Auth guard on protected endpoints', async () => {
      await this.test('Protected endpoint without auth returns 401', async () => {
        const res = await request('GET', '/api/db/databases');
        assert.equal(res.body.statusCode, 401);
      });

      await this.test('Protected endpoint with invalid cookie returns 401', async () => {
        const res = await request('GET', '/api/db/databases', { cookie: 'axiodb_session=invalid' });
        assert.equal(res.body.statusCode, 401);
      });
    });

    await this.describe('System Endpoints', async () => {
      await this.test('GET /api/health - unauthenticated health check', async () => {
        const res = await request('GET', '/api/health');
        assert.equal(res.body.statusCode, 200);
      });

      await this.test('GET /api/info - returns server info', async () => {
        const res = await request('GET', '/api/info', this.cookieHeader());
        assert.equal(res.body.statusCode, 200);
      });

      await this.test('GET /api/system - returns system details', async () => {
        const res = await request('GET', '/api/system', this.cookieHeader());
        assert.equal(res.body.statusCode, 200);
        assert.exists(res.body.data.process);
        assert.exists(res.body.data.memory);
      });

      await this.test('GET /api/routes - lists available routes', async () => {
        const res = await request('GET', '/api/routes', this.cookieHeader());
        assert.equal(res.body.statusCode, 200);
        assert.ok(Array.isArray(res.body.data));
      });
    });

    await this.describe('Static file traversal protection', async () => {
      await this.test('Encoded dot-dot segments cannot reach the static root', async () => {
        const res = await request('GET', '/nested/%2E%2E/index.html');
        assert.equal(res.status, 400);
      });
    });

    await this.describe('Error handling', async () => {
      await this.test('POST /api/operation/create/ - missing dbName returns error', async () => {
        const res = await request('POST', '/api/operation/create/?collectionName=Users', {
          body: { name: 'Test' },
          ...this.cookieHeader(),
        });
        assert.isAbove(res.body.statusCode, 399);
      });

      await this.test('POST /api/operation/create/ - missing collectionName returns error', async () => {
        const res = await request('POST', '/api/operation/create/?dbName=TestDB', {
          body: { name: 'Test' },
          ...this.cookieHeader(),
        });
        assert.isAbove(res.body.statusCode, 399);
      });

      await this.test('GET /api/operation/all/by-id/ - missing documentId returns error', async () => {
        const res = await request('GET', '/api/operation/all/by-id/?dbName=TestDB&collectionName=Users', this.cookieHeader());
        assert.isAbove(res.body.statusCode, 399);
      });

      await this.test('Non-existent route returns 404', async () => {
        const res = await request('GET', '/api/nonexistent', this.cookieHeader());
        assert.equal(res.body.statusCode, 404);
      });
    });
  }
}

module.exports = HTTPAPITests;
