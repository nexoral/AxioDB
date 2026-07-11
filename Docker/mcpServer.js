'use strict';

// MCP server for AxioDB's Docker deployment. Deliberately lives here (not in source/) and
// is required only via relative `./lib/...` paths into the SAME compiled output the rest of
// this image already ships - no extra `axiodb` package install, no second AxioDB instance.
// It exposes the exact same data-plane + control-plane operations the HTTP GUI does, gated
// by the exact same RBAC (login -> session -> PermissionChecker), just as MCP tools instead
// of Fastify routes. Each feature area's tools live in mcp/tools/ (see architecture.md's
// "feature-based, one responsibility per file" convention); this file only wires them up and
// runs the Streamable HTTP transport.

const http = require('http');
const { randomUUID } = require('crypto');
const { McpServer } = require('@modelcontextprotocol/sdk/server/mcp.js');
const { StreamableHTTPServerTransport } = require('@modelcontextprotocol/sdk/server/streamableHttp.js');

const SessionStore = require('./lib/Services/Auth/SessionStore.service').default;
const LoginRateLimiter = require('./lib/Services/Auth/LoginRateLimiter.service').default;

const registerAuthTools = require('./mcp/tools/auth.tools');
const registerDatabaseTools = require('./mcp/tools/database.tools');
const registerCollectionTools = require('./mcp/tools/collection.tools');
const registerDocumentTools = require('./mcp/tools/document.tools');
const registerIndexTools = require('./mcp/tools/index.tools');
const registerDashboardTools = require('./mcp/tools/dashboard.tools');
const registerUserTools = require('./mcp/tools/user.tools');
const registerRoleTools = require('./mcp/tools/role.tools');

const MCP_SERVER_NAME = 'axiodb-mcp-server';
const MCP_SERVER_VERSION = '1.0.0';

function buildMcpServer(axioDBInstance) {
  const server = new McpServer({ name: MCP_SERVER_NAME, version: MCP_SERVER_VERSION });
  registerAuthTools(server, axioDBInstance);
  registerDatabaseTools(server, axioDBInstance);
  registerCollectionTools(server, axioDBInstance);
  registerDocumentTools(server, axioDBInstance);
  registerIndexTools(server, axioDBInstance);
  registerDashboardTools(server, axioDBInstance);
  registerUserTools(server, axioDBInstance);
  registerRoleTools(server, axioDBInstance);
  return server;
}

/**
 * Starts the MCP server on its own HTTP port (Streamable HTTP transport, stateful: one
 * McpServer+transport pair per MCP client session, tracked by the transport's own
 * Mcp-Session-Id - distinct from the RBAC `sessionId` every tool call carries as an input).
 */
function startMcpServer(axioDBInstance, port) {
  const transports = new Map();

  const httpServer = http.createServer(async (req, res) => {
    if (req.method !== 'POST' && req.method !== 'GET' && req.method !== 'DELETE') {
      res.writeHead(405).end();
      return;
    }
    if (!req.url || !req.url.startsWith('/mcp')) {
      res.writeHead(404).end();
      return;
    }

    const mcpSessionId = req.headers['mcp-session-id'];
    let transport = typeof mcpSessionId === 'string' ? transports.get(mcpSessionId) : undefined;

    if (!transport) {
      if (req.method !== 'POST') {
        res.writeHead(400).end('No active MCP session for this request');
        return;
      }
      transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        onsessioninitialized: (sid) => transports.set(sid, transport),
      });
      transport.onclose = () => {
        if (transport.sessionId) {
          transports.delete(transport.sessionId);
        }
      };
      buildMcpServer(axioDBInstance).connect(transport);
    }

    let parsedBody;
    if (req.method === 'POST') {
      const chunks = [];
      for await (const chunk of req) {
        chunks.push(chunk);
      }
      const raw = Buffer.concat(chunks).toString('utf8');
      parsedBody = raw ? JSON.parse(raw) : undefined;
    }

    await transport.handleRequest(req, res, parsedBody);
  });

  SessionStore.startCleanupSweep();
  LoginRateLimiter.startCleanupSweep();

  httpServer.listen(port, () => {
    console.log(`[AxioDB MCP] Streamable HTTP server listening on port ${port} (POST/GET/DELETE /mcp)`);
  });

  return httpServer;
}

module.exports = function mcpServerEntry(axioDBInstance) {
  const port = parseInt(process.env.AXIODB_MCP_PORT || '27020', 10);
  return startMcpServer(axioDBInstance, port);
};
