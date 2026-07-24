/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable no-undef */

/**
 * Crash Recovery Test Suite
 *
 * Everything else in this repo tests "does the logic look right" - this suite tests
 * "does it survive an actual, uncontrolled process death mid-write". AxioDB is a
 * singleton per process, so both the crashing side and the post-crash verification
 * side run as separate spawned `node` processes (same reason Test/run.js isolates
 * every suite into its own process).
 */

const TestRunner = require('../helpers/TestRunner');
const { assert } = require('../helpers/assertions');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const LIB_DB_PATH = path.resolve(__dirname, '../../lib/config/DB.js');

/**
 * Spawns `node -e <code>` and resolves with its stdout once it exits on its own
 * (used for the "verify after recovery" side - it should run to completion normally).
 */
function runChildToCompletion(code, timeoutMs = 15000) {
  return new Promise((resolve, reject) => {
    const child = spawn('node', ['-e', code], { stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    const timer = setTimeout(() => {
      child.kill('SIGKILL');
      reject(new Error(`Child process timed out after ${timeoutMs}ms. stderr: ${stderr}`));
    }, timeoutMs);

    child.stdout.on('data', (d) => { stdout += d.toString(); });
    child.stderr.on('data', (d) => { stderr += d.toString(); });
    child.on('exit', (code) => {
      clearTimeout(timer);
      if (code !== 0) {
        reject(new Error(`Child exited with code ${code}. stderr: ${stderr}`));
      } else {
        resolve(stdout);
      }
    });
  });
}

/**
 * Spawns `node -e <code>`, lets it run for `aliveMs`, then SIGKILLs it - simulating
 * a power loss / OOM kill with no graceful shutdown, no chance to flush anything
 * that wasn't already fsynced.
 */
function runChildThenKill(code, aliveMs) {
  return new Promise((resolve) => {
    const child = spawn('node', ['-e', code], { stdio: 'ignore' });
    const timer = setTimeout(() => {
      child.kill('SIGKILL');
    }, aliveMs);
    child.on('exit', () => {
      clearTimeout(timer);
      resolve();
    });
  });
}

class CrashRecoveryTests extends TestRunner {
  constructor() {
    super('Crash Recovery Test Suite');
    this.testDir = path.resolve(__dirname, '../TestCrashRecovery');
  }

  async setUp() {
    if (fs.existsSync(this.testDir)) {
      fs.rmSync(this.testDir, { recursive: true, force: true });
    }
    fs.mkdirSync(this.testDir, { recursive: true });
  }

  async tearDown() {
    if (fs.existsSync(this.testDir)) {
      fs.rmSync(this.testDir, { recursive: true, force: true });
    }
  }

  async runTests() {
    await this.describe('Crash Recovery (real SIGKILL mid-write)', async () => {
      await this.test('SIGKILL during rapid inserts leaves no corrupted documents, recovers cleanly', async () => {
        const dbPath = path.join(this.testDir, 'KillInsert');

        const crashCode = `
          const { AxioDB } = require(${JSON.stringify(LIB_DB_PATH)});
          (async () => {
            const db = new AxioDB({ GUI: false, RootName: 'CrashDB', CustomPath: ${JSON.stringify(dbPath)} });
            const database = await db.createDB('TestDB');
            const collection = await database.createCollection('Users');
            let i = 0;
            while (true) {
              await collection.insert({ index: i, payload: 'x'.repeat(200) });
              i++;
            }
          })();
        `;

        // Let it hammer inserts for a short window, then hard-kill - no clean shutdown.
        await runChildThenKill(crashCode, 500);

        // Fresh process, same directory - this is what a real restart does:
        // Collection's constructor fires Transaction.recoverTransactions() on startup.
        const collectionPath = path.join(dbPath, 'CrashDB', 'TestDB', 'Users');

        const verifyCode = `
          const { AxioDB } = require(${JSON.stringify(LIB_DB_PATH)});
          (async () => {
            const db = new AxioDB({ GUI: false, RootName: 'CrashDB', CustomPath: ${JSON.stringify(dbPath)} });
            const database = await db.createDB('TestDB');
            const collection = await database.createCollection('Users');
            // Give the fire-and-forget recovery a moment to finish.
            await new Promise((r) => setTimeout(r, 1000));
            const result = await collection.query({}).Limit(100000).exec();
            console.log(JSON.stringify({ count: result.data.documents.length }));
            process.exit(0);
          })();
        `;
        const stdout = await runChildToCompletion(verifyCode);
        const { count } = JSON.parse(stdout.trim().split('\n').pop());

        assert.ok(count > 0, 'Should have recovered at least some documents');

        // Every persisted document file must be complete, valid JSON - never
        // truncated or half-written, no matter where exactly the kill landed.
        const files = fs.readdirSync(collectionPath).filter((f) => f.endsWith('.axiodb'));
        assert.equal(files.length, count, 'File count on disk should match what the query returned');

        for (const file of files) {
          const content = fs.readFileSync(path.join(collectionPath, file), 'utf-8');
          let parsed;
          try {
            parsed = JSON.parse(content);
          } catch (e) {
            throw new Error(`File ${file} is corrupted (not valid JSON): ${e.message}`);
          }
          assert.exists(parsed.documentId, `File ${file} should have an intact documentId field`);
          assert.exists(parsed.payload, `File ${file} should have an intact payload field`);
          assert.equal(parsed.payload.length, 200, `File ${file}'s payload should not be truncated`);
        }

        // The WAL for whichever transaction was in-flight at kill time must have
        // been either replayed or undone, then cleaned up - it should never survive
        // a completed recovery pass.
        const txnDir = path.join(collectionPath, '.transactions');
        if (fs.existsSync(txnDir)) {
          const walFiles = fs.readdirSync(txnDir).filter((f) => f.endsWith('.wal'));
          assert.equal(walFiles.length, 0, 'No .wal files should survive a completed recovery pass');
        }

        // Informational only (not a hard failure): a temp file written just before
        // the kill, but never renamed into place, is a known minor leak - recovery
        // reconstructs the final document correctly from the WAL either way, but
        // nothing currently sweeps orphaned `.tmp-*` files themselves.
        const tempFiles = fs.existsSync(collectionPath)
          ? fs.readdirSync(collectionPath).filter((f) => f.includes('.tmp-'))
          : [];
        this.log(`     Recovered ${count} documents; ${tempFiles.length} orphaned temp file(s) left behind (known minor leak, not corruption)`, 'gray');
      }, { timeout: 20000 });

      await this.test('SIGKILL during a rapid update loop leaves the document in a valid before-or-after state', async () => {
        const dbPath = path.join(this.testDir, 'KillUpdate');

        const setupCode = `
          const { AxioDB } = require(${JSON.stringify(LIB_DB_PATH)});
          (async () => {
            const db = new AxioDB({ GUI: false, RootName: 'CrashDB', CustomPath: ${JSON.stringify(dbPath)} });
            const database = await db.createDB('TestDB');
            const collection = await database.createCollection('Users');
            await collection.insert({ name: 'Target', counter: 0 });
            console.log('done');
            process.exit(0);
          })();
        `;
        await runChildToCompletion(setupCode);

        const crashCode = `
          const { AxioDB } = require(${JSON.stringify(LIB_DB_PATH)});
          (async () => {
            const db = new AxioDB({ GUI: false, RootName: 'CrashDB', CustomPath: ${JSON.stringify(dbPath)} });
            const database = await db.createDB('TestDB');
            const collection = await database.createCollection('Users');
            let i = 0;
            while (true) {
              i++;
              await collection.update({ name: 'Target' }).UpdateOne({ counter: i });
            }
          })();
        `;
        await runChildThenKill(crashCode, 500);

        const verifyCode = `
          const { AxioDB } = require(${JSON.stringify(LIB_DB_PATH)});
          (async () => {
            const db = new AxioDB({ GUI: false, RootName: 'CrashDB', CustomPath: ${JSON.stringify(dbPath)} });
            const database = await db.createDB('TestDB');
            const collection = await database.createCollection('Users');
            await new Promise((r) => setTimeout(r, 1000));
            const result = await collection.query({ name: 'Target' }).exec();
            console.log(JSON.stringify({ doc: result.data.documents[0] || null }));
            process.exit(0);
          })();
        `;
        const stdout = await runChildToCompletion(verifyCode);
        const { doc } = JSON.parse(stdout.trim().split('\n').pop());

        assert.exists(doc, 'Document should still exist after recovery (update never deletes)');
        assert.equal(doc.name, 'Target', 'Document identity should be intact');
        assert.ok(typeof doc.counter === 'number', 'counter field should be a valid number, not corrupted/missing');

        this.log(`     Document recovered with counter=${doc.counter} (some update in the rapid loop, never a torn value)`, 'gray');
      }, { timeout: 20000 });
    });
  }
}

module.exports = CrashRecoveryTests;
