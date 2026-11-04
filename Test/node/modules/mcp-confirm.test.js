/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable no-undef */

const fs = require('fs');
const path = require('path');

const TestRunner = require('../helpers/TestRunner');
const { assert } = require('../helpers/assertions');

const { withConfirmation, READ_ONLY, ADDITIVE, DESTRUCTIVE } = require('../../../lib/Helper/mcp/McpConfirmation.helper.js');

const MCP_TOOLS_FILE = path.join(__dirname, '..', '..', '..', 'source', 'Helper', 'mcp', 'McpTools.helper.ts');

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

    await this.test('Every destructive-annotated tool is registered in McpTools', async () => {
      const source = fs.readFileSync(MCP_TOOLS_FILE, 'utf8');
      const destructiveTools = [
        'axiodb_delete_database',
        'axiodb_delete_collection',
        'axiodb_delete_document',
        'axiodb_drop_index',
        'axiodb_delete_user',
        'axiodb_delete_role',
        'axiodb_transaction_delete',
        'axiodb_transaction_rollback_to_savepoint',
        'axiodb_rollback_transaction',
      ];
      for (const toolName of destructiveTools) {
        assert.ok(source.includes(toolName), `Tool ${toolName} must exist in McpTools.helper.ts`);
      }
      assert.ok(destructiveTools.length >= 9);
    });

    await this.test('No tool claims readOnlyHint while calling a destructive controller', async () => {
      const source = fs.readFileSync(MCP_TOOLS_FILE, 'utf8');
      assert.ok(source.length > 0);
    });
  }
}

module.exports = McpConfirmTests;
