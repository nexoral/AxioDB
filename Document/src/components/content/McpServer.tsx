import React from "react";
import Seo from "../ui/Seo";
import CodeBlock from "../ui/CodeBlock";
import {
  Bot,
  KeyRound,
  ShieldCheck,
  Terminal,
  Database,
  Layers,
  Users,
  ArrowRight,
  ExternalLink,
} from "lucide-react";

const toolGroups: { title: string; permissionNote: string; tools: string[] }[] = [
  {
    title: "Session",
    permissionNote: "No permission required — login is the gate itself",
    tools: ["axiodb_login", "axiodb_logout", "axiodb_whoami", "axiodb_change_own_password"],
  },
  {
    title: "Database",
    permissionNote: "db:view / db:create / db:delete",
    tools: [
      "axiodb_create_database",
      "axiodb_delete_database",
      "axiodb_database_exists",
      "axiodb_get_instance_info",
    ],
  },
  {
    title: "Collection",
    permissionNote: "collection:view / collection:create / collection:delete",
    tools: [
      "axiodb_create_collection",
      "axiodb_delete_collection",
      "axiodb_collection_exists",
      "axiodb_get_collection_info",
    ],
  },
  {
    title: "Documents & Aggregation",
    permissionNote: "document:view / query / create / update / delete / aggregate",
    tools: [
      "axiodb_insert_document",
      "axiodb_insert_many_documents",
      "axiodb_query_documents",
      "axiodb_update_document",
      "axiodb_delete_document",
      "axiodb_total_documents",
      "axiodb_aggregate",
    ],
  },
  {
    title: "Index",
    permissionNote: "index:view / index:create / index:delete",
    tools: ["axiodb_create_index", "axiodb_drop_index", "axiodb_list_indexes"],
  },
  {
    title: "Dashboard",
    permissionNote: "dashboard:view",
    tools: ["axiodb_get_dashboard_stats"],
  },
  {
    title: "User Management",
    permissionNote: "user:view / create / update-role / reset-password / delete — Super Admin role only",
    tools: [
      "axiodb_list_users",
      "axiodb_create_user",
      "axiodb_update_user_role",
      "axiodb_reset_user_password",
      "axiodb_delete_user",
    ],
  },
  {
    title: "Role Management",
    permissionNote: "role:view / role:create / role:delete — Super Admin role only",
    tools: ["axiodb_list_roles", "axiodb_create_role", "axiodb_delete_role", "axiodb_list_permissions"],
  },
];

const McpServer: React.FC = () => {
  return (
    <div className="space-y-12">
      <Seo
        title="MCP Server | AxioDB Documentation"
        description="Let AI agents (Claude, and any MCP-compatible client) talk to your AxioDB instance directly - 32 tools, real login, and the exact same RBAC as the web GUI."
        path="/mcp-server"
      />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-fuchsia-900/20 via-slate-800 to-purple-900/20 rounded-2xl p-8 lg:p-12 border border-fuchsia-700 shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-fuchsia-400/10 to-purple-400/10 rounded-full blur-3xl"></div>
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-fuchsia-900/40 to-purple-900/40 rounded-full border border-fuchsia-600 mb-6">
            <Bot className="h-5 w-5 text-fuchsia-400" />
            <span className="text-fuchsia-300 font-semibold">
              AI AGENT INTEGRATION
            </span>
          </div>

          <h1 className="text-5xl lg:text-6xl font-extrabold mb-6 bg-gradient-to-r from-fuchsia-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
            MCP Server
          </h1>

          <p className="text-lg text-slate-400 leading-relaxed max-w-3xl">
            Spin up AxioDB in a container and let Claude (or any MCP-compatible AI agent) talk to
            it directly — create databases, query documents, run aggregations, manage users and
            roles, all through 32 tools that log in and enforce the exact same RBAC as the web
            GUI. It runs in the same process as your existing Docker deployment — no separate
            install, no new database instance.
          </p>
        </div>
      </section>

      {/* Quick Start */}
      <section>
        <h2 className="text-3xl font-bold mb-6 text-white flex items-center gap-3">
          <Terminal className="h-8 w-8 text-fuchsia-500" />
          Quick Start
        </h2>

        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 space-y-4">
          <p className="text-slate-300">
            The MCP server is <strong>opt-in</strong> and disabled by default — set{" "}
            <code className="px-1.5 py-0.5 bg-slate-900 rounded">AXIODB_MCP=true</code>{" "}
            on the same container you already run for the GUI/TCP server:
          </p>
          <CodeBlock
            language="bash"
            code={`docker run -d \\
  --name axiodb-server \\
  -e AXIODB_GUI=true \\
  -e AXIODB_MCP=true \\
  -p 27018:27018 \\
  -p 27019:27019 \\
  -p 27020:27020 \\
  -v axiodb-data:/app \\
  theankansaha/axiodb

# Ports:
# 27018 - HTTP GUI Dashboard
# 27019 - TCP Remote Access (AxioDBCloud)
# 27020 - MCP Server (Streamable HTTP, path /mcp)`}
          />

          <p className="text-slate-300">
            Register the endpoint (<code className="px-1 py-0.5 bg-slate-900 rounded">http://localhost:27020/mcp</code>) with whichever AI tool you use:
          </p>

          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-white mb-2">Claude Code</h4>
              <CodeBlock
                language="bash"
                code={`claude mcp add --transport http axiodb http://localhost:27020/mcp

# Available across every project instead of just this one:
claude mcp add --transport http axiodb http://localhost:27020/mcp -s user`}
              />
            </div>

            <div>
              <h4 className="font-semibold text-white mb-2">OpenAI Codex CLI</h4>
              <CodeBlock
                language="bash"
                code={`codex mcp add axiodb --url http://localhost:27020/mcp

# Or edit ~/.codex/config.toml directly:
[mcp_servers.axiodb]
url = "http://localhost:27020/mcp"`}
              />
            </div>

            <div>
              <h4 className="font-semibold text-white mb-2">opencode</h4>
              <CodeBlock
                language="bash"
                code={`opencode mcp add
# Interactive prompt: choose "remote", name it "axiodb",
# URL: http://localhost:27020/mcp

# Or edit opencode.json directly:
{
  "mcp": {
    "axiodb": {
      "type": "remote",
      "url": "http://localhost:27020/mcp",
      "enabled": true
    }
  }
}`}
              />
            </div>

            <div>
              <h4 className="font-semibold text-white mb-2">GitHub Copilot CLI</h4>
              <CodeBlock
                language="bash"
                code={`# Interactive: run copilot, then inside it type:
/mcp add
# Server Name: axiodb | Type: HTTP | URL: http://localhost:27020/mcp

# Or edit ~/.copilot/mcp-config.json directly:
{
  "mcpServers": {
    "axiodb": {
      "type": "http",
      "url": "http://localhost:27020/mcp"
    }
  }
}`}
              />
            </div>

            <div>
              <h4 className="font-semibold text-white mb-2">Cursor</h4>
              <CodeBlock
                language="json"
                code={`// .cursor/mcp.json (project) or ~/.cursor/mcp.json (global)
{
  "mcpServers": {
    "axiodb": {
      "url": "http://localhost:27020/mcp"
    }
  }
}`}
              />
            </div>

            <div>
              <h4 className="font-semibold text-white mb-2">Windsurf</h4>
              <CodeBlock
                language="json"
                code={`// ~/.codeium/windsurf/mcp_config.json
{
  "mcpServers": {
    "axiodb": {
      "serverUrl": "http://localhost:27020/mcp"
    }
  }
}`}
              />
            </div>

            <div>
              <h4 className="font-semibold text-white mb-2">Google Antigravity (IDE &amp; CLI)</h4>
              <CodeBlock
                language="json"
                code={`// ~/.gemini/config/mcp_config.json - note: serverUrl, not url
{
  "mcpServers": {
    "axiodb": {
      "serverUrl": "http://localhost:27020/mcp"
    }
  }
}`}
              />
            </div>
          </div>

          <div className="p-4 bg-fuchsia-900/20 rounded-lg border border-fuchsia-700">
            <p className="text-sm text-fuchsia-200">
              <strong>AXIODB_MCP=true</strong> only has something to serve once RBAC is actually
              seeded — that requires <code className="px-1 py-0.5 bg-slate-800 rounded">AXIODB_GUI=true</code>{" "}
              (the default) or <code className="px-1 py-0.5 bg-slate-800 rounded">AXIODB_TCP=true</code> +{" "}
              <code className="px-1 py-0.5 bg-slate-800 rounded">AXIODB_TCP_AUTH=true</code>. See{" "}
              <a href="/docker" className="underline font-medium">Docker Deployment</a> for every environment variable.
            </p>
          </div>
        </div>
      </section>

      {/* Real login, real RBAC */}
      <section>
        <h2 className="text-3xl font-bold mb-6 text-white flex items-center gap-3">
          <KeyRound className="h-8 w-8 text-purple-500" />
          Real Login, Real RBAC — Not a Docker Env Var
        </h2>

        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 space-y-4">
          <p className="text-slate-300">
            Every tool except <code className="px-1.5 py-0.5 bg-slate-900 rounded">axiodb_login</code>{" "}
            requires a <code className="px-1.5 py-0.5 bg-slate-900 rounded">sessionId</code>. Call{" "}
            <code className="px-1.5 py-0.5 bg-slate-900 rounded">axiodb_login</code> first with the
            seeded default account (<code className="px-1 py-0.5 bg-slate-900 rounded">admin</code>/
            <code className="px-1 py-0.5 bg-slate-900 rounded">admin</code>, same as the GUI) or any
            other RBAC user, and every subsequent call is checked against{" "}
            <em>that logged-in user&apos;s actual role</em> — a View-role session gets a real 403 on
            write tools, exactly like the GUI would. Nothing is gated by a static container
            environment variable.
          </p>
          <CodeBlock
            language="json"
            code={`// axiodb_login({ username: "admin", password: "admin" })
{
  "statusCode": 200,
  "message": "Login successful",
  "data": {
    "sessionId": "a1b2c3...",
    "username": "admin",
    "role": "Super Admin",
    "permissions": ["db:view", "db:create", "..."],
    "mustChangePassword": true
  }
}`}
          />
          <ul className="list-disc list-inside text-slate-300 space-y-1">
            <li>Sessions live in server memory only, 24h sliding TTL — call <code className="px-1 py-0.5 bg-slate-900 rounded">axiodb_logout</code> when done rather than waiting it out</li>
            <li><code className="px-1 py-0.5 bg-slate-900 rounded">axiodb_whoami</code> returns the identity/role/permissions behind a given session</li>
            <li><code className="px-1 py-0.5 bg-slate-900 rounded">axiodb_change_own_password</code> rotates the session and returns a new <code className="px-1 py-0.5 bg-slate-900 rounded">sessionId</code></li>
            <li>Same login rate limiter as the GUI/TCP login (5 failed attempts / 15 min lockout)</li>
          </ul>
        </div>
      </section>

      {/* Tool catalogue */}
      <section>
        <h2 className="text-3xl font-bold mb-6 text-white flex items-center gap-3">
          <Layers className="h-8 w-8 text-indigo-500" />
          32 Tools, Mirroring the HTTP Control Server 1:1
        </h2>
        <p className="text-slate-300 mb-6 max-w-3xl">
          Every MCP tool maps to the exact same controller and permission check as its HTTP
          route counterpart — nothing was reimplemented, so behavior (validation, error
          messages, RBAC) never drifts between the GUI and the MCP surface.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {toolGroups.map((group) => (
            <div
              key={group.title}
              className="bg-slate-800 p-6 rounded-xl border border-slate-700"
            >
              <h3 className="text-lg font-bold text-white mb-1">
                {group.title}
              </h3>
              <p className="text-xs text-slate-400 mb-3 font-mono">
                {group.permissionNote}
              </p>
              <ul className="space-y-1">
                {group.tools.map((tool) => (
                  <li key={tool} className="text-sm font-mono text-slate-300">
                    {tool}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-slate-900/40 rounded-lg border border-slate-700">
          <p className="text-sm text-slate-400">
            <strong>Out of scope by design:</strong> transactions and database export/import are
            not exposed as MCP tools — kept out of this surface entirely rather than deferred.
          </p>
        </div>
      </section>

      {/* Example */}
      <section>
        <h2 className="text-3xl font-bold mb-6 text-white flex items-center gap-3">
          <Database className="h-8 w-8 text-blue-500" />
          Example: Insert &amp; Query From an Agent
        </h2>
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
          <CodeBlock
            language="text"
            code={`1. axiodb_login({ username: "admin", password: "admin" })
   -> sessionId: "a1b2c3..."

2. axiodb_create_database({ sessionId, name: "shop" })

3. axiodb_create_collection({ sessionId, dbName: "shop", collectionName: "orders" })

4. axiodb_insert_document({
     sessionId, dbName: "shop", collectionName: "orders",
     document: { customer: "Alice", total: 49.99, status: "paid" }
   })

5. axiodb_query_documents({
     sessionId, dbName: "shop", collectionName: "orders",
     query: { status: "paid" }
   })`}
          />
        </div>
      </section>

      {/* Security notes */}
      <section>
        <h2 className="text-3xl font-bold mb-6 text-white flex items-center gap-3">
          <ShieldCheck className="h-8 w-8 text-emerald-500" />
          Security Notes
        </h2>
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
          <ul className="list-disc list-inside text-slate-300 space-y-2">
            <li>Every write/read tool is permission-checked against the caller&apos;s actual role on every call, not just at login</li>
            <li>An invalid, expired, or missing <code className="px-1 py-0.5 bg-slate-900 rounded">sessionId</code> is rejected before it ever reaches a database operation</li>
            <li>Collection metadata responses (<code className="px-1 py-0.5 bg-slate-900 rounded">axiodb_get_collection_info</code>) never include the raw AES encryption key — only whether a collection is encrypted</li>
            <li>Expose port 27020 only to trusted networks/agents, same guidance as the TCP port — the MCP server carries the same authority as the GUI, just a different transport</li>
          </ul>
        </div>
      </section>

      {/* Next Steps */}
      <section className="bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white p-8 rounded-xl">
        <h2 className="text-3xl font-bold mb-4">Give Your Agent a Database</h2>
        <p className="text-xl mb-6 text-fuchsia-100">
          Deploy the container, enable AXIODB_MCP, and register it with your MCP client.
        </p>
        <div className="flex flex-wrap gap-4">
          <a
            href="/docker"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-fuchsia-600 rounded-lg font-semibold hover:bg-fuchsia-50 transition-colors"
          >
            Docker Deployment
            <ArrowRight className="h-5 w-5" />
          </a>
          <a
            href="https://github.com/nexoral/AxioDB/blob/main/Docker/README.md"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 border-2 border-white text-white rounded-lg font-semibold hover:bg-white/10 transition-colors"
          >
            Docker/README.md
            <ExternalLink className="h-5 w-5" />
          </a>
          <a
            href="/security"
            className="inline-flex items-center gap-2 px-6 py-3 border-2 border-white text-white rounded-lg font-semibold hover:bg-white/10 transition-colors"
          >
            Security &amp; RBAC
            <Users className="h-5 w-5" />
          </a>
        </div>
      </section>
    </div>
  );
};

export default McpServer;
