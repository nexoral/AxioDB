'use strict';

// Human-in-the-loop gate for the destructive MCP tools. Deliberately free of any `../lib`
// or SDK imports so it stays unit-testable outside the Docker image (see
// Test/modules/mcp-confirm.test.js) - it only ever talks to the McpServer it is handed.

// A single boolean field: the elicitation `message` carries the whole warning, this is just
// the operator's yes/no on it.
const CONFIRMATION_SCHEMA = {
  type: 'object',
  properties: {
    confirm: {
      type: 'boolean',
      title: 'Confirm',
      description: 'true runs the destructive operation, anything else aborts it',
    },
  },
  required: ['confirm'],
};

const NOT_CONFIRMED = {
  statusCode: 409,
  message: 'Aborted: this destructive operation was not confirmed by a human reviewer.',
};

/**
 * Wraps a tool handler so a human approves the operation - through the MCP client's own
 * elicitation prompt (`elicitation/create`) - before any data is touched. Only an explicit
 * `accept` with `confirm: true` proceeds; decline, cancel and an unchecked box all abort
 * without calling the handler.
 *
 * Advisory by design: a client that doesn't advertise the `elicitation` capability cannot
 * show a prompt, so the call proceeds with only the tool's `destructiveHint` annotation
 * warning it. Blocking instead would break every MCP client predating elicitation.
 *
 * @param {import('@modelcontextprotocol/sdk/server/mcp.js').McpServer} server - the per-session server the tool is registered on
 * @param {(args: object) => string} buildMessage - renders the prompt from the call's own arguments (name the exact target)
 * @param {(args: object, session: object) => Promise<object>} handler - the guarded handler
 * @returns {(args: object, session: object) => Promise<object>} handler that runs only once confirmed
 */
function withConfirmation(server, buildMessage, handler) {
  return async (args, session) => {
    if (server.server.getClientCapabilities()?.elicitation) {
      const { action, content } = await server.server.elicitInput({
        message: buildMessage(args),
        requestedSchema: CONFIRMATION_SCHEMA,
      });
      if (action !== 'accept' || content?.confirm !== true) {
        return NOT_CONFIRMED;
      }
    }
    return handler(args, session);
  };
}

/** Tool annotation preset: reads only, never mutates. */
const READ_ONLY = { readOnlyHint: true, destructiveHint: false, idempotentHint: true };

/** Tool annotation preset: writes, but only ever adds - nothing existing is lost. */
const ADDITIVE = { readOnlyHint: false, destructiveHint: false };

/** Tool annotation preset: destroys or overwrites existing state - pair with withConfirmation(). */
const DESTRUCTIVE = { readOnlyHint: false, destructiveHint: true };

module.exports = { withConfirmation, READ_ONLY, ADDITIVE, DESTRUCTIVE };
