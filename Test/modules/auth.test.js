/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable no-undef */

const TestRunner = require('../helpers/TestRunner');
const { assert } = require('../helpers/assertions');
const fs = require('fs');

const { AxioDB } = require('../../lib/config/DB.js');

const BASE_URL = 'http://localhost:27018/api';

function extractCookie(response) {
  const cookies = typeof response.headers.getSetCookie === 'function'
    ? response.headers.getSetCookie()
    : (response.headers.get('set-cookie') ? [response.headers.get('set-cookie')] : []);
  if (cookies.length === 0) return null;
  return cookies[0].split(';')[0];
}

class AuthTests extends TestRunner {
  constructor() {
    super('Auth & RBAC Test Suite');
    this.testDir = './Test/TestAuth';
    this.dbInstance = null;
    this.adminCookie = null;
  }

  async setUp() {
    this.log('Setting up test environment...', 'info');

    if (fs.existsSync(this.testDir)) {
      fs.rmSync(this.testDir, { recursive: true, force: true });
    }

    // GUI:true triggers config DB seeding + starts the control server on :27018
    this.dbInstance = new AxioDB({ GUI: true, RootName: 'AuthTestDB', CustomPath: this.testDir });
    await this.waitForServerReady();

    this.log('Test environment ready', 'success');
  }

  async waitForServerReady(retries = 50, delayMs = 200) {
    for (let i = 0; i < retries; i++) {
      try {
        const res = await fetch(`${BASE_URL}/health`);
        if (res.ok) return;
      } catch {
        // server not listening yet
      }
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
    throw new Error('Control server did not become ready in time');
  }

  async tearDown() {
    this.log('Cleaning up...', 'info');
    if (fs.existsSync(this.testDir)) {
      fs.rmSync(this.testDir, { recursive: true, force: true });
    }
    this.log('Cleanup complete', 'success');
  }

  /**
   * Logs in and, if the account is flagged mustChangePassword, immediately
   * completes the forced change. Returns the final valid session cookie.
   */
  async loginFlow(username, password, newPassword) {
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const loginBody = await loginRes.json();
    assert.equal(loginRes.status, 200, `Login should succeed for ${username}`);
    let cookie = extractCookie(loginRes);

    if (loginBody.data.mustChangePassword) {
      const changeRes = await fetch(`${BASE_URL}/auth/change-password`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Cookie: cookie },
        body: JSON.stringify({ currentPassword: password, newPassword }),
      });
      assert.equal(changeRes.status, 200, `Password change should succeed for ${username}`);
      cookie = extractCookie(changeRes);
    }

    return cookie;
  }

  async runTests() {
    await this.describe('Seeding', async () => {
      await this.test('Default admin/admin Super Admin account is seeded', async () => {
        const res = await fetch(`${BASE_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: 'admin', password: 'admin' }),
        });
        const body = await res.json();

        assert.equal(res.status, 200);
        assert.equal(body.data.role, 'Super Admin');
        assert.equal(body.data.mustChangePassword, true);

        this.adminCookie = extractCookie(res);
        assert.exists(this.adminCookie, 'Login should set a session cookie');
      });
    });

    await this.describe('Login', async () => {
      await this.test('Wrong password is rejected without setting a cookie', async () => {
        const res = await fetch(`${BASE_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: 'admin', password: 'wrong-password' }),
        });

        assert.equal(res.status, 401);
        assert.ok(!extractCookie(res), 'No cookie should be set on failed login');
      });

      await this.test('Unknown username is rejected', async () => {
        const res = await fetch(`${BASE_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: 'nobody', password: 'whatever' }),
        });
        assert.equal(res.status, 401);
      });
    });

    await this.describe('Login rate limiting (per-IP cooldown)', async () => {
      await this.test('IP is locked out after enough failed attempts, even with correct credentials', async () => {
        let lastRes;
        // 8 attempts leaves a safety margin over the 5-attempt threshold regardless
        // of how many failures the earlier 'Login' tests already accumulated.
        for (let i = 0; i < 8; i++) {
          lastRes = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'admin', password: `wrong-${i}` }),
          });
        }
        assert.equal(lastRes.status, 429);

        const blockedEvenWithGoodCreds = await fetch(`${BASE_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: 'admin', password: 'admin' }),
        });
        assert.equal(blockedEvenWithGoodCreds.status, 429);
      });
    });

    // Reset the shared rate limiter directly so the lockout above doesn't block the
    // legitimate logins the rest of this suite depends on.
    require('../../lib/Services/Auth/LoginRateLimiter.service').default.clearAll();

    await this.describe('Unauthenticated access', async () => {
      await this.test('Protected route without a cookie returns 401', async () => {
        const res = await fetch(`${BASE_URL}/db/databases`);
        assert.equal(res.status, 401);
      });
    });

    await this.describe('Forced password change gate', async () => {
      await this.test('Protected routes are blocked before the password is changed', async () => {
        const res = await fetch(`${BASE_URL}/db/databases`, {
          headers: { Cookie: this.adminCookie },
        });
        assert.equal(res.status, 403);
      });

      await this.test('/auth/me still works while mustChangePassword is true', async () => {
        const res = await fetch(`${BASE_URL}/auth/me`, {
          headers: { Cookie: this.adminCookie },
        });
        assert.equal(res.status, 200);
      });

      await this.test('Change password fails with the wrong current password', async () => {
        const res = await fetch(`${BASE_URL}/auth/change-password`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Cookie: this.adminCookie },
          body: JSON.stringify({ currentPassword: 'wrong', newPassword: 'NewAdminPass1' }),
        });
        assert.equal(res.status, 400);
      });

      await this.test('Change password succeeds and rotates the session', async () => {
        const res = await fetch(`${BASE_URL}/auth/change-password`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Cookie: this.adminCookie },
          body: JSON.stringify({ currentPassword: 'admin', newPassword: 'NewAdminPass1' }),
        });
        const body = await res.json();

        assert.equal(res.status, 200);
        assert.equal(body.data.mustChangePassword, false);

        const oldCookie = this.adminCookie;
        this.adminCookie = extractCookie(res);
        assert.exists(this.adminCookie);
        assert.ok(this.adminCookie !== oldCookie, 'Session cookie should be rotated');

        const oldSessionRes = await fetch(`${BASE_URL}/auth/me`, { headers: { Cookie: oldCookie } });
        assert.equal(oldSessionRes.status, 401, 'Old session should be invalidated');
      });

      await this.test('Protected routes work after the password change', async () => {
        const res = await fetch(`${BASE_URL}/db/databases`, {
          headers: { Cookie: this.adminCookie },
        });
        assert.equal(res.status, 200);
      });
    });

    await this.describe('Reserved "config" database guard', async () => {
      await this.test('Cannot delete config via the generic database route', async () => {
        const res = await fetch(`${BASE_URL}/db/delete-database?dbName=config`, {
          method: 'DELETE',
          headers: { Cookie: this.adminCookie },
        });
        const body = await res.json();
        // This controller predates the auth work and reports logical status via
        // body.statusCode rather than the real HTTP status (matches the GUI's
        // existing convention of reading response.data.statusCode).
        assert.equal(body.statusCode, 403);
      });

      await this.test('config is hidden from the database listing', async () => {
        const res = await fetch(`${BASE_URL}/db/databases`, { headers: { Cookie: this.adminCookie } });
        const body = await res.json();
        assert.ok(!body.data.ListOfDatabases.includes('config'));
      });
    });

    await this.describe('User & role management', async () => {
      await this.test('Super Admin can create an Admin-role user', async () => {
        const res = await fetch(`${BASE_URL}/auth/users`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Cookie: this.adminCookie },
          body: JSON.stringify({ username: 'adminuser', password: 'AdminPass1', role: 'Admin' }),
        });
        assert.equal(res.status, 201);
      });

      await this.test('Super Admin can create a View-role user', async () => {
        const res = await fetch(`${BASE_URL}/auth/users`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Cookie: this.adminCookie },
          body: JSON.stringify({ username: 'viewuser', password: 'ViewPass1', role: 'View' }),
        });
        assert.equal(res.status, 201);
      });

      await this.test('Duplicate username is rejected', async () => {
        const res = await fetch(`${BASE_URL}/auth/users`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Cookie: this.adminCookie },
          body: JSON.stringify({ username: 'adminuser', password: 'Whatever1', role: 'View' }),
        });
        assert.equal(res.status, 409);
      });

      await this.test('Super Admin can create a custom role from the permission catalogue', async () => {
        const res = await fetch(`${BASE_URL}/auth/roles`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Cookie: this.adminCookie },
          body: JSON.stringify({ roleName: 'Auditor', permissions: ['document:view', 'document:query'] }),
        });
        assert.equal(res.status, 201);
      });

      await this.test('Creating a role with an unknown permission key is rejected', async () => {
        const res = await fetch(`${BASE_URL}/auth/roles`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Cookie: this.adminCookie },
          body: JSON.stringify({ roleName: 'Bogus', permissions: ['not-a-real-permission'] }),
        });
        assert.equal(res.status, 400);
      });

      await this.test('Permission catalogue is fully listed', async () => {
        const res = await fetch(`${BASE_URL}/auth/roles/permissions`, { headers: { Cookie: this.adminCookie } });
        const body = await res.json();
        assert.equal(res.status, 200);
        assert.isAbove(body.data.length, 0);
      });
    });

    let adminRoleCookie;
    let viewRoleCookie;

    await this.describe('RBAC - role-based permission enforcement', async () => {
      await this.test('Admin-role user can create a database', async () => {
        adminRoleCookie = await this.loginFlow('adminuser', 'AdminPass1', 'AdminPass1New');

        const res = await fetch(`${BASE_URL}/db/create-database`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Cookie: adminRoleCookie },
          body: JSON.stringify({ name: 'AdminCreatedDB' }),
        });
        const body = await res.json();
        // This controller predates the auth work and reports logical status via
        // body.statusCode rather than the real HTTP status.
        assert.equal(body.statusCode, 201);
      });

      await this.test('Admin-role user cannot manage users', async () => {
        const res = await fetch(`${BASE_URL}/auth/users`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Cookie: adminRoleCookie },
          body: JSON.stringify({ username: 'shouldfail', password: 'Whatever1', role: 'View' }),
        });
        assert.equal(res.status, 403);
      });

      await this.test('View-role user can list databases', async () => {
        viewRoleCookie = await this.loginFlow('viewuser', 'ViewPass1', 'ViewPass1New');

        const res = await fetch(`${BASE_URL}/db/databases`, { headers: { Cookie: viewRoleCookie } });
        assert.equal(res.status, 200);
      });

      await this.test('View-role user cannot create a database', async () => {
        const res = await fetch(`${BASE_URL}/db/create-database`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Cookie: viewRoleCookie },
          body: JSON.stringify({ name: 'ShouldNotBeCreated' }),
        });
        assert.equal(res.status, 403);
      });
    });

    await this.describe('Session revocation on admin-forced password reset', async () => {
      await this.test('Resetting a user password invalidates their existing session', async () => {
        const resetRes = await fetch(`${BASE_URL}/auth/users/adminuser/reset-password`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Cookie: this.adminCookie },
          body: JSON.stringify({ newPassword: 'ResetPass123' }),
        });
        assert.equal(resetRes.status, 200);

        const staleSessionRes = await fetch(`${BASE_URL}/auth/me`, { headers: { Cookie: adminRoleCookie } });
        assert.equal(staleSessionRes.status, 401, 'Old session should be revoked after password reset');
      });
    });

    await this.describe('Database export / import round-trip', async () => {
      await this.test('Exported database re-imports without a 500', async () => {
        // Regression: import staged its upload in a temp dir and cleaned up with
        // fs.rmdir({recursive:true}). `recursive` was removed from rmdir, so on modern Node
        // it throws ERR_INVALID_ARG_VALUE *after* the extraction succeeded - the data landed
        // but the caller saw "Import failed".
        await fetch(`${BASE_URL}/db/create-database`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Cookie: this.adminCookie },
          body: JSON.stringify({ name: 'RoundTripDB' }),
        });

        const exportRes = await fetch(
          `${BASE_URL}/db/export-database/?dbName=RoundTripDB`,
          { headers: { Cookie: this.adminCookie } }
        );
        assert.equal(exportRes.status, 200, 'Export should succeed');

        const archive = Buffer.from(await exportRes.arrayBuffer());
        assert.isAbove(archive.length, 0, 'Exported archive should not be empty');

        await fetch(`${BASE_URL}/db/delete-database?dbName=RoundTripDB`, {
          method: 'DELETE',
          headers: { Cookie: this.adminCookie },
        });

        const form = new FormData();
        form.append('file', new Blob([archive]), 'RoundTripDB.tar.gz');

        const importRes = await fetch(`${BASE_URL}/db/import-database/`, {
          method: 'POST',
          headers: { Cookie: this.adminCookie },
          body: form,
        });

        const body = await importRes.json();
        assert.equal(
          importRes.status,
          200,
          `Import should succeed, got ${importRes.status}: ${JSON.stringify(body)}`
        );

        const listRes = await fetch(`${BASE_URL}/db/databases`, {
          headers: { Cookie: this.adminCookie },
        });
        const list = await listRes.json();
        assert.includes(list.data.ListOfDatabases, 'RoundTripDB', 'Imported database should be listed');
      });

      await this.test('A valid archive that is not an AxioDB export is rejected and leaves no trash', async () => {
        const tar = require('tar');
        const os = require('os');
        const pathMod = require('path');

        // Well-formed .tar.gz, just not one of ours.
        const work = fs.mkdtempSync(pathMod.join(os.tmpdir(), 'axiodb-notours-'));
        const src = pathMod.join(work, 'NotADatabase');
        fs.mkdirSync(src);
        fs.writeFileSync(pathMod.join(src, 'holiday.jpg'), 'not a database');
        const archive = pathMod.join(work, 'NotADatabase.tar.gz');
        await tar.c({ gzip: true, file: archive, cwd: work }, ['NotADatabase']);

        const form = new FormData();
        form.append('file', new Blob([fs.readFileSync(archive)]), 'NotADatabase.tar.gz');

        const res = await fetch(`${BASE_URL}/db/import-database/`, {
          method: 'POST', headers: { Cookie: this.adminCookie }, body: form,
        });
        const body = await res.json();
        assert.equal(res.status, 400, `Expected 400, got ${res.status}: ${JSON.stringify(body)}`);
        assert.includes(body.message, 'AxioDB');

        // Nothing may have been left behind in the live data directory.
        const dataDir = pathMod.join(this.testDir, 'AuthTestDB');
        assert.ok(
          !fs.existsSync(pathMod.join(dataDir, 'NotADatabase')),
          'A rejected archive must not leave a partial database behind'
        );

        fs.rmSync(work, { recursive: true, force: true });
      });

      await this.test('Re-importing an existing database is refused as a conflict', async () => {
        // RoundTripDB was imported by the earlier test and is still present.
        const exportRes = await fetch(
          `${BASE_URL}/db/export-database/?dbName=RoundTripDB`,
          { headers: { Cookie: this.adminCookie } }
        );
        const archive = Buffer.from(await exportRes.arrayBuffer());

        const form = new FormData();
        // Deliberately a different filename - identification must come from the contents.
        form.append('file', new Blob([archive]), 'totally-different-name.tar.gz');

        const res = await fetch(`${BASE_URL}/db/import-database/`, {
          method: 'POST', headers: { Cookie: this.adminCookie }, body: form,
        });
        const body = await res.json();
        assert.equal(res.status, 409, `Expected 409, got ${res.status}: ${JSON.stringify(body)}`);
        assert.includes(body.message, 'RoundTripDB');
      });

      await this.test('Two users importing different databases at once both succeed', async () => {
        const build = async (name) => {
          await fetch(`${BASE_URL}/db/create-database`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Cookie: this.adminCookie },
            body: JSON.stringify({ name }),
          });
          const res = await fetch(`${BASE_URL}/db/export-database/?dbName=${name}`, {
            headers: { Cookie: this.adminCookie },
          });
          const archive = Buffer.from(await res.arrayBuffer());
          await fetch(`${BASE_URL}/db/delete-database?dbName=${name}`, {
            method: 'DELETE', headers: { Cookie: this.adminCookie },
          });
          return archive;
        };

        const [alpha, beta] = await Promise.all([build('ConcurrentA'), build('ConcurrentB')]);

        const send = (archive, filename) => {
          const form = new FormData();
          form.append('file', new Blob([archive]), filename);
          return fetch(`${BASE_URL}/db/import-database/`, {
            method: 'POST', headers: { Cookie: this.adminCookie }, body: form,
          });
        };

        const [resA, resB] = await Promise.all([
          send(alpha, 'ConcurrentA.tar.gz'),
          send(beta, 'ConcurrentB.tar.gz'),
        ]);

        assert.equal(resA.status, 200, 'Different databases must not block each other');
        assert.equal(resB.status, 200, 'Different databases must not block each other');

        const list = await (await fetch(`${BASE_URL}/db/databases`, {
          headers: { Cookie: this.adminCookie },
        })).json();
        assert.includes(list.data.ListOfDatabases, 'ConcurrentA');
        assert.includes(list.data.ListOfDatabases, 'ConcurrentB');
      });

      await this.test('Two users importing the same database at once: one wins, one is told', async () => {
        await fetch(`${BASE_URL}/db/create-database`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Cookie: this.adminCookie },
          body: JSON.stringify({ name: 'RaceDB' }),
        });
        const archive = Buffer.from(await (await fetch(
          `${BASE_URL}/db/export-database/?dbName=RaceDB`,
          { headers: { Cookie: this.adminCookie } }
        )).arrayBuffer());
        await fetch(`${BASE_URL}/db/delete-database?dbName=RaceDB`, {
          method: 'DELETE', headers: { Cookie: this.adminCookie },
        });

        // Same database, two different filenames - the clash must be detected from content.
        const send = (filename) => {
          const form = new FormData();
          form.append('file', new Blob([archive]), filename);
          return fetch(`${BASE_URL}/db/import-database/`, {
            method: 'POST', headers: { Cookie: this.adminCookie }, body: form,
          });
        };

        const results = await Promise.all([send('RaceDB.tar.gz'), send('some-other-name.tar.gz')]);
        const statuses = results.map((r) => r.status).sort();

        assert.equal(statuses[0], 200, `One import should succeed, got ${statuses}`);
        assert.equal(statuses[1], 409, `The other should be refused as a conflict, got ${statuses}`);

        const loser = results.find((r) => r.status === 409);
        const body = await loser.json();
        assert.includes(body.message, 'RaceDB');
      });

      await this.test('Importing a reserved database name is refused', async () => {
        // path.parse('config.tar.gz').name is 'config.tar', not 'config', so the reserved
        // -name guard used to miss the exact filename shape Export produces.
        const form = new FormData();
        form.append('file', new Blob([Buffer.from('not-a-real-archive')]), 'config.tar.gz');

        const res = await fetch(`${BASE_URL}/db/import-database/`, {
          method: 'POST',
          headers: { Cookie: this.adminCookie },
          body: form,
        });
        assert.equal(res.status, 403);
      });

      await this.test('A decompression bomb is aborted mid-stream, not after filling the disk', async () => {
        // The 42.zip shape: a few MB that expands to gigabytes. The guard has to abort while
        // decompressing - checking the size afterwards is too late, the disk is already full.
        const zlib = require('zlib');
        const tar = require('tar');
        const os = require('os');
        const pathMod = require('path');
        const { unzipFile, UnsafeArchiveError } =
          require('../../lib/utility/ZipUnzip.utils.js');

        const work = fs.mkdtempSync(pathMod.join(os.tmpdir(), 'axiodb-bomb-'));
        const bombPath = pathMod.join(work, 'bomb.tar.gz');
        const dest = pathMod.join(work, 'out');
        fs.mkdirSync(dest);

        const TOTAL = 512 * 1024 * 1024; // declared uncompressed size
        const header = new tar.Header({
          path: 'BombDB/huge.bin', size: TOTAL, type: 'File',
          mode: 0o644, mtime: new Date(), uid: 0, gid: 0,
        });
        const block = Buffer.alloc(512);
        header.encode(block, 0);

        const gzip = zlib.createGzip({ level: 9 });
        const sink = fs.createWriteStream(bombPath);
        gzip.pipe(sink);
        gzip.write(block);

        const chunk = Buffer.alloc(1024 * 1024);
        let written = 0;
        await new Promise((resolve, reject) => {
          const pump = () => {
            while (written < TOTAL) {
              written += chunk.length;
              if (!gzip.write(chunk)) return gzip.once('drain', pump);
            }
            gzip.end(Buffer.alloc(1024));
            resolve();
          };
          gzip.on('error', reject);
          pump();
        });
        await new Promise((resolve) => sink.on('close', resolve));

        const archiveSize = fs.statSync(bombPath).size;
        assert.ok(archiveSize < TOTAL / 100, 'Bomb archive should be tiny relative to its payload');

        let blocked = null;
        try {
          await unzipFile(bombPath, dest, { ratioSampleBytes: 4 * 1024 * 1024 });
        } catch (error) {
          blocked = error;
        }

        assert.ok(blocked, 'Bomb must not extract successfully');
        assert.equal(blocked.name, 'UnsafeArchiveError', `Expected UnsafeArchiveError, got ${blocked?.name}`);
        assert.ok(blocked instanceof UnsafeArchiveError);

        const extracted = pathMod.join(dest, 'BombDB', 'huge.bin');
        assert.includes(blocked.message, 'decompression bomb');

        // Must abort partway through, not after the whole payload has landed.
        const spilled = fs.existsSync(extracted) ? fs.statSync(extracted).size : 0;
        assert.ok(spilled < TOTAL / 4, `Aborted late: ${spilled} of ${TOTAL} bytes hit disk`);

        fs.rmSync(work, { recursive: true, force: true });
      });

      await this.test('Archive entries cannot escape the destination directory', async () => {
        const tar = require('tar');
        const os = require('os');
        const pathMod = require('path');
        const { unzipFile } = require('../../lib/utility/ZipUnzip.utils.js');

        const work = fs.mkdtempSync(pathMod.join(os.tmpdir(), 'axiodb-slip-'));
        const dest = pathMod.join(work, 'out');
        const staging = pathMod.join(work, 'src');
        fs.mkdirSync(dest);
        fs.mkdirSync(staging);
        fs.writeFileSync(pathMod.join(staging, 'evil.txt'), 'pwned');

        const archive = pathMod.join(work, 'slip.tar.gz');
        // preservePaths lets us *write* the traversal entry; extraction must still refuse it.
        await tar.c(
          { gzip: true, file: archive, cwd: staging, preservePaths: true },
          ['evil.txt']
        );

        let failed = null;
        try {
          await unzipFile(archive, dest);
        } catch (error) {
          failed = error;
        }

        // Either refused outright, or extracted safely inside dest - never above it.
        const escaped = pathMod.join(work, 'evil.txt');
        assert.ok(!fs.existsSync(escaped), 'Entry must not be written outside the destination');
        if (failed) assert.equal(failed.name, 'UnsafeArchiveError');

        fs.rmSync(work, { recursive: true, force: true });
      });

      await this.test('A corrupt archive returns 400 instead of killing the server', async () => {
        // unzipFile only listened for 'error' on the last stream in the pipe chain, so a
        // non-gzip upload raised an unhandled 'error' on the zlib stream and took the whole
        // process down - a DoS for anyone holding db:import.
        const form = new FormData();
        form.append('file', new Blob([Buffer.from('definitely not gzip')]), 'BrokenDB.tar.gz');

        const res = await fetch(`${BASE_URL}/db/import-database/`, {
          method: 'POST',
          headers: { Cookie: this.adminCookie },
          body: form,
        });
        assert.equal(res.status, 400);

        // The server must still be answering afterwards.
        const health = await fetch(`${BASE_URL}/health`);
        assert.equal(health.status, 200, 'Server should survive a corrupt upload');
      });
    });

    await this.describe('Self-deletion guard', async () => {
      await this.test('A user cannot delete their own account', async () => {
        const res = await fetch(`${BASE_URL}/auth/users/admin`, {
          method: 'DELETE',
          headers: { Cookie: this.adminCookie },
        });
        const body = await res.json();
        assert.equal(res.status, 400);
        assert.includes(body.message, 'cannot delete your own account');
      });

      await this.test('Deleting somebody else is still allowed', async () => {
        await fetch(`${BASE_URL}/auth/users`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Cookie: this.adminCookie },
          body: JSON.stringify({ username: 'disposable', password: 'Disposable1', role: 'View' }),
        });

        const res = await fetch(`${BASE_URL}/auth/users/disposable`, {
          method: 'DELETE',
          headers: { Cookie: this.adminCookie },
        });
        assert.equal(res.status, 200);
      });
    });

    await this.describe('Last remaining Super Admin guard', async () => {
      await this.test('A delegated role cannot delete the only Super Admin', async () => {
        // Reachable only from a non-Super-Admin holder of user:delete - a Super Admin
        // deleting the last Super Admin would be deleting itself, which is refused above.
        await fetch(`${BASE_URL}/auth/roles`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Cookie: this.adminCookie },
          body: JSON.stringify({ roleName: 'UserRemover', permissions: ['user:delete'] }),
        });
        await fetch(`${BASE_URL}/auth/users`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Cookie: this.adminCookie },
          body: JSON.stringify({ username: 'remover', password: 'Remover1', role: 'UserRemover' }),
        });
        const removerCookie = await this.loginFlow('remover', 'Remover1', 'Remover1New');

        const res = await fetch(`${BASE_URL}/auth/users/admin`, {
          method: 'DELETE',
          headers: { Cookie: removerCookie },
        });
        const body = await res.json();
        assert.equal(res.status, 400);
        assert.includes(body.message.toLowerCase(), 'super admin');
      });
    });
  }
}

module.exports = AuthTests;
