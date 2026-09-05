/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable no-undef */

const TestRunner = require('../helpers/TestRunner');
const { assert } = require('../helpers/assertions');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const { AxioDB, InstanceTypes } = require('../../lib/config/DB.js');

const InMemoryCache = InstanceTypes.InMemoryCache;

class CacheOptionsTests extends TestRunner {
  constructor() {
    super('InMemoryCache Options Test Suite');
    this.testDir = './Test/TestCacheOptions';
    this.childDir = './Test/TestCacheOptionsChild';
    this.dbInstance = null;
    this.testDB = null;
    this.collection = null;
  }

  async setUp() {
    this.log('Setting up test environment...', 'info');

    if (fs.existsSync(this.testDir)) {
      fs.rmSync(this.testDir, { recursive: true, force: true });
    }

    // Default instance (cache enabled by default)
    this.dbInstance = new AxioDB({ GUI: false, RootName: 'CacheOptionsDB', CustomPath: this.testDir });
    this.testDB = await this.dbInstance.createDB('TestDatabase');
    this.collection = await this.testDB.createCollection('Users');

    this.log('Test environment ready', 'success');
  }

  async tearDown() {
    this.log('Cleaning up...', 'info');
    for (const dir of [this.testDir, this.childDir]) {
      if (fs.existsSync(dir)) {
        fs.rmSync(dir, { recursive: true, force: true });
      }
    }
    this.log('Cleanup complete', 'success');
  }

  async runTests() {
    await this.describe('InMemoryCache Options', async () => {
      await this.test('Default construction stores and retrieves', async () => {
        const cache = new InMemoryCache();
        await cache.setCache('key-default', 'value');
        const details = await cache.getCacheDetails();
        assert.ok(details, 'getCacheDetails should succeed');
        assert.equal(details.cacheItemCount, 1, 'entry should be stored');
        assert.equal(await cache.getCache('key-default'), 'value', 'value should be retrievable');
      });

      await this.test('Custom minTTL/maxTTL/cacheClearUp accepted', async () => {
        const cache = new InMemoryCache({ minTTL: 1, maxTTL: 10, cacheClearUp: 100 });
        await cache.setCache('key-custom', { a: 1 });
        const got = await cache.getCache('key-custom');
        assert.equal(JSON.stringify(got), JSON.stringify({ a: 1 }), 'value should roundtrip');
      });

      await this.test('Legacy numeric/string TTL overload', async () => {
        const cacheNumeric = new InMemoryCache(60);
        const cacheString = new InMemoryCache('60');
        assert.ok(cacheNumeric, 'numeric overload constructs');
        assert.ok(cacheString, 'string overload constructs');
        await cacheNumeric.setCache('legacy-num', 'v');
        assert.equal(await cacheNumeric.getCache('legacy-num'), 'v', 'numeric overload stores');
        await cacheString.setCache('legacy-str', 'v');
        assert.equal(await cacheString.getCache('legacy-str'), 'v', 'string overload stores');
      });

      await this.test('maxTTL < minTTL throws', async () => {
        await assert.throws(
          () => new InMemoryCache({ minTTL: 15, maxTTL: 5 }),
          'Invalid cache TTL',
        );
      });

      await this.test('Non-positive TTL throws', async () => {
        await assert.throws(
          () => new InMemoryCache({ minTTL: 0 }),
          'Invalid cache TTL',
        );
        await assert.throws(
          () => new InMemoryCache({ maxTTL: -1 }),
          'Invalid cache TTL',
        );
      });

      await this.test('Non-positive cacheClearUp throws', async () => {
        await assert.throws(
          () => new InMemoryCache({ cacheClearUp: 0 }),
          'cacheClearUp must be a positive number',
        );
      });

      await this.test('Disabled cache stores nothing and every lookup misses', async () => {
        const cache = new InMemoryCache({ enabled: false });
        assert.equal(await cache.setCache('key-disabled', 'value'), true, 'setCache reports success');
        assert.equal(await cache.getCache('key-disabled'), false, 'no entry is readable');
        assert.equal(await cache.getCache('anything'), false, 'any lookup misses');
        assert.equal(await cache.setTempSearchQuery({ q: 1 }), true, 'setTempSearchQuery no-ops');
        const details = await cache.getCacheDetails();
        assert.ok(details, 'getCacheDetails should succeed');
        assert.equal(details.cacheItemCount, 0, 'nothing is stored');
        assert.equal(details.tempQueryCount, 0, 'search queries are not tracked');
      });

      await this.test('Two instances are isolated', async () => {
        const cacheA = new InMemoryCache();
        const cacheB = new InMemoryCache();
        await cacheA.setCache('isolated-key', 'only-a');
        assert.equal(await cacheA.getCache('isolated-key'), 'only-a', 'A sees its own entry');
        assert.equal(await cacheB.getCache('isolated-key'), false, 'B does not see As entry');
        assert.equal((await cacheB.getCacheDetails()).cacheItemCount, 0, 'B stays empty');
      });

      await this.test('Invalidation by collection/document/clearAll', async () => {
        const cache = new InMemoryCache();
        await cache.setCache('/db/users::all', [{ documentId: 'ID1' }, { documentId: 'ID2' }], '/db/users');
        assert.equal(
          JSON.stringify(await cache.getCache('/db/users::all')),
          JSON.stringify([{ documentId: 'ID1' }, { documentId: 'ID2' }]),
          'entry stored',
        );

        await cache.invalidateByDocument('/db/users', 'ID1');
        assert.equal(await cache.getCache('/db/users::all'), false, 'document invalidation evicts the entry');

        await cache.setCache('/db/users::all', [{ documentId: 'ID1' }], '/db/users');
        await cache.setCache('/db/users::other', [{ documentId: 'ID9' }], '/db/users');
        await cache.setCache('/db/orders::all', [{ documentId: 'O1' }], '/db/orders');

        await cache.invalidateByCollection('/db/users');
        assert.equal(await cache.getCache('/db/users::all'), false, 'collection invalidation clears users');
        assert.equal(await cache.getCache('/db/users::other'), false, 'collection invalidation clears all users entries');
        assert.equal(
          JSON.stringify(await cache.getCache('/db/orders::all')),
          JSON.stringify([{ documentId: 'O1' }]),
          'orders entry untouched',
        );

        await cache.clearAllCache();
        assert.equal(await cache.getCache('/db/orders::all'), false, 'clearAllCache empties everything');
      });
    });

    await this.describe('AxioDB instance integration', async () => {
      await this.test('Default instance serves consistent reads across repeated identical queries', async () => {
        const docs = [];
        for (let i = 0; i < 5; i++) {
          docs.push({ name: `user-${i}`, age: i * 10 });
        }
        for (const doc of docs) {
          assert.isSuccess(await this.collection.insert(doc));
        }

        const first = await this.collection.query({}).exec();
        const second = await this.collection.query({}).exec();
        assert.isSuccess(first);
        assert.isSuccess(second);
        assert.deepEqual(first, second, 'cached repeat reads return the same result');
        assert.equal(first.data.documents.length, 5, 'all documents are returned');
      });

      await this.test('Cache:false instance still serves correct reads (child process)', async () => {
        const script = `
          const { AxioDB } = require('./lib/config/DB.js');
          (async () => {
            const db = new AxioDB({ GUI: false, Cache: false, RootName: 'CacheDisabledDB', CustomPath: './Test/TestCacheOptionsChild' });
            const d = await db.createDB('DB');
            const c = await d.createCollection('Users');
            await c.insert({ v: 1 });
            await c.insert({ v: 2 });
            await c.insert({ v: 3 });
            const a = await c.query({}).exec();
            const b = await c.query({}).exec();
            console.log('CHILD_RESULT=' + JSON.stringify({
              ok: a.status === true && JSON.stringify(a) === JSON.stringify(b) && a.data.documents.length === 3
            }));
            await db.deleteDatabase('DB');
          })();
        `;
        const stdout = execFileSync(process.execPath, ['-e', script], {
          cwd: path.resolve(__dirname, '../..'),
          encoding: 'utf8',
        });
        const line = stdout.split('\n').find((l) => l.startsWith('CHILD_RESULT='));
        assert.exists(line, 'child process should report a result');
        const childResult = JSON.parse(line.split('CHILD_RESULT=')[1]);
        assert.equal(childResult.ok, true, 'disabled cache instance reads are correct and repeatable');
      });
    });
  }
}

module.exports = CacheOptionsTests;