import React, { useState } from "react";
import Seo from "../ui/Seo";
import CodeBlock from "../ui/CodeBlock";
import {
  Bot,
  ShieldCheck,
  Terminal,
  Layers,
  Users,
  ArrowRight,
  ExternalLink,
  Code2,
  Container,
  Cpu,
  Globe,
  Radio,
} from "lucide-react";

interface ToolGroup {
  title: string;
  count: number;
  description: string;
  tools: string[];
}

const toolGroups: ToolGroup[] = [
  {
    title: "Session & Auth",
    count: 4,
    description: "Authenticate agents and manage sessions",
    tools: [
      "axiodb_login",
      "axiodb_logout",
      "axiodb_whoami",
      "axiodb_change_own_password",
    ],
  },
  {
    title: "Database Management",
    count: 4,
    description: "Create, inspect, and drop databases",
    tools: [
      "axiodb_create_database",
      "axiodb_delete_database",
      "axiodb_database_exists",
      "axiodb_get_instance_info",
    ],
  },
  {
    title: "Collection Management",
    count: 4,
    description: "Manage collections inside databases",
    tools: [
      "axiodb_create_collection",
      "axiodb_delete_collection",
      "axiodb_collection_exists",
      "axiodb_get_collection_info",
    ],
  },
  {
    title: "Documents & Aggregation",
    count: 8,
    description: "CRUD operations and aggregation pipelines",
    tools: [
      "axiodb_insert_document",
      "axiodb_insert_many_documents",
      "axiodb_query_documents",
      "axiodb_update_document",
      "axiodb_delete_document",
      "axiodb_total_documents",
      "axiodb_find_documents_by_ids",
      "axiodb_aggregate",
    ],
  },
  {
    title: "Transactions",
    count: 9,
    description: "Atomic multi-document transactions with WAL",
    tools: [
      "axiodb_begin_transaction",
      "axiodb_transaction_insert",
      "axiodb_transaction_update",
      "axiodb_transaction_delete",
      "axiodb_transaction_savepoint",
      "axiodb_transaction_rollback_to_savepoint",
      "axiodb_transaction_release_savepoint",
      "axiodb_commit_transaction",
      "axiodb_rollback_transaction",
    ],
  },
  {
    title: "Indexes",
    count: 3,
    description: "Create and manage dual-write memory/disk indexes",
    tools: [
      "axiodb_create_index",
      "axiodb_drop_index",
      "axiodb_list_indexes",
    ],
  },
  {
    title: "User & Role Administration",
    count: 9,
    description: "Role-based access control and user management",
    tools: [
      "axiodb_list_users",
      "axiodb_create_user",
      "axiodb_update_user_role",
      "axiodb_reset_user_password",
      "axiodb_delete_user",
      "axiodb_list_roles",
      "axiodb_create_role",
      "axiodb_delete_role",
      "axiodb_list_permissions",
    ],
  },
  {
    title: "Monitoring & Health",
    count: 4,
    description: "Real-time health status, metrics, and diagnostics",
    tools: [
      "axiodb_health",
      "axiodb_get_dashboard_stats",
      "axiodb_instance_info",
      "axiodb_ping",
    ],
  },
];

const McpServer: React.FC = () => {
  const [initMode, setInitMode] = useState<"cli" | "core" | "docker">("cli");

  return (
    <>
      <div className="space-y-12">
        <Seo
          title="MCP Server Guide - Model Context Protocol | AxioDB"
          description="Complete guide to connecting AI agents (Claude Code, Cursor, Windsurf, Copilot, Antigravity) to AxioDB via native Model Context Protocol (MCP) server."
          path="/mcp-server"
          ogType="article"
        />

        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-gray-50 via-white to-fuchsia-50/40 rounded-xl p-6 sm:p-8 lg:p-10 border border-fuchsia-200/80 shadow-sm">
          <div className="absolute top-0 right-0 w-80 h-80 bg-fuchsia-100/40 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Column: Heading, Description & Stats */}
            <div className="lg:col-span-7 space-y-5">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-fuchsia-100/80 text-fuchsia-700 text-xs font-bold rounded-full border border-fuchsia-200 uppercase tracking-wide">
                <Bot className="h-3.5 w-3.5" />
                <span>Native AI Agent Integration</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 tracking-tight">
                AxioDB MCP Server Guide
              </h1>

              <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
                Connect AI coding assistants and autonomous agents directly to AxioDB via the{" "}
                <strong>Model Context Protocol (MCP)</strong>. AxioDB includes a built-in MCP server
                providing <strong>45 tools</strong> on port <strong>27020</strong> with full RBAC authentication,
                JSON-RPC 2.0 / SSE support, and zero external dependencies.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <div className="bg-white p-3.5 rounded-lg border border-gray-200/90 shadow-2xs">
                  <div className="text-2xl font-black text-fuchsia-600">45</div>
                  <div className="text-xs text-gray-500 font-medium mt-0.5">Built-in Tools</div>
                </div>
                <div className="bg-white p-3.5 rounded-lg border border-gray-200/90 shadow-2xs">
                  <div className="text-2xl font-black text-purple-600">27020</div>
                  <div className="text-xs text-gray-500 font-medium mt-0.5">Standard Port</div>
                </div>
                <div className="bg-white p-3.5 rounded-lg border border-gray-200/90 shadow-2xs">
                  <div className="text-xl font-black text-emerald-600">Core + Docker</div>
                  <div className="text-xs text-gray-500 font-medium mt-0.5">Deployment</div>
                </div>
                <div className="bg-white p-3.5 rounded-lg border border-gray-200/90 shadow-2xs">
                  <div className="text-2xl font-black text-blue-600">RBAC</div>
                  <div className="text-xs text-gray-500 font-medium mt-0.5">Role Security</div>
                </div>
              </div>
            </div>

            {/* Right Column: Interactive Quick Reference Box */}
            <div className="lg:col-span-5">
              <div className="bg-white rounded-xl border border-fuchsia-200 p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                    </span>
                    <span className="text-xs font-bold text-gray-900 tracking-wide uppercase">
                      Streamable HTTP Endpoint
                    </span>
                  </div>
                  <span className="text-xs font-mono font-bold bg-fuchsia-50 text-fuchsia-700 px-2 py-0.5 rounded border border-fuchsia-200">
                    Port 27020
                  </span>
                </div>

                <div>
                  <div className="text-xs font-semibold text-gray-500 mb-1 flex items-center justify-between">
                    <span>Endpoint URL</span>
                    <span className="text-[11px] text-gray-400">Path: /mcp</span>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 text-fuchsia-700 font-mono text-xs p-2.5 rounded-md break-all select-all font-semibold">
                    http://localhost:27020/mcp
                  </div>
                </div>

                <div>
                  <div className="text-xs font-semibold text-gray-500 mb-1">Quick Start in TypeScript</div>
                  <div className="bg-gray-900 text-gray-100 font-mono text-xs p-2.5 rounded-md">
                    <span className="text-purple-400">new</span> <span className="text-amber-300">AxioDB</span>&#40;&#123; <span className="text-emerald-400">MCP</span>: <span className="text-blue-400">true</span> &#125;&#41;;
                  </div>
                </div>

                <div className="pt-1 border-t border-gray-100">
                  <div className="text-xs font-semibold text-gray-500 mb-2">Supported Clients & Protocols</div>
                  <div className="flex flex-wrap gap-1.5 text-[11px]">
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded font-medium">JSON-RPC 2.0</span>
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded font-medium">SSE Stream</span>
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded font-medium">Claude Code</span>
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded font-medium">Cursor</span>
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded font-medium">Windsurf</span>
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded font-medium">Antigravity</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Step 1: Start the MCP Server */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-fuchsia-600 text-white font-bold text-sm">
              1
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Start the MCP Server
            </h2>
          </div>

          <p className="text-gray-600 mb-6">
            You can start the MCP server directly using the <strong>AxioDB CLI</strong>, in your <strong>Node.js / TypeScript code</strong>, or via <strong>Docker</strong>.
          </p>

          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
            {/* Tabs */}
            <div className="flex border-b border-gray-200 bg-gray-50 overflow-x-auto">
              <button
                onClick={() => setInitMode("cli")}
                className={`flex items-center gap-2 px-6 py-3 font-semibold text-sm transition-colors border-b-2 whitespace-nowrap ${
                  initMode === "cli"
                    ? "border-fuchsia-600 text-fuchsia-700 bg-white"
                    : "border-transparent text-gray-600 hover:text-gray-900"
                }`}
              >
                <Terminal className="h-4 w-4" />
                Via CLI (Bun / Instant)
              </button>
              <button
                onClick={() => setInitMode("core")}
                className={`flex items-center gap-2 px-6 py-3 font-semibold text-sm transition-colors border-b-2 whitespace-nowrap ${
                  initMode === "core"
                    ? "border-fuchsia-600 text-fuchsia-700 bg-white"
                    : "border-transparent text-gray-600 hover:text-gray-900"
                }`}
              >
                <Code2 className="h-4 w-4" />
                In TypeScript / Node.js (Core)
              </button>
              <button
                onClick={() => setInitMode("docker")}
                className={`flex items-center gap-2 px-6 py-3 font-semibold text-sm transition-colors border-b-2 whitespace-nowrap ${
                  initMode === "docker"
                    ? "border-fuchsia-600 text-fuchsia-700 bg-white"
                    : "border-transparent text-gray-600 hover:text-gray-900"
                }`}
              >
                <Container className="h-4 w-4" />
                In Docker Container
              </button>
            </div>

            <div className="p-6">
              {initMode === "cli" ? (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Use <code className="px-1.5 py-0.5 bg-gray-100 rounded text-fuchsia-700 font-mono">axiodb serve mcp</code> or <code className="px-1.5 py-0.5 bg-gray-100 rounded text-fuchsia-700 font-mono">axiodb serve full</code> to launch the MCP server instantly with Bun.
                  </p>
                  <CodeBlock
                    language="bash"
                    code={`# Launch MCP server only on port 27020
axiodb serve mcp

# Or start full stack: HTTP (27018) + TCP (27019) + GUI Dashboard + MCP (27020)
axiodb serve full`}
                  />
                  <div className="p-3 bg-purple-50 border border-purple-200 rounded text-xs text-purple-900">
                    <strong>Endpoint:</strong> <code className="font-mono text-fuchsia-700">http://localhost:27020/mcp</code> — automatically bootstrapped in a temporary sandbox.
                  </div>
                </div>
              ) : initMode === "core" ? (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Pass <code className="px-1.5 py-0.5 bg-gray-100 rounded text-fuchsia-700 font-mono">MCP: true</code> when creating an <code className="font-mono">AxioDB</code> instance. It immediately launches the native MCP HTTP/SSE server on port <strong>27020</strong>.
                  </p>
                  <CodeBlock
                    language="typescript"
                    code={`import { AxioDB } from "axiodb";

// Initiate AxioDB with native MCP server enabled
const db = new AxioDB({
  MCP: true,     // Starts MCP server at http://localhost:27020/mcp
  GUI: true,     // Optional: also launch Web Dashboard on port 27018
});

// To gracefully stop the MCP server when shutting down:
// await db.stopMCPServer();`}
                  />
                  <div className="p-3 bg-purple-50 border border-purple-200 rounded text-xs text-purple-900">
                    <strong>Tip:</strong> The MCP server runs within your same application process with zero external binaries.
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Run the official container with <code className="px-1.5 py-0.5 bg-gray-100 rounded text-fuchsia-700 font-mono">AXIODB_MCP=true</code> and expose port <code className="font-mono">27020</code>:
                  </p>
                  <CodeBlock
                    language="bash"
                    code={`docker run -d \\
  --name axiodb \\
  -e AXIODB_GUI=true \\
  -e AXIODB_MCP=true \\
  -p 27018:27018 \\
  -p 27019:27019 \\
  -p 27020:27020 \\
  -v axiodb-data:/app \\
  theankansaha/axiodb`}
                  />
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded text-xs text-gray-600">
                    <strong>Endpoint:</strong> <code className="font-mono text-fuchsia-700">http://localhost:27020/mcp</code>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Step 2: Configure Your AI Client */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-fuchsia-600 text-white font-bold text-sm">
              2
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Connect Your AI Tools
            </h2>
          </div>

          <p className="text-gray-600 mb-6">
            Register the AxioDB endpoint (<code className="px-1.5 py-0.5 bg-gray-100 rounded font-mono text-fuchsia-700">http://localhost:27020/mcp</code>) with your favorite AI agent:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Claude Code */}
            <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm space-y-3">
              <div className="flex items-center gap-2 font-bold text-gray-900">
                <Terminal className="h-5 w-5 text-fuchsia-600" />
                Claude Code
              </div>
              <p className="text-xs text-gray-500">Run in your terminal to add AxioDB tools globally or per-project:</p>
              <CodeBlock
                language="bash"
                code={`claude mcp add --transport http axiodb http://localhost:27020/mcp`}
              />
            </div>

            {/* Cursor */}
            <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm space-y-3">
              <div className="flex items-center gap-2 font-bold text-gray-900">
                <Code2 className="h-5 w-5 text-blue-600" />
                Cursor
              </div>
              <p className="text-xs text-gray-500">Add to <code className="font-mono text-xs">.cursor/mcp.json</code> or global user settings:</p>
              <CodeBlock
                language="json"
                code={`{
  "mcpServers": {
    "axiodb": {
      "url": "http://localhost:27020/mcp"
    }
  }
}`}
              />
            </div>

            {/* Windsurf */}
            <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm space-y-3">
              <div className="flex items-center gap-2 font-bold text-gray-900">
                <Cpu className="h-5 w-5 text-emerald-600" />
                Windsurf
              </div>
              <p className="text-xs text-gray-500">Add to <code className="font-mono text-xs">~/.codeium/windsurf/mcp_config.json</code>:</p>
              <CodeBlock
                language="json"
                code={`{
  "mcpServers": {
    "axiodb": {
      "serverUrl": "http://localhost:27020/mcp"
    }
  }
}`}
              />
            </div>

            {/* Google Antigravity */}
            <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm space-y-3">
              <div className="flex items-center gap-2 font-bold text-gray-900">
                <Bot className="h-5 w-5 text-purple-600" />
                Google Antigravity (IDE &amp; CLI)
              </div>
              <p className="text-xs text-gray-500">Add to <code className="font-mono text-xs">~/.gemini/config/mcp_config.json</code>:</p>
              <CodeBlock
                language="json"
                code={`{
  "mcpServers": {
    "axiodb": {
      "serverUrl": "http://localhost:27020/mcp"
    }
  }
}`}
              />
            </div>

            {/* GitHub Copilot CLI */}
            <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm space-y-3">
              <div className="flex items-center gap-2 font-bold text-gray-900">
                <Terminal className="h-5 w-5 text-gray-800" />
                GitHub Copilot CLI
              </div>
              <p className="text-xs text-gray-500">Add to <code className="font-mono text-xs">~/.copilot/mcp-config.json</code>:</p>
              <CodeBlock
                language="json"
                code={`{
  "mcpServers": {
    "axiodb": {
      "type": "http",
      "url": "http://localhost:27020/mcp"
    }
  }
}`}
              />
            </div>

            {/* OpenAI Codex */}
            <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm space-y-3">
              <div className="flex items-center gap-2 font-bold text-gray-900">
                <Terminal className="h-5 w-5 text-green-700" />
                OpenAI Codex CLI
              </div>
              <p className="text-xs text-gray-500">Run CLI command or edit <code className="font-mono text-xs">~/.codex/config.toml</code>:</p>
              <CodeBlock
                language="bash"
                code={`codex mcp add axiodb --url http://localhost:27020/mcp`}
              />
            </div>
          </div>
        </section>

        {/* Available Tools Summary */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Layers className="h-7 w-7 text-fuchsia-600" />
                Available MCP Tools (45)
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Full-featured toolset covering the complete database lifecycle.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {toolGroups.map((group) => (
              <div
                key={group.title}
                className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-gray-900 text-sm">{group.title}</h3>
                    <span className="text-xs bg-fuchsia-50 text-fuchsia-700 font-semibold px-2 py-0.5 rounded border border-fuchsia-200">
                      {group.count} tools
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mb-3">{group.description}</p>
                  <ul className="space-y-1">
                    {group.tools.map((t) => (
                      <li key={t} className="text-xs font-mono text-gray-700 bg-gray-50 px-2 py-1 rounded">
                        {t}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Safety & Human Confirmation */}
        <section>
          <div className="bg-amber-50/60 rounded-lg p-6 border border-amber-200">
            <div className="flex items-start gap-4">
              <ShieldCheck className="h-6 w-6 text-amber-600 flex-shrink-0 mt-1" />
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-gray-900">
                  Built-in Safety &amp; Human-in-the-Loop Confirmation
                </h3>
                <p className="text-sm text-gray-700 leading-relaxed">
                  Destructive operations (e.g., dropping a database, dropping a collection, or bulk deletion) issue standard MCP elicitation prompts asking the human user to confirm before execution proceeds. If declined, the operation is safely aborted.
                </p>
                <div className="flex flex-wrap gap-2 pt-2">
                  <span className="text-xs bg-white text-gray-700 px-2.5 py-1 rounded border border-amber-200 font-medium">
                    ✓ Role-based permissions enforced on every tool call
                  </span>
                  <span className="text-xs bg-white text-gray-700 px-2.5 py-1 rounded border border-amber-200 font-medium">
                    ✓ Assign <code className="font-mono text-amber-800">View</code> role for read-only agents
                  </span>
                  <span className="text-xs bg-white text-gray-700 px-2.5 py-1 rounded border border-amber-200 font-medium">
                    ✓ Memory-only sliding session tokens
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Next Steps */}
        <section className="bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white p-8 rounded-lg shadow-sm">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3">Empower Your AI Agents Today</h2>
          <p className="text-fuchsia-100 mb-6 max-w-2xl text-sm sm:text-base leading-relaxed">
            Add AxioDB to your agent workflows for lightning-fast embedded document storage, ACID transactions, and zero-setup local persistence.
          </p>
          <div className="flex flex-wrap gap-4">
            <a
              href="/quickstart"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-fuchsia-700 rounded-lg font-bold hover:bg-fuchsia-50 transition-colors text-sm"
            >
              Quick Start Guide
              <ArrowRight className="h-4 w-4" />
            </a>
            <a
              href="/docker"
              className="inline-flex items-center gap-2 px-5 py-2.5 border border-white/40 text-white rounded-lg font-semibold hover:bg-white/10 transition-colors text-sm"
            >
              Docker Guide
              <ExternalLink className="h-4 w-4" />
            </a>
            <a
              href="/security"
              className="inline-flex items-center gap-2 px-5 py-2.5 border border-white/40 text-white rounded-lg font-semibold hover:bg-white/10 transition-colors text-sm"
            >
              Security &amp; RBAC
              <Users className="h-4 w-4" />
            </a>
          </div>
        </section>
      </div>

      <div className="mt-12 pt-6 border-t border-gray-200 text-sm text-gray-500">
        See also: <a href="/quickstart" className="text-accent-600 hover:underline">Quickstart</a> · <a href="/docker" className="text-accent-600 hover:underline">Docker</a> · <a href="/security" className="text-accent-600 hover:underline">Security</a> · <a href="/api-reference" className="text-accent-600 hover:underline">API Reference</a>
      </div>
    </>
  );
};

export default McpServer;
