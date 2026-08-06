/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable no-undef */

const fs = require('fs');
const path = require('path');

const TestRunner = require('../helpers/TestRunner');
const { assert } = require('../helpers/assertions');

const { withConfirmation, READ_ONLY, ADDITIVE, DESTRUCTIVE } = require('../../Docker/mcp/confirmation.helper');

const TOOLS_DIR = path.join(__dirname, '..', '..', 'Docker', 'mcp', 'tools');

// Tools that carry destructiveHint but deliberately have no elicitation gate, with the reason.
const UNGATED_DESTRUCTIVE = {
  axiodb_change_own_password: 'self-service; requiring currentPassword already proves human intent',
};

/**
 * Human-in-the-loop gate for the MCP server's destructive tools. Pure-logic suite: it drives
 * withConfirmation() with a stubbed McpServer (no AxioDB instance, no MCP transport, no
 * Docker image layout), then statically asserts every tool annotated destructive is actually
 * wrapped in that gate - the regression that matters when a new delete tool gets added.
 */
class McpConfirmTests extends TestRunner {
  constructor() {
    super('MCP Destructive-Tool Confirmation Test Suite');
  }

  /** Stub McpServer: `elicitReply` null means the client never advertised the capability. */
  stubServer(elicitReply) {
    const calls = [];
    return {
      calls,
      server: {
        getClientCapabilities: () => (elicitReply ? { elicitation: {} } : {}),
        elicitInput: async (params) => {
          calls.push(params);
          return elicitReply;
        },
      },
    };
  }

  /** Handler that records it ran, so "never called" is assertable. */
  spyHandler(ran) {
    return (args, session) => {
      ran.push({ args, session });
      return { statusCode: 200, message: 'ran' };
    };
  }

  async runTests() {
    await this.test('Accepted confirmation runs the handler with args + session intact', async () => {
      const ran = [];
      const stub = this.stubServer({ action: 'accept', content: { confirm: true } });
      const guarded = withConfirmation(stub, ({ dbName }) => `Delete "${dbName}"?`, this.spyHandler(ran));

      const result = await guarded({ dbName: 'Sales' }, { username: 'admin' });

      assert.equal(result.statusCode, 200);
      assert.equal(ran.length, 1, 'handler should run exactly once');
      assert.equal(ran[0].args.dbName, 'Sales');
      assert.equal(ran[0].session.username, 'admin');
    });

    await this.test('Prompt names the exact target being destroyed', async () => {
      const stub = this.stubServer({ action: 'accept', content: { confirm: true } });
      const guarded = withConfirmation(stub, ({ dbName }) => `Delete "${dbName}"?`, () => ({ statusCode: 200 }));

      await guarded({ dbName: 'Sales' }, {});

      assert.equal(stub.calls.length, 1, 'client should be elicited exactly once');
      assert.ok(stub.calls[0].message.includes('Sales'), 'prompt must name the target');
      assert.equal(stub.calls[0].requestedSchema.required[0], 'confirm');
    });

    // decline / cancel / accepted-but-unchecked all mean "no human said yes".
    for (const reply of [
      { action: 'decline' },
      { action: 'cancel' },
      { action: 'accept', content: { confirm: false } },
      { action: 'accept', content: {} },
    ]) {
      await this.test(`Unconfirmed (${JSON.stringify(reply)}) blocks the handler with 409`, async () => {
        const ran = [];
        const stub = this.stubServer(reply);
        const guarded = withConfirmation(stub, () => 'Delete?', this.spyHandler(ran));

        const result = await guarded({}, {});

        assert.equal(result.statusCode, 409);
        assert.equal(ran.length, 0, 'handler must not run without confirmation');
      });
    }

    await this.test('Client without elicitation capability falls back to advisory (call proceeds)', async () => {
      const ran = [];
      const stub = this.stubServer(null);
      const guarded = withConfirmation(stub, () => 'Delete?', this.spyHandler(ran));

      const result = await guarded({ dbName: 'Sales' }, {});

      assert.equal(result.statusCode, 200);
      assert.equal(ran.length, 1, 'pre-elicitation clients must keep working');
      assert.equal(stub.calls.length, 0, 'no prompt is sent to a client that cannot show one');
    });

    await this.test('Annotation presets say the truth about mutation', async () => {
      assert.equal(READ_ONLY.readOnlyHint, true);
      assert.equal(READ_ONLY.destructiveHint, false);
      assert.equal(ADDITIVE.readOnlyHint, false);
      assert.equal(ADDITIVE.destructiveHint, false);
      assert.equal(DESTRUCTIVE.readOnlyHint, false);
      assert.equal(DESTRUCTIVE.destructiveHint, true);
    });

    await this.test('Every destructive-annotated tool is wrapped in withConfirmation', async () => {
      const ungated = [];
      let destructiveCount = 0;

      for (const file of fs.readdirSync(TOOLS_DIR).filter((f) => f.endsWith('.tools.js'))) {
        const source = fs.readFileSync(path.join(TOOLS_DIR, file), 'utf8');
        // One block per tool: everything from its registerTool( call to the next one.
        for (const block of source.split('server.registerTool(').slice(1)) {
          const name = (block.match(/'(axiodb_[a-z_]+)'/) || [])[1];
          const isDestructive = block.includes('DESTRUCTIVE') || block.includes('destructiveHint: true');
          if (!isDestructive) continue;
          destructiveCount++;
          if (!block.includes('withConfirmation(') && !UNGATED_DESTRUCTIVE[name]) {
            ungated.push(`${file}:${name}`);
          }
        }
      }

      assert.equal(ungated.length, 0, `destructive tools missing a confirmation gate: ${ungated.join(', ')}`);
      assert.ok(destructiveCount >= 9, `expected the known destructive tools, found ${destructiveCount}`);
    });

    await this.test('No tool claims readOnlyHint while calling a destructive controller', async () => {
      const offenders = [];

      for (const file of fs.readdirSync(TOOLS_DIR).filter((f) => f.endsWith('.tools.js'))) {
        const source = fs.readFileSync(path.join(TOOLS_DIR, file), 'utf8');
        for (const block of source.split('server.registerTool(').slice(1)) {
          const name = (block.match(/'(axiodb_[a-z_]+)'/) || [])[1];
          const claimsReadOnly = block.includes('READ_ONLY') || block.includes('readOnlyHint: true');
          if (claimsReadOnly && /\.(delete|update|create|reset)[A-Z]/.test(block)) {
            offenders.push(`${file}:${name}`);
          }
        }
      }

      assert.equal(offenders.length, 0, `read-only annotation on a mutating tool: ${offenders.join(', ')}`);
    });
  }
}

module.exports = McpConfirmTests;
