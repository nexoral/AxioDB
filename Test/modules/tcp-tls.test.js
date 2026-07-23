/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable no-undef */

const fs = require('fs');
const path = require('path');
const net = require('net');
const crypto = require('crypto');
const selfsigned = require('selfsigned');

const TestRunner = require('../helpers/TestRunner');
const { assert } = require('../helpers/assertions');

const { AxioDB, AxioDBCloud } = require('../../lib/config/DB.js');
const { MessageFramer, MessageBuffer } = require('../../lib/tcp/config/protocol');

const TCP_HOST = '127.0.0.1';
const TCP_PORT = 27019;

/**
 * TLS suite: server started with `TLS: true` + a self-signed cert (generated in pure JS via
 * `selfsigned`, not committed anywhere, not requiring OpenSSL or any OS tool - cross-platform
 * by construction). Runs in its own process, separate from tcp-auth/tcp-noauth, since AxioDB
 * is a hard singleton and this scenario needs a differently-configured instance (TLS on).
 */
class TcpTlsTests extends TestRunner {
  constructor() {
    super('TCP (AxioDBCloud) TLS Test Suite');
    this.testDir = './Test/TestTcpTls';
    this.certDir = './Test/TestTcpTls/certs';
    this.dbInstance = null;
    this.certPath = null;
    this.keyPath = null;
  }

  async setUp() {
    this.log('Setting up test environment...', 'info');

    if (fs.existsSync(this.testDir)) {
      fs.rmSync(this.testDir, { recursive: true, force: true });
    }
    fs.mkdirSync(this.certDir, { recursive: true });

    const attrs = [{ name: 'commonName', value: 'localhost' }];
    const pems = await selfsigned.generate(attrs, {
      days: 1,
      keySize: 2048,
      // Client connects via TCP_HOST (127.0.0.1), so the cert needs an IP-type SAN entry
      // for it, not just the DNS name - Node's TLS validation checks IP connections
      // against the cert's IP SANs specifically, a DNS-only SAN doesn't satisfy that.
      extensions: [{
        name: 'subjectAltName',
        altNames: [
          { type: 2, value: 'localhost' },
          { type: 7, ip: '127.0.0.1' },
        ],
      }],
    });

    this.certPath = path.join(this.certDir, 'server.crt');
    this.keyPath = path.join(this.certDir, 'server.key');
    fs.writeFileSync(this.certPath, pems.cert);
    fs.writeFileSync(this.keyPath, pems.private);

    this.dbInstance = new AxioDB({
      TCP: true,
      TLS: true,
      TLSCertPath: this.certPath,
      TLSKeyPath: this.keyPath,
      RootName: 'TcpTlsTestDB',
      CustomPath: this.testDir,
    });

    await this.waitForServerReady();

    this.log('Test environment ready', 'success');
  }

  async waitForServerReady(retries = 50, delayMs = 200) {
    for (let i = 0; i < retries; i += 1) {
      const client = new AxioDBCloud(`axiodb://${TCP_HOST}:${TCP_PORT}`, {
        timeout: 2000,
        maxPoolSize: 1,
        tls: true,
        tlsCAPath: this.certPath,
      });
      client.on('error', () => {});
      try {
        await client.connect();
        await client.disconnect();
        return;
      } catch {
        // server not listening yet
      }
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
    throw new Error('TCP (TLS) server did not become ready in time');
  }

  async tearDown() {
    this.log('Cleaning up...', 'info');
    if (fs.existsSync(this.testDir)) {
      fs.rmSync(this.testDir, { recursive: true, force: true });
    }
    this.log('Cleanup complete', 'success');
  }

  async runTests() {
    await this.describe('TLS-encrypted TCP connection', async () => {
      await this.test('a client with the matching CA connects and can perform CRUD over TLS', async () => {
        const client = new AxioDBCloud(`axiodb://${TCP_HOST}:${TCP_PORT}`, {
          tls: true,
          tlsCAPath: this.certPath,
        });
        await client.connect();

        const db = await client.createDB('TlsDB');
        const users = await db.createCollection('Users');
        await users.insert({ name: 'Alice' });
        const results = await users.query({}).exec();
        assert.equal(results.data.documents.length, 1);

        await client.disconnect();
      });

      await this.test('a client with no trusted CA fails to connect (rejectUnauthorized defaults to true)', async () => {
        const client = new AxioDBCloud(`axiodb://${TCP_HOST}:${TCP_PORT}`, {
          tls: true,
          timeout: 2000,
          // Deliberately no tlsCAPath - the self-signed cert isn't in any trusted CA store,
          // so the default rejectUnauthorized: true must reject it.
        });
        client.on('error', () => {});

        let threw = false;
        try {
          await client.connect();
        } catch {
          threw = true;
        }
        assert.ok(threw, 'Connecting without a trusted CA should fail against a self-signed certificate');
        await client.disconnect();
      });

      await this.test('a plaintext client can never complete a valid protocol exchange with a TLS-only server', async () => {
        // Regression guard: if the TLS branch were ever accidentally skipped server-side,
        // this would start succeeding (a plain PING would get a valid PONG back).
        const socket = net.createConnection(TCP_PORT, TCP_HOST);
        const buffer = new MessageBuffer();
        let gotValidResponse = false;

        const outcome = await new Promise((resolve) => {
          socket.once('connect', () => {
            const id = crypto.randomUUID();
            socket.write(MessageFramer.encode({ id, command: 'PING', params: {} }));
          });
          socket.on('data', (chunk) => {
            try {
              const messages = buffer.addChunk(chunk);
              if (messages.length > 0) {
                gotValidResponse = true;
                resolve('got-response');
              }
            } catch {
              // TLS handshake bytes don't parse as our plaintext framed protocol - expected.
              resolve('protocol-error');
            }
          });
          socket.once('error', () => resolve('socket-error'));
          socket.once('close', () => resolve('closed'));
          socket.setTimeout(2000, () => resolve('timeout'));
        });

        socket.destroy();
        assert.ok(!gotValidResponse, 'A plaintext PING must never get a valid PONG from a TLS-only server');
        assert.ok(outcome !== 'got-response', `Expected no valid protocol response, got outcome: ${outcome}`);
      });
    });
  }
}

module.exports = TcpTlsTests;
