export const DEFAULT_MCP_PORT = 27020;
export const MCP_PROTOCOL_VERSION = "2024-11-05";
export const MCP_SERVER_NAME = "axiodb-mcp-server";
export const MCP_SERVER_VERSION = "24.33.5";

export interface JsonRpcRequest {
  jsonrpc: "2.0";
  id?: string | number | null;
  method: string;
  params?: Record<string, unknown>;
}

export interface JsonRpcResponse {
  jsonrpc: "2.0";
  id: string | number | null;
  result?: unknown;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
}

export interface McpToolProperty {
  type: string;
  description?: string;
  items?: { type: string };
  properties?: Record<string, McpToolProperty>;
  required?: string[];
  [key: string]: unknown;
}

export interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: "object";
    properties: Record<string, McpToolProperty>;
    required?: string[];
  };
}

export interface McpToolResult {
  content: Array<{
    type: "text";
    text: string;
  }>;
  isError?: boolean;
}
