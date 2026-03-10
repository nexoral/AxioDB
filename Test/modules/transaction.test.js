/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable no-undef */

const TestRunner = require('../helpers/TestRunner');
const { assert } = require('../helpers/assertions');
const fixtures = require('../helpers/fixtures');
const fs = require('fs');

const { AxioDB } = require('../../lib/config/DB.js');

class TransactionTests extends TestRunner {
  constructor() {
    super('Transaction Test Suite');
    this.testDir = './Test/TestTransaction';
    this.dbInstance = null;
    this.testDB = null;
    this.collection = null;
  }

  async setUp() {
    this.log('Setting up test environment...', 'info');

    if (fs.existsSync(this.testDir)) {
      fs.rmSync(this.testDir, { recursive: true, force: true });
    }

    this.dbInstance = new AxioDB(false, 'TransactionTestDB', this.testDir);
    this.testDB = await this.dbInstance.createDB('TestDB');
    this.collection = await this.testDB.createCollection('Users', false);
    await this.collection.newIndex('email', 'age', 'name');

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
    // Basic Transaction Tests
    await this.describe('Basic Transaction Operations', async () => {
      await this.test('Transaction - Insert operations', async () => {
        const txn = this.collection.beginTransaction();
        await txn
          .insert({ name: 'TxAlice', email: 'txalice@test.com', age: 25 })
          .insert({ name: 'TxBob', email: 'txbob@test.com', age: 30 })
          .commit();

        const users = await this.collection.query({}).exec();
        assert.isSuccess(users);
        assert.equal(users.data.documents.length, 2);
      });

      await this.test('Transaction - Update operations', async () => {
        const txn = this.collection.beginTransaction();
        await txn
          .update({ name: 'TxAlice' }, { age: 26 })
          .commit();

        const user = await this.collection.query({ name: 'TxAlice' }).exec();
        assert.isSuccess(user);
        assert.equal(user.data.documents[0].age, 26);
      });

      await this.test('Transaction - Delete operations', async () => {
        // Add a user to delete
        await this.collection.insert({ name: 'TxDelete', email: 'delete@test.com', age: 40 });

        const beforeCount = await this.collection.totalDocuments();
        const txn = this.collection.beginTransaction();
        await txn.delete({ name: 'TxDelete' }).commit();

        const afterCount = await this.collection.totalDocuments();
        assert.isBelow(afterCount.data.total, beforeCount.data.total);
      });

      await this.test('Transaction - Mixed operations', async () => {
        await this.collection.insert({ name: 'TxMixed', email: 'mixed@test.com', age: 35 });

        const txn = this.collection.beginTransaction();
        await txn
          .insert({ name: 'TxNew', email: 'new@test.com', age: 22 })
          .update({ name: 'TxMixed' }, { status: 'active' })
          .commit();

        const mixed = await this.collection.query({ name: 'TxMixed' }).exec();
        const newUser = await this.collection.query({ name: 'TxNew' }).exec();

        assert.equal(mixed.data.documents[0].status, 'active');
        assert.equal(newUser.data.documents.length, 1);
      });
    });

    // Rollback Tests
    await this.describe('Transaction Rollback', async () => {
      await this.test('Rollback prevents insert', async () => {
        const beforeCount = await this.collection.totalDocuments();

        const txn = this.collection.beginTransaction();
        txn.insert({ name: 'RollbackUser', email: 'rollback@test.com', age: 50 });
        await txn.rollback();

        const afterCount = await this.collection.totalDocuments();
        assert.equal(afterCount.data.total, beforeCount.data.total);
      });

      await this.test('Empty transaction throws error', async () => {
        const txn = this.collection.beginTransaction();
        const result = await txn.commit();
        // Empty transaction returns error response rather than throwing
        assert.isError(result);
        assert.ok(result.message && result.message.includes('No operations'), 'Should mention no operations');
      });
    });

    // Savepoint Tests
    await this.describe('Savepoint Operations', async () => {
      await this.test('Create and rollback to savepoint', async () => {
        const txn = this.collection.beginTransaction();

        txn.insert({ name: 'SP_User1', email: 'sp1@test.com', age: 20 });
        txn.savepoint('sp1');
        txn.insert({ name: 'SP_User2', email: 'sp2@test.com', age: 21 });
        txn.rollbackTo('sp1');

        await txn.commit();

        const user1 = await this.collection.query({ name: 'SP_User1' }).exec();
        const user2 = await this.collection.query({ name: 'SP_User2' }).exec();

        assert.equal(user1.data.documents.length, 1, 'SP_User1 should exist');
        assert.equal(user2.data.documents.length, 0, 'SP_User2 should not exist (rolled back)');
      });

      await this.test('Multiple savepoints', async () => {
        const txn = this.collection.beginTransaction();

        txn.insert({ name: 'Multi_SP1', email: 'multi1@test.com', age: 30 });
        txn.savepoint('first');
        txn.insert({ name: 'Multi_SP2', email: 'multi2@test.com', age: 31 });
        txn.savepoint('second');
        txn.insert({ name: 'Multi_SP3', email: 'multi3@test.com', age: 32 });

        // Rollback to first savepoint (should remove SP2 and SP3)
        txn.rollbackTo('first');
        await txn.commit();

        const sp1 = await this.collection.query({ name: 'Multi_SP1' }).exec();
        const sp2 = await this.collection.query({ name: 'Multi_SP2' }).exec();
        const sp3 = await this.collection.query({ name: 'Multi_SP3' }).exec();

        assert.equal(sp1.data.documents.length, 1);
        assert.equal(sp2.data.documents.length, 0);
        assert.equal(sp3.data.documents.length, 0);
      });

      await this.test('Release savepoint', async () => {
        const txn = this.collection.beginTransaction();

        txn.insert({ name: 'Release_SP', email: 'release@test.com', age: 40 });
        txn.savepoint('toRelease');
        txn.releaseSavepoint('toRelease');

        // Trying to rollback to released savepoint should fail
        try {
          txn.rollbackTo('toRelease');
          throw new Error('Should have thrown error');
        } catch (error) {
          assert.ok(error.message.includes('not found'));
        }
      });

      await this.test('Duplicate savepoint name throws error', async () => {
        const txn = this.collection.beginTransaction();

        txn.savepoint('duplicate');
        try {
          txn.savepoint('duplicate');
          throw new Error('Should have thrown error for duplicate savepoint');
        } catch (error) {
          assert.ok(error.message.includes('already exists'));
        }
      });
    });

    // Session Tests
    await this.describe('Session-based Transactions', async () => {
      await this.test('startSession creates session', async () => {
        const session = this.collection.startSession();
        assert.exists(session);
        assert.exists(session.getSessionId());
        await session.endSession();
      });

      await this.test('withTransaction - auto commit on success', async () => {
        const session = this.collection.startSession();

        const result = await session.withTransaction(async (txn) => {
          txn.insert({ name: 'SessionUser', email: 'session@test.com', age: 28 });
        });

        assert.isSuccess(result);

        const user = await this.collection.query({ name: 'SessionUser' }).exec();
        assert.equal(user.data.documents.length, 1);

        await session.endSession();
      });

      await this.test('withTransaction - auto rollback on error', async () => {
        const session = this.collection.startSession({ maxRetries: 1 });
        const beforeCount = await this.collection.totalDocuments();

        const result = await session.withTransaction(async (txn) => {
          txn.insert({ name: 'FailUser', email: 'fail@test.com', age: 30 });
          throw new Error('Intentional failure');
        });

        assert.isError(result);

        const afterCount = await this.collection.totalDocuments();
        assert.equal(afterCount.data.total, beforeCount.data.total, 'Should rollback on error');

        await session.endSession();
      });

      await this.test('Session options - custom timeout', async () => {
        const session = this.collection.startSession({
          defaultTimeout: 5000,
          maxRetries: 2
        });

        assert.ok(session.isSessionActive());
        await session.endSession();
        assert.ok(!session.isSessionActive());
      });
    });

    // Index Consistency Tests
    await this.describe('Transaction Index Consistency', async () => {
      await this.test('Index updated after transaction commit', async () => {
        const txn = this.collection.beginTransaction();
        await txn
          .insert({ name: 'IndexTest', email: 'indextest@test.com', age: 45 })
          .commit();

        // Query using indexed field
        const byEmail = await this.collection.query({ email: 'indextest@test.com' }).exec();
        const byName = await this.collection.query({ name: 'IndexTest' }).exec();

        assert.equal(byEmail.data.documents.length, 1);
        assert.equal(byName.data.documents.length, 1);
      });
    });
  }
}

module.exports = TransactionTests;
