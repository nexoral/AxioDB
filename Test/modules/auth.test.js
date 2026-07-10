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

    await this.describe('Last remaining Super Admin guard', async () => {
      await this.test('Cannot delete the only Super Admin account', async () => {
        const res = await fetch(`${BASE_URL}/auth/users/admin`, {
          method: 'DELETE',
          headers: { Cookie: this.adminCookie },
        });
        assert.equal(res.status, 400);
      });
    });
  }
}

module.exports = AuthTests;
