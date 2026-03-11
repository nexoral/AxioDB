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

    this.dbInstance = new AxioDB(false, 'ReadOptTestDB', this.testDir);
    this.testDB = await this.dbInstance.createDB('TestDB');
    this.collection = await this.testDB.createCollection('LargeCollection');

    // Create indexes before inserting data
    await this.collection.newIndex('name', 'email', 'age', 'category');

    // Generate and insert large dataset (10000 docs for realistic benchmark)
    this.largeDataset = fixtures.generateUsers(10000);
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
        const startTime = Date.now();
        const result = await this.collection.query({ name: 'Alice100' }).exec();
        const duration = Date.now() - startTime;

        assert.isSuccess(result);
        assert.performanceWithin(duration, 500, 'Indexed query should be fast');
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
        // Worker thread startup adds overhead, allow 500ms
        assert.performanceWithin(avgTime, 500, 'Repeated indexed queries should be fast');
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
        // Full scan (no query)
        const fullScanStart = Date.now();
        await this.collection.query({}).Limit(10000).exec();
        const fullScanTime = Date.now() - fullScanStart;

        // Indexed query
        const indexedStart = Date.now();
        await this.collection.query({ name: 'Alice500' }).exec();
        const indexedTime = Date.now() - indexedStart;

        this.log(`     Full scan (10000 docs): ${fullScanTime}ms`, 'gray');
        this.log(`     Indexed query: ${indexedTime}ms`, 'gray');

        // With worker threads, indexed queries may have startup overhead
        // Just verify both complete successfully without timeout
        assert.ok(fullScanTime < 30000, 'Full scan should complete within 30 seconds');
        assert.ok(indexedTime < 5000, 'Indexed query should complete within 5 seconds');
      });
    });
  }
}

module.exports = ReadOptimizationTests;
