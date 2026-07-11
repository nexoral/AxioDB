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
 * A minimal raw TCP client, talking the exact same [length][JSON] protocol as
 * AxioDBCloud, but exposing the full TCPResponse (including statusCode) for
 * precise assertions instead of just resolve/reject like the real client.
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

class TcpAuthTests extends TestRunner {
  constructor() {
    super('TCP (AxioDBCloud) Authentication Test Suite');
    this.testDir = './Test/TestTcpAuth';
    this.dbInstance = null;
  }

  async setUp() {
    this.log('Setting up test environment...', 'info');

    if (fs.existsSync(this.testDir)) {
      fs.rmSync(this.testDir, { recursive: true, force: true });
    }

    // TCP:true + TCPAuth:true triggers config DB seeding (shared with GUI RBAC)
    // and starts the TCP server with the auth/permission gate enabled.
    this.dbInstance = new AxioDB({ TCP: true, TCPAuth: true, RootName: 'TcpAuthTestDB', CustomPath: this.testDir });
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

  /** Opens a fresh authenticated connection for a given user. */
  async authenticatedClient(username, password) {
    const client = new RawTcpClient();
    await client.connect();
    const response = await client.send(CommandType.AUTHENTICATE, { username, password });
    assert.equal(response.statusCode, 200, `Login should succeed for ${username}: ${response.message}`);
    return client;
  }

  async runTests() {
    await this.describe('Unauthenticated access', async () => {
      await this.test('PING works without authentication', async () => {
        const client = new RawTcpClient();
        await client.connect();
        const response = await client.send(CommandType.PING);
        assert.equal(response.statusCode, 200);
        client.close();
      });

      await this.test('CREATE_DB before AUTHENTICATE returns 401', async () => {
        const client = new RawTcpClient();
        await client.connect();
        const response = await client.send(CommandType.CREATE_DB, { dbName: 'ShouldNotBeCreated' });
        assert.equal(response.statusCode, 401);
        client.close();
      });

      await this.test('QUERY_DOCUMENTS before AUTHENTICATE returns 401', async () => {
        const client = new RawTcpClient();
        await client.connect();
        const response = await client.send(CommandType.QUERY_DOCUMENTS, { dbName: 'x', collectionName: 'y' });
        assert.equal(response.statusCode, 401);
        client.close();
      });
    });

    await this.describe('AUTHENTICATE', async () => {
      await this.test('Wrong password is rejected with 401', async () => {
        const client = new RawTcpClient();
        await client.connect();
        const response = await client.send(CommandType.AUTHENTICATE, { username: 'admin', password: 'wrong-password' });
        assert.equal(response.statusCode, 401);
        client.close();
      });

      await this.test('Unknown username is rejected with 401', async () => {
        const client = new RawTcpClient();
        await client.connect();
        const response = await client.send(CommandType.AUTHENTICATE, { username: 'nobody', password: 'whatever' });
        assert.equal(response.statusCode, 401);
        client.close();
      });

      await this.test('Correct default admin/admin credentials are rejected until the password is changed', async () => {
        const client = new RawTcpClient();
        await client.connect();
        const response = await client.send(CommandType.AUTHENTICATE, { username: 'admin', password: 'admin' });
        assert.equal(response.statusCode, 403, 'A mustChangePassword account must not be able to authenticate over TCP');
        assert.equal(response.data.mustChangePassword, true);
        client.close();
      });
    });

    await this.describe('Login rate limiting (per-IP cooldown)', async () => {
      await this.test('IP is locked out after enough failed attempts within the window', async () => {
        const client = new RawTcpClient();
        await client.connect();

        // 8 attempts leaves a safety margin over the 5-attempt threshold regardless
        // of how many failures earlier tests already accumulated for this IP - the
        // last attempt is guaranteed to land after lockout kicks in.
        let lastResponse;
        for (let i = 0; i < 8; i++) {
          lastResponse = await client.send(CommandType.AUTHENTICATE, { username: 'admin', password: `wrong-${i}` });
        }
        assert.equal(lastResponse.statusCode, 429);

        // Even correct credentials are blocked while the cooldown is active.
        const blockedEvenWithGoodCreds = await client.send(CommandType.AUTHENTICATE, { username: 'admin', password: 'admin' });
        assert.equal(blockedEvenWithGoodCreds.statusCode, 429);

        client.close();
      });

      await this.test('Cooldown does not block PING or other unauthenticated-exempt commands', async () => {
        const client = new RawTcpClient();
        await client.connect();
        const response = await client.send(CommandType.PING);
        assert.equal(response.statusCode, 200);
        client.close();
      });
    });

    // Reset the shared rate limiter directly so the lockout triggered above doesn't
    // block the legitimate logins that follow (all these tests share one loopback IP).
    require('../../lib/Services/Auth/LoginRateLimiter.service').default.clearAll();

    let adminClient;
    let viewClient;
    const AuthService = require('../../lib/Services/Auth/AuthService.service').default;
    const authService = new AuthService();

    await this.describe('User bootstrap (stand-in for GUI user management + forced password change)', async () => {
      await this.test('Super Admin can create Admin-role and View-role TCP users via the shared config DB', async () => {
        const adminUser = await authService.createUser('tcpadmin', 'TcpAdminTemp1', 'Admin');
        assert.equal(adminUser.success, true);

        const viewUser = await authService.createUser('tcpview', 'TcpViewTemp1', 'View');
        assert.equal(viewUser.success, true);
      });

      await this.test('New TCP users cannot authenticate until their forced password change completes', async () => {
        const client = new RawTcpClient();
        await client.connect();
        const response = await client.send(CommandType.AUTHENTICATE, { username: 'tcpadmin', password: 'TcpAdminTemp1' });
        assert.equal(response.statusCode, 403);
        client.close();
      });

      await this.test('Completing the forced password change (as the GUI would) unblocks TCP login', async () => {
        // No TCP change-password command exists yet - this stands in for the GUI's
        // PATCH /auth/change-password, which is the only place a password can change today.
        const adminChange = await authService.changeOwnPassword('tcpadmin', 'TcpAdminTemp1', 'TcpAdminPass1');
        assert.equal(adminChange.success, true);

        const viewChange = await authService.changeOwnPassword('tcpview', 'TcpViewTemp1', 'TcpViewPass1');
        assert.equal(viewChange.success, true);

        adminClient = await this.authenticatedClient('tcpadmin', 'TcpAdminPass1');
      });
    });

    await this.describe('Reserved "config" database guard', async () => {
      await this.test('Authenticated Admin cannot query the reserved config database', async () => {
        const response = await adminClient.send(CommandType.QUERY_DOCUMENTS, { dbName: 'config', collectionName: 'users' });
        assert.equal(response.statusCode, 403);
      });
    });

    await this.describe('RBAC - role-based permission enforcement', async () => {
      await this.test('Admin-role user can perform full CRUD', async () => {
        const createDb = await adminClient.send(CommandType.CREATE_DB, { dbName: 'RbacDB' });
        assert.equal(createDb.statusCode, 200);

        const createCollection = await adminClient.send(CommandType.CREATE_COLLECTION, { dbName: 'RbacDB', collectionName: 'People' });
        assert.equal(createCollection.statusCode, 200);

        const insert = await adminClient.send(CommandType.INSERT_DOCUMENT, {
          dbName: 'RbacDB',
          collectionName: 'People',
          data: { name: 'Alice', age: 30 },
        });
        assert.equal(insert.statusCode, 201);

        const query = await adminClient.send(CommandType.QUERY_DOCUMENTS, { dbName: 'RbacDB', collectionName: 'People', query: {} });
        assert.equal(query.statusCode, 200);
        assert.equal(query.data.data.documents.length, 1);
      });

      await this.test('View-role user can list databases but cannot create one', async () => {
        viewClient = await this.authenticatedClient('tcpview', 'TcpViewPass1');

        const dbExists = await viewClient.send(CommandType.DB_EXISTS, { dbName: 'RbacDB' });
        assert.equal(dbExists.statusCode, 200);

        const createDb = await viewClient.send(CommandType.CREATE_DB, { dbName: 'ShouldBeForbidden' });
        assert.equal(createDb.statusCode, 403);
      });

      await this.test('View-role user cannot delete a database', async () => {
        const response = await viewClient.send(CommandType.DELETE_DB, { dbName: 'RbacDB' });
        assert.equal(response.statusCode, 403);
      });
    });

    await this.describe('Index management parity (view/create/delete)', async () => {
      await this.test('Admin can create, list, and drop an index', async () => {
        const create = await adminClient.send(CommandType.CREATE_INDEX, {
          dbName: 'RbacDB',
          collectionName: 'People',
          fieldNames: ['name'],
        });
        assert.equal(create.statusCode, 200);

        const listAfterCreate = await adminClient.send(CommandType.LIST_INDEXES, { dbName: 'RbacDB', collectionName: 'People' });
        assert.equal(listAfterCreate.statusCode, 200);
        assert.ok(listAfterCreate.data.some((entry) => entry.indexFieldName === 'name'), 'Index list should include the new index');

        const drop = await adminClient.send(CommandType.DROP_INDEX, { dbName: 'RbacDB', collectionName: 'People', indexName: 'name' });
        assert.equal(drop.statusCode, 200);

        const listAfterDrop = await adminClient.send(CommandType.LIST_INDEXES, { dbName: 'RbacDB', collectionName: 'People' });
        assert.equal(listAfterDrop.statusCode, 200);
        assert.ok(!listAfterDrop.data.some((entry) => entry.indexFieldName === 'name'), 'Index should be gone after drop');
      });

      await this.test('View-role user can list indexes but cannot create or drop one', async () => {
        const list = await viewClient.send(CommandType.LIST_INDEXES, { dbName: 'RbacDB', collectionName: 'People' });
        assert.equal(list.statusCode, 200);

        const create = await viewClient.send(CommandType.CREATE_INDEX, { dbName: 'RbacDB', collectionName: 'People', fieldNames: ['age'] });
        assert.equal(create.statusCode, 403);

        const drop = await viewClient.send(CommandType.DROP_INDEX, { dbName: 'RbacDB', collectionName: 'People', indexName: 'age' });
        assert.equal(drop.statusCode, 403);
      });
    });

    await this.describe('Session revocation bridge (GUI-side mutation revokes an open TCP connection)', async () => {
      await this.test('Resetting a TCP user password via AuthService immediately invalidates their open TCP connection', async () => {
        const response = await viewClient.send(CommandType.DB_EXISTS, { dbName: 'RbacDB' });
        assert.equal(response.statusCode, 200, 'Sanity check: connection is authenticated before revocation');

        // Simulates a Super Admin resetting this user's password from the GUI while
        // the user still has this TCP connection open.
        const resetResult = await authService.resetUserPassword('tcpview', 'TcpViewReset1');
        assert.equal(resetResult.success, true);

        const afterRevocation = await viewClient.send(CommandType.DB_EXISTS, { dbName: 'RbacDB' });
        assert.equal(afterRevocation.statusCode, 401, 'Connection must be forced to re-authenticate after a password reset');

        viewClient.close();
        adminClient.close();
      });
    });

    await this.describe('AxioDBCloud client - constructor credentials', async () => {
      await this.test('connect() auto-authenticates when credentials are supplied', async () => {
        const { AxioDBCloud } = require('../../lib/config/DB.js');
        const client = new AxioDBCloud(`axiodb://${TCP_HOST}:${TCP_PORT}`, {
          username: 'tcpadmin',
          password: 'TcpAdminPass1',
        });

        await client.connect();
        assert.exists(client.authenticatedUser, 'authenticatedUser should be populated after connect()');
        assert.equal(client.authenticatedUser.username, 'tcpadmin');

        await client.disconnect();
      });

      await this.test('Bad credentials reject connect() without triggering background reconnects', async () => {
        const { AxioDBCloud } = require('../../lib/config/DB.js');
        const client = new AxioDBCloud(`axiodb://${TCP_HOST}:${TCP_PORT}`, {
          username: 'tcpadmin',
          password: 'wrong-password',
        });

        let reconnecting = false;
        client.on('reconnecting', () => {
          reconnecting = true;
        });

        await assert.throws(() => client.connect());

        // Give any errant background reconnect attempt a moment to fire before asserting it didn't.
        await new Promise((resolve) => setTimeout(resolve, 300));
        assert.equal(reconnecting, false, 'Bad credentials must not trigger automatic reconnect attempts');
      });
    });

    await this.describe('AxioDBCloud client - connection pooling (maxPoolSize)', async () => {
      await this.test('connect() opens a default pool of 10 connections', async () => {
        const { AxioDBCloud } = require('../../lib/config/DB.js');
        const client = new AxioDBCloud(`axiodb://${TCP_HOST}:${TCP_PORT}`, {
          username: 'tcpadmin',
          password: 'TcpAdminPass1',
        });

        await client.connect();
        assert.equal(client.pool.length, 10, 'Default maxPoolSize should open 10 connections');
        assert.ok(client.isConnected, 'Client should report connected once the pool is up');

        await client.disconnect();
      });

      await this.test('connect() respects a custom maxPoolSize', async () => {
        const { AxioDBCloud } = require('../../lib/config/DB.js');
        const client = new AxioDBCloud(`axiodb://${TCP_HOST}:${TCP_PORT}`, {
          username: 'tcpadmin',
          password: 'TcpAdminPass1',
          maxPoolSize: 3,
        });

        await client.connect();
        assert.equal(client.pool.length, 3, 'Custom maxPoolSize should be respected');

        await client.disconnect();
      });

      await this.test('commands still succeed when routed across a pooled connection', async () => {
        const { AxioDBCloud } = require('../../lib/config/DB.js');
        const client = new AxioDBCloud(`axiodb://${TCP_HOST}:${TCP_PORT}`, {
          username: 'tcpadmin',
          password: 'TcpAdminPass1',
          maxPoolSize: 4,
        });

        await client.connect();

        // Enough concurrent commands to guarantee more than one pool member handles a request.
        const results = await Promise.all(
          Array.from({ length: 8 }, () => client.getInstanceInfo()),
        );
        for (const result of results) {
          assert.exists(result, 'Each pooled request should resolve with instance info');
        }

        await client.disconnect();
      });

      await this.test('sendCommand() routes to the least-busy connection, not round-robin', async () => {
        const { AxioDBCloud } = require('../../lib/config/DB.js');
        const client = new AxioDBCloud(`axiodb://${TCP_HOST}:${TCP_PORT}`, {
          username: 'tcpadmin',
          password: 'TcpAdminPass1',
          maxPoolSize: 3,
        });

        await client.connect();

        const busyConnection = client.pool[0];
        // sendCommand() registers the pending request synchronously (before any network
        // I/O), so firing several here without awaiting leaves pendingCount reflecting
        // all of them even though none has resolved yet - simulating one pool member
        // stuck on slow work while the others sit idle.
        const busyRequests = [];
        for (let i = 0; i < 5; i += 1) {
          busyRequests.push(busyConnection.sendCommand(CommandType.GET_INSTANCE_INFO, {}));
        }

        assert.equal(busyConnection.pendingCount, 5, 'Directly-issued commands should be pending on pool member 0');

        const picked = client.pickConnection();
        assert.ok(picked !== busyConnection, 'Least-busy routing must avoid the connection with in-flight requests');
        assert.equal(picked.pendingCount, 0, 'Picked connection should be an idle pool member');

        await Promise.all(busyRequests);
        await client.disconnect();
      });
    });

    await this.describe('AxioDBCloud client - error handling regression', async () => {
      await this.test('connect() to an unreachable port rejects cleanly without crashing the process', async () => {
        const { AxioDBCloud } = require('../../lib/config/DB.js');
        // Deliberately does NOT attach client.on('error', ...) - this is exactly the
        // scenario that used to crash the whole process via Node's "throw on unhandled
        // EventEmitter 'error' event" behavior, even with a .catch() on connect().
        const client = new AxioDBCloud(`axiodb://${TCP_HOST}:59999`, { timeout: 2000 });

        await assert.throws(() => client.connect());
        // Reaching this line at all proves the process survived the socket error.
      });
    });
  }
}

module.exports = TcpAuthTests;
