/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable no-undef */

const TestRunner = require('../helpers/TestRunner');
const { assert } = require('../helpers/assertions');
const fs = require('fs');
const path = require('path');
const http = require('http');

const { AxioDB } = require('../../../axiodb.js');

const PORT = 27018;

function request(method, urlPath, { body, cookie } = {}) {
  return new Promise((resolve, reject) => {
    const headers = {};
    if (cookie) headers['Cookie'] = cookie;
    let payload;
    if (body !== undefined) {
      payload = JSON.stringify(body);
      headers['Content-Type'] = 'application/json';
      headers['Content-Length'] = Buffer.byteLength(payload);
    }

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
    if (payload !== undefined) req.write(payload);
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
    this.dbInstance = new AxioDB({ HTTP: true, RootName: 'HttpApiTestDB', CustomPath: this.testDir });
    this.db = await this.dbInstance.createDB('TestDB');
    this.collection = await this.db.createCollection('Users');
    await this.collection.newIndex('email', 'age');

    const insertResult = await this.collection.insertMany([
      { name: 'Alice', email: 'alice@test.com', age: 30, active: true },
      { name: 'Bob', email: 'bob@test.com', age: 25, active: false },
      { name: 'Charlie', email: 'charlie@test.com', age: 35, active: true },
    ]);
    this.documentIds = insertResult.data.id;
    await this.waitForServerReady();
    this.log('Test environment ready', 'success');
  }

  // The control server starts asynchronously, so a fixed sleep races it - on a
  // loaded CI runner 500ms is not always enough and every request then fails with
  // ECONNREFUSED. Poll the unauthenticated health endpoint until it answers.
  async waitForServerReady(retries = 100, delayMs = 200) {
    for (let i = 0; i < retries; i++) {
      try {
        const response = await request('GET', '/api/health');
        if (response.status < 500) return;
      } catch {
        // server not listening yet
      }
      await new Promise((r) => setTimeout(r, delayMs));
    }
    throw new Error('HTTP server did not become ready in time');
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

      await this.test('GET /api/db/databases - does not leak host filesystem paths (SEC-10)', async () => {
        const res = await request('GET', '/api/db/databases', this.cookieHeader());
        assert.equal(res.body.statusCode, 200);
        const data = res.body.data;
        if (data.CurrentPath) {
          assert.equal(path.isAbsolute(data.CurrentPath), false);
        }
        if (Array.isArray(data.AllDatabasesPaths)) {
          for (const p of data.AllDatabasesPaths) {
            assert.equal(path.isAbsolute(p), false);
          }
        }
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

      await this.test('POST /api/db/create-database - reserved db name returns 403 (SEC-11)', async () => {
        const res = await request('POST', '/api/db/create-database', {
          body: { name: 'config' },
          ...this.cookieHeader(),
        });
        assert.equal(res.body.statusCode, 403);
        assert.ok(res.body.message.includes('reserved'));
      });

      await this.test('POST /api/db/create-database - case-insensitive reserved db name returns 403 (SEC-11)', async () => {
        const res = await request('POST', '/api/db/create-database', {
          body: { name: 'Config' },
          ...this.cookieHeader(),
        });
        assert.equal(res.body.statusCode, 403);
        assert.ok(res.body.message.includes('reserved'));
      });

      await this.test('DELETE /api/db/delete-database - deletes a database', async () => {
        const res = await request('DELETE', '/api/db/delete-database?dbName=TempDB', this.cookieHeader());
        assert.equal(res.body.statusCode, 200);
      });

      await this.test('DELETE /api/db/delete-database - non-existent returns error', async () => {
        const res = await request('DELETE', '/api/db/delete-database?dbName=NonExistent', this.cookieHeader());
        assert.isAbove(res.body.statusCode, 399);
      });

      await this.test('DELETE /api/db/delete-database - missing or empty dbName returns 400 (SEC-21)', async () => {
        const resMissing = await request('DELETE', '/api/db/delete-database', this.cookieHeader());
        assert.equal(resMissing.body.statusCode, 400);
        assert.equal(resMissing.body.message, 'Database name is required');

        const resEmpty = await request('DELETE', '/api/db/delete-database?dbName=', this.cookieHeader());
        assert.equal(resEmpty.body.statusCode, 400);
        assert.equal(resEmpty.body.message, 'Database name is required');

        const resWhitespace = await request('DELETE', '/api/db/delete-database?dbName=%20%20', this.cookieHeader());
        assert.equal(resWhitespace.body.statusCode, 400);
        assert.equal(resWhitespace.body.message, 'Database name is required');
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

      await this.test('GET /api/collection/all/ - does not leak host filesystem paths (SEC-10)', async () => {
        const res = await request('GET', '/api/collection/all/?databaseName=TestDB', this.cookieHeader());
        assert.equal(res.body.statusCode, 200);
        const data = res.body.data;
        if (data.CurrentPath) {
          assert.equal(path.isAbsolute(data.CurrentPath), false);
        }
        if (Array.isArray(data.AllCollectionsPaths)) {
          for (const p of data.AllCollectionsPaths) {
            assert.equal(path.isAbsolute(p), false);
          }
        }
        if (Array.isArray(data.CollectionSizeMap)) {
          for (const entry of data.CollectionSizeMap) {
            if (entry.folderPath) {
              assert.equal(path.isAbsolute(entry.folderPath), false);
            }
          }
        }
        if (Array.isArray(data.collectionMetaStatus)) {
          for (const meta of data.collectionMetaStatus) {
            if (meta.path) {
              assert.equal(path.isAbsolute(meta.path), false);
            }
          }
        }
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

      await this.test('POST /api/operation/all/by-query/ - non-existent DB returns 404 and does not create folder (SEC-08)', async () => {
        const fakeDbName = 'NonExistentDbSec08';
        const res = await request('POST', `/api/operation/all/by-query/?dbName=${fakeDbName}&collectionName=Users&page=1`, {
          body: { query: { active: true } },
          ...this.cookieHeader(),
        });
        assert.equal(res.body.statusCode, 404);
        assert.includes(res.body.message, 'does not exist');

        const fakePath = path.join(this.testDir, 'HttpApiTestDB', fakeDbName);
        assert.ok(!fs.existsSync(fakePath), 'Non-existent DB folder should NOT be created by read query');
      });

      await this.test('GET /api/operation/all/ - non-existent collection returns 404 and does not create folder (SEC-08)', async () => {
        const fakeColName = 'NonExistentColSec08';
        const res = await request('GET', `/api/operation/all/?dbName=TestDB&collectionName=${fakeColName}&page=1`, {
          ...this.cookieHeader(),
        });
        assert.equal(res.body.statusCode, 404);
        assert.includes(res.body.message, 'does not exist');

        const fakeColPath = path.join(this.testDir, 'HttpApiTestDB', 'TestDB', fakeColName);
        assert.ok(!fs.existsSync(fakeColPath), 'Non-existent collection folder should NOT be created by read query');
      });

      await this.test('PATCH /api/operation/update/by-id/ - non-existent DB returns 404 and does not create folder (SEC-13)', async () => {
        const fakeDbName = 'NonExistentDbUpdateSec13';
        const res = await request('PATCH', `/api/operation/update/by-id/?dbName=${fakeDbName}&collectionName=Users&documentId=fake1`, {
          body: { name: 'NewName' },
          ...this.cookieHeader(),
        });
        assert.equal(res.body.statusCode, 404);

        const fakePath = path.join(this.testDir, 'HttpApiTestDB', fakeDbName);
        assert.ok(!fs.existsSync(fakePath), 'Non-existent DB folder should NOT be created by update by id');
      });

      await this.test('DELETE /api/operation/delete/by-id/ - non-existent DB returns 404 and does not create folder (SEC-13)', async () => {
        const fakeDbName = 'NonExistentDbDeleteSec13';
        const res = await request('DELETE', `/api/operation/delete/by-id/?dbName=${fakeDbName}&collectionName=Users&documentId=fake1`, {
          ...this.cookieHeader(),
        });
        assert.equal(res.body.statusCode, 404);

        const fakePath = path.join(this.testDir, 'HttpApiTestDB', fakeDbName);
        assert.ok(!fs.existsSync(fakePath), 'Non-existent DB folder should NOT be created by delete by id');
      });

      await this.test('DELETE /api/operation/delete/by-query/ - non-existent collection returns 404 and does not create folder (SEC-13)', async () => {
        const fakeColName = 'NonExistentColDeleteSec13';
        const res = await request('DELETE', `/api/operation/delete/by-query/?dbName=TestDB&collectionName=${fakeColName}&isMany=false`, {
          body: { query: { name: 'test' } },
          ...this.cookieHeader(),
        });
        assert.equal(res.body.statusCode, 404);

        const fakeColPath = path.join(this.testDir, 'HttpApiTestDB', 'TestDB', fakeColName);
        assert.ok(!fs.existsSync(fakeColPath), 'Non-existent collection folder should NOT be created by delete by query');
      });

      await this.test('GET /api/indexes - non-existent DB returns 404 and does not create folder (SEC-13)', async () => {
        const fakeDbName = 'NonExistentDbIndexSec13';
        const res = await request('GET', `/api/indexes?dbName=${fakeDbName}&collectionName=Users`, {
          ...this.cookieHeader(),
        });
        assert.equal(res.body.statusCode, 404);

        const fakePath = path.join(this.testDir, 'HttpApiTestDB', fakeDbName);
        assert.ok(!fs.existsSync(fakePath), 'Non-existent DB folder should NOT be created by get indexes');
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

      await this.test('POST /api/operation/create/ - passing array payload returns 400 (SEC-29)', async () => {
        const res = await request('POST', '/api/operation/create/?dbName=TestDB&collectionName=Users', {
          body: [{ name: 'ArrayPayload' }],
          ...this.cookieHeader(),
        });
        assert.equal(res.body.statusCode, 400);
      });

      await this.test('POST /api/operation/create-many/ - passing non-array payload returns 400 (SEC-29)', async () => {
        const res = await request('POST', '/api/operation/create-many/?dbName=TestDB&collectionName=Users', {
          body: { name: 'SingleObject' },
          ...this.cookieHeader(),
        });
        assert.equal(res.body.statusCode, 400);
      });

      await this.test('POST /api/operation/create-many/ - passing empty array returns 400 (SEC-29)', async () => {
        const res = await request('POST', '/api/operation/create-many/?dbName=TestDB&collectionName=Users', {
          body: [],
          ...this.cookieHeader(),
        });
        assert.equal(res.body.statusCode, 400);
      });

      await this.test('POST /api/operation/create-many/ - passing array with non-objects returns 400 (SEC-29)', async () => {
        const res = await request('POST', '/api/operation/create-many/?dbName=TestDB&collectionName=Users', {
          body: ['invalid', 123, null],
          ...this.cookieHeader(),
        });
        assert.equal(res.body.statusCode, 400);
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
      await this.test('GET /api/dashboard-stats - returns dashboard stats with volume metrics (SEC-26)', async () => {
        const res = await request('GET', '/api/dashboard-stats', this.cookieHeader());
        assert.equal(res.body.statusCode, 200);
        assert.exists(res.body.data);
        assert.exists(res.body.data.storageInfo);
        assert.equal(typeof res.body.data.storageInfo.machine, 'number');
        assert.equal(typeof res.body.data.storageInfo.total, 'number');
        assert.equal(res.body.data.storageInfo.matrixUnit, 'MB');
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
        assert.exists(res.body.data.services);
        const tcpService = res.body.data.services.find((s) => s.name === 'TCP Server');
        assert.exists(tcpService);
        assert.equal(tcpService.running, false);
      });

      await this.test('GET /api/system - does not leak host filesystem path in instance (SEC-10)', async () => {
        const res = await request('GET', '/api/system', this.cookieHeader());
        assert.equal(res.body.statusCode, 200);
        const inst = res.body.data.instance;
        assert.exists(inst);
        if (inst.path) {
          assert.equal(path.isAbsolute(inst.path), false);
        }
      });

      await this.test('GET /api/routes - lists available routes', async () => {
        const res = await request('GET', '/api/routes', this.cookieHeader());
        assert.equal(res.body.statusCode, 200);
        assert.ok(Array.isArray(res.body.data));
      });
    });

    await this.describe('Transaction Endpoints', async () => {
      await this.test('POST /api/transaction/begin - missing dbName returns 400', async () => {
        const res = await request('POST', '/api/transaction/begin', {
          body: { collectionName: 'Users' },
          ...this.cookieHeader(),
        });
        assert.equal(res.body.statusCode, 400);
      });

      await this.test('POST /api/transaction/begin - reserved db returns 403', async () => {
        const res = await request('POST', '/api/transaction/begin', {
          body: { dbName: 'config', collectionName: 'Users' },
          ...this.cookieHeader(),
        });
        assert.equal(res.body.statusCode, 403);
      });

      await this.test('POST /api/transaction/begin - non-existent database returns 404 and does not create folder (SEC-17)', async () => {
        const fakeDbName = 'NonExistentDbTxnSec17';
        const res = await request('POST', '/api/transaction/begin', {
          body: { dbName: fakeDbName, collectionName: 'Users' },
          ...this.cookieHeader(),
        });
        assert.equal(res.body.statusCode, 404);
        assert.equal(res.body.message, 'Database not found');

        const fakeDbPath = path.join(this.testDir, 'HttpApiTestDB', fakeDbName);
        assert.ok(!fs.existsSync(fakeDbPath), 'Non-existent DB folder should NOT be created');
      });

      await this.test('POST /api/transaction/begin - non-existent collection returns 404 and does not create folder (SEC-17)', async () => {
        const fakeColName = 'NonExistentColTxnSec17';
        const res = await request('POST', '/api/transaction/begin', {
          body: { dbName: 'TestDB', collectionName: fakeColName },
          ...this.cookieHeader(),
        });
        assert.equal(res.body.statusCode, 404);
        assert.equal(res.body.message, 'Collection not found');

        const fakeColPath = path.join(this.testDir, 'HttpApiTestDB', 'TestDB', fakeColName);
        assert.ok(!fs.existsSync(fakeColPath), 'Non-existent collection folder should NOT be created');
      });

      await this.test('POST /api/transaction/begin - starts transaction successfully', async () => {
        const res = await request('POST', '/api/transaction/begin', {
          body: { dbName: 'TestDB', collectionName: 'Users' },
          ...this.cookieHeader(),
        });
        assert.equal(res.body.statusCode, 200);
        assert.exists(res.body.data.transactionId);
      });

      await this.test('Transaction lifecycle: begin, insert, savepoint, rollback-to-savepoint, commit', async () => {
        const beginRes = await request('POST', '/api/transaction/begin', {
          body: { dbName: 'TestDB', collectionName: 'Users' },
          ...this.cookieHeader(),
        });
        assert.equal(beginRes.body.statusCode, 200);
        const txnId = beginRes.body.data.transactionId;

        const ins1 = await request('POST', '/api/transaction/insert', {
          body: { transactionId: txnId, document: { name: 'TxUser1', email: 'tx1@test.com' } },
          ...this.cookieHeader(),
        });
        assert.equal(ins1.body.statusCode, 200);

        const spRes = await request('POST', '/api/transaction/savepoint', {
          body: { transactionId: txnId, savepointName: 'sp1' },
          ...this.cookieHeader(),
        });
        assert.equal(spRes.body.statusCode, 200);

        const ins2 = await request('POST', '/api/transaction/insert', {
          body: { transactionId: txnId, document: { name: 'TxUser2', email: 'tx2@test.com' } },
          ...this.cookieHeader(),
        });
        assert.equal(ins2.body.statusCode, 200);

        const rbSpRes = await request('POST', '/api/transaction/rollback-to-savepoint', {
          body: { transactionId: txnId, savepointName: 'sp1' },
          ...this.cookieHeader(),
        });
        assert.equal(rbSpRes.body.statusCode, 200);

        const commitRes = await request('POST', '/api/transaction/commit', {
          body: { transactionId: txnId },
          ...this.cookieHeader(),
        });
        assert.equal(commitRes.body.statusCode, 200);

        const query1 = await request('POST', '/api/operation/all/by-query/?dbName=TestDB&collectionName=Users&page=1', {
          body: { query: { email: 'tx1@test.com' } },
          ...this.cookieHeader(),
        });
        assert.equal(query1.body.statusCode, 200);
        assert.isAbove(query1.body.data.data.documents.length, 0);

        const query2 = await request('POST', '/api/operation/all/by-query/?dbName=TestDB&collectionName=Users&page=1', {
          body: { query: { email: 'tx2@test.com' } },
          ...this.cookieHeader(),
        });
        assert.equal(query2.body.statusCode, 200);
        assert.equal(query2.body.data.data.documents.length, 0);
      });

      await this.test('Transaction rollback discards buffered operations', async () => {
        const beginRes = await request('POST', '/api/transaction/begin', {
          body: { dbName: 'TestDB', collectionName: 'Users' },
          ...this.cookieHeader(),
        });
        const txnId = beginRes.body.data.transactionId;

        const ins = await request('POST', '/api/transaction/insert', {
          body: { transactionId: txnId, document: { name: 'DiscardMe', email: 'discard@test.com' } },
          ...this.cookieHeader(),
        });
        assert.equal(ins.body.statusCode, 200);

        const rbRes = await request('POST', '/api/transaction/rollback', {
          body: { transactionId: txnId },
          ...this.cookieHeader(),
        });
        assert.equal(rbRes.body.statusCode, 200);

        const query = await request('POST', '/api/operation/all/by-query/?dbName=TestDB&collectionName=Users&page=1', {
          body: { query: { email: 'discard@test.com' } },
          ...this.cookieHeader(),
        });
        assert.equal(query.body.statusCode, 200);
        assert.equal(query.body.data.data.documents.length, 0);
      });

      await this.test('Transaction update and delete operations in transaction', async () => {
        const insDirect = await request('POST', '/api/operation/create/?dbName=TestDB&collectionName=Users', {
          body: { name: 'DirectUser', email: 'direct@test.com', status: 'pending' },
          ...this.cookieHeader(),
        });
        assert.equal(insDirect.body.statusCode, 201);

        const beginRes = await request('POST', '/api/transaction/begin', {
          body: { dbName: 'TestDB', collectionName: 'Users' },
          ...this.cookieHeader(),
        });
        const txnId = beginRes.body.data.transactionId;

        const updRes = await request('POST', '/api/transaction/update', {
          body: {
            transactionId: txnId,
            query: { email: 'direct@test.com' },
            update: { status: 'verified' },
          },
          ...this.cookieHeader(),
        });
        assert.equal(updRes.body.statusCode, 200);

        const commitRes = await request('POST', '/api/transaction/commit', {
          body: { transactionId: txnId },
          ...this.cookieHeader(),
        });
        assert.equal(commitRes.body.statusCode, 200);

        const queryUpdated = await request('POST', '/api/operation/all/by-query/?dbName=TestDB&collectionName=Users&page=1', {
          body: { query: { email: 'direct@test.com' } },
          ...this.cookieHeader(),
        });
        assert.equal(queryUpdated.body.statusCode, 200);
        assert.equal(queryUpdated.body.data.data.documents[0].status, 'verified');

        const beginRes2 = await request('POST', '/api/transaction/begin', {
          body: { dbName: 'TestDB', collectionName: 'Users' },
          ...this.cookieHeader(),
        });
        const txnId2 = beginRes2.body.data.transactionId;

        const delRes = await request('POST', '/api/transaction/delete', {
          body: {
            transactionId: txnId2,
            query: { email: 'direct@test.com' },
          },
          ...this.cookieHeader(),
        });
        assert.equal(delRes.body.statusCode, 200);

        const commitRes2 = await request('POST', '/api/transaction/commit', {
          body: { transactionId: txnId2 },
          ...this.cookieHeader(),
        });
        assert.equal(commitRes2.body.statusCode, 200);

        const queryDeleted = await request('POST', '/api/operation/all/by-query/?dbName=TestDB&collectionName=Users&page=1', {
          body: { query: { email: 'direct@test.com' } },
          ...this.cookieHeader(),
        });
        assert.equal(queryDeleted.body.statusCode, 200);
        assert.equal(queryDeleted.body.data.data.documents.length, 0);
      });

      await this.test('Operations on non-existent or completed transaction return 404', async () => {
        const res = await request('POST', '/api/transaction/commit', {
          body: { transactionId: 'non-existent-id' },
          ...this.cookieHeader(),
        });
        assert.equal(res.body.statusCode, 404);
      });
    });

    await this.describe('Root Welcome & Non-API handling', async () => {
      await this.test('GET / returns welcome message and GUI install instructions', async () => {
        const res = await request('GET', '/');
        assert.equal(res.status, 200);
        assert.ok(typeof res.body === 'string' && res.body.includes('Welcome to AxioDB'));
        assert.ok(res.body.includes('CHOICE=2 bash'));
      });
      await this.test('Non-existent non-API path returns 404', async () => {
        const res = await request('GET', '/nested/unknown.html');
        assert.equal(res.status, 404);
      });
    });

    await this.describe('Error handling', async () => {
      await this.test('POST /api/operation/create/ - oversized body returns 413 Payload Too Large (SEC-24)', async () => {
        const HttpServerHelper = require('../../../lib/Helper/http/HttpServer.helper').default || require('../../../lib/Helper/http/HttpServer.helper');
        const HttpRouter = require('../../../lib/Helper/http/HttpRouter.helper').default || require('../../../lib/Helper/http/HttpRouter.helper');

        const router = new HttpRouter();
        router.post('/api/operation/create/', async (_req, reply) => {
          reply.status(200).send({ statusCode: 200, status: true });
        });

        const testServer = new HttpServerHelper(router, { bodyLimit: 128 });
        await testServer.listen(0, '127.0.0.1');
        const testPort = testServer.server.address().port;

        try {
          const res = await new Promise((resolve, reject) => {
            const req = http.request({
              hostname: '127.0.0.1',
              port: testPort,
              path: '/api/operation/create/',
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
            }, (response) => {
              const chunks = [];
              response.on('data', (c) => chunks.push(c));
              response.on('end', () => {
                const raw = Buffer.concat(chunks).toString();
                let parsed;
                try { parsed = JSON.parse(raw); } catch { parsed = raw; }
                resolve({ status: response.statusCode, body: parsed });
              });
            });
            req.on('error', reject);
            req.write(JSON.stringify({ data: 'x'.repeat(256) }));
            req.end();
          });

          assert.equal(res.status, 413);
          assert.equal(res.body.statusCode, 413);
          assert.equal(res.body.status, false);
          assert.ok(typeof res.body.message === 'string' && res.body.message.includes('Payload Too Large'));
        } finally {
          await testServer.close();
        }
      });

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
