import http from "node:http";
import crypto from "node:crypto";
import { AxioDB } from "../../Services/Indexation.operation";
import Logger from "../Logger.helper";
import {
  DEFAULT_MCP_PORT,
  MCP_PROTOCOL_VERSION,
  MCP_SERVER_NAME,
  MCP_SERVER_VERSION,
  JsonRpcRequest,
  JsonRpcResponse,
} from "./McpKeys";
import { buildMcpTools, RegisteredTool } from "./McpTools.helper";

let activeServer: http.Server | null = null;
const activeSseResponses = new Set<http.ServerResponse>();

function getCorsHeaders(sessionId?: string): Record<string, string> {
  const headers: Record<string, string> = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, mcp-session-id, Mcp-Session-Id",
    "Access-Control-Expose-Headers": "Content-Type, mcp-session-id, Mcp-Session-Id",
  };
  if (sessionId) {
    headers["mcp-session-id"] = sessionId;
  }
  return headers;
}

function sendJson(
  res: http.ServerResponse,
  statusCode: number,
  data: unknown,
  extraHeaders?: Record<string, string>,
): void {
  const body = JSON.stringify(data);
  res.writeHead(statusCode, {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(body),
    ...getCorsHeaders(),
    ...(extraHeaders || {}),
  });
  res.end(body);
}

function sendAccepted(res: http.ServerResponse, sessionId?: string): void {
  res.writeHead(202, getCorsHeaders(sessionId));
  res.end();
}

function sendJsonRpcResponse(
  res: http.ServerResponse,
  id: string | number | null | undefined,
  result?: unknown,
  error?: { code: number; message: string; data?: unknown },
  sessionId?: string,
): void {
  const response: JsonRpcResponse = {
    jsonrpc: "2.0",
    id: id !== undefined ? id : null,
    ...(result !== undefined ? { result } : {}),
    ...(error !== undefined ? { error } : {}),
  };
  sendJson(res, 200, response, sessionId ? { "mcp-session-id": sessionId } : undefined);
}

export async function startMcpServer(
  axioDBInstance: AxioDB,
  port: number = DEFAULT_MCP_PORT,
): Promise<http.Server> {
  if (port !== DEFAULT_MCP_PORT) {
    throw new Error(`MCP port must be strictly ${DEFAULT_MCP_PORT}. Ports 27018, 27019 and other ports are forbidden.`);
  }

  const tools: Map<string, RegisteredTool> = buildMcpTools(axioDBInstance);

  const server = http.createServer(async (req, res) => {
    // Handle CORS pre-flight
    if (req.method === "OPTIONS") {
      res.writeHead(204, getCorsHeaders());
      res.end();
      return;
    }

    // Handle session termination
    if (req.method === "DELETE") {
      res.writeHead(204, getCorsHeaders());
      res.end();
      return;
    }

    const clientSessionId =
      (req.headers["mcp-session-id"] as string | undefined) ||
      (req.headers["Mcp-Session-Id"] as string | undefined);

    // GET: SSE stream or discovery/health
    if (req.method === "GET") {
      const accept = req.headers.accept || "";
      if (accept.includes("text/event-stream")) {
        const streamSessionId = clientSessionId || crypto.randomUUID();
        res.writeHead(200, {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive",
          ...getCorsHeaders(streamSessionId),
        });
        res.write(": connected\n\n");
        activeSseResponses.add(res);

        const keepAlive = setInterval(() => {
          res.write(": ping\n\n");
        }, 15000);

        req.on("close", () => {
          clearInterval(keepAlive);
          activeSseResponses.delete(res);
        });
        return;
      }

      sendJson(res, 200, {
        status: "online",
        service: MCP_SERVER_NAME,
        version: MCP_SERVER_VERSION,
        protocolVersion: MCP_PROTOCOL_VERSION,
        port,
        toolsCount: tools.size,
      });
      return;
    }

    if (req.method !== "POST") {
      sendJson(res, 405, { error: "Method not allowed. Use POST /mcp for JSON-RPC requests." });
      return;
    }

    // Read body
    const chunks: Buffer[] = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", async () => {
      let rpc: JsonRpcRequest;
      try {
        const raw = Buffer.concat(chunks).toString("utf8");
        rpc = JSON.parse(raw);
      } catch {
        sendJsonRpcResponse(res, null, undefined, {
          code: -32700,
          message: "Parse error: Invalid JSON",
        });
        return;
      }

      if (!rpc || typeof rpc !== "object" || rpc.jsonrpc !== "2.0") {
        sendJsonRpcResponse(res, null, undefined, {
          code: -32600,
          message: "Invalid Request: Must be JSON-RPC 2.0 object",
        });
        return;
      }

      const { id, method, params } = rpc;
      const isNotification = id === undefined || (typeof method === "string" && method.startsWith("notifications/"));

      // Notifications in Streamable HTTP must return 202 Accepted with no body
      if (isNotification && method !== "initialize") {
        sendAccepted(res, clientSessionId);
        return;
      }

      const activeSessionId = clientSessionId || crypto.randomUUID();

      try {
        switch (method) {
          case "initialize":
            sendJsonRpcResponse(
              res,
              id,
              {
                protocolVersion: MCP_PROTOCOL_VERSION,
                capabilities: {
                  tools: {
                    listChanged: false,
                  },
                },
                serverInfo: {
                  name: MCP_SERVER_NAME,
                  version: MCP_SERVER_VERSION,
                },
              },
              undefined,
              activeSessionId,
            );
            break;

          case "ping":
            sendJsonRpcResponse(res, id, {}, undefined, activeSessionId);
            break;

          case "tools/list":
            sendJsonRpcResponse(
              res,
              id,
              {
                tools: Array.from(tools.values()).map((t) => t.definition),
              },
              undefined,
              activeSessionId,
            );
            break;

          case "tools/call": {
            const toolName = typeof params?.name === "string" ? params.name : "";
            const toolArgs =
              params && typeof params.arguments === "object" && params.arguments !== null
                ? (params.arguments as Record<string, unknown>)
                : {};

            const tool = tools.get(toolName);
            if (!tool) {
              sendJsonRpcResponse(
                res,
                id,
                undefined,
                {
                  code: -32601,
                  message: `Tool not found: '${toolName}'`,
                },
                activeSessionId,
              );
              return;
            }

            const clientIp =
              req.socket.remoteAddress ||
              (typeof req.headers["x-forwarded-for"] === "string"
                ? req.headers["x-forwarded-for"].split(",")[0].trim()
                : undefined) ||
              "127.0.0.1";

            const toolResult = await tool.handler({ ...toolArgs, _clientIp: clientIp });
            sendJsonRpcResponse(res, id, toolResult, undefined, activeSessionId);
            break;
          }

          default:
            sendJsonRpcResponse(
              res,
              id,
              undefined,
              {
                code: -32601,
                message: `Method not found: '${method}'`,
              },
              activeSessionId,
            );
            break;
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        sendJsonRpcResponse(
          res,
          id,
          undefined,
          {
            code: -32603,
            message: `Internal error: ${msg}`,
          },
          activeSessionId,
        );
      }
    });
  });

  return new Promise((resolve, reject) => {
    server.once("error", (err: NodeJS.ErrnoException) => {
      if (err.code === "EADDRINUSE") {
        const error = new Error(`Port ${port} is already in use. Please free port ${port} to start AxioDB MCP Server.`);
        Logger.error(error.message);
        reject(error);
      } else {
        Logger.error(`[AxioDB MCP] Server error:`, err);
        reject(err);
      }
    });

    const host = process.env.AXIODB_HOST || "127.0.0.1";
    server.listen(port, host, () => {
      activeServer = server;
      Logger.info(`AxioDB MCP Server is running on http://localhost:${port}/mcp`);
      resolve(server);
    });
  });
}

export async function stopMcpServer(): Promise<void> {
  for (const sseRes of activeSseResponses) {
    try {
      sseRes.end();
    } catch {
      // Ignore cleanup error on closed sockets
    }
  }
  activeSseResponses.clear();

  if (!activeServer) {
    return;
  }
  return new Promise((resolve) => {
    activeServer?.close(() => {
      activeServer = null;
      resolve();
    });
  });
}
