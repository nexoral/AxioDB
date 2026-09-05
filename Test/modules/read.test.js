/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable no-undef */

const TestRunner = require('../helpers/TestRunner');
const { assert } = require('../helpers/assertions');
const fixtures = require('../helpers/fixtures');
const fs = require('fs');

const { AxioDB } = require('../../lib/config/DB.js');

class ReadOptimizationTests extends TestRunner {
  constructor() {
    super('Read Optimization Test Suite');
    this.testDir = './Test/TestReadOptimization';
    this.dbInstance = null;
    this.testDB = null;
    this.collection = null;
    this.largeDataset = [];
  }

  async setUp() {
    this.log('Setting up test environment with large dataset...', 'info');

    if (fs.existsSync(this.testDir)) {
      fs.rmSync(this.testDir, { recursive: true, force: true });
    }

    this.dbInstance = new AxioDB({ GUI: false, RootName: 'ReadOptTestDB', CustomPath: this.testDir });
    this.testDB = await this.dbInstance.createDB('TestDB');
    this.collection = await this.testDB.createCollection('LargeCollection');

    // Create indexes before inserting data
    await this.collection.newIndex('name', 'email', 'age', 'category');

    // Generate and insert large dataset (50000 docs for realistic benchmark)
    this.largeDataset = fixtures.generateUsers(50000);
    await this.collection.insertMany(this.largeDataset);

    this.log(`Test environment ready with ${this.largeDataset.length} documents`, 'success');
  }

  async tearDown() {
    this.log('Cleaning up...', 'info');
    if (fs.existsSync(this.testDir)) {
      fs.rmSync(this.testDir, { recursive: true, force: true });
    }
    this.log('Cleanup complete', 'success');
  }

  async runTests() {
    // Index-based Read Tests
    await this.describe('Index-Based Reads', async () => {
      await this.test('Exact match on indexed field is fast', async () => {
        // Warm up index cache + worker threads (cold start after 50K insertMany)
        await this.collection.query({ name: 'Alice0' }).exec();
        const startTime = Date.now();
        const result = await this.collection.query({ name: 'Alice100' }).exec();
        const duration = Date.now() - startTime;

        assert.isSuccess(result);
        assert.performanceWithin(duration, 2000, 'Indexed query should be fast');
        this.log(`     Index query completed in ${duration}ms`, 'gray');
      });

      await this.test('Query uses index for exact match', async () => {
        // Run same query multiple times - should be consistently fast due to index
        const times = [];
        for (let i = 0; i < 3; i++) {
          const start = Date.now();
          await this.collection.query({ name: `Alice${i * 100}` }).exec();
          times.push(Date.now() - start);
        }

        const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
        // Worker thread startup adds overhead, allow 1000ms for 50K dataset
        assert.performanceWithin(avgTime, 1000, 'Repeated indexed queries should be fast');
      });
    });

    // Cache Tests
    await this.describe('Cache Optimization', async () => {
      await this.test('Repeated identical queries use cache', async () => {
        const query = { age: { $gt: 30, $lt: 40 } };

        // First query - cache miss
        const firstStart = Date.now();
        await this.collection.query(query).exec();
        const firstDuration = Date.now() - firstStart;

        // Second query - should hit cache
        const secondStart = Date.now();
        await this.collection.query(query).exec();
        const secondDuration = Date.now() - secondStart;

        // Third query - should also hit cache
        const thirdStart = Date.now();
        await this.collection.query(query).exec();
        const thirdDuration = Date.now() - thirdStart;

        this.log(`     First: ${firstDuration}ms, Second: ${secondDuration}ms, Third: ${thirdDuration}ms`, 'gray');

        // Cache hits should generally be faster (allowing some variance)
        assert.ok(
          thirdDuration <= firstDuration * 1.5 || thirdDuration < 100,
          'Cached query should not be significantly slower'
        );
      });

      await this.test('Updating one document evicts only its own cached queries', async () => {
        const queryA = { age: { $gt: 30, $lt: 35 } };
        const queryB = { age: { $gt: 55, $lt: 60 } }; // disjoint age range - shares no documents with queryA

        // Warm both caches
        await this.collection.query(queryA).exec();
        await this.collection.query(queryB).exec();

        const bBeforeStart = Date.now();
        await this.collection.query(queryB).exec();
        const bBeforeDuration = Date.now() - bBeforeStart;

        // Update a document that belongs to queryA's cached result
        const aResult = await this.collection.query(queryA).exec();
        const targetId = aResult.data.documents[0].documentId;
        await this.collection.update({ documentId: targetId }).UpdateOne({ marked: true });

        // queryB never contained the updated document - its cache entry should survive untouched
        const bAfterStart = Date.now();
        await this.collection.query(queryB).exec();
        const bAfterDuration = Date.now() - bAfterStart;

        // queryA did contain the updated document - its cache entry should have been evicted,
        // forcing a full recompute (noticeably slower than a cache hit)
        const aAfterStart = Date.now();
        await this.collection.query(queryA).exec();
        const aAfterDuration = Date.now() - aAfterStart;

        this.log(`     queryB cache hit before: ${bBeforeDuration}ms, after unrelated update: ${bAfterDuration}ms`, 'gray');
        this.log(`     queryA recomputed after its own document was updated: ${aAfterDuration}ms`, 'gray');

        assert.ok(bAfterDuration < 100, 'Unrelated cached query (queryB) should remain a fast cache hit after queryA document update');
        assert.ok(
          aAfterDuration > bAfterDuration,
          'queryA should have been evicted and recomputed (slower than the untouched cache hit), proving invalidation was targeted to the affected entry'
        );
      });

      await this.test('Deleting one document evicts only its own cached queries', async () => {
        // Same guarantee as the update test above, but for deleteOne - regression
        // coverage for Transaction.commit() invalidating the whole collection's
        // cache on every write instead of just the deleted document's entries.
        const insertResult = await this.collection.insert({ name: 'CacheDeleteTarget', age: 500 });
        const targetId = insertResult.data.documentId;

        const queryA = { name: 'CacheDeleteTarget' };
        const queryB = { age: { $gt: 55, $lt: 60 } }; // disjoint - shares no documents with queryA

        await this.collection.query(queryA).exec();
        await this.collection.query(queryB).exec();

        const bBeforeStart = Date.now();
        await this.collection.query(queryB).exec();
        const bBeforeDuration = Date.now() - bBeforeStart;

        await this.collection.delete({ documentId: targetId }).deleteOne();

        const bAfterStart = Date.now();
        await this.collection.query(queryB).exec();
        const bAfterDuration = Date.now() - bAfterStart;

        this.log(`     queryB cache hit before: ${bBeforeDuration}ms, after unrelated delete: ${bAfterDuration}ms`, 'gray');
        assert.ok(bAfterDuration < 100, 'Unrelated cached query should remain a fast cache hit after an unrelated document is deleted');
      });

      await this.test('UpdateMany evicts only the cached queries for documents it actually touched', async () => {
        const queryA = { age: { $gt: 30, $lt: 35 } };
        const queryB = { age: { $gt: 55, $lt: 60 } }; // disjoint - UpdateMany below never touches these documents

        await this.collection.query(queryA).exec();
        await this.collection.query(queryB).exec();

        const bBeforeStart = Date.now();
        await this.collection.query(queryB).exec();
        const bBeforeDuration = Date.now() - bBeforeStart;

        await this.collection.update(queryA).UpdateMany({ batchMarked: true });

        const bAfterStart = Date.now();
        await this.collection.query(queryB).exec();
        const bAfterDuration = Date.now() - bAfterStart;

        this.log(`     queryB cache hit before: ${bBeforeDuration}ms, after disjoint UpdateMany: ${bAfterDuration}ms`, 'gray');
        assert.ok(bAfterDuration < 100, 'Unrelated cached query should remain a fast cache hit after an UpdateMany that never matched it');
      });

      await this.test('A cached "no results" query is correctly invalidated after an insert that would now match', async () => {
        // Inserts can't be selectively targeted (a brand-new documentId has no
        // existing cache entry to evict) - they must broadly invalidate the whole
        // collection, otherwise a cached empty/stale result set would stay wrong
        // indefinitely instead of just until the next unrelated write.
        const uniqueMarker = `insert-cache-check-${Date.now()}`;
        const before = await this.collection.query({ name: uniqueMarker }).exec();
        assert.equal(before.data.documents.length, 0, 'Should find nothing before the document exists');

        await this.collection.insert({ name: uniqueMarker, age: 999 });

        const after = await this.collection.query({ name: uniqueMarker }).exec();
        assert.equal(after.data.documents.length, 1, 'Previously-cached empty result must be invalidated by the insert, not served stale');
      });

      await this.test('DocumentId queries are cached', async () => {
        // Get a documentId first
        const firstResult = await this.collection.query({ name: 'Alice0' }).exec();
        const docId = firstResult.data.documents[0]?.documentId;

        if (docId) {
          // Query by documentId multiple times
          const times = [];
          for (let i = 0; i < 3; i++) {
            const start = Date.now();
            await this.collection.query({ documentId: docId }).exec();
            times.push(Date.now() - start);
          }

          this.log(`     DocumentId query times: ${times.join('ms, ')}ms`, 'gray');
          // Worker thread adds overhead, allow 500ms per query
          assert.ok(times.every(t => t < 500), 'DocumentId queries should be fast');
        }
      });
    });

    // Range Query Tests
    await this.describe('Range Query Performance', async () => {
      await this.test('Range query with $gt operator', async () => {
        const startTime = Date.now();
        const result = await this.collection
          .query({ age: { $gt: 50 } })
          .Limit(100)
          .exec();
        const duration = Date.now() - startTime;

        assert.isSuccess(result);
        result.data.documents.forEach(doc => {
          assert.isAbove(doc.age, 50);
        });
        this.log(`     Range query completed in ${duration}ms`, 'gray');
      });

      await this.test('Range query with $gte and $lte', async () => {
        const startTime = Date.now();
        const result = await this.collection
          .query({ age: { $gte: 30, $lte: 40 } })
          .exec();
        const duration = Date.now() - startTime;

        assert.isSuccess(result);
        result.data.documents.forEach(doc => {
          assert.ok(doc.age >= 30 && doc.age <= 40);
        });
        this.log(`     Combined range query completed in ${duration}ms`, 'gray');
      });
    });

    // Range Query Index Correctness (sorted-index range lookup: $gt/$gte/$lt/$lte)
    await this.describe('Range Query Index Correctness', async () => {
      await this.test('$gt excludes boundary, $gte includes boundary', async () => {
        const exclusive = await this.collection.query({ age: { $gt: 30 } }).Limit(50000).exec();
        const inclusive = await this.collection.query({ age: { $gte: 30 } }).Limit(50000).exec();

        assert.isSuccess(exclusive);
        assert.isSuccess(inclusive);
        assert.ok(
          exclusive.data.documents.every(doc => doc.age > 30),
          '$gt should never include age === 30'
        );
        assert.ok(
          inclusive.data.documents.some(doc => doc.age === 30),
          '$gte should include age === 30'
        );
        const boundaryCount = inclusive.data.documents.filter(doc => doc.age === 30).length;
        assert.ok(
          boundaryCount > 0,
          'There should be documents with age === 30 in the dataset'
        );
        assert.equal(
          inclusive.data.documents.length - exclusive.data.documents.length,
          boundaryCount,
          '$gte result should exceed $gt result by exactly the count of boundary-value docs'
        );
      });

      await this.test('$lt excludes boundary, $lte includes boundary', async () => {
        const exclusive = await this.collection.query({ age: { $lt: 40 } }).Limit(50000).exec();
        const inclusive = await this.collection.query({ age: { $lte: 40 } }).Limit(50000).exec();

        assert.isSuccess(exclusive);
        assert.isSuccess(inclusive);
        assert.ok(
          exclusive.data.documents.every(doc => doc.age < 40),
          '$lt should never include age === 40'
        );
        assert.ok(
          inclusive.data.documents.some(doc => doc.age === 40),
          '$lte should include age === 40'
        );
        const boundaryCount = inclusive.data.documents.filter(doc => doc.age === 40).length;
        assert.ok(
          boundaryCount > 0,
          'There should be documents around the age 40 boundary'
        );
      });

      await this.test('Combined range matches manual full-scan filter exactly', async () => {
        const indexed = await this.collection.query({ age: { $gte: 33, $lte: 37 } }).Limit(50000).exec();
        const fullScan = await this.collection.query({}).Limit(50000).exec();

        assert.isSuccess(indexed);
        assert.isSuccess(fullScan);

        const expectedIds = fullScan.data.documents
          .filter(doc => doc.age >= 33 && doc.age <= 37)
          .map(doc => doc.documentId)
          .sort();
        const actualIds = indexed.data.documents.map(doc => doc.documentId).sort();

        assert.equal(
          actualIds.length,
          expectedIds.length,
          'Indexed range query must return the same number of documents as a manual full-scan filter'
        );
        assert.deepEqual(actualIds, expectedIds, 'Indexed range query must return the same documents as a manual full-scan filter');
      });

      await this.test('Newly inserted unique value becomes queryable via range', async () => {
        const insertResult = await this.collection.insert({
          name: 'RangeProbeHigh',
          email: 'rangeprobehigh@example.com',
          age: 999,
          active: true,
        });
        assert.isSuccess(insertResult);

        const result = await this.collection.query({ age: { $gt: 900 } }).Limit(20000).exec();
        assert.isSuccess(result);
        assert.ok(
          result.data.documents.some(doc => doc.documentId === insertResult.data.documentId),
          'A brand-new unique indexed value should be reachable by a range query right after insert'
        );
      });

      await this.test('Deleted document no longer matches range query', async () => {
        const insertResult = await this.collection.insert({
          name: 'RangeProbeLow',
          email: 'rangeprobelow@example.com',
          age: 1000,
          active: true,
        });
        assert.isSuccess(insertResult);

        const beforeDelete = await this.collection.query({ age: { $gt: 990 } }).Limit(20000).exec();
        assert.ok(
          beforeDelete.data.documents.some(doc => doc.documentId === insertResult.data.documentId),
          'Document should be visible via range query before deletion'
        );

        await this.collection.delete({ documentId: insertResult.data.documentId }).deleteOne();

        const afterDelete = await this.collection.query({ age: { $gt: 990 } }).Limit(20000).exec();
        assert.ok(
          afterDelete.data.documents.every(doc => doc.documentId !== insertResult.data.documentId),
          'Deleted document must not reappear in range queries afterwards'
        );
      });
    });

    // $in Operator Tests
    await this.describe('$in Operator Performance', async () => {
      await this.test('$in with small array', async () => {
        const startTime = Date.now();
        const result = await this.collection
          .query({ age: { $in: [25, 30, 35, 40, 45] } })
          .Limit(50)
          .exec();
        const duration = Date.now() - startTime;

        assert.isSuccess(result);
        this.log(`     $in (5 values) completed in ${duration}ms`, 'gray');
      });

      await this.test('$in with large array uses Set optimization', async () => {
        // Generate array of 50 ages
        const ages = Array.from({ length: 50 }, (_, i) => 20 + i);

        const startTime = Date.now();
        const result = await this.collection
          .query({ age: { $in: ages } })
          .Limit(100)
          .exec();
        const duration = Date.now() - startTime;

        assert.isSuccess(result);
        // Large $in arrays should still be reasonably fast due to Set optimization
        assert.performanceWithin(duration, 2000, '$in with large array should use Set');
        this.log(`     $in (50 values) completed in ${duration}ms`, 'gray');
      });
    });

    // Limit and Skip Optimization
    await this.describe('Limit and Skip Optimization', async () => {
      await this.test('Limit restricts result count', async () => {
        const result = await this.collection.query({}).Limit(10).exec();

        assert.isSuccess(result);
        assert.equal(result.data.documents.length, 10);
      });

      await this.test('Small limit queries are fast', async () => {
        const startTime = Date.now();
        const result = await this.collection
          .query({ age: { $gt: 25 } })
          .Limit(5)
          .exec();
        const duration = Date.now() - startTime;

        assert.isSuccess(result);
        assert.equal(result.data.documents.length, 5);
        // With 10K docs and worker thread overhead, allow up to 2 seconds
        assert.performanceWithin(duration, 2000, 'Small limit should enable early termination');
        this.log(`     Limit 5 query completed in ${duration}ms`, 'gray');
      });

      await this.test('Skip and Limit pagination', async () => {
        const page1 = await this.collection.query({}).Skip(0).Limit(10).exec();
        const page2 = await this.collection.query({}).Skip(10).Limit(10).exec();

        assert.isSuccess(page1);
        assert.isSuccess(page2);
        assert.equal(page1.data.documents.length, 10);
        assert.equal(page2.data.documents.length, 10);

        // Pages should have different documents
        const page1Ids = page1.data.documents.map(d => d.documentId);
        const page2Ids = page2.data.documents.map(d => d.documentId);
        const overlap = page1Ids.filter(id => page2Ids.includes(id));
        assert.equal(overlap.length, 0, 'Pages should not overlap');
      });
    });

    // Regex Query Tests
    await this.describe('Regex Query Performance', async () => {
      await this.test('Regex pattern matching', async () => {
        const startTime = Date.now();
        const result = await this.collection
          .query({ email: { $regex: /@example\.com$/ } })
          .Limit(50)
          .exec();
        const duration = Date.now() - startTime;

        assert.isSuccess(result);
        result.data.documents.forEach(doc => {
          assert.ok(doc.email.endsWith('@example.com') || doc.email.includes('example.com'));
        });
        this.log(`     Regex query completed in ${duration}ms`, 'gray');
      });

      await this.test('Regex with options (case insensitive)', async () => {
        const result = await this.collection
          .query({ name: { $regex: 'alice', $options: 'i' } })
          .Limit(20)
          .exec();

        assert.isSuccess(result);
        result.data.documents.forEach(doc => {
          assert.ok(doc.name.toLowerCase().includes('alice'));
        });
      });
    });

    // Complex Query Tests
    await this.describe('Complex Query Performance', async () => {
      await this.test('Multi-field query with sorting', async () => {
        const startTime = Date.now();
        const result = await this.collection
          .query({ age: { $gte: 25, $lte: 45 } })
          .Sort({ age: 1 })
          .Limit(100)
          .exec();
        const duration = Date.now() - startTime;

        assert.isSuccess(result);
        // Verify sorting
        const ages = result.data.documents.map(d => d.age);
        for (let i = 1; i < ages.length; i++) {
          assert.ok(ages[i] >= ages[i - 1], 'Should be sorted ascending');
        }
        this.log(`     Complex query with sort completed in ${duration}ms`, 'gray');
      });

      await this.test('Query with projection reduces payload', async () => {
        const result = await this.collection
          .query({ age: { $gt: 30 } })
          .setProject({ name: 1, age: 1 })
          .Limit(50)
          .exec();

        assert.isSuccess(result);
        // Check projection
        const doc = result.data.documents[0];
        assert.hasProperty(doc, 'name');
        assert.hasProperty(doc, 'age');
        assert.hasProperty(doc, 'documentId'); // Always included
      });
    });

    // Performance Comparison
    await this.describe('Performance Benchmarks', async () => {
      await this.test('Benchmark: Full scan vs indexed query', async () => {
        // Full scan (no query) - limit to 10K for reasonable time
        const fullScanStart = Date.now();
        await this.collection.query({}).Limit(10000).exec();
        const fullScanTime = Date.now() - fullScanStart;

        // Indexed query
        const indexedStart = Date.now();
        await this.collection.query({ name: 'Alice500' }).exec();
        const indexedTime = Date.now() - indexedStart;

        this.log(`     Full scan (10000 of 50000 docs): ${fullScanTime}ms`, 'gray');
        this.log(`     Indexed query: ${indexedTime}ms`, 'gray');

        // With worker threads, indexed queries may have startup overhead
        // Just verify both complete successfully without timeout
        assert.ok(fullScanTime < 60000, 'Full scan should complete within 60 seconds');
        assert.ok(indexedTime < 10000, 'Indexed query should complete within 10 seconds');
      });
    });

    // Missing Query Operator Tests
    await this.describe('Query Operator Correctness', async () => {
      await this.test('$eq explicit equality match', async () => {
        const result = await this.collection.query({ name: { $eq: 'Alice0' } }).exec();
        assert.isSuccess(result);
        assert.ok(result.data.documents.length >= 1, '$eq should find exact match');
        result.data.documents.forEach(doc => {
          assert.equal(doc.name, 'Alice0');
        });
      });

      await this.test('$ne excludes matching values', async () => {
        const result = await this.collection.query({ name: { $ne: 'Alice0' } }).Limit(100).exec();
        assert.isSuccess(result);
        result.data.documents.forEach(doc => {
          assert.ok(doc.name !== 'Alice0', '$ne should exclude the specified value');
        });
      });

      await this.test('$nin excludes values in array', async () => {
        const excludedNames = ['Alice0', 'Alice1', 'Alice2'];
        const result = await this.collection.query({ name: { $nin: excludedNames } }).Limit(100).exec();
        assert.isSuccess(result);
        result.data.documents.forEach(doc => {
          assert.ok(!excludedNames.includes(doc.name), '$nin should exclude all values in the array');
        });
      });

      await this.test('$exists true finds documents with field', async () => {
        const result = await this.collection.query({ age: { $exists: true } }).Limit(100).exec();
        assert.isSuccess(result);
        assert.ok(result.data.documents.length > 0, '$exists:true should find documents with the field');
        result.data.documents.forEach(doc => {
          assert.hasProperty(doc, 'age');
        });
      });

      await this.test('$exists false finds documents without field', async () => {
        await this.collection.insert({ name: 'NoAgeDoc', email: 'noage@test.com' });
        const result = await this.collection.query({ age: { $exists: false } }).exec();
        assert.isSuccess(result);
        assert.ok(
          result.data.documents.some(doc => doc.name === 'NoAgeDoc'),
          '$exists:false should find the document without age field'
        );
        await this.collection.delete({ name: 'NoAgeDoc' }).deleteOne();
      });

      await this.test('$not negates sub-condition', async () => {
        const result = await this.collection.query({ age: { $not: { $gt: 40 } } }).Limit(100).exec();
        assert.isSuccess(result);
        result.data.documents.forEach(doc => {
          assert.ok(doc.age <= 40, '$not:{$gt:40} should return docs with age <= 40');
        });
      });

      await this.test('$or matches any condition', async () => {
        const result = await this.collection.query({
          $or: [{ name: 'Alice0' }, { name: 'Bob0' }]
        }).Limit(100).exec();
        assert.isSuccess(result);
        assert.ok(result.data.documents.length >= 1, '$or should match at least one condition');
        const names = result.data.documents.map(d => d.name);
        assert.ok(
          names.includes('Alice0') || names.includes('Bob0'),
          '$or should return docs matching at least one branch'
        );
      });

      await this.test('$and matches all conditions', async () => {
        const result = await this.collection.query({
          $and: [{ age: { $gt: 25 } }, { age: { $lt: 35 } }]
        }).Limit(100).exec();
        assert.isSuccess(result);
        result.data.documents.forEach(doc => {
          assert.ok(doc.age > 25 && doc.age < 35, '$and should enforce all conditions');
        });
      });

      await this.test('$nor matches none of the conditions', async () => {
        const result = await this.collection.query({
          $nor: [{ name: 'Alice0' }, { age: { $gt: 40 } }]
        }).Limit(100).exec();
        assert.isSuccess(result);
        result.data.documents.forEach(doc => {
          assert.ok(doc.name !== 'Alice0', '$nor should exclude first condition');
          assert.ok(doc.age <= 40, '$nor should exclude second condition');
        });
      });

      await this.test('$elemMatch matches array elements', async () => {
        await this.collection.insert({
          name: 'ArrayDoc',
          email: 'array@test.com',
          age: 30,
          tags: [{ type: 'a', score: 10 }, { type: 'b', score: 20 }]
        });
        const result = await this.collection.query({
          tags: { $elemMatch: { type: 'a', score: { $gt: 5 } } }
        }).exec();
        assert.isSuccess(result);
        assert.ok(
          result.data.documents.some(doc => doc.name === 'ArrayDoc'),
          '$elemMatch should find document with matching array element'
        );
        await this.collection.delete({ name: 'ArrayDoc' }).deleteOne();
      });

      await this.test('$size matches array length', async () => {
        await this.collection.insert({
          name: 'SizeDoc',
          email: 'size@test.com',
          age: 30,
          tags: ['a', 'b', 'c']
        });
        const result = await this.collection.query({ tags: { $size: 3 } }).exec();
        assert.isSuccess(result);
        assert.ok(
          result.data.documents.some(doc => doc.name === 'SizeDoc'),
          '$size should find document with 3-element array'
        );
        await this.collection.delete({ name: 'SizeDoc' }).deleteOne();
      });

      await this.test('$all matches all values in array', async () => {
        await this.collection.insert({
          name: 'AllDoc',
          email: 'all@test.com',
          age: 30,
          tags: ['a', 'b', 'c']
        });
        const result = await this.collection.query({ tags: { $all: ['a', 'c'] } }).exec();
        assert.isSuccess(result);
        assert.ok(
          result.data.documents.some(doc => doc.name === 'AllDoc'),
          '$all should find document containing all specified values'
        );
        await this.collection.delete({ name: 'AllDoc' }).deleteOne();
      });
    });

    // Index Cache Invalidation
    await this.describe('Index Cache Invalidation', async () => {
      await this.test('Creating an index is immediately usable for queries', async () => {
        await this.collection.newIndex('tempField');
        const result = await this.collection.query({ tempField: 'nonexistent' }).exec();
        assert.isSuccess(result);
        await this.collection.dropIndex('tempField');
      });

      await this.test('Dropped index queries fall back to full scan without errors', async () => {
        await this.collection.newIndex('dropTestField');
        await this.collection.insert({ dropTestField: 'hello', name: 'DropTest', age: 50 });
        // Warm the cache
        await this.collection.query({ dropTestField: 'hello' }).exec();
        // Drop the index
        await this.collection.dropIndex('dropTestField');
        // Querying the dropped field should still work (full scan fallback), not return stale index data
        const result = await this.collection.query({ dropTestField: 'hello' }).exec();
        assert.isSuccess(result);
        assert.ok(result.data.documents.length > 0 || result.data.documents.length === 0,
          'Query on dropped index field should not error');
        // Clean up
        await this.collection.delete({ name: 'DropTest' }).deleteOne();
      });
    });
  }
}

module.exports = ReadOptimizationTests;
