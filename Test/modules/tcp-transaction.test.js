/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable no-undef */

const net = require('net');
const crypto = require('crypto');
const fs = require('fs');

const TestRunner = require('../helpers/TestRunner');
const { assert } = require('../helpers/assertions');

const { AxioDB } = require('../../lib/config/DB.js');
const { MessageFramer, MessageBuffer } = require('../../lib/tcp/config/protocol');
const { CommandType } = require('../../lib/tcp/types/command.types');

const TCP_HOST = '127.0.0.1';
const TCP_PORT = 27019;

class RawTcpClient {
  constructor() {
    this.socket = null;
    this.buffer = new MessageBuffer();
    this.pending = new Map();
  }

  connect() {
    return new Promise((resolve, reject) => {
      this.socket = net.createConnection(TCP_PORT, TCP_HOST, () => resolve());
      this.socket.once('error', reject);
      this.socket.on('data', (chunk) => {
        const messages = this.buffer.addChunk(chunk);
        for (const message of messages) {
          const pending = this.pending.get(message.id);
          if (pending) {
            this.pending.delete(message.id);
            pending(message);
          }
        }
      });
    });
  }

  send(command, params = {}) {
    return new Promise((resolve) => {
      const id = crypto.randomUUID();
      this.pending.set(id, resolve);
      this.socket.write(MessageFramer.encode({ id, command, params }));
    });
  }

  close() {
    if (this.socket && !this.socket.destroyed) {
      this.socket.destroy();
    }
  }
}

function getDocs(response) {
  return response?.data?.data?.documents ?? [];
}

class TcpTransactionTests extends TestRunner {
  constructor() {
    super('TCP Transaction Test Suite');
    this.testDir = './Test/TestTcpTransaction';
    this.dbInstance = null;
  }

  async setUp() {
    this.log('Setting up test environment...', 'info');

    if (fs.existsSync(this.testDir)) {
      fs.rmSync(this.testDir, { recursive: true, force: true });
    }

    this.dbInstance = new AxioDB({ TCP: true, GUI: false, RootName: 'TcpTxnTestDB', CustomPath: this.testDir });
    await this.waitForServerReady();
    this.log('Test environment ready', 'success');
  }

  async tearDown() {
    this.log('Cleaning up...', 'info');
    if (fs.existsSync(this.testDir)) {
      fs.rmSync(this.testDir, { recursive: true, force: true });
    }
    this.log('Cleanup complete', 'success');
  }

  async waitForServerReady(retries = 50, delayMs = 200) {
    for (let i = 0; i < retries; i++) {
      const client = new RawTcpClient();
      try {
        await client.connect();
        const response = await client.send(CommandType.PING);
        client.close();
        if (response.statusCode === 200) return;
      } catch {
        // server not listening yet
      }
      client.close();
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
    throw new Error('TCP server did not become ready in time');
  }

  async runTests() {
    await this.describe('Transaction BEGIN / COMMIT', async () => {
      await this.test('BEGIN_TRANSACTION returns transactionId', async () => {
        const client = new RawTcpClient();
        await client.connect();
        const res = await client.send(CommandType.BEGIN_TRANSACTION, { dbName: 'TxnDb1', collectionName: 'Col1' });
        assert.equal(res.statusCode, 200);
        assert.ok(res.data, 'Response should have data');
        assert.ok(res.data.transactionId, 'Should return transactionId');
        assert.ok(typeof res.data.transactionId === 'string' && res.data.transactionId.length > 0);
        await client.send(CommandType.COMMIT_TRANSACTION, { transactionId: res.data.transactionId });
        client.close();
      });

      await this.test('COMMIT with no operations returns error', async () => {
        const client = new RawTcpClient();
        await client.connect();
        const begin = await client.send(CommandType.BEGIN_TRANSACTION, { dbName: 'TxnDb2', collectionName: 'Col2' });
        const commit = await client.send(CommandType.COMMIT_TRANSACTION, { transactionId: begin.data.transactionId });
        assert.equal(commit.statusCode >= 400, true);
        client.close();
      });

      await this.test('COMMIT with invalid transactionId returns error', async () => {
        const client = new RawTcpClient();
        await client.connect();
        const commit = await client.send(CommandType.COMMIT_TRANSACTION, { transactionId: 'nonexistent' });
        assert.equal(commit.statusCode >= 400, true);
        client.close();
      });
    });

    await this.describe('Transaction ROLLBACK', async () => {
      await this.test('ROLLBACK discards all buffered operations', async () => {
        const client = new RawTcpClient();
        await client.connect();

        const begin = await client.send(CommandType.BEGIN_TRANSACTION, { dbName: 'TxnRollback1', collectionName: 'Col1' });
        const txnId = begin.data.transactionId;

        await client.send(CommandType.INSERT_DOCUMENT, {
          dbName: 'TxnRollback1',
          collectionName: 'Col1',
          data: { name: 'RollbackMe', value: 1 },
          transactionId: txnId,
        });

        const rollback = await client.send(CommandType.ROLLBACK_TRANSACTION, { transactionId: txnId });
        assert.equal(rollback.statusCode, 200);

        const query = await client.send(CommandType.QUERY_DOCUMENTS, {
          dbName: 'TxnRollback1',
          collectionName: 'Col1',
          query: {},
        });
        assert.equal(query.statusCode, 200);
        assert.equal(getDocs(query).length, 0);

        client.close();
      });

      await this.test('ROLLBACK with invalid transactionId returns error', async () => {
        const client = new RawTcpClient();
        await client.connect();
        const rollback = await client.send(CommandType.ROLLBACK_TRANSACTION, { transactionId: 'fakeid' });
        assert.equal(rollback.statusCode >= 400, true);
        client.close();
      });
    });

    await this.describe('CRUD within Transactions', async () => {
      await this.test('INSERT + COMMIT persists documents', async () => {
        const client = new RawTcpClient();
        await client.connect();

        const begin = await client.send(CommandType.BEGIN_TRANSACTION, { dbName: 'TxnCrud1', collectionName: 'Users' });
        const txnId = begin.data.transactionId;

        await client.send(CommandType.INSERT_DOCUMENT, {
          dbName: 'TxnCrud1', collectionName: 'Users',
          data: { name: 'TxUser1', age: 25 },
          transactionId: txnId,
        });
        await client.send(CommandType.INSERT_DOCUMENT, {
          dbName: 'TxnCrud1', collectionName: 'Users',
          data: { name: 'TxUser2', age: 30 },
          transactionId: txnId,
        });

        const commit = await client.send(CommandType.COMMIT_TRANSACTION, { transactionId: txnId });
        assert.equal(commit.statusCode, 200);

        const query = await client.send(CommandType.QUERY_DOCUMENTS, {
          dbName: 'TxnCrud1', collectionName: 'Users', query: {},
        });
        assert.equal(query.statusCode, 200);
        assert.equal(getDocs(query).length, 2);

        client.close();
      });

      await this.test('INSERT_MANY within transaction', async () => {
        const client = new RawTcpClient();
        await client.connect();

        const begin = await client.send(CommandType.BEGIN_TRANSACTION, { dbName: 'TxnCrud2', collectionName: 'Items' });
        const txnId = begin.data.transactionId;

        await client.send(CommandType.INSERT_MANY_DOCUMENTS, {
          dbName: 'TxnCrud2', collectionName: 'Items',
          documents: [{ name: 'A' }, { name: 'B' }, { name: 'C' }],
          transactionId: txnId,
        });

        const commit = await client.send(CommandType.COMMIT_TRANSACTION, { transactionId: txnId });
        assert.equal(commit.statusCode, 200);

        const query = await client.send(CommandType.QUERY_DOCUMENTS, {
          dbName: 'TxnCrud2', collectionName: 'Items', query: {},
        });
        assert.equal(getDocs(query).length, 3);

        client.close();
      });

      await this.test('UPDATE_BY_ID + COMMIT modifies documents', async () => {
        const client = new RawTcpClient();
        await client.connect();

        const begin1 = await client.send(CommandType.BEGIN_TRANSACTION, { dbName: 'TxnCrud3', collectionName: 'Users' });
        const txnId1 = begin1.data.transactionId;
        await client.send(CommandType.INSERT_DOCUMENT, {
          dbName: 'TxnCrud3', collectionName: 'Users',
          data: { name: 'UpdateMe', age: 20 },
          transactionId: txnId1,
        });
        const commit1 = await client.send(CommandType.COMMIT_TRANSACTION, { transactionId: txnId1 });
        const insertedId = commit1.data.documentIds[0];

        const begin2 = await client.send(CommandType.BEGIN_TRANSACTION, { dbName: 'TxnCrud3', collectionName: 'Users' });
        const txnId2 = begin2.data.transactionId;
        await client.send(CommandType.UPDATE_DOCUMENT_BY_ID, {
          dbName: 'TxnCrud3', collectionName: 'Users',
          id: insertedId, updateData: { age: 21 },
          transactionId: txnId2,
        });
        const commit = await client.send(CommandType.COMMIT_TRANSACTION, { transactionId: txnId2 });
        assert.equal(commit.statusCode, 200);

        const query = await client.send(CommandType.QUERY_BY_ID, {
          dbName: 'TxnCrud3', collectionName: 'Users', id: insertedId,
        });
        assert.equal(query.statusCode, 200);

        client.close();
      });

      await this.test('DELETE_BY_ID + COMMIT removes documents', async () => {
        const client = new RawTcpClient();
        await client.connect();

        const begin1 = await client.send(CommandType.BEGIN_TRANSACTION, { dbName: 'TxnCrud4', collectionName: 'Items' });
        const txnId1 = begin1.data.transactionId;
        await client.send(CommandType.INSERT_DOCUMENT, {
          dbName: 'TxnCrud4', collectionName: 'Items',
          data: { name: 'DeleteMe' },
          transactionId: txnId1,
        });
        const commit1 = await client.send(CommandType.COMMIT_TRANSACTION, { transactionId: txnId1 });
        const insertedId = commit1.data.documentIds[0];

        const begin2 = await client.send(CommandType.BEGIN_TRANSACTION, { dbName: 'TxnCrud4', collectionName: 'Items' });
        const txnId2 = begin2.data.transactionId;
        await client.send(CommandType.DELETE_DOCUMENT_BY_ID, {
          dbName: 'TxnCrud4', collectionName: 'Items',
          id: insertedId,
          transactionId: txnId2,
        });
        const commit = await client.send(CommandType.COMMIT_TRANSACTION, { transactionId: txnId2 });
        assert.equal(commit.statusCode, 200);

        const query = await client.send(CommandType.QUERY_DOCUMENTS, {
          dbName: 'TxnCrud4', collectionName: 'Items', query: {},
        });
        assert.equal(getDocs(query).length, 0);

        client.close();
      });
    });

    await this.describe('Savepoints', async () => {
      await this.test('SAVEPOINT + ROLLBACK_TO_SAVEPOINT reverts partial ops', async () => {
        const client = new RawTcpClient();
        await client.connect();

        const begin = await client.send(CommandType.BEGIN_TRANSACTION, { dbName: 'TxnSp1', collectionName: 'Col' });
        const txnId = begin.data.transactionId;

        await client.send(CommandType.INSERT_DOCUMENT, {
          dbName: 'TxnSp1', collectionName: 'Col',
          data: { name: 'KeepMe' },
          transactionId: txnId,
        });

        const sp = await client.send(CommandType.SAVEPOINT, { transactionId: txnId, savepointName: 'sp1' });
        assert.equal(sp.statusCode, 200);

        await client.send(CommandType.INSERT_DOCUMENT, {
          dbName: 'TxnSp1', collectionName: 'Col',
          data: { name: 'RevertMe' },
          transactionId: txnId,
        });

        const rbSp = await client.send(CommandType.ROLLBACK_TO_SAVEPOINT, { transactionId: txnId, savepointName: 'sp1' });
        assert.equal(rbSp.statusCode, 200);

        await client.send(CommandType.COMMIT_TRANSACTION, { transactionId: txnId });

        const query = await client.send(CommandType.QUERY_DOCUMENTS, {
          dbName: 'TxnSp1', collectionName: 'Col', query: {},
        });
        assert.equal(getDocs(query).length, 1);
        assert.equal(getDocs(query)[0].name, 'KeepMe');

        client.close();
      });

      await this.test('RELEASE_SAVEPOINT removes savepoint', async () => {
        const client = new RawTcpClient();
        await client.connect();

        const begin = await client.send(CommandType.BEGIN_TRANSACTION, { dbName: 'TxnSp2', collectionName: 'Col' });
        const txnId = begin.data.transactionId;

        await client.send(CommandType.SAVEPOINT, { transactionId: txnId, savepointName: 'spA' });
        const release = await client.send(CommandType.RELEASE_SAVEPOINT, { transactionId: txnId, savepointName: 'spA' });
        assert.equal(release.statusCode, 200);

        const rbSp = await client.send(CommandType.ROLLBACK_TO_SAVEPOINT, { transactionId: txnId, savepointName: 'spA' });
        assert.equal(rbSp.statusCode >= 400, true);

        await client.send(CommandType.COMMIT_TRANSACTION, { transactionId: txnId });
        client.close();
      });

      await this.test('Duplicate savepoint name returns error', async () => {
        const client = new RawTcpClient();
        await client.connect();

        const begin = await client.send(CommandType.BEGIN_TRANSACTION, { dbName: 'TxnSp3', collectionName: 'Col' });
        const txnId = begin.data.transactionId;

        await client.send(CommandType.SAVEPOINT, { transactionId: txnId, savepointName: 'dup' });
        const dup = await client.send(CommandType.SAVEPOINT, { transactionId: txnId, savepointName: 'dup' });
        assert.equal(dup.statusCode >= 400, true);

        await client.send(CommandType.COMMIT_TRANSACTION, { transactionId: txnId });
        client.close();
      });
    });

    await this.describe('Validation & Edge Cases', async () => {
      await this.test('BEGIN without dbName returns error', async () => {
        const client = new RawTcpClient();
        await client.connect();
        const res = await client.send(CommandType.BEGIN_TRANSACTION, { collectionName: 'X' });
        assert.equal(res.statusCode >= 400, true);
        client.close();
      });

      await this.test('BEGIN without collectionName returns error', async () => {
        const client = new RawTcpClient();
        await client.connect();
        const res = await client.send(CommandType.BEGIN_TRANSACTION, { dbName: 'X' });
        assert.equal(res.statusCode >= 400, true);
        client.close();
      });

      await this.test('COMMIT without transactionId returns error', async () => {
        const client = new RawTcpClient();
        await client.connect();
        const res = await client.send(CommandType.COMMIT_TRANSACTION, {});
        assert.equal(res.statusCode >= 400, true);
        client.close();
      });

      await this.test('INSERT with transactionId on wrong connection fails', async () => {
        const client1 = new RawTcpClient();
        const client2 = new RawTcpClient();
        await client1.connect();
        await client2.connect();

        const begin = await client1.send(CommandType.BEGIN_TRANSACTION, { dbName: 'TxnCross', collectionName: 'Col' });
        const txnId = begin.data.transactionId;

        const insert = await client2.send(CommandType.INSERT_DOCUMENT, {
          dbName: 'TxnCross', collectionName: 'Col',
          data: { name: 'Bad' },
          transactionId: txnId,
        });
        assert.equal(insert.statusCode >= 400, true);

        await client1.send(CommandType.ROLLBACK_TRANSACTION, { transactionId: txnId });
        client1.close();
        client2.close();
      });

      await this.test('SAVEPOINT without transactionId returns error', async () => {
        const client = new RawTcpClient();
        await client.connect();
        const res = await client.send(CommandType.SAVEPOINT, { savepointName: 'sp' });
        assert.equal(res.statusCode >= 400, true);
        client.close();
      });

      await this.test('SAVEPOINT without savepointName returns error', async () => {
        const client = new RawTcpClient();
        await client.connect();
        const res = await client.send(CommandType.SAVEPOINT, { transactionId: 'x' });
        assert.equal(res.statusCode >= 400, true);
        client.close();
      });
    });

    await this.describe('Transactional Isolation', async () => {
      await this.test('Uncommitted inserts not visible to other connections', async () => {
        const client1 = new RawTcpClient();
        const client2 = new RawTcpClient();
        await client1.connect();
        await client2.connect();

        const begin = await client1.send(CommandType.BEGIN_TRANSACTION, { dbName: 'TxnIso', collectionName: 'Col' });
        const txnId = begin.data.transactionId;

        await client1.send(CommandType.INSERT_DOCUMENT, {
          dbName: 'TxnIso', collectionName: 'Col',
          data: { name: 'Hidden' },
          transactionId: txnId,
        });

        const query = await client2.send(CommandType.QUERY_DOCUMENTS, {
          dbName: 'TxnIso', collectionName: 'Col', query: {},
        });
        assert.equal(query.statusCode, 200);
        assert.equal(getDocs(query).length, 0);

        await client1.send(CommandType.COMMIT_TRANSACTION, { transactionId: txnId });

        const query2 = await client2.send(CommandType.QUERY_DOCUMENTS, {
          dbName: 'TxnIso', collectionName: 'Col', query: {},
        });
        assert.equal(getDocs(query2).length, 1);
        assert.equal(getDocs(query2)[0].name, 'Hidden');

        client1.close();
        client2.close();
      });
    });

    await this.describe('Connection Disconnect Cleanup', async () => {
      await this.test('Disconnect during transaction triggers auto-rollback', async () => {
        const client = new RawTcpClient();
        await client.connect();

        const begin = await client.send(CommandType.BEGIN_TRANSACTION, { dbName: 'TxnDisconnect', collectionName: 'Col' });
        const txnId = begin.data.transactionId;

        await client.send(CommandType.INSERT_DOCUMENT, {
          dbName: 'TxnDisconnect', collectionName: 'Col',
          data: { name: 'ShouldVanish' },
          transactionId: txnId,
        });

        client.close();
        await new Promise((resolve) => setTimeout(resolve, 500));

        const client2 = new RawTcpClient();
        await client2.connect();
        const query = await client2.send(CommandType.QUERY_DOCUMENTS, {
          dbName: 'TxnDisconnect', collectionName: 'Col', query: {},
        });
        assert.equal(query.statusCode, 200);
        assert.equal(getDocs(query).length, 0);

        client2.close();
      });
    });
  }
}

module.exports = TcpTransactionTests;
