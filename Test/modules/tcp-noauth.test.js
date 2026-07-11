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

    await this.describe('Per-IP connection limit (MAX_CONNECTIONS_PER_IP)', async () => {
      await this.test('a single IP is rejected once it exceeds MAX_CONNECTIONS_PER_IP concurrent sockets', async () => {
        const { MAX_CONNECTIONS_PER_IP } = require('../../lib/tcp/config/keys');

        // All connect from 127.0.0.1 (this test process), so this alone should be
        // enough to hit the per-IP cap without needing MAX_CONNECTIONS (global, 1000).
        const sockets = [];
        try {
          for (let i = 0; i < MAX_CONNECTIONS_PER_IP; i += 1) {
            const socket = net.createConnection(TCP_PORT, TCP_HOST);
            sockets.push(socket);
          }
          await Promise.all(
            sockets.map(
              (socket) => new Promise((resolve, reject) => {
                socket.once('connect', resolve);
                socket.once('error', reject);
              }),
            ),
          );

          // One more than the cap - server should accept the TCP handshake (can't refuse
          // at that layer) but immediately send a rejection and close it.
          const rejected = await new Promise((resolve, reject) => {
            const socket = net.createConnection(TCP_PORT, TCP_HOST);
            const buffer = new MessageBuffer();
            socket.once('error', reject);
            socket.on('data', (chunk) => {
              const messages = buffer.addChunk(chunk);
              if (messages.length > 0) resolve(messages[0]);
            });
          });

          assert.equal(rejected.statusCode, 429, 'The (N+1)th connection from one IP should be rejected with 429');
          assert.equal(rejected.error, 'Too many concurrent connections from this IP address');
        } finally {
          for (const socket of sockets) {
            if (!socket.destroyed) socket.destroy();
          }
        }
      });
    });

    await this.describe('Connection-attempt rate limiting (CONNECTION_RATE_LIMIT_MAX_ATTEMPTS)', async () => {
      await this.test('a burst of connection attempts from one IP triggers a temporary rate-limit lockout, independent of MAX_CONNECTIONS_PER_IP', async () => {
        const { CONNECTION_RATE_LIMIT_MAX_ATTEMPTS } = require('../../lib/tcp/config/keys');
        // Same singleton instance the running TCP server uses (test process hosts both) -
        // clearAll() at the end so this lockout doesn't leak into later tests/files sharing 127.0.0.1.
        const ConnectionRateLimiter = require('../../lib/tcp/connection/ConnectionRateLimiter').default;

        try {
          // Every attempt counts towards the limiter regardless of outcome (accepted or
          // rejected by MAX_CONNECTIONS_PER_IP), so connect-then-immediately-destroy is
          // enough to rack up attempts without needing to hold sockets open.
          const attempts = Array.from({ length: CONNECTION_RATE_LIMIT_MAX_ATTEMPTS }, () => new Promise((resolve) => {
            const socket = net.createConnection(TCP_PORT, TCP_HOST);
            const finish = () => {
              if (!socket.destroyed) socket.destroy();
              resolve();
            };
            socket.once('connect', finish);
            socket.once('error', finish);
          }));
          await Promise.all(attempts);

          // The next attempt should be rejected purely on attempt-rate grounds, even
          // though there are no lingering concurrent connections from this IP right now.
          const rejected = await new Promise((resolve, reject) => {
            const socket = net.createConnection(TCP_PORT, TCP_HOST);
            const buffer = new MessageBuffer();
            socket.once('error', reject);
            socket.on('data', (chunk) => {
              const messages = buffer.addChunk(chunk);
              if (messages.length > 0) resolve(messages[0]);
            });
          });

          assert.equal(rejected.statusCode, 429, 'A connection attempt during the rate-limit cooldown should be rejected with 429');
          assert.equal(rejected.error, 'Too many connection attempts from this IP address. Try again later.');
        } finally {
          ConnectionRateLimiter.clearAll();
        }
      });
    });
  }
}

module.exports = TcpNoAuthTests;
