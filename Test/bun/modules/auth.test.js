/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable no-undef */

const TestRunner = require('../helpers/TestRunner');
const { assert } = require('../helpers/assertions');
const fs = require('fs');

const { AxioDB, CoreDBMS } = require('../../../axiodb.js');

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

    // HTTP:true triggers config DB seeding + starts the control server on :27018
    this.dbInstance = new AxioDB({ HTTP: true, RootName: 'AuthTestDB', CustomPath: this.testDir });
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

      await this.test('Lockout on one account does not cause denial of service on other accounts (SEC-07)', async () => {
        // 'admin' is locked out from the test above.
        // A login attempt for a different user ('otheruser') should NOT return 429
        const otherRes = await fetch(`${BASE_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: 'otheruser', password: 'somepassword' }),
        });
        assert.equal(otherRes.status, 401);
      });

      await this.test('X-Forwarded-For header identifies distinct client IP behind reverse proxy (SEC-07)', async () => {
        // Attempting login with X-Forwarded-For from a distinct IP should not be blocked by 127.0.0.1 lockout
        const proxyRes = await fetch(`${BASE_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': '203.0.113.195' },
          body: JSON.stringify({ username: 'admin', password: 'wrongpassword' }),
        });
        assert.equal(proxyRes.status, 401);
      });
    });

    // Reset the shared rate limiter directly so the lockout above doesn't block the
    // legitimate logins the rest of this suite depends on.
    CoreDBMS.LoginRateLimiter.clearAll();

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
        assert.ok(!fs.existsSync('./RoundTripDB.tar.gz'), 'Export should NOT leave files in project root (SEC-15)');

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

      await this.test('Aborted export download cleans up temporary files without disk leak (SEC-15)', async () => {
        const http = require('http');
        const parsedUrl = new URL(`${BASE_URL}/db/export-database/?dbName=RoundTripDB`);

        await fetch(`${BASE_URL}/db/create-database`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Cookie: this.adminCookie },
          body: JSON.stringify({ name: 'AbortExportDB' }),
        });

        await new Promise((resolve) => {
          const req = http.request({
            hostname: parsedUrl.hostname,
            port: parsedUrl.port,
            path: `${parsedUrl.pathname}?dbName=AbortExportDB`,
            method: 'GET',
            headers: { Cookie: this.adminCookie },
          }, (res) => {
            res.once('data', () => {
              req.destroy();
              resolve();
            });
          });
          req.end();
        });

        await new Promise((r) => setTimeout(r, 50));
        assert.ok(!fs.existsSync('./AbortExportDB.tar.gz'), 'Aborted export should not pollute project root');

        await fetch(`${BASE_URL}/db/delete-database?dbName=AbortExportDB`, {
          method: 'DELETE',
          headers: { Cookie: this.adminCookie },
        });
      });

      await this.test('A valid archive that is not an AxioDB export is rejected and leaves no trash', async () => {
        const os = require('os');
        const pathMod = require('path');
        const { tarGzFolder } = require('../../../lib/utility/ZipUnzip.utils.js');

        // Well-formed .tar.gz, just not one of ours.
        const work = fs.mkdtempSync(pathMod.join(os.tmpdir(), 'axiodb-notours-'));
        const src = pathMod.join(work, 'NotADatabase');
        fs.mkdirSync(src);
        fs.writeFileSync(pathMod.join(src, 'holiday.jpg'), 'not a database');
        const archive = pathMod.join(work, 'NotADatabase.tar.gz');
        await tarGzFolder(src, archive);

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
        const os = require('os');
        const pathMod = require('path');
        const TarHelper = require('../../../lib/Helper/Tar.helper.js').default;
        const { unzipFile, UnsafeArchiveError } =
          require('../../../lib/utility/ZipUnzip.utils.js');

        const work = fs.mkdtempSync(pathMod.join(os.tmpdir(), 'axiodb-bomb-'));
        const bombPath = pathMod.join(work, 'bomb.tar.gz');
        const dest = pathMod.join(work, 'out');
        fs.mkdirSync(dest);

        const TOTAL = 512 * 1024 * 1024; // declared uncompressed size
        const block = TarHelper.encodeHeader({
          name: 'BombDB/huge.bin',
          size: TOTAL,
          type: 'File',
        });

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
        const zlib = require('zlib');
        const os = require('os');
        const pathMod = require('path');
        const TarHelper = require('../../../lib/Helper/Tar.helper.js').default;
        const { unzipFile } = require('../../../lib/utility/ZipUnzip.utils.js');

        const work = fs.mkdtempSync(pathMod.join(os.tmpdir(), 'axiodb-slip-'));
        const dest = pathMod.join(work, 'out');
        fs.mkdirSync(dest);

        const archive = pathMod.join(work, 'slip.tar.gz');
        const header = TarHelper.encodeHeader({
          name: '../evil.txt',
          size: 5,
          type: 'File',
        });

        const gzip = zlib.createGzip();
        const sink = fs.createWriteStream(archive);
        gzip.pipe(sink);
        gzip.write(header);
        gzip.write(Buffer.from('pwned'));
        gzip.write(Buffer.alloc(512 - 5));
        gzip.end(Buffer.alloc(1024));
        await new Promise((resolve) => sink.on('close', resolve));

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

      await this.test('Multipart headers exceeding size limit reject immediately to prevent OOM (SEC-09)', async () => {
        const boundary = '----AxioTestBoundary' + Date.now();
        const hugeHeader = 'X-Header: ' + 'A'.repeat(70 * 1024);
        const payload = `--${boundary}\r\n${hugeHeader}`;

        const res = await fetch(`${BASE_URL}/db/import-database/`, {
          method: 'POST',
          headers: {
            'Content-Type': `multipart/form-data; boundary=${boundary}`,
            Cookie: this.adminCookie,
          },
          body: payload,
        });
        assert.ok(res.status >= 400, 'Expected error response for oversize multipart header');

        const health = await fetch(`${BASE_URL}/health`);
        assert.equal(health.status, 200, 'Server should survive oversize header attempt');
      });

      await this.test('MultipartHelper.parseFile rejects streams with headers > 64KB (SEC-09)', async () => {
        const { Readable } = require('stream');
        const MultipartHelper = require('../../../lib/Helper/http/Multipart.helper.js').default;
        const boundary = 'test-boundary';
        const stream = new Readable({
          read() {
            this.push(Buffer.alloc(70 * 1024, 'X'));
            this.push(null);
          },
        });
        let rejected = false;
        try {
          await MultipartHelper.parseFile(stream, boundary);
        } catch (err) {
          rejected = true;
          assert.includes(err.message, 'Multipart headers exceed maximum allowed size');
        }
        assert.ok(rejected, 'Expected parseFile to reject oversized header buffer');
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

    await this.describe('Self-role-change guard', async () => {
      await this.test('A user cannot change their own assigned role', async () => {
        const res = await fetch(`${BASE_URL}/auth/users/admin/role`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Cookie: this.adminCookie },
          body: JSON.stringify({ role: 'View' }),
        });
        const body = await res.json();
        assert.equal(res.status, 400);
        assert.includes(body.message, 'cannot change your own assigned role');
      });

      await this.test("Updating somebody else's role is still allowed", async () => {
        await fetch(`${BASE_URL}/auth/users`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Cookie: this.adminCookie },
          body: JSON.stringify({ username: 'role_target', password: 'Target1Password', role: 'View' }),
        });

        const res = await fetch(`${BASE_URL}/auth/users/role_target/role`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Cookie: this.adminCookie },
          body: JSON.stringify({ role: 'Super Admin' }),
        });
        assert.equal(res.status, 200);

        // Clean up
        await fetch(`${BASE_URL}/auth/users/role_target`, {
          method: 'DELETE',
          headers: { Cookie: this.adminCookie },
        });
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

    await this.describe('Privilege escalation prevention (SEC-06)', async () => {
      let subAdminCookie = null;

      await this.test('Create delegated manager role with user management permissions', async () => {
        await fetch(`${BASE_URL}/auth/roles`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Cookie: this.adminCookie },
          body: JSON.stringify({
            roleName: 'DelegatedManager',
            permissions: ['user:view', 'user:create', 'user:reset-password', 'user:update-role', 'user:delete'],
          }),
        });

        await fetch(`${BASE_URL}/auth/users`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Cookie: this.adminCookie },
          body: JSON.stringify({ username: 'subadmin', password: 'SubAdminPass1', role: 'DelegatedManager' }),
        });

        subAdminCookie = await this.loginFlow('subadmin', 'SubAdminPass1', 'SubAdminPass2');
        assert.ok(subAdminCookie);
      });

      await this.test('Delegated manager cannot create a Super Admin user', async () => {
        const res = await fetch(`${BASE_URL}/auth/users`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Cookie: subAdminCookie },
          body: JSON.stringify({ username: 'fake_superadmin', password: 'FakeSuperPass1!', role: 'Super Admin' }),
        });
        const body = await res.json();
        assert.equal(res.status, 400);
        assert.includes(body.message, 'Only a Super Admin can create a Super Admin user');
      });

      await this.test('Delegated manager CAN create a normal user', async () => {
        const res = await fetch(`${BASE_URL}/auth/users`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Cookie: subAdminCookie },
          body: JSON.stringify({ username: 'normal_created', password: 'NormalPass123!', role: 'View' }),
        });
        const body = await res.json();
        assert.equal(res.status, 201);
        assert.equal(body.statusCode, 201);
      });

      await this.test('Super Admin CAN create another Super Admin user', async () => {
        const res = await fetch(`${BASE_URL}/auth/users`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Cookie: this.adminCookie },
          body: JSON.stringify({ username: 'second_superadmin', password: 'SecondSuperPass1!', role: 'Super Admin' }),
        });
        const body = await res.json();
        assert.equal(res.status, 201);
        assert.equal(body.statusCode, 201);
      });

      await this.test('Direct AuthService calls without actor cannot create or reset Super Admin', async () => {
        const CoreDBMS = require('../../../axiodb.js').CoreDBMS;
        const authService = new CoreDBMS.AuthService();
        const createResult = await authService.createUser('no_actor_super', 'NoActorPass1!', 'Super Admin');
        assert.equal(createResult.success, false);
        assert.includes(createResult.message, 'Only a Super Admin can create a Super Admin user');

        const resetResult = await authService.resetUserPassword('admin', 'NoActorReset1!');
        assert.equal(resetResult.success, false);
        assert.includes(resetResult.message, 'Only a Super Admin can reset the password of a Super Admin');
      });

      await this.test('Delegated manager cannot reset SuperAdmin password', async () => {
        const res = await fetch(`${BASE_URL}/auth/users/admin/reset-password`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Cookie: subAdminCookie },
          body: JSON.stringify({ newPassword: 'NewHackedPass1!' }),
        });
        const body = await res.json();
        assert.equal(res.status, 400);
        assert.includes(body.message, 'Only a Super Admin can reset the password of a Super Admin');
      });

      await this.test('Delegated manager cannot promote a user to SuperAdmin', async () => {
        await fetch(`${BASE_URL}/auth/users`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Cookie: this.adminCookie },
          body: JSON.stringify({ username: 'target_peer', password: 'PeerPass123!', role: 'View' }),
        });

        const res = await fetch(`${BASE_URL}/auth/users/target_peer/role`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Cookie: subAdminCookie },
          body: JSON.stringify({ role: 'Super Admin' }),
        });
        const body = await res.json();
        assert.equal(res.status, 400);
        assert.includes(body.message, 'Only a Super Admin can assign or modify the Super Admin role');
      });

      await this.test('Delegated manager cannot delete a SuperAdmin', async () => {
        const res = await fetch(`${BASE_URL}/auth/users/admin`, {
          method: 'DELETE',
          headers: { Cookie: subAdminCookie },
        });
        const body = await res.json();
        assert.equal(res.status, 400);
        assert.includes(body.message, 'Only a Super Admin can delete a Super Admin');
      });

      await this.test('SuperAdmin CAN reset another user password', async () => {
        const res = await fetch(`${BASE_URL}/auth/users/target_peer/reset-password`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Cookie: this.adminCookie },
          body: JSON.stringify({ newPassword: 'ResetByAdmin1!' }),
        });
        const body = await res.json();
        assert.equal(res.status, 200);
        assert.includes(body.message, 'Password reset successfully');
      });
    });
  }
}

module.exports = AuthTests;
