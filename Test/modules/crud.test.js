/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable no-undef */

const TestRunner = require('../helpers/TestRunner');
const { assert } = require('../helpers/assertions');
const fixtures = require('../helpers/fixtures');
const fs = require('fs');

const { AxioDB } = require('../../lib/config/DB.js');

class CRUDTests extends TestRunner {
  constructor() {
    super('CRUD Operations Test Suite');
    this.testDir = './Test/TestCRUD';
    this.dbInstance = null;
    this.testDB = null;
    this.collection = null;
    this.documentIds = [];
  }

  async setUp() {
    this.log('Setting up test environment...', 'info');

    // Clean up previous test data
    if (fs.existsSync(this.testDir)) {
      fs.rmSync(this.testDir, { recursive: true, force: true });
    }

    // Create database instance
    this.dbInstance = new AxioDB(false, 'CRUDTestDB', this.testDir);
    this.testDB = await this.dbInstance.createDB('TestDatabase');
    this.collection = await this.testDB.createCollection('Users');

    // Create indexes
    await this.collection.newIndex('name', 'email', 'age');

    this.log('Test environment ready', 'success');
  }

  async tearDown() {
    this.log('Cleaning up...', 'info');
    if (fs.existsSync(this.testDir)) {
      fs.rmSync(this.testDir, { recursive: true, force: true });
    }
    this.log('Cleanup complete', 'success');
  }

  async runTests() {
    // CREATE Tests
    await this.describe('CREATE Operations', async () => {
      await this.test('Insert single document', async () => {
        const user = fixtures.sampleUser();
        const result = await this.collection.insert(user);

        assert.isSuccess(result);
        assert.exists(result.data.documentId);
        this.documentIds.push(result.data.documentId);
      });

      await this.test('Insert multiple documents', async () => {
        const users = fixtures.generateUsers(100);
        const result = await this.collection.insertMany(users);

        assert.isSuccess(result);
        assert.equal(result.data.total, 100);
        assert.equal(result.data.id.length, 100);
        this.documentIds.push(...result.data.id);
      });

      await this.test('Insert with validation - empty data throws', async () => {
        await assert.throws(
          async () => await this.collection.insert(null),
          'cannot be empty'
        );
      });
    });

    // READ Tests
    await this.describe('READ Operations', async () => {
      await this.test('Find by exact match (indexed field)', async () => {
        const result = await this.collection.query({ name: 'Alice0' }).exec();

        assert.isSuccess(result);
        assert.exists(result.data.documents);
      });

      await this.test('Find by documentId', async () => {
        if (this.documentIds.length > 0) {
          const result = await this.collection
            .query({ documentId: this.documentIds[0] })
            .exec();

          assert.isSuccess(result);
        }
      });

      await this.test('Find with $gt operator', async () => {
        const result = await this.collection.query({ age: { $gt: 40 } }).exec();

        assert.isSuccess(result);
        result.data.documents.forEach(doc => {
          assert.isAbove(doc.age, 40);
        });
      });

      await this.test('Find with $in operator', async () => {
        const result = await this.collection
          .query({ age: { $in: [25, 30, 35] } })
          .exec();

        assert.isSuccess(result);
      });

      await this.test('Find with Limit', async () => {
        const result = await this.collection.query({}).Limit(5).exec();

        assert.isSuccess(result);
        assert.isBelow(result.data.documents.length, 6);
      });

      await this.test('Find with Skip', async () => {
        const result = await this.collection.query({}).Skip(10).Limit(5).exec();

        assert.isSuccess(result);
      });

      await this.test('Find with Sort', async () => {
        const result = await this.collection.query({}).Sort({ age: 1 }).Limit(10).exec();

        assert.isSuccess(result);
        const ages = result.data.documents.map(d => d.age);
        for (let i = 1; i < ages.length; i++) {
          assert.ok(ages[i] >= ages[i - 1], 'Should be sorted ascending');
        }
      });

      await this.test('Find with findOne', async () => {
        const result = await this.collection
          .query({ name: 'Alice0' })
          .findOne(true)
          .exec();

        assert.isSuccess(result);
        assert.exists(result.data.documents);
      });

      await this.test('Find with setCount', async () => {
        const result = await this.collection.query({}).setCount(true).exec();

        assert.isSuccess(result);
        assert.exists(result.data.totalDocuments);
      });

      await this.test('Find with projection', async () => {
        const result = await this.collection
          .query({})
          .setProject({ name: 1, age: 1 })
          .Limit(5)
          .exec();

        assert.isSuccess(result);
        // Projected fields should exist
        result.data.documents.forEach(doc => {
          assert.hasProperty(doc, 'name');
          assert.hasProperty(doc, 'age');
        });
      });
    });

    // UPDATE Tests
    await this.describe('UPDATE Operations', async () => {
      await this.test('Update single document', async () => {
        const result = await this.collection
          .update({ name: 'Alice0' })
          .UpdateOne({ age: 99, status: 'updated' });

        assert.isSuccess(result);
      });

      await this.test('Update multiple documents', async () => {
        const result = await this.collection
          .update({ age: { $gt: 50 } })
          .UpdateMany({ category: 'senior' });

        assert.isSuccess(result);
      });

      await this.test('Verify update persisted', async () => {
        const result = await this.collection.query({ name: 'Alice0' }).exec();

        assert.isSuccess(result);
        if (result.data.documents.length > 0) {
          assert.equal(result.data.documents[0].status, 'updated');
        }
      });
    });

    // DELETE Tests
    await this.describe('DELETE Operations', async () => {
      // Add test data for deletion
      await this.collection.insertMany([
        { name: 'DeleteMe1', age: 100 },
        { name: 'DeleteMe2', age: 100 },
        { name: 'DeleteMe3', age: 100 }
      ]);

      await this.test('Delete single document', async () => {
        const result = await this.collection
          .delete({ name: 'DeleteMe1' })
          .deleteOne();

        assert.isSuccess(result);
      });

      await this.test('Delete multiple documents', async () => {
        const result = await this.collection
          .delete({ name: { $regex: /DeleteMe/ } })
          .deleteMany();

        assert.isSuccess(result);
      });

      await this.test('Verify deletion', async () => {
        const result = await this.collection
          .query({ name: { $regex: /DeleteMe/ } })
          .exec();

        assert.isSuccess(result);
        assert.equal(result.data.documents.length, 0);
      });
    });
  }
}

module.exports = CRUDTests;
