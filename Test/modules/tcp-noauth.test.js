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

/**
 * Regression suite: `TCP: true` with `TCPAuth` omitted (defaults to false) must behave
 * exactly like AxioDBCloud did before authentication support was added - no login
 * required, every command works immediately after connect. Runs in its own process
 * (separate from tcp-auth.test.js) since AxioDB is a hard singleton and this
 * scenario needs a differently-configured instance (TCPAuth: false vs true).
 */
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

class TcpNoAuthTests extends TestRunner {
  constructor() {
    super('TCP (AxioDBCloud) Backward-Compatibility Test Suite');
    this.testDir = './Test/TestTcpNoAuth';
    this.dbInstance = null;
  }

  async setUp() {
    this.log('Setting up test environment...', 'info');

    if (fs.existsSync(this.testDir)) {
      fs.rmSync(this.testDir, { recursive: true, force: true });
    }

    // TCPAuth intentionally omitted - defaults to false, matching pre-auth behavior.
    this.dbInstance = new AxioDB({ TCP: true, RootName: 'TcpNoAuthTestDB', CustomPath: this.testDir });
    await this.waitForServerReady();

    this.log('Test environment ready', 'success');
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

  async tearDown() {
    this.log('Cleaning up...', 'info');
    if (fs.existsSync(this.testDir)) {
      fs.rmSync(this.testDir, { recursive: true, force: true });
    }
    this.log('Cleanup complete', 'success');
  }

  async runTests() {
    await this.describe('Zero-auth backward compatibility', async () => {
      await this.test('CREATE_DB works without any AUTHENTICATE call', async () => {
        const client = new RawTcpClient();
        await client.connect();

        const response = await client.send(CommandType.CREATE_DB, { dbName: 'NoAuthDB' });
        assert.equal(response.statusCode, 200);

        client.close();
      });

      await this.test('Full CRUD works without authentication', async () => {
        const client = new RawTcpClient();
        await client.connect();

        const createCollection = await client.send(CommandType.CREATE_COLLECTION, {
          dbName: 'NoAuthDB',
          collectionName: 'Items',
        });
        assert.equal(createCollection.statusCode, 200);

        const insert = await client.send(CommandType.INSERT_DOCUMENT, {
          dbName: 'NoAuthDB',
          collectionName: 'Items',
          data: { name: 'Widget' },
        });
        assert.equal(insert.statusCode, 201);

        const query = await client.send(CommandType.QUERY_DOCUMENTS, {
          dbName: 'NoAuthDB',
          collectionName: 'Items',
          query: {},
        });
        assert.equal(query.statusCode, 200);
        assert.equal(query.data.data.documents.length, 1);

        client.close();
      });

      await this.test('The reserved config database is still protected even with TCPAuth off', async () => {
        const client = new RawTcpClient();
        await client.connect();

        const response = await client.send(CommandType.QUERY_DOCUMENTS, { dbName: 'config', collectionName: 'users' });
        assert.equal(response.statusCode, 403);

        client.close();
      });
    });
  }
}

module.exports = TcpNoAuthTests;
