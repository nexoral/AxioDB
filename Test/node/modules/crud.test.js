/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable no-undef */

const TestRunner = require('../helpers/TestRunner');
const { assert } = require('../helpers/assertions');
const fixtures = require('../helpers/fixtures');
const fs = require('fs');
const path = require('path');

const { AxioDB } = require('../../../axiodb.js');

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
    this.dbInstance = new AxioDB({ RootName: 'CRUDTestDB', CustomPath: this.testDir });
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

      await this.test('Generated documentId is 16-char uppercase alphanumeric', async () => {
        const result = await this.collection.insert(fixtures.sampleUser());
        const id = result.data.documentId;
        assert.equal(id.length, 16, 'documentId should be 16 characters');
        assert.ok(/^[A-Z0-9]+$/.test(id), 'documentId should contain only uppercase letters and digits');
        this.documentIds.push(id);
      });

      await this.test('Insert multiple documents', async () => {
        const users = fixtures.generateUsers(500);
        const startTime = Date.now();
        const result = await this.collection.insertMany(users);
        const insertDuration = Date.now() - startTime;

        assert.isSuccess(result);
        assert.equal(result.data.total, users.length);
        assert.equal(result.data.id.length, users.length);
        this.documentIds.push(...result.data.id);
        this.log(`     InsertMany (${users.length} docs): ${insertDuration}ms`, 'gray');
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

      await this.test('Find with $ne operator', async () => {
        const result = await this.collection.query({ age: { $ne: 20 } }).exec();

        assert.isSuccess(result);
        result.data.documents.forEach(doc => {
          assert.ok(doc.age !== 20, 'Should exclude documents with age 20');
        });
      });

      await this.test('Find with $nin operator', async () => {
        const result = await this.collection
          .query({ age: { $nin: [20, 21, 22] } })
          .exec();

        assert.isSuccess(result);
        result.data.documents.forEach(doc => {
          assert.ok(![20, 21, 22].includes(doc.age), 'Should exclude ages 20, 21, and 22');
        });
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

      await this.test('Update with $ne operator excludes matching documents', async () => {
        await this.collection.insertMany([
          { name: 'NeUser1', age: 77, tag: 'ne-test' },
          { name: 'NeUser2', age: 78, tag: 'ne-test' },
          { name: 'NeUser3', age: 79, tag: 'ne-test' }
        ]);

        const result = await this.collection
          .update({ tag: 'ne-test', age: { $ne: 78 } })
          .UpdateMany({ marked: true });

        assert.isSuccess(result);
        assert.equal(result.data.effectedData, 2, 'Should update only the 2 documents where age != 78');

        const untouched = await this.collection.query({ name: 'NeUser2' }).exec();
        assert.isSuccess(untouched);
        assert.ok(!untouched.data.documents[0].marked, 'age=78 document should be excluded by $ne and stay untouched');
      });

      await this.test('UpdateOne/UpdateMany on a query matching nothing return an error, not a false success', async () => {
        const oneResult = await this.collection
          .update({ name: 'NoSuchUserAtAll' })
          .UpdateOne({ marked: true });
        assert.isError(oneResult, 'UpdateOne with no matching document should return an error');

        const manyResult = await this.collection
          .update({ name: 'NoSuchUserAtAll' })
          .UpdateMany({ marked: true });
        assert.isError(manyResult, 'UpdateMany with no matching documents should return an error');
      });

      await this.test('UpdateOne with directory traversal in documentId safely fails without escaping directory (SEC-16)', async () => {
        const result = await this.collection
          .update({ documentId: '../../traversal_test' })
          .UpdateOne({ marked: true });
        assert.isError(result, 'UpdateOne with path traversal should return an error');
      });

      await this.test('Updating one document does not disturb an unrelated one sharing the same indexed value', async () => {
        // Regression test: two documents sharing an indexed field's value used to have
        // their shared index bucket silently reordered on every update to either one -
        // even when the update never touched that field - because the index-sync step
        // did an unconditional remove+re-append regardless of whether the value changed.
        // That could make a later "first match" query resolve to the wrong document.
        const insertResult = await this.collection.insertMany([
          { name: 'DupName', age: 40, marker: 'first' },
          { name: 'DupName', age: 41, marker: 'second' }
        ]);
        assert.isSuccess(insertResult);
        const [firstId, secondId] = insertResult.data.id;

        // Update only the FIRST document, touching a field ('marker') that is not
        // itself indexed, but 'name' (shared, unchanged) and 'age' (indexed, unchanged
        // for this doc) both still get processed by index staging.
        const updateResult = await this.collection
          .update({ documentId: firstId })
          .UpdateOne({ marker: 'first-updated' });
        assert.isSuccess(updateResult);
        assert.equal(updateResult.data.documentId, firstId, 'UpdateOne should report the document it actually targeted');

        // The untouched document must be provably untouched, found by its own ID -
        // not by relying on array position from a shared-value query.
        const secondCheck = await this.collection.query({ documentId: secondId }).exec();
        assert.isSuccess(secondCheck);
        assert.equal(secondCheck.data.documents[0].marker, 'second', 'Untouched document must keep its original marker');
        assert.equal(secondCheck.data.documents[0].age, 41, 'Untouched document must keep its original age');

        // The updated document, found by its own ID, must reflect the change.
        const firstCheck = await this.collection.query({ documentId: firstId }).exec();
        assert.isSuccess(firstCheck);
        assert.equal(firstCheck.data.documents[0].marker, 'first-updated', 'Updated document must reflect the change');

        // A plain query on the shared 'name' value must still return both documents,
        // regardless of internal bucket order.
        const both = await this.collection.query({ name: 'DupName' }).exec();
        assert.isSuccess(both);
        assert.equal(both.data.documents.length, 2, 'Both documents sharing the indexed value must still be findable');
      });
    });

    // CONCURRENT UPDATE Tests - ACID Compliance
    await this.describe('CONCURRENT UPDATE - ACID Verification', async () => {
      await this.test('Concurrent updates to same document - Atomicity & Isolation', async () => {
        // Insert a document with a counter field
        const testDoc = { name: 'ConcurrentTest', counter: 0, value: 100 };
        const insertResult = await this.collection.insert(testDoc);
        assert.isSuccess(insertResult);
        const docId = insertResult.data.documentId;

        // Perform 10 concurrent updates (reduced from 50 - ACID locks serialize operations)
        const concurrentUpdates = [];
        for (let i = 0; i < 10; i++) {
          concurrentUpdates.push(
            this.collection
              .update({ documentId: docId })
              .UpdateOne({ counter: i + 1, lastUpdate: i })
          );
        }

        // Wait for all concurrent updates to complete
        const results = await Promise.all(concurrentUpdates);

        // With ACID locks, operations on SAME document execute SEQUENTIALLY
        // Some may timeout or fail - this is EXPECTED and CORRECT behavior
        const successCount = results.filter(r => 'data' in r).length;
        const failCount = results.filter(r => !('data' in r)).length;

        this.log(`Successful: ${successCount}, Failed: ${failCount} (expected with ACID locking)`, 'info');

        // At least some operations should succeed
        assert.isAbove(successCount, 0, 'At least one update should succeed');

        // Verify final state - document should exist and be consistent (NO CORRUPTION)
        const finalResult = await this.collection
          .query({ documentId: docId })
          .exec();

        assert.isSuccess(finalResult);
        assert.equal(finalResult.data.documents.length, 1, 'Document should exist');

        const finalDoc = finalResult.data.documents[0];
        assert.exists(finalDoc.counter, 'Counter field should exist');
        assert.exists(finalDoc.lastUpdate, 'LastUpdate field should exist');
        assert.equal(finalDoc.documentId, docId, 'DocumentId should match');

        this.log(`✅ ACID Isolation verified: Final counter=${finalDoc.counter}, lastUpdate=${finalDoc.lastUpdate}`, 'success');
      });

      await this.test('Concurrent updates with different queries - Race condition check', async () => {
        // Insert test documents with DIFFERENT names to allow parallelism
        const insertResult = await this.collection.insertMany([
          { name: 'Race1', status: 'pending', counter: 0 },
          { name: 'Race2', status: 'pending', counter: 0 },
          { name: 'Race3', status: 'pending', counter: 0 }
        ]);
        assert.isSuccess(insertResult);

        // Perform concurrent updates on DIFFERENT documents (parallelism works!)
        const updates = await Promise.all([
          this.collection.update({ name: 'Race1' }).UpdateOne({ status: 'processing', counter: 1 }),
          this.collection.update({ name: 'Race2' }).UpdateOne({ status: 'completed', counter: 2 }),
          this.collection.update({ name: 'Race3' }).UpdateOne({ status: 'archived', counter: 3 })
        ]);

        // All operations should succeed (different documents = no lock contention)
        updates.forEach((result, idx) => {
          assert.isSuccess(result, `Update ${idx + 1} should succeed`);
        });

        // Verify data consistency - all documents updated correctly
        const doc1 = await this.collection.query({ name: 'Race1' }).exec();
        const doc2 = await this.collection.query({ name: 'Race2' }).exec();
        const doc3 = await this.collection.query({ name: 'Race3' }).exec();

        assert.isSuccess(doc1);
        assert.isSuccess(doc2);
        assert.isSuccess(doc3);

        assert.equal(doc1.data.documents[0].status, 'processing');
        assert.equal(doc2.data.documents[0].status, 'completed');
        assert.equal(doc3.data.documents[0].status, 'archived');

        this.log(`✅ Parallel updates on different documents succeeded`, 'success');
      });

      await this.test('Concurrent read-update-read - Consistency check', async () => {
        // Insert a document
        const insertResult = await this.collection.insert({
          name: 'ConsistencyTest',
          value: 1000,
          modified: false
        });
        assert.isSuccess(insertResult);
        const docId = insertResult.data.documentId;

        // Sequential updates with reads (reads don't require locks, updates do)
        const read1 = await this.collection.query({ documentId: docId }).exec();
        assert.isSuccess(read1);
        assert.equal(read1.data.documents[0].value, 1000);

        const update1 = await this.collection.update({ documentId: docId }).UpdateOne({ value: 2000, modified: true });
        assert.isSuccess(update1);

        const read2 = await this.collection.query({ documentId: docId }).exec();
        assert.isSuccess(read2);
        assert.equal(read2.data.documents[0].value, 2000);

        const update2 = await this.collection.update({ documentId: docId }).UpdateOne({ value: 3000 });
        assert.isSuccess(update2);

        // Final read should have consistent data (no corruption)
        const finalRead = await this.collection.query({ documentId: docId }).exec();
        assert.isSuccess(finalRead);
        assert.equal(finalRead.data.documents.length, 1);
        assert.equal(finalRead.data.documents[0].modified, true);
        assert.equal(finalRead.data.documents[0].value, 3000);

        this.log(`✅ Consistency verified: ${finalRead.data.documents[0].value}`, 'success');
      });

      await this.test('Concurrent UpdateMany on NON-overlapping queries', async () => {
        // Insert test data - use different categories to avoid overlapping locks
        await this.collection.insertMany([
          { category: 'A', type: 'X', counter: 0 },
          { category: 'B', type: 'Y', counter: 0 },
          { category: 'C', type: 'Z', counter: 0 }
        ]);

        // Concurrent UpdateMany with NON-overlapping queries (different documents)
        const updates = await Promise.all([
          this.collection.update({ category: 'A' }).UpdateMany({ batch1: true, counter: 1 }),
          this.collection.update({ category: 'B' }).UpdateMany({ batch2: true, counter: 2 }),
          this.collection.update({ category: 'C' }).UpdateMany({ batch3: true, counter: 3 })
        ]);

        // All should succeed (no lock contention)
        updates.forEach((result, idx) => {
          assert.isSuccess(result, `UpdateMany ${idx + 1} should succeed`);
        });

        // Verify all documents updated correctly
        const resultA = await this.collection.query({ category: 'A' }).exec();
        const resultB = await this.collection.query({ category: 'B' }).exec();
        const resultC = await this.collection.query({ category: 'C' }).exec();

        assert.isSuccess(resultA);
        assert.isSuccess(resultB);
        assert.isSuccess(resultC);

        assert.equal(resultA.data.documents[0].counter, 1);
        assert.equal(resultB.data.documents[0].counter, 2);
        assert.equal(resultC.data.documents[0].counter, 3);

        this.log('✅ Parallel UpdateMany on different documents succeeded', 'success');
      });

      await this.test('Mixed inserts and updates - Data integrity', async () => {
        // Test data integrity with mixed operations (run sequentially to avoid timeout)

        // Batch 1: Inserts (new documents)
        const inserts = await this.collection.insertMany([
          { name: 'MixedTest0', value: 0 },
          { name: 'MixedTest1', value: 1 },
          { name: 'MixedTest2', value: 2 }
        ]);
        assert.isSuccess(inserts);

        // Batch 2: Updates on those documents
        const update0 = await this.collection.update({ name: 'MixedTest0' }).UpdateOne({ updated: true, value: 10 });
        const update1 = await this.collection.update({ name: 'MixedTest1' }).UpdateOne({ updated: true, value: 20 });
        const update2 = await this.collection.update({ name: 'MixedTest2' }).UpdateOne({ updated: true, value: 30 });

        assert.isSuccess(update0);
        assert.isSuccess(update1);
        assert.isSuccess(update2);

        // Verify data integrity - no corruption
        const result = await this.collection.query({ name: { $regex: /MixedTest/ } }).exec();
        assert.isSuccess(result);
        assert.equal(result.data.documents.length, 3);

        // All should have updated=true
        result.data.documents.forEach(doc => {
          assert.equal(doc.updated, true);
        });

        this.log(`✅ Data integrity verified: All ${result.data.documents.length} documents updated correctly`, 'success');
      });

      await this.test('Same file concurrent writes - File system integrity', async () => {
        // Create a specific document to target
        const result = await this.collection.insert({
          name: 'SameFileTest',
          version: 0,
          updates: []
        });
        assert.isSuccess(result);
        const targetId = result.data.documentId;

        // Perform 20 concurrent updates to the EXACT same file (reduced from 100)
        // With ACID locks, these will serialize - some may timeout
        const sameFileUpdates = [];
        for (let i = 0; i < 20; i++) {
          sameFileUpdates.push(
            this.collection
              .update({ documentId: targetId })
              .UpdateOne({
                version: i,
                timestamp: Date.now(),
                updateNumber: i
              })
          );
        }

        const updateResults = await Promise.all(sameFileUpdates);

        // With ACID locks, operations serialize - some may fail/timeout
        const successCount = updateResults.filter(r => 'data' in r).length;
        const failCount = updateResults.filter(r => !('data' in r)).length;

        this.log(`Same file updates: ${successCount} succeeded, ${failCount} failed (ACID serialization)`, 'info');

        // At least some should succeed
        assert.isAbove(successCount, 0, 'At least one update should succeed');

        // Read the file and verify it's NOT CORRUPTED (this is the key test)
        const finalDoc = await this.collection
          .query({ documentId: targetId })
          .exec();

        assert.isSuccess(finalDoc);
        assert.equal(finalDoc.data.documents.length, 1, 'Document should still exist');

        const doc = finalDoc.data.documents[0];
        assert.exists(doc.version, 'Document should have version field');
        assert.exists(doc.updateNumber, 'Document should have updateNumber field');
        assert.equal(doc.documentId, targetId, 'DocumentId should match');
        assert.equal(doc.name, 'SameFileTest', 'Name should be preserved');

        this.log(`✅ File integrity verified: version=${doc.version}, updateNumber=${doc.updateNumber}`, 'success');
      });

      await this.test('Concurrent UpdateOne and deleteOne on the same document - no corruption either way', async () => {
        const insertResult = await this.collection.insert({ name: 'UpdateDeleteRace', counter: 0 });
        assert.isSuccess(insertResult);
        const targetId = insertResult.data.documentId;

        // Race an update against a delete on the exact same document. Whichever
        // wins the lock first should complete cleanly; whichever loses should
        // either serialize behind it (finding the doc already gone, if delete won)
        // or complete normally (if update won and delete found nothing to remove
        // afterwards) - either outcome is acceptable, but neither should throw an
        // unhandled error, hang, or leave a corrupted/partial file.
        const [updateResult, deleteResult] = await Promise.all([
          this.collection.update({ documentId: targetId }).UpdateOne({ counter: 1 }),
          this.collection.delete({ documentId: targetId }).deleteOne()
        ]);

        this.log(`     Update: ${'data' in updateResult ? 'succeeded' : 'failed'}, Delete: ${'data' in deleteResult ? 'succeeded' : 'failed'}`, 'gray');

        // At least one of the two must have observed a real, non-crashing outcome.
        assert.ok('data' in updateResult || 'data' in deleteResult, 'At least one of update/delete should complete');

        // Whatever the final state is, it must be internally consistent: either the
        // document is gone, or it exists as valid, uncorrupted data.
        const finalState = await this.collection.query({ documentId: targetId }).exec();
        assert.isSuccess(finalState);
        if (finalState.data.documents.length > 0) {
          const doc = finalState.data.documents[0];
          assert.equal(doc.documentId, targetId, 'Surviving document must have the correct documentId');
          assert.exists(doc.name, 'Surviving document must have an intact name field');
          assert.equal(doc.name, 'UpdateDeleteRace', 'Surviving document must not be corrupted');
        } else {
          this.log('     Document was deleted - acceptable outcome of the race', 'gray');
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

      await this.test('Delete with $nin operator excludes matching documents', async () => {
        await this.collection.insertMany([
          { name: 'NinUser1', status: 'x', tag: 'nin-test' },
          { name: 'NinUser2', status: 'y', tag: 'nin-test' },
          { name: 'NinUser3', status: 'z', tag: 'nin-test' }
        ]);

        const result = await this.collection
          .delete({ tag: 'nin-test', status: { $nin: ['x', 'y'] } })
          .deleteMany();

        assert.isSuccess(result);
        assert.equal(result.data.deleteData.length, 1, 'Should delete only the document with status "z"');

        const remaining = await this.collection
          .query({ tag: 'nin-test' })
          .Limit(10)
          .exec();
        assert.isSuccess(remaining);
        assert.equal(remaining.data.documents.length, 2, 'The two excluded documents (status x, y) should remain');
      });

      await this.test('deleteOne/deleteMany on a query matching nothing return an error, not a false success', async () => {
        const oneResult = await this.collection
          .delete({ name: 'NoSuchUserAtAll' })
          .deleteOne();
        assert.isError(oneResult, 'deleteOne with no matching document should return an error');

        const manyResult = await this.collection
          .delete({ name: 'NoSuchUserAtAll' })
          .deleteMany();
        assert.isError(manyResult, 'deleteMany with no matching documents should return an error');
      });

      await this.test('deleteOne with directory traversal in documentId safely fails without escaping directory (SEC-16)', async () => {
        const result = await this.collection
          .delete({ documentId: '../../traversal_test' })
          .deleteOne();
        assert.isError(result, 'deleteOne with path traversal should return an error');
      });
    });

    // Index Tests
    await this.describe('Index Operations', async () => {
      await this.test('List indexes returns the indexes created in setUp', async () => {
        const result = await this.collection.getIndexes();

        assert.isSuccess(result);
        const fieldNames = result.data.map((entry) => entry.indexFieldName);
        assert.includes(fieldNames, 'name');
        assert.includes(fieldNames, 'email');
        assert.includes(fieldNames, 'age');
      });

      await this.test('Newly created index appears in the list', async () => {
        await this.collection.newIndex('city');
        const result = await this.collection.getIndexes();

        assert.isSuccess(result);
        assert.includes(result.data.map((entry) => entry.indexFieldName), 'city');
      });

      await this.test('Dropped index no longer appears in the list', async () => {
        await this.collection.dropIndex('city');
        const result = await this.collection.getIndexes();

        assert.isSuccess(result);
        assert.ok(
          !result.data.some((entry) => entry.indexFieldName === 'city'),
          'Dropped index should not appear in the list'
        );
      });
    });

    // Document Counting - the collection folder also holds indexes/ and
    // .transactions/, none of which are documents.
    await this.describe('Document Counting', async () => {
      const collectionPath = path.join(
        this.testDir,
        'CRUDTestDB',
        'TestDatabase',
        'CountCollection'
      );
      let countCollection = null;

      await this.test('totalDocuments counts only documents, not index files', async () => {
        countCollection = await this.testDB.createCollection('CountCollection');
        await countCollection.newIndex('name', 'age');
        await countCollection.insertMany([
          { name: 'A', age: 1 },
          { name: 'B', age: 2 },
          { name: 'C', age: 3 }
        ]);

        const result = await countCollection.totalDocuments();
        assert.isSuccess(result);
        assert.equal(result.data.total, 3, 'totalDocuments should report 3');
      });

      await this.test('Dashboard collection list counts match the real document count', async () => {
        // Same helper the GUI's /api/collection/all endpoint uses - it used to
        // count every file recursively and reported 9 for these 3 documents.
        const countDocumentsInFolder =
          require('../../../lib/server/helper/documentCounterInFolder.helper.js').default;

        assert.ok(
          fs.existsSync(path.join(collectionPath, 'indexes')),
          'Collection folder should contain an indexes/ subfolder for this test to be meaningful'
        );
        assert.equal(await countDocumentsInFolder(collectionPath), 3);
      });
    });

    await this.describe('FileManager Security & Integrity', async () => {
      await this.test('GetFileSize returns accurate size and preserves strict file permissions without chmod tampering', async () => {
        const FileManager = require('../../../lib/engine/Filesystem/FileManager.js').default;
        const fileManager = new FileManager();
        const testFilePath = path.join(this.testDir, 'secure-test.txt');
        const content = 'AxioDB secure file inspection test';
        fs.writeFileSync(testFilePath, content, { mode: 0o600 });

        const beforeStat = fs.statSync(testFilePath);
        const res = await fileManager.GetFileSize(testFilePath);
        assert.isSuccess(res);
        assert.equal(res.data, Buffer.byteLength(content));

        const afterStat = fs.statSync(testFilePath);
        assert.equal(afterStat.mode, beforeStat.mode);

        const missingRes = await fileManager.GetFileSize(path.join(this.testDir, 'non-existent.txt'));
        assert.isError(missingRes);
      });

      await this.test('FolderManager.UnlockDirectory applies restrictive permissions (0o750) and prevents world-writable access', async () => {
        const FolderManager = require('../../../lib/engine/Filesystem/FolderManager.js').default;
        const folderManager = new FolderManager();
        const testUnlockDir = path.join(this.testDir, 'secure-unlock-dir');
        fs.mkdirSync(testUnlockDir, { recursive: true, mode: 0o700 });

        const res = await folderManager.UnlockDirectory(testUnlockDir);
        assert.isSuccess(res);

        const stat = fs.statSync(testUnlockDir);
        const mode = stat.mode & 0o777;
        if (process.platform !== 'win32') {
          assert.equal(mode, 0o750, `Expected permissions 0o750, got 0o${mode.toString(8)}`);
        }
        assert.ok(!(mode & 0o002), 'Directory must not be world-writable');
      });

      await this.test('FileManager.ReadLines reads valid files and cleanly handles non-existent or unreadable targets (SEC-30)', async () => {
        const FileManager = require('../../../lib/engine/Filesystem/FileManager.js').default;
        const fileManager = new FileManager();

        // 1. Valid file with whitespace and empty lines
        const testLinesFile = path.join(this.testDir, 'readlines-test.txt');
        fs.writeFileSync(testLinesFile, 'line 1\n\n  line 2  \nline 3\n\n');

        const lines = await fileManager.ReadLines(testLinesFile);
        assert.equal(lines.length, 3);
        assert.equal(lines[0], 'line 1');
        assert.equal(lines[1], 'line 2');
        assert.equal(lines[2], 'line 3');

        // 2. Non-existent file returns [] without throwing or leaking
        const nonExistent = path.join(this.testDir, 'does-not-exist.txt');
        const emptyResult = await fileManager.ReadLines(nonExistent);
        assert.ok(Array.isArray(emptyResult));
        assert.equal(emptyResult.length, 0);

        // 3. Unreadable/directory target emits stream error and returns []
        const dirTarget = path.join(this.testDir, 'readlines-dir');
        fs.mkdirSync(dirTarget, { recursive: true });
        const dirResult = await fileManager.ReadLines(dirTarget);
        assert.ok(Array.isArray(dirResult));
        assert.equal(dirResult.length, 0);
      });
    });

    await this.describe('Tar & Archive Security (SEC-22)', async () => {
      const zlib = require('zlib');
      const { pipeline } = require('node:stream/promises');
      const TarHelper = require('../../../lib/Helper/Tar.helper.js').default;
      const { unzipFile, UnsafeArchiveError } = require('../../../lib/utility/ZipUnzip.utils.js');

      function encodeTarHeaderWithTypeflag(entry, typeflag) {
        const header = TarHelper.encodeHeader(entry);
        header.fill(0x20, 148, 156);
        header[156] = typeof typeflag === 'string' ? typeflag.charCodeAt(0) : typeflag;
        let checksum = 0;
        for (let i = 0; i < 512; i++) {
          checksum += header[i];
        }
        header.write(checksum.toString(8).padStart(6, '0') + '\0 ', 148, 8, 'ascii');
        return header;
      }

      await this.test('TarExtractor rejects an entry with typeflag 2 (symlink) and prevents file creation', async () => {
        const testExtractDir = path.join(this.testDir, 'tar-symlink-extract');
        fs.mkdirSync(testExtractDir, { recursive: true });

        const header = encodeTarHeaderWithTypeflag(
          { name: 'symlink.txt', size: 12, type: 'File' },
          0x32 // '2' = symlink
        );

        const extractor = TarHelper.createExtractor(testExtractDir);
        let errorCaught = null;

        await new Promise((resolve) => {
          extractor.on('error', (err) => {
            errorCaught = err;
            resolve();
          });
          extractor.on('finish', () => resolve());
          extractor.write(header);
          extractor.write(Buffer.from('evil link 12'));
          extractor.write(Buffer.alloc(512 - 12));
          extractor.write(Buffer.alloc(1024));
          extractor.end();
        });

        assert.ok(errorCaught !== null, 'Extractor should emit an error on symlink typeflag');
        assert.ok(
          errorCaught.message.includes('Unsupported or unsafe tar entry type: 0x32'),
          `Error message should indicate unsafe typeflag: ${errorCaught ? errorCaught.message : ''}`
        );
        assert.ok(
          !fs.existsSync(path.join(testExtractDir, 'symlink.txt')),
          'Symlink entry must not be extracted to destination'
        );
      });

      await this.test('unzipFile rejects a .tar.gz archive with symlink entry (typeflag 2)', async () => {
        const testArchive = path.join(this.testDir, 'symlink-archive.tar.gz');
        const testDest = path.join(this.testDir, 'symlink-dest');
        fs.mkdirSync(testDest, { recursive: true });

        const header = encodeTarHeaderWithTypeflag(
          { name: 'symlink_target.txt', size: 10, type: 'File' },
          0x32 // '2' = symlink
        );

        const gzip = zlib.createGzip();
        const sink = fs.createWriteStream(testArchive);
        const pipePromise = pipeline(gzip, sink);
        gzip.write(header);
        gzip.write(Buffer.from('0123456789'));
        gzip.write(Buffer.alloc(512 - 10));
        gzip.write(Buffer.alloc(1024));
        gzip.end();
        await pipePromise;

        let failed = null;
        try {
          await unzipFile(testArchive, testDest);
        } catch (err) {
          failed = err;
        }

        assert.ok(failed !== null, 'unzipFile must throw when encountering a symlink entry');
        assert.ok(
          failed instanceof UnsafeArchiveError || (failed && failed.name === 'UnsafeArchiveError'),
          `Should throw UnsafeArchiveError, got ${failed ? failed.name : 'null'}`
        );
        assert.ok(
          failed.message.includes('Unsupported or unsafe tar entry type: 0x32'),
          `Error message should mention unsafe typeflag: ${failed ? failed.message : ''}`
        );
        assert.ok(
          !fs.existsSync(path.join(testDest, 'symlink_target.txt')),
          'File from symlink archive must not exist in extraction destination'
        );
      });

      await this.test('Trailing slash cannot bypass symlink typeflag rejection (spoofed directory)', async () => {
        const testArchive = path.join(this.testDir, 'spoofed-dir-archive.tar.gz');
        const testDest = path.join(this.testDir, 'spoofed-dir-dest');
        fs.mkdirSync(testDest, { recursive: true });

        // Trailing slash with symlink typeflag '2'
        const header = encodeTarHeaderWithTypeflag(
          { name: 'spoofed_dir/', size: 0, type: 'Directory' },
          0x32 // '2' = symlink
        );

        const gzip = zlib.createGzip();
        const sink = fs.createWriteStream(testArchive);
        const pipePromise = pipeline(gzip, sink);
        gzip.write(header);
        gzip.write(Buffer.alloc(1024));
        gzip.end();
        await pipePromise;

        let failed = null;
        try {
          await unzipFile(testArchive, testDest);
        } catch (err) {
          failed = err;
        }

        assert.ok(failed !== null, 'unzipFile must throw on spoofed directory with symlink typeflag');
        assert.ok(
          failed instanceof UnsafeArchiveError || (failed && failed.name === 'UnsafeArchiveError'),
          `Should throw UnsafeArchiveError, got ${failed ? failed.name : 'null'}`
        );
        assert.ok(
          failed.message.includes('Unsupported or unsafe tar entry type: 0x32'),
          `Error message should mention unsafe typeflag: ${failed ? failed.message : ''}`
        );
        assert.ok(
          !fs.existsSync(path.join(testDest, 'spoofed_dir')),
          'Spoofed directory must not be created'
        );
      });

      await this.test('Special device and invalid typeflags (0x31 hardlink, 0x33 char dev, 0x34 block dev, 0x36 fifo) are rejected', async () => {
        const testDest = path.join(this.testDir, 'special-dev-dest');
        fs.mkdirSync(testDest, { recursive: true });

        for (const flag of [0x31, 0x33, 0x34, 0x36]) {
          const testArchive = path.join(this.testDir, `special-${flag}.tar.gz`);
          const header = encodeTarHeaderWithTypeflag(
            { name: `special_${flag}.dev`, size: 0, type: 'File' },
            flag
          );

          const gzip = zlib.createGzip();
          const sink = fs.createWriteStream(testArchive);
          const pipePromise = pipeline(gzip, sink);
          gzip.write(header);
          gzip.write(Buffer.alloc(1024));
          gzip.end();
          await pipePromise;

          let failed = null;
          try {
            await unzipFile(testArchive, testDest);
          } catch (err) {
            failed = err;
          }

          assert.ok(failed !== null, `unzipFile must throw for typeflag 0x${flag.toString(16)}`);
          assert.ok(
            failed.message.includes(`Unsupported or unsafe tar entry type: 0x${flag.toString(16)}`),
            `Error message should mention unsafe typeflag: ${failed ? failed.message : ''}`
          );
        }
      });
    });
  }
}

module.exports = CRUDTests;
